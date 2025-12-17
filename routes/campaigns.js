// routes/campaigns.js
const express = require('express');
const { auth } = require('../middleware/auth');
const Campaign = require('../models/Campaign');

const router = express.Router();

// POST /api/campaigns — добавить кампанию
router.post('/', auth, async (req, res) => {
  const { name, adSpend, grossRevenue } = req.body;

  if (!name || adSpend == null || grossRevenue == null) {
    return res.status(400).json({ msg: 'Все поля обязательны' });
  }

  try {
    const campaign = new Campaign({
      userId: req.user.id,
      name,
      adSpend,
      grossRevenue
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});

// GET /api/campaigns — получить все кампании пользователя
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});

module.exports = router;