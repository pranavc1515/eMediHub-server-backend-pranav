const axios = require('axios');

// External payment microservice URL
const PAYMENT_MICROSERVICE_URL = process.env.PAYMENT_MICROSERVICE_URL || 'http://43.204.91.138:3000';

/**
 * Proxy function to forward requests to external payment microservice
 */
const proxyToPaymentService = async (req, res, method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${PAYMENT_MICROSERVICE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                // Forward authorization header if present
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
            },
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`Error proxying to payment service: ${error.message}`);

        if (error.response) {
            // Forward error response from payment microservice
            res.status(error.response.status).json(error.response.data);
        } else {
            // Network or other error
            res.status(500).json({
                success: false,
                message: 'Payment service unavailable',
                error: 'Unable to connect to payment microservice'
            });
        }
    }
};

/**
 * Initiate a payment
 * POST /payments/initiate
 */
exports.initiatePayment = async (req, res) => {
    await proxyToPaymentService(req, res, 'POST', '/payments/initiate', req.body);
};

/**
 * Verify Razorpay payment
 * POST /payments/verify-payment
 */
exports.verifyPayment = async (req, res) => {
    await proxyToPaymentService(req, res, 'POST', '/payments/verify-payment', req.body);
};

/**
 * Get payment status by payment ID
 * GET /payments/status/:payment_id
 */
exports.getPaymentStatus = async (req, res) => {
    const { payment_id } = req.params;
    await proxyToPaymentService(req, res, 'GET', `/payments/status/${payment_id}`);
};

/**
 * Release payment to doctor after verification
 * POST /payments/split/:payment_id
 */
exports.splitPayment = async (req, res) => {
    const { payment_id } = req.params;
    await proxyToPaymentService(req, res, 'POST', `/payments/split/${payment_id}`);
};

/**
 * Get transfer status by transfer ID
 * GET /payments/transfer/:transfer_id
 */
exports.getTransferStatus = async (req, res) => {
    const { transfer_id } = req.params;
    await proxyToPaymentService(req, res, 'GET', `/payments/transfer/${transfer_id}`);
};

/**
 * Get total transfer amount for linked account
 * GET /payments/linked-account/total-transfer
 */
exports.getTotalTransfer = async (req, res) => {
    await proxyToPaymentService(req, res, 'GET', '/payments/linked-account/total-transfer');
};

/**
 * Request refund and reverse transfer
 * POST /payments/refund/:payment_id
 */
exports.refundPayment = async (req, res) => {
    const { payment_id } = req.params;
    await proxyToPaymentService(req, res, 'POST', `/payments/refund/${payment_id}`);
};

// Legacy endpoints for backward compatibility (deprecated)
exports.createOrder = exports.initiatePayment;
exports.getPaymentDetails = exports.getPaymentStatus;