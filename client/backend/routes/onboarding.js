const express = require('express');
const crypto = require('crypto');
const prisma = require('../../prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function genToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 8) return res.status(400).json({ error: 'Invalid token' });

    const form = await prisma.onboardingForm.findUnique({
      where: { token }
    });
    
    if (!form) return res.status(404).json({ error: 'Form not found' });

    let student = null;
    if (form.student_id) {
      student = await prisma.student.findUnique({
        where: { id: form.student_id }
      });
    }

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
        submitted_at: form.submitted_at ? form.submitted_at.toISOString() : null,
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

router.post('/submit', async (req, res) => {
  try {
    const { token, full_name, phone, whatsapp, email, referrals = [] } = req.body;

    if (!token || token.length < 8) return res.status(400).json({ error: 'Invalid token' });
    if (!full_name || full_name.trim().length < 1) return res.status(400).json({ error: 'full_name is required' });
    if (!phone || phone.trim().length < 5) return res.status(400).json({ error: 'phone is required' });
    if (!whatsapp || whatsapp.trim().length < 5) return res.status(400).json({ error: 'whatsapp is required' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
    if (!Array.isArray(referrals) || referrals.length > 20) return res.status(400).json({ error: 'referrals must be an array of max 20' });

    const form = await prisma.onboardingForm.findUnique({
      where: { token }
    });
    
    if (!form) return res.status(404).json({ error: 'Invalid or expired form link' });
    if (form.submitted_at) return res.status(400).json({ error: 'This form has already been submitted' });

    const now = new Date();

    await prisma.onboardingForm.update({
      where: { id: form.id },
      data: {
        full_name: full_name.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        submitted_at: now,
      }
    });

    if (form.student_id) {
      await prisma.student.update({
        where: { id: form.student_id },
        data: {
          full_name: full_name.trim(),
          phone: (whatsapp || phone).trim(),
          email: email.trim(),
        }
      });
    }

    const cleaned = referrals
      .map((r) => ({
        name: (r.name || '').trim(),
        phone: (r.phone || '').trim(),
        email: (r.email || '').trim(),
      }))
      .filter((r) => r.name && (r.phone || r.email));

    let inserted_referrals = 0;
    if (cleaned.length > 0) {
      const referralData = cleaned.map(r => ({
        referrer_student_id: form.student_id,
        referred_name: r.name,
        referred_phone: r.phone || null,
        referred_email: r.email || null,
        status: 'pending',
        created_at: now,
      }));
      
      await prisma.referral.createMany({
        data: referralData
      });
      inserted_referrals = cleaned.length;
    }

    res.json({ ok: true, inserted_referrals });
  } catch (err) {
    console.error('submitOnboarding error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/send', authenticate, async (req, res) => {
  try {
    const { student_id, base_url } = req.body;
    const userId = req.user?.id;

    if (!student_id) return res.status(400).json({ error: 'student_id is required' });

    const student = await prisma.student.findUnique({
      where: { id: student_id }
    });
    
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const existingForm = await prisma.onboardingForm.findFirst({
      where: {
        student_id: student.id,
        submitted_at: null
      },
      orderBy: { created_at: 'desc' }
    });

    let token;
    if (existingForm) {
      token = existingForm.token;
    } else {
      token = genToken();
      await prisma.onboardingForm.create({
        data: {
          token,
          student_id: student.id,
          lead_id: student.lead_id || null,
          full_name: student.full_name || student.name,
          phone: student.phone || null,
          whatsapp: null,
          email: student.email || null,
          submitted_at: null,
        }
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

    await prisma.whatsappLog.create({
      data: {
        student_id: student.id,
        employee_id: userId || null,
        message: msg,
        payment_link: url,
        status: 'sent',
      }
    });

    res.json({ url, wa_link: waLink, phone: student.phone, name: studentName });
  } catch (err) {
    console.error('sendOnboardingForm error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const forms = await prisma.onboardingForm.findMany({
      orderBy: { created_at: 'desc' },
      take: 200
    });
    
    res.json(forms.map(f => ({
      ...f,
      submitted_at: f.submitted_at ? f.submitted_at.toISOString() : null,
      created_at: f.created_at.toISOString()
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
