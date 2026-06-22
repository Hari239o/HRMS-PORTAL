const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function populate() {
  try {
    const leadsSnap = await db.collection('leads').limit(1).get();
    if (leadsSnap.empty) {
      console.log('No leads found.');
      process.exit(0);
    }
    const lead = leadsSnap.docs[0];
    const leadData = lead.data();

    // The user logged in the screenshot is Jithendra varma.
    const employeeId = 'emp_jithendra_mock';
    const employeeName = 'Jithendra varma';

    const messages = [
      {
        messageText: 'Hi, this is Jithendra from Geonixa. Are you still interested in our program?',
        senderType: 'employee',
        timeOffset: -1000 * 60 * 60 * 2 // 2 hours ago
      },
      {
        messageText: 'Yes, I am looking for details regarding the full stack course.',
        senderType: 'lead',
        timeOffset: -1000 * 60 * 60 * 1.5 // 1.5 hours ago
      },
      {
        messageText: 'Great! I have sent the brochure to your email. Let me know if you received it.',
        senderType: 'employee',
        timeOffset: -1000 * 60 * 10 // 10 mins ago
      },
      {
        messageText: 'I got it, thanks. What is the fee structure?',
        senderType: 'lead',
        timeOffset: -1000 * 60 * 5 // 5 mins ago
      }
    ];

    for (const msg of messages) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const payload = {
        id,
        leadId: lead.id,
        leadName: leadData.fullName || leadData.name || 'Student',
        employeeId,
        employeeName,
        messageText: msg.messageText,
        senderType: msg.senderType,
        createdAt: new Date(Date.now() + msg.timeOffset).toISOString(),
      };
      await db.collection('messages').doc(id).set(payload);
    }

    console.log('Successfully populated mock WhatsApp messages!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

populate();
