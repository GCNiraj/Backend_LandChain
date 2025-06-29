const express = require('express');
const ctrl = require('../controllers/listingController');
const router = express.Router();

router.post('/', ctrl.createListing);
router.get('/', ctrl.getAllListings);
router.get('/:listingId', ctrl.getListing);
router.patch('/:listingId', ctrl.updateListing);
router.delete('/:listingId', ctrl.deleteListing);

module.exports = router;
