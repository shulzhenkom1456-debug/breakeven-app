const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client'
  },
    isBlocked: { 
    type: Boolean, 
    default: false 
  },
  lastSeen: { 
    type: Date 
  },
  // Бизнес-данные (для расчёта ТБУ)
  business: {
    fixedCosts: { type: Number, default: 0 },         // Постоянные затраты
    variableCostPerUnit: { type: Number, default: 0 }, // Переменные затраты на единицу
    unitPrice: { type: Number, default: 0 }           // Цена за единицу
  }
}, 
{
  timestamps: true
});

// Хеширование пароля перед сохранением
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model('User', userSchema);