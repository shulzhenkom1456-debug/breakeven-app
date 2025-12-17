// routes/admin.js
const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Campaign = require('../models/Campaign');

const router = express.Router();

// GET /api/admin/users — список всех клиентов (не админов)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'client' }).select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});

// GET /api/admin/export — экспорт всех клиентов в CSV
router.get('/export', adminOnly, async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }).select('email createdAt lastSeen business');
    const campaigns = await Campaign.find().populate('userId', 'email');

    // Собираем данные
    const data = clients.map(client => {
      const clientCamps = campaigns.filter(c => c.userId?._id.equals(client._id));
      const totalSpend = clientCamps.reduce((sum, c) => sum + c.adSpend, 0);
      const totalRevenue = clientCamps.reduce((sum, c) => sum + c.grossRevenue, 0);

      return {
        email: client.email,
        registrationDate: client.createdAt?.toLocaleDateString('ru-BY'),
        lastSeen: client.lastSeen?.toLocaleDateString('ru-BY') || '—',
        campaignCount: clientCamps.length,
        totalAdSpend: totalSpend,
        totalGrossRevenue: totalRevenue,
        fixedCosts: client.business?.fixedCosts || 0,
        variableCostPerUnit: client.business?.variableCostPerUnit || 0,
        unitPrice: client.business?.unitPrice || 0
      };
    });

    // Формируем CSV
    const csv = [
      ['Email', 'Дата регистрации', 'Последний вход', 'Кампаний', 'Расходы (Br)', 'Доход (Br)', 'Пост. затраты', 'Перем. затраты/ед.', 'Цена/ед.'],
      ...data.map(d => [
        d.email,
        d.registrationDate,
        d.lastSeen,
        d.campaignCount,
        d.totalAdSpend,
        d.totalGrossRevenue,
        d.fixedCosts,
        d.variableCostPerUnit,
        d.unitPrice
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('breakeven-clients.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ошибка экспорта' });
  }
});


// DELETE /api/admin/users/:id — удалить клиента и всё его данные
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Удаляем пользователя
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ msg: 'Пользователь не найден' });

    // Удаляем все его кампании
    await Campaign.deleteMany({ userId: id });

    res.json({ msg: 'Клиент и все его данные удалены' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});

// DELETE /api/admin/users/:id/campaigns — только кампании
router.delete('/users/:id/campaigns', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Campaign.deleteMany({ userId: id });
    res.json({ msg: `Удалено ${result.deletedCount} кампаний` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});

// POST /api/admin/users/:id/block
router.post('/users/:id/block', adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ msg: 'Клиент не найден' });
    res.json({ msg: 'Клиент заблокирован' });
  } catch (err) {
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});

// POST /api/admin/users/:id/unblock
router.post('/users/:id/unblock', adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ msg: 'Клиент не найден' });
    res.json({ msg: 'Клиент разблокирован' });
  } catch (err) {
    res.status(500).json({ msg: 'Ошибка сервера' });
  }
});

module.exports = router;