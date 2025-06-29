const express = require('express');
const ctrl = require('../controllers/transactionController');
const router = express.Router();

router.post('/', ctrl.createTransaction);
router.get('/', ctrl.getAllTransactions);
router.get('/:txId', ctrl.getTransaction);
router.patch('/:txId', ctrl.updateTransaction);
router.delete('/:txId', ctrl.deleteTransaction);

module.exports = router;
