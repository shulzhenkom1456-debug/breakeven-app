// routes/users.js
const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');


const router = express.Router();

// GET /api/users/me — получить свой профиль
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});

// PUT /api/users/me/business — обновить бизнес-данные
router.put('/me/business', auth, async (req, res) => {
  const { fixedCosts, variableCostPerUnit, unitPrice } = req.body;

  if (fixedCosts == null || variableCostPerUnit == null || unitPrice == null) {
    return res.status(400).json({ msg: 'Все поля обязательны' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'business.fixedCosts': fixedCosts,
          'business.variableCostPerUnit': variableCostPerUnit,
          'business.unitPrice': unitPrice
        }
      },
      { new: true }
    ).select('-password');

    res.json(user); // ← должен вернуть бизнес-данные
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});


module.exports = router;