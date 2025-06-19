const { Op } = require('sequelize');
const sequelize = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Define a Content model (we'll create this in memory since it might not exist yet)
const Content = sequelize.define('Content', {
    id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    slug: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    title: {
        type: sequelize.Sequelize.STRING,
        allowNull: false
    },
    content: {
        type: sequelize.Sequelize.TEXT,
        allowNull: false
    },
    type: {
        type: sequelize.Sequelize.ENUM('faq', 'policy', 'help', 'about', 'other'),
        defaultValue: 'other'
    },
    isPublished: {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: true
    },
    order: {
        type: sequelize.Sequelize.INTEGER,
        defaultValue: 0
    },
    lastUpdatedBy: {
        type: sequelize.Sequelize.STRING,
        allowNull: true
    }
}, {
    tableName: 'contents',
    timestamps: true
});

// Sync the model to ensure the table exists
(async () => {
    try {
        await Content.sync({ alter: true });
        console.log('Content table synchronized successfully');

        // Check if we need to seed default content
        const count = await Content.count();
        if (count === 0) {
            await seedDefaultContent();
        }
    } catch (error) {
        console.error('Error syncing Content table:', error);
    }
})();

// Seed default content
async function seedDefaultContent() {
    const defaultContent = [
        // FAQs
        {
            slug: 'what-is-emedihub',
            title: 'What is eMediHub?',
            content: 'eMediHub is a telemedicine platform that connects patients with doctors for online consultations. Our platform makes healthcare accessible from the comfort of your home.',
            type: 'faq',
            order: 1
        },
        {
            slug: 'how-to-book-appointment',
            title: 'How do I book an appointment?',
            content: 'To book an appointment, log in to your account, search for a doctor by specialization or name, select an available time slot, and confirm your booking. You will receive a confirmation email with the details.',
            type: 'faq',
            order: 2
        },
        {
            slug: 'payment-methods',
            title: 'What payment methods are accepted?',
            content: 'We accept credit/debit cards, net banking, and digital wallets. All payments are processed securely through our payment gateway.',
            type: 'faq',
            order: 3
        },

        // Policies
        {
            slug: 'terms-of-service',
            title: 'Terms of Service',
            content: `
# Terms of Service

## 1. Introduction
Welcome to eMediHub. By using our platform, you agree to these Terms of Service.

## 2. User Accounts
You are responsible for maintaining the security of your account and password.

## 3. Services
eMediHub provides a platform for telemedicine consultations between patients and healthcare providers.

## 4. Privacy
Your use of eMediHub is subject to our Privacy Policy.

## 5. Limitations
eMediHub is not a substitute for emergency medical services. In case of emergency, please call your local emergency number.
      `,
            type: 'policy',
            order: 1
        },
        {
            slug: 'privacy-policy',
            title: 'Privacy Policy',
            content: `
# Privacy Policy

## 1. Information We Collect
We collect personal information that you provide to us, including your name, email address, and health information.

## 2. How We Use Your Information
We use your information to provide our services, improve our platform, and communicate with you.

## 3. Information Sharing
We do not sell your personal information. We may share your information with healthcare providers to facilitate consultations.

## 4. Data Security
We implement appropriate security measures to protect your personal information.

## 5. Your Rights
You have the right to access, correct, or delete your personal information.
      `,
            type: 'policy',
            order: 2
        },

        // Help content
        {
            slug: 'getting-started',
            title: 'Getting Started with eMediHub',
            content: `
# Getting Started with eMediHub

## Creating an Account
1. Visit our website or download our mobile app
2. Click on "Sign Up" and enter your details
3. Verify your email address
4. Complete your profile information

## Booking Your First Appointment
1. Log in to your account
2. Search for a doctor by specialization or name
3. Select an available time slot
4. Confirm your booking
5. Make the payment

## Joining a Video Consultation
1. Log in to your account 10 minutes before the scheduled time
2. Go to "My Appointments" section
3. Click on the upcoming appointment
4. Click "Join Consultation" when it's time
      `,
            type: 'help',
            order: 1
        },

        // About content
        {
            slug: 'about-us',
            title: 'About eMediHub',
            content: `
# About eMediHub

eMediHub is a leading telemedicine platform dedicated to making healthcare accessible to everyone. Our mission is to bridge the gap between patients and healthcare providers through technology.

Founded in 2023, eMediHub has quickly grown to become a trusted platform for online medical consultations. We partner with verified and experienced doctors across various specializations to provide quality healthcare services.

Our team consists of healthcare professionals, technology experts, and customer service specialists working together to ensure a seamless experience for both patients and doctors.
      `,
            type: 'about',
            order: 1
        }
    ];

    try {
        await Content.bulkCreate(defaultContent);
        console.log('Default content seeded successfully');
    } catch (error) {
        console.error('Error seeding default content:', error);
    }
}

// Get all content
exports.getAllContent = async (req, res) => {
    try {
        const { type, published } = req.query;

        const where = {};
        if (type) {
            where.type = type;
        }
        if (published !== undefined) {
            where.isPublished = published === 'true';
        }

        const content = await Content.findAll({
            where,
            order: [['type', 'ASC'], ['order', 'ASC'], ['title', 'ASC']]
        });

        // Group by type if no specific type is requested
        const response = !type ? content.reduce((acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {}) : content;

        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
};

// Get content by ID or slug
exports.getContentByIdOrSlug = async (req, res) => {
    try {
        const { idOrSlug } = req.params;

        // Check if it's an ID (number) or slug (string)
        const isId = !isNaN(parseInt(idOrSlug));

        const where = isId ? { id: idOrSlug } : { slug: idOrSlug };

        const content = await Content.findOne({ where });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
};

// Create new content
exports.createContent = async (req, res) => {
    try {
        const { slug, title, content, type, isPublished, order } = req.body;

        if (!slug || !title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Slug, title, and content are required'
            });
        }

        // Check if slug already exists
        const existingContent = await Content.findOne({
            where: { slug }
        });

        if (existingContent) {
            return res.status(400).json({
                success: false,
                message: 'Content with this slug already exists'
            });
        }

        // Create new content
        const newContent = await Content.create({
            slug,
            title,
            content,
            type: type || 'other',
            isPublished: isPublished !== undefined ? isPublished : true,
            order: order || 0,
            lastUpdatedBy: req.user ? req.user.email : 'admin'
        });

        res.status(201).json({
            success: true,
            message: 'Content created successfully',
            data: newContent
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating content',
            error: error.message
        });
    }
};

// Update content
exports.updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { slug, title, content, type, isPublished, order } = req.body;

        const contentItem = await Content.findByPk(id);

        if (!contentItem) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Check if slug is being changed and if it already exists
        if (slug && slug !== contentItem.slug) {
            const existingContent = await Content.findOne({
                where: {
                    slug,
                    id: { [Op.ne]: id }
                }
            });

            if (existingContent) {
                return res.status(400).json({
                    success: false,
                    message: 'Content with this slug already exists'
                });
            }
        }

        // Update content
        await contentItem.update({
            slug: slug || contentItem.slug,
            title: title || contentItem.title,
            content: content || contentItem.content,
            type: type || contentItem.type,
            isPublished: isPublished !== undefined ? isPublished : contentItem.isPublished,
            order: order !== undefined ? order : contentItem.order,
            lastUpdatedBy: req.user ? req.user.email : 'admin'
        });

        res.json({
            success: true,
            message: 'Content updated successfully',
            data: contentItem
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating content',
            error: error.message
        });
    }
};

// Delete content
exports.deleteContent = async (req, res) => {
    try {
        const { id } = req.params;

        const contentItem = await Content.findByPk(id);

        if (!contentItem) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        await contentItem.destroy();

        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error deleting content',
            error: error.message
        });
    }
};

// Manage FAQs
exports.manageFAQs = async (req, res) => {
    try {
        const { action } = req.query;
        const { faqs } = req.body;

        if (!action || !['update', 'reorder'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action specified'
            });
        }

        if (!faqs || !Array.isArray(faqs)) {
            return res.status(400).json({
                success: false,
                message: 'FAQs array is required'
            });
        }

        if (action === 'update') {
            // Bulk update FAQs
            const updatePromises = faqs.map(async faq => {
                if (!faq.id) {
                    // Create new FAQ if no ID
                    return Content.create({
                        slug: faq.slug || `faq-${Date.now()}`,
                        title: faq.title,
                        content: faq.content,
                        type: 'faq',
                        order: faq.order || 0,
                        isPublished: faq.isPublished !== undefined ? faq.isPublished : true,
                        lastUpdatedBy: req.user ? req.user.email : 'admin'
                    });
                } else {
                    // Update existing FAQ
                    const existingFAQ = await Content.findByPk(faq.id);
                    if (existingFAQ) {
                        return existingFAQ.update({
                            title: faq.title || existingFAQ.title,
                            content: faq.content || existingFAQ.content,
                            isPublished: faq.isPublished !== undefined ? faq.isPublished : existingFAQ.isPublished,
                            order: faq.order !== undefined ? faq.order : existingFAQ.order,
                            lastUpdatedBy: req.user ? req.user.email : 'admin'
                        });
                    }
                }
            });

            await Promise.all(updatePromises);
        } else if (action === 'reorder') {
            // Reorder FAQs
            const updatePromises = faqs.map(async (faq, index) => {
                if (faq.id) {
                    const existingFAQ = await Content.findByPk(faq.id);
                    if (existingFAQ) {
                        return existingFAQ.update({
                            order: index + 1,
                            lastUpdatedBy: req.user ? req.user.email : 'admin'
                        });
                    }
                }
            });

            await Promise.all(updatePromises);
        }

        // Get updated FAQs
        const updatedFAQs = await Content.findAll({
            where: { type: 'faq' },
            order: [['order', 'ASC'], ['title', 'ASC']]
        });

        res.json({
            success: true,
            message: `FAQs ${action === 'update' ? 'updated' : 'reordered'} successfully`,
            data: updatedFAQs
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error managing FAQs',
            error: error.message
        });
    }
};

// Update policy
exports.updatePolicy = async (req, res) => {
    try {
        const { slug } = req.params;
        const { title, content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Policy content is required'
            });
        }

        // Find or create the policy
        const [policy, created] = await Content.findOrCreate({
            where: { slug, type: 'policy' },
            defaults: {
                title: title || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                content,
                isPublished: true,
                order: 0,
                lastUpdatedBy: req.user ? req.user.email : 'admin'
            }
        });

        if (!created) {
            await policy.update({
                title: title || policy.title,
                content,
                lastUpdatedBy: req.user ? req.user.email : 'admin'
            });
        }

        res.json({
            success: true,
            message: `${created ? 'Created' : 'Updated'} policy successfully`,
            data: policy
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating policy',
            error: error.message
        });
    }
};

// Update help documentation
exports.updateHelpDoc = async (req, res) => {
    try {
        const { slug } = req.params;
        const { title, content, order } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Help document content is required'
            });
        }

        // Find or create the help document
        const [helpDoc, created] = await Content.findOrCreate({
            where: { slug, type: 'help' },
            defaults: {
                title: title || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                content,
                isPublished: true,
                order: order || 0,
                lastUpdatedBy: req.user ? req.user.email : 'admin'
            }
        });

        if (!created) {
            await helpDoc.update({
                title: title || helpDoc.title,
                content,
                order: order !== undefined ? order : helpDoc.order,
                lastUpdatedBy: req.user ? req.user.email : 'admin'
            });
        }

        res.json({
            success: true,
            message: `${created ? 'Created' : 'Updated'} help document successfully`,
            data: helpDoc
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating help document',
            error: error.message
        });
    }
};