const Listing = require('../models/listingModels');

// Create listing
exports.createListing = async (req, res) => {
    try {
        const { listingId, seller, parcelId, amount, price, active } = req.body;
        const exists = await Listing.findOne({ listingId });
        if (exists) return res.status(409).json({ error: 'Listing already exists' });

        const doc = await Listing.create({ listingId, seller, parcelId, amount, price, active });
        res.status(201).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all listings (with optional filter)
exports.getAllListings = async (req, res) => {
    try {
        const { seller, parcelId, active } = req.query;
        const filter = {};
        if (seller) filter.seller = seller;
        if (parcelId) filter.parcelId = Number(parcelId);
        if (active !== undefined) filter.active = active === 'true';

        const docs = await Listing.find(filter);
        res.status(200).json({ data: docs, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get listing by listingId
exports.getListing = async (req, res) => {
    try {
        const doc = await Listing.findOne({ listingId: Number(req.params.listingId) });
        if (!doc) return res.status(404).json({ error: 'Listing not found' });
        res.status(200).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update listing (PATCH)
exports.updateListing = async (req, res) => {
    try {
        const update = { ...req.body };
        const doc = await Listing.findOneAndUpdate(
            { listingId: Number(req.params.listingId) },
            update,
            { new: true, runValidators: true }
        );
        if (!doc) return res.status(404).json({ error: 'Listing not found' });
        res.status(200).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete listing
exports.deleteListing = async (req, res) => {
    try {
        const doc = await Listing.findOneAndDelete({ listingId: Number(req.params.listingId) });
        res.status(200).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
