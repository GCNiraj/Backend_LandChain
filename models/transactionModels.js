const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  buyer: {
    type: String,
    required: true,
    index: true
  },
  listingId: {
    type: Number,
    required: true,
    index: true // Reference to Listing.listingId
  },
  amount: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: String,
    required: true
  },
  docsVerified: {
    type: Boolean,
    default: false
  },
  surveyApproved: {
    type: Boolean,
    default: false
  },
  votesYes: {
    type: Number,
    default: 0
  },
  votesTotal: {
    type: Number,
    default: 0
  },
  finalized: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
