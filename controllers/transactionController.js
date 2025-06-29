const Transaction = require('../models/transactionModels');

// Create transaction
exports.createTransaction = async (req, res) => {
    try {
        const {
            txId, buyer, listingId, amount,
            totalPrice, docsVerified, surveyApproved,
            votesYes, votesTotal, finalized
        } = req.body;
        const exists = await Transaction.findOne({ txId });
        if (exists) return res.status(409).json({ error: 'Transaction already exists' });

        const doc = await Transaction.create({
            txId, buyer, listingId, amount,
            totalPrice, docsVerified, surveyApproved,
            votesYes, votesTotal, finalized
        });
        res.status(201).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all transactions (with optional filter)
exports.getAllTransactions = async (req, res) => {
    try {
        const { buyer, listingId, finalized } = req.query;
        const filter = {};
        if (buyer) filter.buyer = buyer;
        if (listingId) filter.listingId = Number(listingId);
        if (finalized !== undefined) filter.finalized = finalized === 'true';

        const docs = await Transaction.find(filter);
        res.status(200).json({ data: docs, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get transaction by txId
exports.getTransaction = async (req, res) => {
    try {
        const doc = await Transaction.findOne({ txId: Number(req.params.txId) });
        if (!doc) return res.status(404).json({ error: 'Transaction not found' });
        res.status(200).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update transaction (PATCH)
exports.updateTransaction = async (req, res) => {
    try {
        const update = { ...req.body };
        const doc = await Transaction.findOneAndUpdate(
            { txId: Number(req.params.txId) },
            update,
            { new: true, runValidators: true }
        );
        if (!doc) return res.status(404).json({ error: 'Transaction not found' });
        res.status(200).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const doc = await Transaction.findOneAndDelete({ txId: Number(req.params.txId) });
        res.status(200).json({ data: doc, status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
