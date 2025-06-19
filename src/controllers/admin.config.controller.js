const { Op } = require('sequelize');
const sequelize = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Define a SystemConfig model (we'll create this in memory since it might not exist yet)
const SystemConfig = sequelize.define('SystemConfig', {
    key: {
        type: sequelize.Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    value: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
    },
    category: {
        type: sequelize.Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: sequelize.Sequelize.STRING,
        allowNull: true
    }
}, {
    tableName: 'system_configs',
    timestamps: true
});

// Sync the model to ensure the table exists
(async () => {
    try {
        await SystemConfig.sync({ alter: true });
        console.log('SystemConfig table synchronized successfully');

        // Check if we need to seed default configurations
        const count = await SystemConfig.count();
        if (count === 0) {
            await seedDefaultConfigurations();
        }
    } catch (error) {
        console.error('Error syncing SystemConfig table:', error);
    }
})();

// Seed default configurations
async function seedDefaultConfigurations() {
    const defaultConfigs = [
        // General settings
        { key: 'site_name', value: 'eMediHub', category: 'general', description: 'Name of the platform' },
        { key: 'contact_email', value: 'support@emedihub.com', category: 'general', description: 'Support email address' },
        { key: 'contact_phone', value: '+1-800-MEDI-HUB', category: 'general', description: 'Support phone number' },

        // Consultation settings
        { key: 'default_consultation_duration', value: '15', category: 'consultation', description: 'Default consultation duration in minutes' },
        { key: 'min_consultation_fee', value: '10', category: 'consultation', description: 'Minimum consultation fee allowed' },
        { key: 'max_consultation_fee', value: '500', category: 'consultation', description: 'Maximum consultation fee allowed' },
        { key: 'consultation_buffer_time', value: '5', category: 'consultation', description: 'Buffer time between consultations in minutes' },

        // Notification settings
        { key: 'email_notifications_enabled', value: 'true', category: 'notifications', description: 'Enable email notifications' },
        { key: 'sms_notifications_enabled', value: 'true', category: 'notifications', description: 'Enable SMS notifications' },
        { key: 'appointment_reminder_time', value: '60', category: 'notifications', description: 'Minutes before appointment to send reminder' },

        // Working hours
        {
            key: 'working_hours', value: JSON.stringify({
                monday: { start: '09:00', end: '17:00', enabled: true },
                tuesday: { start: '09:00', end: '17:00', enabled: true },
                wednesday: { start: '09:00', end: '17:00', enabled: true },
                thursday: { start: '09:00', end: '17:00', enabled: true },
                friday: { start: '09:00', end: '17:00', enabled: true },
                saturday: { start: '10:00', end: '15:00', enabled: true },
                sunday: { start: '10:00', end: '15:00', enabled: false }
            }), category: 'scheduling', description: 'Default working hours'
        },

        // Fee structure
        {
            key: 'fee_structure', value: JSON.stringify({
                platform_fee_percentage: 10,
                tax_percentage: 5,
                minimum_payout_amount: 50
            }), category: 'billing', description: 'Fee structure for the platform'
        }
    ];

    try {
        await SystemConfig.bulkCreate(defaultConfigs);
        console.log('Default system configurations seeded successfully');
    } catch (error) {
        console.error('Error seeding default configurations:', error);
    }
}

// Get all system settings
exports.getAllSettings = async (req, res) => {
    try {
        const { category } = req.query;

        const where = {};
        if (category) {
            where.category = category;
        }

        const settings = await SystemConfig.findAll({
            where,
            order: [['category', 'ASC'], ['key', 'ASC']]
        });

        // Process settings to convert JSON strings to objects where appropriate
        const processedSettings = settings.map(setting => {
            const data = setting.toJSON();

            // Try to parse JSON values
            if (data.value && (data.value.startsWith('{') || data.value.startsWith('['))) {
                try {
                    data.value = JSON.parse(data.value);
                } catch (e) {
                    // Keep as string if not valid JSON
                }
            }

            // Convert string booleans to actual booleans
            if (data.value === 'true' || data.value === 'false') {
                data.value = data.value === 'true';
            }

            // Convert numeric strings to numbers
            if (data.value && !isNaN(data.value) && data.value.trim() !== '') {
                data.value = Number(data.value);
            }

            return data;
        });

        // Group by category
        const groupedSettings = processedSettings.reduce((acc, setting) => {
            if (!acc[setting.category]) {
                acc[setting.category] = [];
            }
            acc[setting.category].push(setting);
            return acc;
        }, {});

        res.json({
            success: true,
            data: groupedSettings
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching system settings',
            error: error.message
        });
    }
};

// Update system settings
exports.updateSettings = async (req, res) => {
    try {
        const { settings } = req.body;

        if (!settings || !Array.isArray(settings)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid settings data. Expected an array of settings.'
            });
        }

        const updatePromises = settings.map(async setting => {
            // Validate required fields
            if (!setting.key) {
                throw new Error('Setting key is required');
            }

            // Convert objects/arrays to JSON strings for storage
            let valueToStore = setting.value;
            if (typeof valueToStore === 'object') {
                valueToStore = JSON.stringify(valueToStore);
            }

            // Update or create the setting
            const [configSetting, created] = await SystemConfig.findOrCreate({
                where: { key: setting.key },
                defaults: {
                    value: valueToStore,
                    category: setting.category || 'general',
                    description: setting.description
                }
            });

            if (!created) {
                await configSetting.update({
                    value: valueToStore,
                    category: setting.category || configSetting.category,
                    description: setting.description || configSetting.description
                });
            }

            return configSetting;
        });

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                updatedCount: settings.length
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating system settings',
            error: error.message
        });
    }
};

// Configure notification templates
exports.getNotificationTemplates = async (req, res) => {
    try {
        // Define the templates directory path
        const templatesDir = path.join(__dirname, '..', 'templates');

        // Ensure the directory exists
        try {
            await fs.access(templatesDir);
        } catch (error) {
            // Create the directory if it doesn't exist
            await fs.mkdir(templatesDir, { recursive: true });

            // Create default templates
            await createDefaultTemplates(templatesDir);
        }

        // Read all template files
        const files = await fs.readdir(templatesDir);
        const templates = [];

        for (const file of files) {
            if (file.endsWith('.html') || file.endsWith('.txt')) {
                const filePath = path.join(templatesDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const stats = await fs.stat(filePath);

                templates.push({
                    name: file,
                    content,
                    type: file.endsWith('.html') ? 'html' : 'text',
                    lastModified: stats.mtime
                });
            }
        }

        res.json({
            success: true,
            data: {
                templates
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching notification templates',
            error: error.message
        });
    }
};

// Update notification template
exports.updateNotificationTemplate = async (req, res) => {
    try {
        const { name, content, type } = req.body;

        if (!name || !content) {
            return res.status(400).json({
                success: false,
                message: 'Template name and content are required'
            });
        }

        // Validate template name to prevent directory traversal
        if (name.includes('..') || name.includes('/') || name.includes('\\')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template name'
            });
        }

        // Define the templates directory path
        const templatesDir = path.join(__dirname, '..', 'templates');

        // Ensure the directory exists
        try {
            await fs.access(templatesDir);
        } catch (error) {
            await fs.mkdir(templatesDir, { recursive: true });
        }

        // Determine file extension
        const extension = type === 'html' ? '.html' : '.txt';
        const fileName = name.endsWith(extension) ? name : `${name}${extension}`;

        // Write the template file
        await fs.writeFile(path.join(templatesDir, fileName), content);

        res.json({
            success: true,
            message: 'Template updated successfully',
            data: {
                name: fileName
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating notification template',
            error: error.message
        });
    }
};

// Set fee structure
exports.setFeeStructure = async (req, res) => {
    try {
        const {
            platformFeePercentage,
            taxPercentage,
            minimumPayoutAmount,
            specialtyFees
        } = req.body;

        // Validate inputs
        if (platformFeePercentage !== undefined && (platformFeePercentage < 0 || platformFeePercentage > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Platform fee percentage must be between 0 and 100'
            });
        }

        if (taxPercentage !== undefined && (taxPercentage < 0 || taxPercentage > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Tax percentage must be between 0 and 100'
            });
        }

        // Build the fee structure object
        const feeStructure = {
            platform_fee_percentage: platformFeePercentage,
            tax_percentage: taxPercentage,
            minimum_payout_amount: minimumPayoutAmount,
            specialty_fees: specialtyFees
        };

        // Filter out undefined values
        Object.keys(feeStructure).forEach(key => {
            if (feeStructure[key] === undefined) {
                delete feeStructure[key];
            }
        });

        // Get existing fee structure
        const existingConfig = await SystemConfig.findOne({
            where: { key: 'fee_structure' }
        });

        if (existingConfig) {
            // Merge with existing structure
            const existingStructure = JSON.parse(existingConfig.value);
            const updatedStructure = { ...existingStructure, ...feeStructure };

            await existingConfig.update({
                value: JSON.stringify(updatedStructure)
            });
        } else {
            // Create new fee structure
            await SystemConfig.create({
                key: 'fee_structure',
                value: JSON.stringify(feeStructure),
                category: 'billing',
                description: 'Fee structure for the platform'
            });
        }

        res.json({
            success: true,
            message: 'Fee structure updated successfully',
            data: feeStructure
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating fee structure',
            error: error.message
        });
    }
};

// Define working hours
exports.setWorkingHours = async (req, res) => {
    try {
        const { workingHours } = req.body;

        if (!workingHours || typeof workingHours !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Working hours data is required'
            });
        }

        // Validate the working hours format
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const validatedHours = {};

        days.forEach(day => {
            if (workingHours[day]) {
                const dayConfig = workingHours[day];

                // Validate time format (HH:MM)
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

                if (dayConfig.enabled !== undefined &&
                    (!dayConfig.start || timeRegex.test(dayConfig.start)) &&
                    (!dayConfig.end || timeRegex.test(dayConfig.end))) {
                    validatedHours[day] = {
                        start: dayConfig.start || '09:00',
                        end: dayConfig.end || '17:00',
                        enabled: !!dayConfig.enabled
                    };
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid time format for ${day}. Use HH:MM format (24-hour).`
                    });
                }
            } else {
                // Use default if not provided
                validatedHours[day] = {
                    start: '09:00',
                    end: '17:00',
                    enabled: day !== 'sunday' // All days enabled except Sunday by default
                };
            }
        });

        // Update or create working hours config
        const [workingHoursConfig, created] = await SystemConfig.findOrCreate({
            where: { key: 'working_hours' },
            defaults: {
                value: JSON.stringify(validatedHours),
                category: 'scheduling',
                description: 'Default working hours'
            }
        });

        if (!created) {
            await workingHoursConfig.update({
                value: JSON.stringify(validatedHours)
            });
        }

        res.json({
            success: true,
            message: 'Working hours updated successfully',
            data: validatedHours
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating working hours',
            error: error.message
        });
    }
};

// Helper function to create default notification templates
async function createDefaultTemplates(templatesDir) {
    const defaultTemplates = {
        'appointment_confirmation.html': `
<!DOCTYPE html>
<html>
<head>
  <title>Appointment Confirmation</title>
</head>
<body>
  <h1>Your Appointment is Confirmed</h1>
  <p>Dear {{patientName}},</p>
  <p>Your appointment with {{doctorName}} has been confirmed for {{appointmentDate}} at {{appointmentTime}}.</p>
  <p>Please be ready 5 minutes before your scheduled time.</p>
  <p>Thank you for choosing eMediHub!</p>
</body>
</html>`,

        'appointment_reminder.html': `
<!DOCTYPE html>
<html>
<head>
  <title>Appointment Reminder</title>
</head>
<body>
  <h1>Reminder: Upcoming Appointment</h1>
  <p>Dear {{patientName}},</p>
  <p>This is a reminder that you have an appointment with {{doctorName}} on {{appointmentDate}} at {{appointmentTime}}.</p>
  <p>Please be ready 5 minutes before your scheduled time.</p>
  <p>Thank you for choosing eMediHub!</p>
</body>
</html>`,

        'prescription_ready.html': `
<!DOCTYPE html>
<html>
<head>
  <title>Prescription Ready</title>
</head>
<body>
  <h1>Your Prescription is Ready</h1>
  <p>Dear {{patientName}},</p>
  <p>Your prescription from your consultation with {{doctorName}} on {{consultationDate}} is now ready.</p>
  <p>You can view and download it from your patient dashboard.</p>
  <p>Thank you for choosing eMediHub!</p>
</body>
</html>`,

        'doctor_verification.html': `
<!DOCTYPE html>
<html>
<head>
  <title>Doctor Verification Status</title>
</head>
<body>
  <h1>Your Verification Status Has Been Updated</h1>
  <p>Dear Dr. {{doctorName}},</p>
  <p>Your verification status has been updated to: <strong>{{verificationStatus}}</strong>.</p>
  <p>{{additionalMessage}}</p>
  <p>Thank you for being part of eMediHub!</p>
</body>
</html>`
    };

    // Create each template file
    for (const [fileName, content] of Object.entries(defaultTemplates)) {
        await fs.writeFile(path.join(templatesDir, fileName), content);
    }

    console.log('Default notification templates created');
};