const express = require('express');

const publicController = require('../controllers/public.controller');

const router = express.Router();

router.get('/availability', publicController.listAvailability);

module.exports = router;
