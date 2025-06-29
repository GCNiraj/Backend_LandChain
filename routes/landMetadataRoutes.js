const express = require('express');
const ctrl = require('../controllers/landMetadataController');
const router = express.Router();

router.post('/', ctrl.createMetadata);
router.get('/', ctrl.getAllMetadata);
router.get('/:tokenId', ctrl.getMetadata);
router.patch('/:tokenId', ctrl.updateMetadata);
router.delete('/:tokenId', ctrl.deleteMetadata);

module.exports = router;
