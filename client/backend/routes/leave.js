const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/apply', authenticate, async (req, res) => {
  const { type, fromDate, toDate, reason } = req.body;
  try {
    const leave = await prisma.leave.create({
      data: {
        employeeId: req.user.id,
        type,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        reason
      }
    });
    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  const { role, id } = req.user;
  try {
    const where = role === 'admin' ? {} : { employeeId: id };
    const leaves = await prisma.leave.findMany({
      where,
      include: { employee: { select: { name: true, email: true, department: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/status', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { leaveId, status } = req.body;
  try {
    const leave = await prisma.leave.update({
      where: { id: leaveId },
      data: { status },
      include: { employee: true }
    });

    // Send Email Notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: leave.employee.email,
      subject: `Leave Application ${status}`,
      text: `Hello ${leave.employee.name},\n\nYour leave application from ${leave.fromDate.toDateString()} to ${leave.toDate.toDateString()} has been ${status}.\n\nReason: ${leave.reason}\n\nBest regards,\nHR Department`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log('Email Error:', error);
    });

    res.json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
