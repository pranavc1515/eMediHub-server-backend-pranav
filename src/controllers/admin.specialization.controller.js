const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { DoctorPersonal, DoctorProfessional } = require('../models/doctor.model');

// Define a Specialization model (we'll create this in memory since it might not exist yet)
const Specialization = sequelize.define('Specialization', {
    id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
    },
    icon: {
        type: sequelize.Sequelize.STRING,
        allowNull: true
    },
    baseConsultationFee: {
        type: sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: true
    },
    isActive: {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'specializations',
    timestamps: true
});

// Sync the model to ensure the table exists
(async () => {
    try {
        await Specialization.sync({ alter: true });
        console.log('Specialization table synchronized successfully');

        // Check if we need to seed default specializations
        const count = await Specialization.count();
        if (count === 0) {
            await seedDefaultSpecializations();
        }
    } catch (error) {
        console.error('Error syncing Specialization table:', error);
    }
})();

// Seed default specializations
async function seedDefaultSpecializations() {
    const defaultSpecializations = [
        { name: 'General Medicine', description: 'Primary healthcare for adults', baseConsultationFee: 50.00 },
        { name: 'Pediatrics', description: 'Medical care for children', baseConsultationFee: 60.00 },
        { name: 'Cardiology', description: 'Heart and cardiovascular system', baseConsultationFee: 100.00 },
        { name: 'Dermatology', description: 'Skin, hair, and nails', baseConsultationFee: 80.00 },
        { name: 'Orthopedics', description: 'Musculoskeletal system', baseConsultationFee: 90.00 },
        { name: 'Gynecology', description: 'Female reproductive health', baseConsultationFee: 70.00 },
        { name: 'Neurology', description: 'Nervous system disorders', baseConsultationFee: 110.00 },
        { name: 'Psychiatry', description: 'Mental health', baseConsultationFee: 85.00 },
        { name: 'Ophthalmology', description: 'Eye care', baseConsultationFee: 75.00 },
        { name: 'ENT', description: 'Ear, nose, and throat', baseConsultationFee: 65.00 }
    ];

    try {
        await Specialization.bulkCreate(defaultSpecializations);
        console.log('Default specializations seeded successfully');
    } catch (error) {
        console.error('Error seeding default specializations:', error);
    }
}

// Get all specializations
exports.getAllSpecializations = async (req, res) => {
    try {
        const { active } = req.query;

        const where = {};
        if (active !== undefined) {
            where.isActive = active === 'true';
        }

        const specializations = await Specialization.findAll({
            where,
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            data: specializations
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching specializations',
            error: error.message
        });
    }
};

// Get specialization by ID
exports.getSpecializationById = async (req, res) => {
    try {
        const { id } = req.params;

        const specialization = await Specialization.findByPk(id);

        if (!specialization) {
            return res.status(404).json({
                success: false,
                message: 'Specialization not found'
            });
        }

        // Get count of doctors in this specialization
        const doctorCount = await DoctorProfessional.count({
            where: {
                specialization: specialization.name
            }
        });

        res.json({
            success: true,
            data: {
                ...specialization.toJSON(),
                doctorCount
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching specialization',
            error: error.message
        });
    }
};

// Create new specialization
exports.createSpecialization = async (req, res) => {
    try {
        const { name, description, icon, baseConsultationFee } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Specialization name is required'
            });
        }

        // Check if specialization already exists
        const existingSpecialization = await Specialization.findOne({
            where: {
                name: {
                    [Op.eq]: name
                }
            }
        });

        if (existingSpecialization) {
            return res.status(400).json({
                success: false,
                message: 'Specialization with this name already exists'
            });
        }

        // Create new specialization
        const specialization = await Specialization.create({
            name,
            description,
            icon,
            baseConsultationFee: baseConsultationFee || 0
        });

        res.status(201).json({
            success: true,
            message: 'Specialization created successfully',
            data: specialization
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating specialization',
            error: error.message
        });
    }
};

// Update specialization
exports.updateSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, baseConsultationFee, isActive } = req.body;

        const specialization = await Specialization.findByPk(id);

        if (!specialization) {
            return res.status(404).json({
                success: false,
                message: 'Specialization not found'
            });
        }

        // Check if name is being changed and if it already exists
        if (name && name !== specialization.name) {
            const existingSpecialization = await Specialization.findOne({
                where: {
                    name: {
                        [Op.eq]: name
                    },
                    id: {
                        [Op.ne]: id
                    }
                }
            });

            if (existingSpecialization) {
                return res.status(400).json({
                    success: false,
                    message: 'Specialization with this name already exists'
                });
            }
        }

        // Update specialization
        await specialization.update({
            name: name || specialization.name,
            description: description !== undefined ? description : specialization.description,
            icon: icon !== undefined ? icon : specialization.icon,
            baseConsultationFee: baseConsultationFee !== undefined ? baseConsultationFee : specialization.baseConsultationFee,
            isActive: isActive !== undefined ? isActive : specialization.isActive
        });

        res.json({
            success: true,
            message: 'Specialization updated successfully',
            data: specialization
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating specialization',
            error: error.message
        });
    }
};

// Delete specialization
exports.deleteSpecialization = async (req, res) => {
    try {
        const { id } = req.params;

        const specialization = await Specialization.findByPk(id);

        if (!specialization) {
            return res.status(404).json({
                success: false,
                message: 'Specialization not found'
            });
        }

        // Check if any doctors are using this specialization
        const doctorCount = await DoctorProfessional.count({
            where: {
                specialization: specialization.name
            }
        });

        if (doctorCount > 0) {
            // Instead of deleting, mark as inactive
            await specialization.update({ isActive: false });

            return res.json({
                success: true,
                message: `Specialization marked as inactive because it's used by ${doctorCount} doctor(s)`,
                data: {
                    id: specialization.id,
                    isActive: false
                }
            });
        }

        // Delete if not in use
        await specialization.destroy();

        res.json({
            success: true,
            message: 'Specialization deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error deleting specialization',
            error: error.message
        });
    }
};

// Get doctors by specialization
exports.getDoctorsBySpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10, verified } = req.query;

        const offset = (page - 1) * limit;

        const specialization = await Specialization.findByPk(id);

        if (!specialization) {
            return res.status(404).json({
                success: false,
                message: 'Specialization not found'
            });
        }

        // Build doctor filter
        const where = {};
        if (verified !== undefined) {
            where.isVerified = verified === 'true';
        }

        // Find doctors with this specialization
        const { count, rows: doctors } = await DoctorPersonal.findAndCountAll({
            where,
            include: [
                {
                    model: DoctorProfessional,
                    where: {
                        specialization: specialization.name
                    },
                    attributes: ['specialization', 'qualification', 'yearsOfExperience', 'consultationFees']
                }
            ],
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['fullName', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                specialization: specialization.name,
                total: count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                doctors
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching doctors by specialization',
            error: error.message
        });
    }
};

// Set consultation fee for specialization
exports.setConsultationFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { baseConsultationFee } = req.body;

        if (baseConsultationFee === undefined || baseConsultationFee < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid base consultation fee is required'
            });
        }

        const specialization = await Specialization.findByPk(id);

        if (!specialization) {
            return res.status(404).json({
                success: false,
                message: 'Specialization not found'
            });
        }

        // Update the base consultation fee
        await specialization.update({ baseConsultationFee });

        res.json({
            success: true,
            message: 'Consultation fee updated successfully',
            data: {
                id: specialization.id,
                name: specialization.name,
                baseConsultationFee: specialization.baseConsultationFee
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating consultation fee',
            error: error.message
        });
    }
};