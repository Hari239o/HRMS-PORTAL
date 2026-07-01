const express = require('express');
const prisma = require('../../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  const { name, date, type } = req.body;
  try {
    const newHoliday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date),
        type
      }
    });
    res.status(201).json({ id: newHoliday.id, name, date, type });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const records = await prisma.holiday.findMany({
      orderBy: { date: 'asc' }
    });
    const holidays = records.map(h => ({
      ...h,
      date: h.date.toISOString().split('T')[0]
    }));
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize(['admin', 'hr']), async (req, res) => {
  try {
    await prisma.holiday.delete({ where: { id: req.params.id } });
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
