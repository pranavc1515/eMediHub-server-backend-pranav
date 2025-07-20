const { DoctorPersonal } = require('../models/doctor.model');
const { sendEmailOTP, generateEmailOTP } = require('../utils/emailService');
const { Op } = require('sequelize');

// Send OTP to doctor's email for verification
const sendEmailVerificationOTP = async (req, res) => {
    try {
        const { email, doctorId } = req.body;

        // Validate required fields
        if (!email || !doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Email and doctorId are required',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // Check if authenticated user matches the doctorId
        if (req.user && req.user.id !== parseInt(doctorId)) {
            return res.status(403).json({
                success: false,
                message: 'You can only verify your own email address',
            });
        }

        // Find the doctor
        const doctor = await DoctorPersonal.findByPk(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        // Check if email is already verified for this doctor
        if (doctor.email === email && doctor.emailVerified) {
            return res.status(200).json({
                success: true,
                message: 'Email is already verified',
                data: {
                    emailVerified: true,
                    email: doctor.email,
                },
            });
        }

        // Check if email is already used by another verified doctor
        const existingDoctor = await DoctorPersonal.findOne({
            where: {
                email: email,
                emailVerified: true,
                id: { [Op.ne]: doctorId },
            },
        });

        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: 'This email is already verified by another doctor',
            });
        }

        // Generate OTP and set expiry (10 minutes from now)
        const otp = generateEmailOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update doctor with OTP and expiry
        await doctor.update({
            email: email,
            emailOTP: otp,
            emailOTPExpiry: otpExpiry,
            emailVerified: false, // Reset verification status
        });

        // Send email with OTP
        try {
            const emailResult = await sendEmailOTP(email, otp, doctor.fullName || 'Doctor');

            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully to your email',
                data: {
                    email: email,
                    otpSent: true,
                    expiresAt: otpExpiry,
                },
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);

            // Reset OTP fields if email sending failed
            await doctor.update({
                emailOTP: null,
                emailOTPExpiry: null,
            });

            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again.',
                error: emailError.message,
            });
        }
    } catch (error) {
        console.error('Error in sendEmailVerificationOTP:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Verify email OTP
const verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp, doctorId } = req.body;

        // Validate required fields
        if (!email || !otp || !doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, and doctorId are required',
            });
        }

        // Validate OTP format (6 digits)
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: 'OTP must be 6 digits',
            });
        }

        // Check if authenticated user matches the doctorId
        if (req.user && req.user.id !== parseInt(doctorId)) {
            return res.status(403).json({
                success: false,
                message: 'You can only verify your own email address',
            });
        }

        // Find the doctor
        const doctor = await DoctorPersonal.findByPk(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        // Check if doctor has email and OTP data
        if (!doctor.email || !doctor.emailOTP || !doctor.emailOTPExpiry) {
            return res.status(400).json({
                success: false,
                message: 'No pending email verification found. Please request a new OTP.',
            });
        }

        // Check if the email matches
        if (doctor.email !== email) {
            return res.status(400).json({
                success: false,
                message: 'Email does not match the pending verification request',
            });
        }

        // Check if OTP has expired
        if (new Date() > doctor.emailOTPExpiry) {
            // Clear expired OTP
            await doctor.update({
                emailOTP: null,
                emailOTPExpiry: null,
            });

            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.',
            });
        }

        // Verify OTP
        if (doctor.emailOTP !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please check and try again.',
            });
        }

        // OTP is valid - mark email as verified and clear OTP data
        await doctor.update({
            emailVerified: true,
            emailOTP: null,
            emailOTPExpiry: null,
        });

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                doctorId: doctor.id,
                email: doctor.email,
                emailVerified: true,
                verifiedAt: new Date(),
            },
        });
    } catch (error) {
        console.error('Error in verifyEmailOTP:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Get email verification status
const getEmailVerificationStatus = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Check if authenticated user matches the doctorId (if authentication is present)
        if (req.user && req.user.id !== parseInt(doctorId)) {
            return res.status(403).json({
                success: false,
                message: 'You can only check your own email verification status',
            });
        }

        // Find the doctor
        const doctor = await DoctorPersonal.findByPk(doctorId, {
            attributes: ['id', 'email', 'emailVerified', 'emailOTPExpiry'],
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        const hasActivePendingVerification = doctor.emailOTPExpiry && new Date() < doctor.emailOTPExpiry;

        return res.status(200).json({
            success: true,
            data: {
                doctorId: doctor.id,
                email: doctor.email,
                emailVerified: doctor.emailVerified,
                hasPendingVerification: hasActivePendingVerification,
                otpExpiresAt: hasActivePendingVerification ? doctor.emailOTPExpiry : null,
            },
        });
    } catch (error) {
        console.error('Error in getEmailVerificationStatus:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Resend email verification OTP
const resendEmailVerificationOTP = async (req, res) => {
    try {
        const { doctorId } = req.body;

        // Check if authenticated user matches the doctorId
        if (req.user && req.user.id !== parseInt(doctorId)) {
            return res.status(403).json({
                success: false,
                message: 'You can only resend OTP for your own email',
            });
        }

        // Find the doctor
        const doctor = await DoctorPersonal.findByPk(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        // Check if doctor has an email
        if (!doctor.email) {
            return res.status(400).json({
                success: false,
                message: 'No email address found. Please provide an email first.',
            });
        }

        // Check if email is already verified
        if (doctor.emailVerified) {
            return res.status(200).json({
                success: true,
                message: 'Email is already verified',
                data: {
                    emailVerified: true,
                    email: doctor.email,
                },
            });
        }

        // Generate new OTP and set expiry
        const otp = generateEmailOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update doctor with new OTP
        await doctor.update({
            emailOTP: otp,
            emailOTPExpiry: otpExpiry,
        });

        // Send email with OTP
        try {
            await sendEmailOTP(doctor.email, otp, doctor.fullName || 'Doctor');

            return res.status(200).json({
                success: true,
                message: 'OTP resent successfully to your email',
                data: {
                    email: doctor.email,
                    otpSent: true,
                    expiresAt: otpExpiry,
                },
            });
        } catch (emailError) {
            console.error('Failed to resend email:', emailError);

            // Reset OTP fields if email sending failed
            await doctor.update({
                emailOTP: null,
                emailOTPExpiry: null,
            });

            return res.status(500).json({
                success: false,
                message: 'Failed to resend verification email. Please try again.',
                error: emailError.message,
            });
        }
    } catch (error) {
        console.error('Error in resendEmailVerificationOTP:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

module.exports = {
    sendEmailVerificationOTP,
    verifyEmailOTP,
    getEmailVerificationStatus,
    resendEmailVerificationOTP,
}; 