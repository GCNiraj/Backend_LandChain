const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  listingId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  seller: {
    type: String,
    required: true,
    index: true // Wallet address
  },
  parcelId: {
    type: Number,
    required: true,
    index: true // Reference to LandMetadata.tokenId
  },
  amount: {
    type: Number,
    required: true
  },
  price: {
    type: String, // To safely support big numbers
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Listing', listingSchema);
