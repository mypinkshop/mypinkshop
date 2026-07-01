const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRecharged: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    reference: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    adCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdCampaign'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

walletSchema.index({ vendorId: 1 });
walletSchema.index({ 'transactions.createdAt': -1 });

walletSchema.methods.addBalance = async function(amount, description, reference = '') {
  this.balance += amount;
  this.totalRecharged += amount;
  this.transactions.push({
    type: 'credit',
    amount,
    description,
    reference,
    status: 'completed'
  });
  this.lastUpdated = new Date();
  return await this.save();
};

walletSchema.methods.deductBalance = async function(amount, description, reference = '') {
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  this.balance -= amount;
  this.totalSpent += amount;
  this.transactions.push({
    type: 'debit',
    amount,
    description,
    reference,
    status: 'completed'
  });
  this.lastUpdated = new Date();
  return await this.save();
};

walletSchema.methods.hasSufficientBalance = function(amount) {
  return this.balance >= amount;
};

const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
