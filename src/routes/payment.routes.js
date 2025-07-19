const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate a payment
 *     description: Initiates a UPI payment for a doctor-related transaction (e.g., VDC).
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *               - transaction_type
 *               - amount
 *             properties:
 *               doctor_id:
 *                 type: integer
 *                 description: ID of the doctor
 *                 example: 101
 *               transaction_type:
 *                 type: string
 *                 description: Type of transaction
 *                 example: "VDC"
 *               amount:
 *                 type: number
 *                 description: Amount to be paid
 *                 example: 499
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 order_id:
 *                   type: string
 *                   example: "order_QuqV1mRT1YoCB4"
 *                 amount:
 *                   type: number
 *                   example: 49900
 *                 currency:
 *                   type: string
 *                   example: "INR"
 *                 receipt:
 *                   type: string
 *                   example: "receipt_1_1752910581819"
 *                 payment_id:
 *                   type: string
 *                   description: Payment ID (optional)
 *                 upi_link:
 *                   type: string
 *                   description: UPI payment link (optional)
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/initiate', auth, paymentController.initiatePayment);

/**
 * @swagger
 * /api/payments/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment
 *     description: Verifies the payment signature and updates payment status.
 *     tags: [Payments]
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
 *                 description: Razorpay order ID
 *               razorpay_payment_id:
 *                 type: string
 *                 description: Razorpay payment ID
 *               razorpay_signature:
 *                 type: string
 *                 description: Razorpay signature for verification
 *     responses:
 *       200:
 *         description: Payment verified and processed successfully
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
 *                   example: "Payment verified successfully"
 *       400:
 *         description: Invalid signature or request
 *       500:
 *         description: Internal server error
 */
router.post('/verify-payment', auth, paymentController.verifyPayment);

/**
 * @swagger
 * /api/payments/status/{payment_id}:
 *   get:
 *     summary: Get the status of a payment by its ID
 *     description: Fetches the current status of a specific payment using its unique ID.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the payment
 *         example: "order_Qup6slXdxlB4M2"
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "Completed"
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get('/status/:payment_id', auth, paymentController.getPaymentStatus);

/**
 * @swagger
 * /api/payments/split/{payment_id}:
 *   post:
 *     summary: Release payment to the doctor after verification
 *     description: Transfers the doctor's share of the payment after verifying the payment is successful.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the payment
 *     responses:
 *       200:
 *         description: Payment released successfully
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
 *                   example: "Payment released to doctor"
 *       404:
 *         description: Payment not found or already released
 *       500:
 *         description: Internal server error
 */
router.post('/split/:payment_id', auth, paymentController.splitPayment);

/**
 * @swagger
 * /api/payments/transfer/{transfer_id}:
 *   get:
 *     summary: Get transfer status by transfer ID
 *     description: Fetches status and details of a Razorpay transfer using the given transfer ID.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transfer_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Razorpay transfer ID
 *     responses:
 *       200:
 *         description: Transfer details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transfer_id:
 *                   type: string
 *                 status:
 *                   type: string
 *       404:
 *         description: Transfer not found
 *       500:
 *         description: Internal server error
 */
router.get('/transfer/:transfer_id', auth, paymentController.getTransferStatus);

/**
 * @swagger
 * /api/payments/linked-account/total-transfer:
 *   get:
 *     summary: Get total transfer amount for linked account
 *     description: Calculates the total amount transferred via all linked accounts.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total transfer fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_amount:
 *                   type: number
 *                   example: 0
 *                 currency:
 *                   type: string
 *                   example: "INR"
 *       500:
 *         description: Internal server error
 */
router.get('/linked-account/total-transfer', auth, paymentController.getTotalTransfer);

/**
 * @swagger
 * /api/payments/refund/{payment_id}:
 *   post:
 *     summary: Request refund and reverse transfer
 *     description: Allows a doctor to initiate a refund for a specific payment. Also reverses the associated transfer.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the payment to be refunded
 *     responses:
 *       200:
 *         description: Refund and reversal processed successfully
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
 *                   example: "Refund initiated and transfer reversed"
 *       400:
 *         description: Invalid payment ID or refund failed
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
router.post('/refund/:payment_id', auth, paymentController.refundPayment);

// Legacy routes for backward compatibility (deprecated)
/**
 * @swagger
 * /api/payment/create-order:
 *   post:
 *     deprecated: true
 *     summary: Create a new payment order (deprecated)
 *     description: Legacy endpoint - use /api/payments/initiate instead
 *     tags: [Payments - Legacy]
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
 */
router.post('/create-order', auth, paymentController.createOrder);

/**
 * @swagger
 * /api/payment/details/{paymentId}:
 *   get:
 *     deprecated: true
 *     summary: Get details of a specific payment (deprecated)
 *     description: Legacy endpoint - use /api/payments/status/{payment_id} instead
 *     tags: [Payments - Legacy]
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
 */
router.get('/details/:paymentId', auth, paymentController.getPaymentDetails);

module.exports = router;