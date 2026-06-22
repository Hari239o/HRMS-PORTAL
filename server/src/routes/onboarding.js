const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─── Helper ───────────────────────────────────────────────────────────────────
function genToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

// ─── PUBLIC: Load onboarding form by token ────────────────────────────────────
// GET /api/onboarding/:token
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 8) return res.status(400).json({ error: 'Invalid token' });

    const snap = await db.collection('onboarding_forms').where('token', '==', token).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Form not found' });

    const formDoc = snap.docs[0];
    const form = { id: formDoc.id, ...formDoc.data() };

    let student = null;
    if (form.student_id) {
      const sDoc = await db.collection('students').doc(form.student_id).get();
      if (sDoc.exists) student = { id: sDoc.id, ...sDoc.data() };
    }

    // Return only safe fields
    res.json({
      form: {
        id: form.id,
        token: form.token,
        student_id: form.student_id,
        lead_id: form.lead_id,
        full_name: form.full_name,
        phone: form.phone,
        whatsapp: form.whatsapp,
        email: form.email,
        submitted_at: form.submitted_at || null,
      },
      student: student
        ? {
            id: student.id,
            full_name: student.full_name || student.name,
            enrollment_id: student.enrollment_id,
            program: student.program,
          }
        : null,
    });
  } catch (err) {
    console.error('getOnboardingByToken error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUBLIC: Submit onboarding form + referrals ───────────────────────────────
// POST /api/onboarding/submit
router.post('/submit', async (req, res) => {
  try {
    const { token, full_name, phone, whatsapp, email, referrals = [] } = req.body;

    // Validate required fields
    if (!token || token.length < 8) return res.status(400).json({ error: 'Invalid token' });
    if (!full_name || full_name.trim().length < 1) return res.status(400).json({ error: 'full_name is required' });
    if (!phone || phone.trim().length < 5) return res.status(400).json({ error: 'phone is required' });
    if (!whatsapp || whatsapp.trim().length < 5) return res.status(400).json({ error: 'whatsapp is required' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
    if (!Array.isArray(referrals) || referrals.length > 20) return res.status(400).json({ error: 'referrals must be an array of max 20' });

    // Find the form
    const snap = await db.collection('onboarding_forms').where('token', '==', token).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Invalid or expired form link' });

    const formDoc = snap.docs[0];
    const form = formDoc.data();

    if (form.submitted_at) return res.status(400).json({ error: 'This form has already been submitted' });

    const now = new Date().toISOString();

    // Update onboarding form record
    await db.collection('onboarding_forms').doc(formDoc.id).update({
      full_name: full_name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      submitted_at: now,
    });

    // Sync the canonical student record
    if (form.student_id) {
      await db.collection('students').doc(form.student_id).update({
        full_name: full_name.trim(),
        phone: (whatsapp || phone).trim(),
        email: email.trim(),
      });
    }

    // Insert referrals — clean and filter valid ones
    const cleaned = referrals
      .map((r) => ({
        name: (r.name || '').trim(),
        phone: (r.phone || '').trim(),
        email: (r.email || '').trim(),
      }))
      .filter((r) => r.name && (r.phone || r.email));

    let inserted_referrals = 0;
    if (cleaned.length > 0) {
      const batch = db.batch();
      for (const r of cleaned) {
        const ref = db.collection('referrals').doc();
        batch.set(ref, {
          referrer_student_id: form.student_id,
          referred_name: r.name,
          referred_phone: r.phone || null,
          referred_email: r.email || null,
          status: 'pending',
          created_at: now,
        });
      }
      await batch.commit();
      inserted_referrals = cleaned.length;
    }

    res.json({ ok: true, inserted_referrals });
  } catch (err) {
    console.error('submitOnboarding error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── STAFF: (Re)send onboarding form for a paid student ──────────────────────
// POST /api/onboarding/send  (requires auth)
router.post('/send', authenticate, async (req, res) => {
  try {
    const { student_id, base_url } = req.body;
    const userId = req.user?.id;

    if (!student_id) return res.status(400).json({ error: 'student_id is required' });

    // Load student
    const sDoc = await db.collection('students').doc(student_id).get();
    if (!sDoc.exists) return res.status(404).json({ error: 'Student not found' });
    const student = { id: sDoc.id, ...sDoc.data() };

    // Reuse an unsubmitted form if one exists, else create a fresh token
    const existingSnap = await db
      .collection('onboarding_forms')
      .where('student_id', '==', student.id)
      .where('submitted_at', '==', null)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    let token;
    if (!existingSnap.empty) {
      token = existingSnap.docs[0].data().token;
    } else {
      token = genToken();
      const now = new Date().toISOString();
      await db.collection('onboarding_forms').add({
        token,
        student_id: student.id,
        lead_id: student.lead_id || null,
        full_name: student.full_name || student.name,
        phone: student.phone || null,
        whatsapp: null,
        email: student.email || null,
        submitted_at: null,
        created_at: now,
      });
    }

    const base = (base_url || '').replace(/\/+$/, '');
    const url = `${base}/onboarding/${token}`;
    const phoneDigits = (student.phone || '').replace(/[^\d]/g, '');
    const studentName = student.full_name || student.name || 'Student';

    const msg =
      `Hi ${studentName}, welcome to Geonixa! 🎉\n\n` +
      `Please complete your onboarding form here:\n${url}\n\n` +
      `Tip: invite friends inside the form — earn ₹250 for 1 paid referral, ₹1000 for 4, and a FREE seat at 8!`;

    const waLink = phoneDigits
      ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`
      : null;

    // Log to whatsapp_logs so it shows in the WhatsApp logs page
    await db.collection('whatsapp_logs').add({
      student_id: student.id,
      employee_id: userId || null,
      message: msg,
      payment_link: url,
      status: 'sent',
      created_at: new Date().toISOString(),
    });

    res.json({ url, wa_link: waLink, phone: student.phone, name: studentName });
  } catch (err) {
    console.error('sendOnboardingForm error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── STAFF: List all onboarding forms ─────────────────────────────────────────
// GET /api/onboarding  (requires auth)
router.get('/', authenticate, async (req, res) => {
  try {
    const snap = await db.collection('onboarding_forms').orderBy('created_at', 'desc').limit(200).get();
    const forms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
