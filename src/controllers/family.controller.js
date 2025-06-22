const Family = require('../models/family.model');
const { Op } = require('sequelize');
const db = require('../config/database');

// Add a new family member
const addFamilyMember = async (req, res) => {
    try {
        const {
            userId,
            firstName,
            lastName,
            relationship,
            dateOfBirth,
            gender,
            phone,
            email,
            bloodGroup,
            medicalConditions,
            emergencyContact,
            profileImage,
            notes
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !relationship) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and relationship are required'
            });
        }

        // Validate userId is provided
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Validate relationship value
        const validRelationships = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Other'];
        if (!validRelationships.includes(relationship)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid relationship type'
            });
        }

        // Validate blood group if provided
        if (bloodGroup) {
            const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            if (!validBloodGroups.includes(bloodGroup)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid blood group'
                });
            }
        }

        // Validate gender if provided
        if (gender) {
            const validGenders = ['Male', 'Female', 'Other'];
            if (!validGenders.includes(gender)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid gender'
                });
            }
        }

        // Validate email format if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate phone format if provided
        if (phone && !/^[\d\s\-\+\(\)]{10,15}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Create family member without user validation (since user might not be in User table)
        const familyMember = await Family.create({
            userId,
            firstName,
            lastName,
            relationship,
            dateOfBirth,
            gender,
            phone,
            email,
            bloodGroup,
            medicalConditions,
            emergencyContact: emergencyContact || false,
            profileImage,
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Family member added successfully',
            data: familyMember
        });

    } catch (error) {
        console.error('Error adding family member:', error);

        // Handle specific database errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.errors.map(e => e.message).join(', ')
            });
        }

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID provided',
                error: 'User does not exist'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to add family member',
            error: error.message
        });
    }
};

// Get all family members for a user
const getFamilyMembers = async (req, res) => {
    try {
        const { userId } = req.params;
        const { relationship, isActive } = req.query;

        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Build where clause
        let whereClause = { userId };

        if (relationship) {
            // Validate relationship value
            const validRelationships = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Other'];
            if (!validRelationships.includes(relationship)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid relationship type'
                });
            }
            whereClause.relationship = relationship;
        }

        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }

        const familyMembers = await Family.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            attributes: {
                exclude: ['created_at', 'updated_at']
            }
        });

        res.json({
            success: true,
            message: 'Family members retrieved successfully',
            data: familyMembers,
            count: familyMembers.length
        });

    } catch (error) {
        console.error('Error fetching family members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch family members',
            error: error.message
        });
    }
};

// Get a specific family member by ID
const getFamilyMemberById = async (req, res) => {
    try {
        const { id } = req.params;

        const familyMember = await Family.findByPk(id, {
            attributes: {
                exclude: ['created_at', 'updated_at']
            }
        });

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        res.json({
            success: true,
            message: 'Family member retrieved successfully',
            data: familyMember
        });

    } catch (error) {
        console.error('Error fetching family member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch family member',
            error: error.message
        });
    }
};

// Update family member
const updateFamilyMember = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate ID
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Family member ID is required'
            });
        }

        // Remove fields that shouldn't be updated
        delete updateData.id;
        delete updateData.userId;
        delete updateData.created_at;
        delete updateData.updated_at;

        // Validate relationship if provided
        if (updateData.relationship) {
            const validRelationships = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Other'];
            if (!validRelationships.includes(updateData.relationship)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid relationship type'
                });
            }
        }

        // Validate blood group if provided
        if (updateData.bloodGroup) {
            const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            if (!validBloodGroups.includes(updateData.bloodGroup)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid blood group'
                });
            }
        }

        // Validate gender if provided
        if (updateData.gender) {
            const validGenders = ['Male', 'Female', 'Other'];
            if (!validGenders.includes(updateData.gender)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid gender'
                });
            }
        }

        const familyMember = await Family.findByPk(id);

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        // Update the family member
        await familyMember.update(updateData);

        res.json({
            success: true,
            message: 'Family member updated successfully',
            data: familyMember
        });

    } catch (error) {
        console.error('Error updating family member:', error);

        // Handle specific database errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.errors.map(e => e.message).join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update family member',
            error: error.message
        });
    }
};

// Delete family member (soft delete)
const deleteFamilyMember = async (req, res) => {
    try {
        const { id } = req.params;

        const familyMember = await Family.findByPk(id);

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        // Soft delete by setting isActive to false
        await familyMember.update({ isActive: false });

        res.json({
            success: true,
            message: 'Family member deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting family member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete family member',
            error: error.message
        });
    }
};

// Hard delete family member (permanent)
const permanentDeleteFamilyMember = async (req, res) => {
    try {
        const { id } = req.params;

        const familyMember = await Family.findByPk(id);

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        await familyMember.destroy();

        res.json({
            success: true,
            message: 'Family member permanently deleted'
        });

    } catch (error) {
        console.error('Error permanently deleting family member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to permanently delete family member',
            error: error.message
        });
    }
};

// Get family members by relationship
const getFamilyMembersByRelationship = async (req, res) => {
    try {
        const { userId, relationship } = req.params;

        // Validate parameters
        if (!userId || !relationship) {
            return res.status(400).json({
                success: false,
                message: 'User ID and relationship are required'
            });
        }

        // Validate relationship value
        const validRelationships = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Other'];
        if (!validRelationships.includes(relationship)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid relationship type'
            });
        }

        const familyMembers = await Family.findAll({
            where: {
                userId,
                relationship,
                isActive: true
            },
            order: [['firstName', 'ASC']],
            attributes: {
                exclude: ['created_at', 'updated_at']
            }
        });

        res.json({
            success: true,
            message: `${relationship} family members retrieved successfully`,
            data: familyMembers,
            count: familyMembers.length
        });

    } catch (error) {
        console.error('Error fetching family members by relationship:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch family members by relationship',
            error: error.message
        });
    }
};

// Get emergency contacts
const getEmergencyContacts = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const emergencyContacts = await Family.findAll({
            where: {
                userId,
                emergencyContact: true,
                isActive: true
            },
            order: [['firstName', 'ASC']],
            attributes: {
                exclude: ['created_at', 'updated_at']
            }
        });

        res.json({
            success: true,
            message: 'Emergency contacts retrieved successfully',
            data: emergencyContacts,
            count: emergencyContacts.length
        });

    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency contacts',
            error: error.message
        });
    }
};

// Search family members
const searchFamilyMembers = async (req, res) => {
    try {
        const { userId } = req.params;
        const { query } = req.query;

        // Validate parameters
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required and cannot be empty'
            });
        }

        // Sanitize query to prevent potential issues
        const sanitizedQuery = query.trim();

        const familyMembers = await Family.findAll({
            where: {
                userId,
                isActive: true,
                [Op.or]: [
                    { firstName: { [Op.like]: `%${sanitizedQuery}%` } },
                    { lastName: { [Op.like]: `%${sanitizedQuery}%` } },
                    { relationship: { [Op.like]: `%${sanitizedQuery}%` } },
                    { phone: { [Op.like]: `%${sanitizedQuery}%` } },
                    { email: { [Op.like]: `%${sanitizedQuery}%` } }
                ]
            },
            order: [['firstName', 'ASC']],
            attributes: {
                exclude: ['created_at', 'updated_at']
            }
        });

        res.json({
            success: true,
            message: 'Search results retrieved successfully',
            data: familyMembers,
            count: familyMembers.length,
            query: sanitizedQuery
        });

    } catch (error) {
        console.error('Error searching family members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search family members',
            error: error.message
        });
    }
};

// Get family statistics
const getFamilyStatistics = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Get relationship breakdown
        const stats = await Family.findAll({
            where: { userId, isActive: true },
            attributes: [
                'relationship',
                [db.fn('COUNT', db.col('relationship')), 'count']
            ],
            group: ['relationship'],
            raw: true
        });

        // Get total count
        const totalMembers = await Family.count({
            where: { userId, isActive: true }
        });

        // Get emergency contacts count
        const emergencyContactsCount = await Family.count({
            where: { userId, isActive: true, emergencyContact: true }
        });

        // Get gender breakdown
        const genderStats = await Family.findAll({
            where: { userId, isActive: true, gender: { [Op.not]: null } },
            attributes: [
                'gender',
                [db.fn('COUNT', db.col('gender')), 'count']
            ],
            group: ['gender'],
            raw: true
        });

        // Get age groups (approximate based on date of birth)
        const ageGroupStats = await Family.findAll({
            where: { userId, isActive: true, dateOfBirth: { [Op.not]: null } },
            attributes: [
                [db.fn('COUNT', db.col('id')), 'count'],
                [db.literal(`
          CASE 
            WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) < 18 THEN 'Under 18'
            WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 18 AND 35 THEN '18-35'
            WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 36 AND 60 THEN '36-60'
            ELSE 'Over 60'
          END
        `), 'ageGroup']
            ],
            group: [db.literal(`
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) < 18 THEN 'Under 18'
          WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 18 AND 35 THEN '18-35'
          WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 36 AND 60 THEN '36-60'
          ELSE 'Over 60'
        END
      `)],
            raw: true
        });

        res.json({
            success: true,
            message: 'Family statistics retrieved successfully',
            data: {
                totalMembers,
                emergencyContactsCount,
                relationshipBreakdown: stats,
                genderBreakdown: genderStats,
                ageGroupBreakdown: ageGroupStats,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error fetching family statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch family statistics',
            error: error.message
        });
    }
};

// Get available options for dropdowns
const getFamilyOptions = async (req, res) => {
    try {
        const options = {
            relationships: ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Other'],
            bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            genders: ['Male', 'Female', 'Other']
        };

        res.json({
            success: true,
            message: 'Family options retrieved successfully',
            data: options
        });

    } catch (error) {
        console.error('Error retrieving family options:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve family options',
            error: error.message
        });
    }
};

// Bulk add family members
const bulkAddFamilyMembers = async (req, res) => {
    try {
        const { userId, familyMembers } = req.body;

        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Validate familyMembers array
        if (!Array.isArray(familyMembers) || familyMembers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Family members array is required and cannot be empty'
            });
        }

        // Validate each family member
        const validRelationships = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Other'];
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        const validGenders = ['Male', 'Female', 'Other'];

        for (let i = 0; i < familyMembers.length; i++) {
            const member = familyMembers[i];

            if (!member.firstName || !member.lastName || !member.relationship) {
                return res.status(400).json({
                    success: false,
                    message: `Family member at index ${i}: First name, last name, and relationship are required`
                });
            }

            if (!validRelationships.includes(member.relationship)) {
                return res.status(400).json({
                    success: false,
                    message: `Family member at index ${i}: Invalid relationship type`
                });
            }

            if (member.bloodGroup && !validBloodGroups.includes(member.bloodGroup)) {
                return res.status(400).json({
                    success: false,
                    message: `Family member at index ${i}: Invalid blood group`
                });
            }

            if (member.gender && !validGenders.includes(member.gender)) {
                return res.status(400).json({
                    success: false,
                    message: `Family member at index ${i}: Invalid gender`
                });
            }
        }

        // Prepare data for bulk insert
        const familyMembersData = familyMembers.map(member => ({
            ...member,
            userId,
            emergencyContact: member.emergencyContact || false,
            isActive: true
        }));

        // Bulk create family members
        const createdMembers = await Family.bulkCreate(familyMembersData, {
            validate: true,
            returning: true
        });

        res.status(201).json({
            success: true,
            message: `${createdMembers.length} family members added successfully`,
            data: createdMembers,
            count: createdMembers.length
        });

    } catch (error) {
        console.error('Error bulk adding family members:', error);

        // Handle specific database errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.errors.map(e => e.message).join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to bulk add family members',
            error: error.message
        });
    }
};

module.exports = {
    addFamilyMember,
    getFamilyMembers,
    getFamilyMemberById,
    updateFamilyMember,
    deleteFamilyMember,
    permanentDeleteFamilyMember,
    getFamilyMembersByRelationship,
    getEmergencyContacts,
    searchFamilyMembers,
    getFamilyStatistics,
    getFamilyOptions,
    bulkAddFamilyMembers
}; 