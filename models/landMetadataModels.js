const mongoose = require('mongoose');

const LandMetadataSchema = new mongoose.Schema({
  tokenId:     { type: Number, required: true, unique: true },
  tharmNumber: { type: String, required: true, unique: true },
  metadata:    {
    name:        String,
    description: String,
    area:        Number,
    image:       String,
    attributes:  [
      {
        trait_type: String,
        value:      mongoose.Schema.Types.Mixed
      }
    ]
  }
}, { timestamps: true });

module.exports = mongoose.model('LandMetadata', LandMetadataSchema);
