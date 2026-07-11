const express = require('express');

const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/status', authController.getStatus);
router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/setup', authController.setupInitialAdmin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/create-account', requireAuth, authController.createAccount);
router.post('/change-password', requireAuth, authController.changePassword);

module.exports = router;
