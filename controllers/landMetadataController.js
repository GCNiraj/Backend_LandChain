const LandMetadata = require('../models/landMetadataModels');

// Create metadata
exports.createMetadata = async (req, res) => {
    try {
        const { tokenId, tharmNumber, metadata } = req.body;
        const exists = await LandMetadata.findOne({ tokenId });
        if (exists) return res.status(409).json({ error: 'Token metadata already exists' });

        const doc = await LandMetadata.create({ tokenId, tharmNumber, metadata });
        res.status(201).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all metadata (with optional search/filter)
exports.getAllMetadata = async (req, res) => {
    try {
        const { tharmNumber, search } = req.query;
        const filter = {};
        if (tharmNumber) filter.tharmNumber = tharmNumber;
        if (search) {
            filter.$or = [
                { tharmNumber: { $regex: search, $options: 'i' } },
                { tokenId: isNaN(Number(search)) ? undefined : Number(search) }
            ];
        }
        const docs = await LandMetadata.find(filter);
        res.status(200).json({ data: docs, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get metadata by tokenId
exports.getMetadata = async (req, res) => {
    try {
        const doc = await LandMetadata.findOne({ tokenId: Number(req.params.tokenId) });
        if (!doc) return res.status(404).json({ error: 'Metadata not found' });
        res.status(200).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update metadata (PATCH)
exports.updateMetadata = async (req, res) => {
    try {
        const update = { ...req.body };
        const doc = await LandMetadata.findOneAndUpdate(
            { tokenId: Number(req.params.tokenId) },
            update,
            { new: true, runValidators: true }
        );
        if (!doc) return res.status(404).json({ error: 'Metadata not found' });
        res.status(200).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete metadata
exports.deleteMetadata = async (req, res) => {
    try {
        const doc = await LandMetadata.findOneAndDelete({ tokenId: Number(req.params.tokenId) });
        res.status(200).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
