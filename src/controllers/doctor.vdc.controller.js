const {
    DoctorPersonal,
    DoctorProfessional,
} = require('../models/doctor.model');

/**
 * Get VDC (Video/Digital Consultation) settings for a doctor
 */
const getVDCSettings = async (req, res) => {
    try {
        const doctorId = req.user.id;

        // Find doctor's professional details
        const professional = await DoctorProfessional.findOne({
            where: { doctorId },
        });

        if (!professional) {
            return res.status(404).json({
                success: false,
                message: 'Doctor professional details not found',
            });
        }

        // Return VDC-specific settings
        const vdcSettings = {
            vdcEnabled: professional.vdcEnabled,
            consultationFees: professional.consultationFees,
            availableDays: professional.availableDays,
            availableTimeSlots: professional.availableTimeSlots,
        };

        res.json({
            success: true,
            data: vdcSettings,
        });
    } catch (error) {
        console.error('Error fetching VDC settings:', error);
        res.status(400).json({
            success: false,
            message: 'Error fetching VDC settings',
            error: error.message,
        });
    }
};

/**
 * Update VDC (Video/Digital Consultation) settings for a doctor
 */
const updateVDCSettings = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const {
            vdcEnabled,
            consultationFees,
            availableDays,
            availableTimeSlots,
        } = req.body;

        // Find doctor's professional details
        let professional = await DoctorProfessional.findOne({
            where: { doctorId },
        });

        if (!professional) {
            // Create professional details if not exists
            professional = await DoctorProfessional.create({
                doctorId,
                status: 'Verified',
                vdcEnabled: false,
            });
        }

        // Prepare update data
        const updateData = {};

        // Handle VDC enabled/disabled
        if (vdcEnabled !== undefined) {
            updateData.vdcEnabled = Boolean(vdcEnabled);
        }

        // Only update consultation fees and availability if VDC is being enabled
        // or if VDC is already enabled
        if (vdcEnabled === true || professional.vdcEnabled) {
            if (consultationFees !== undefined) {
                if (consultationFees < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Consultation fees cannot be negative',
                    });
                }
                updateData.consultationFees = parseFloat(consultationFees);
            }

            if (availableDays !== undefined) {
                // Parse availableDays if it's a string
                let parsedAvailableDays = availableDays;
                if (typeof availableDays === 'string') {
                    try {
                        parsedAvailableDays = JSON.parse(availableDays);
                    } catch (e) {
                        parsedAvailableDays = [availableDays];
                    }
                }

                // Validate availableDays array
                if (Array.isArray(parsedAvailableDays)) {
                    const validDays = [
                        'monday',
                        'tuesday',
                        'wednesday',
                        'thursday',
                        'friday',
                        'saturday',
                        'sunday',
                    ];
                    const invalidDays = parsedAvailableDays.filter(
                        (day) => !validDays.includes(day.toLowerCase())
                    );

                    if (invalidDays.length > 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Invalid days: ${invalidDays.join(', ')}. Valid days are: ${validDays.join(', ')}`,
                        });
                    }
                }

                updateData.availableDays = parsedAvailableDays;
            }

            if (availableTimeSlots !== undefined) {
                // Parse availableTimeSlots if it's a string
                let parsedTimeSlots = availableTimeSlots;
                if (typeof availableTimeSlots === 'string') {
                    try {
                        parsedTimeSlots = JSON.parse(availableTimeSlots);
                    } catch (e) {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid availableTimeSlots format. Must be a valid JSON object',
                        });
                    }
                }
                updateData.availableTimeSlots = parsedTimeSlots;
            }
        }

        // If disabling VDC, clear consultation fees and availability
        if (vdcEnabled === false) {
            updateData.consultationFees = null;
            updateData.availableDays = [];
            updateData.availableTimeSlots = {};
        }

        // Update professional details
        await professional.update(updateData);

        // Fetch updated data
        const updatedProfessional = await DoctorProfessional.findOne({
            where: { doctorId },
        });

        const responseData = {
            vdcEnabled: updatedProfessional.vdcEnabled,
            consultationFees: updatedProfessional.consultationFees,
            availableDays: updatedProfessional.availableDays,
            availableTimeSlots: updatedProfessional.availableTimeSlots,
        };

        res.json({
            success: true,
            message: 'VDC settings updated successfully',
            data: responseData,
        });
    } catch (error) {
        console.error('Error updating VDC settings:', error);
        res.status(400).json({
            success: false,
            message: 'Error updating VDC settings',
            error: error.message,
        });
    }
};

/**
 * Check if doctor has opted for VDC (Video/Digital Consultation) services
 */
const checkVDCStatus = async (req, res) => {
    try {
        const doctorId = req.user.id;

        // Find doctor's professional details
        const professional = await DoctorProfessional.findOne({
            where: { doctorId },
            attributes: ['vdcEnabled'], // Only fetch the vdcEnabled field
        });

        if (!professional) {
            return res.status(404).json({
                success: false,
                message: 'Doctor professional details not found',
            });
        }

        res.json({
            success: true,
            data: {
                vdcEnabled: professional.vdcEnabled,
                hasOptedVDC: professional.vdcEnabled,
            },
        });
    } catch (error) {
        console.error('Error checking VDC status:', error);
        res.status(400).json({
            success: false,
            message: 'Error checking VDC status',
            error: error.message,
        });
    }
};

module.exports = {
    getVDCSettings,
    updateVDCSettings,
    checkVDCStatus,
}; 