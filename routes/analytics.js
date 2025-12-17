// routes/analytics.js
const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const {
  calculateBreakEvenUnits,
  calculateBreakEvenRevenue,
  calculateROAS,
  calculateROI
} = require('../utils/calculations');

const router = express.Router();

// GET /api/analytics/report — отчёт для текущего пользователя
router.get('/report', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('business');
    if (!user || !user.business) {
      return res.status(400).json({ msg: 'Сначала заполните данные бизнеса' });
    }

    const { fixedCosts, variableCostPerUnit, unitPrice } = user.business || {};
    if (fixedCosts == null || variableCostPerUnit == null || unitPrice == null) {
      return res.status(400).json({ msg: 'Недостаточно данных для расчёта ТБУ' });
    }

    const breakEvenUnits = calculateBreakEvenUnits(fixedCosts, unitPrice, variableCostPerUnit);
    const breakEvenRevenue = calculateBreakEvenRevenue(fixedCosts, unitPrice, variableCostPerUnit);
    const campaigns = await Campaign.find({ userId: req.user.id });

    const campaignAnalytics = campaigns.map(camp => {
      const roas = calculateROAS(camp.grossRevenue, camp.adSpend);
      const profit = camp.grossRevenue - camp.adSpend;
      const roi = calculateROI(profit, camp.adSpend);
      return {
        ...camp.toObject(),
        roas: isFinite(roas) ? parseFloat(roas.toFixed(2)) : roas,
        roi: isFinite(roi) ? parseFloat(roi.toFixed(2)) : roi
      };
    });

    res.json({
      breakEven: {
        units: isFinite(breakEvenUnits) ? parseFloat(breakEvenUnits.toFixed(2)) : breakEvenUnits,
        revenue: isFinite(breakEvenRevenue) ? parseFloat(breakEvenRevenue.toFixed(2)) : breakEvenRevenue
      },
      business: user.business,
      campaigns: campaignAnalytics
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ошибка при генерации отчёта' });
  }
});

// GET /api/analytics/report/:clientId — отчёт для админа по конкретному клиенту
router.get('/report/:clientId', auth, adminOnly, async (req, res) => {
  try {
    const { clientId } = req.params;
    const user = await User.findById(clientId);
    if (!user) return res.status(404).json({ msg: 'Клиент не найден' });

    const campaigns = await Campaign.find({ userId: clientId });
    const campaignCount = campaigns.length;
    const totalAdSpend = campaigns.reduce((sum, c) => sum + c.adSpend, 0);

    const { fixedCosts, variableCostPerUnit, unitPrice } = user.business || {};
    let breakEven = { units: null, revenue: null };
    if (fixedCosts != null && variableCostPerUnit != null && unitPrice != null) {
      const marginal = unitPrice - variableCostPerUnit;
      if (marginal > 0) {
        const units = calculateBreakEvenUnits(fixedCosts, unitPrice, variableCostPerUnit);
        const revenue = calculateBreakEvenRevenue(fixedCosts, unitPrice, variableCostPerUnit);
        breakEven = { units, revenue };
      }
    }

    const lastSeen = user.lastSeen;
    const createdAt = user.createdAt;

    res.json({
      client: {
        id: user._id,
        email: user.email,
        lastSeen,
        createdAt,
        campaignCount,
        totalAdSpend
      },
      breakEven,
      campaigns: campaigns.map(c => ({
        ...c.toObject(),
        roas: calculateROAS(c.grossRevenue, c.adSpend),
        roi: calculateROI(c.grossRevenue - c.adSpend, c.adSpend)
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});

module.exports = router;