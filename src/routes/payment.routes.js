const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth.middleware');
// Authentication middleware removed to allow unauthenticated access

/**
 * @swagger
 * /api/payment/create-order:
 *   post:
 *     summary: Create a new payment order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to be paid (in INR)
 *               currency:
 *                 type: string
 *                 default: INR
 *                 description: Currency for the payment
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 order:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Razorpay order ID
 *                     amount:
 *                       type: number
 *                       description: Order amount in paise
 *                     currency:
 *                       type: string
 *                       description: Order currency
 *                     receipt:
 *                       type: string
 *                       description: Order receipt ID
 *                     status:
 *                       type: string
 *                       description: Order status
 *                   description: Razorpay order details
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server error while creating order
 */
router.post('/create-order', paymentController.createOrder);

/**
 * @swagger
 * /api/payment/verify-payment:
 *   post:
 *     summary: Verify a payment after completion
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *                 description: Order ID from Razorpay
 *               razorpay_payment_id:
 *                 type: string
 *                 description: Payment ID from Razorpay
 *               razorpay_signature:
 *                 type: string
 *                 description: Payment signature from Razorpay
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment verified successfully
 *       400:
 *         description: Invalid payment signature
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server error while verifying payment
 */
router.post('/verify-payment', paymentController.verifyPayment);

/**
 * @swagger
 * /api/payment/details/{paymentId}:
 *   get:
 *     summary: Get details of a specific payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the payment to retrieve
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Payment ID
 *                     order_id:
 *                       type: string
 *                       description: Associated order ID
 *                     amount:
 *                       type: number
 *                       description: Payment amount
 *                     status:
 *                       type: string
 *                       description: Payment status
 *                     method:
 *                       type: string
 *                       description: Payment method used
 *                   description: Payment details from Razorpay
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server error while fetching payment details
 */
router.get('/details/:paymentId', paymentController.getPaymentDetails);

module.exports = router;