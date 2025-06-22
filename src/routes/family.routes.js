const express = require('express');
const router = express.Router();
const familyController = require('../controllers/family.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     FamilyMember:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - relationship
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated unique identifier
 *         userId:
 *           type: string
 *           description: ID of the user who is adding this family member (can be any string format like "1", "user123", etc.)
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: First name of the family member
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: Last name of the family member
 *         relationship:
 *           type: string
 *           enum: [Father, Mother, Spouse, Brother, Sister, Son, Daughter, Other]
 *           description: Relationship to the user
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth (YYYY-MM-DD format)
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           description: Gender of the family member
 *         phone:
 *           type: string
 *           minLength: 10
 *           maxLength: 15
 *           description: Phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         bloodGroup:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *           description: Blood group
 *         medicalConditions:
 *           type: string
 *           description: Existing medical conditions or allergies
 *         emergencyContact:
 *           type: boolean
 *           default: false
 *           description: Whether this person can be contacted in emergencies
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the family member record is active
 *         profileImage:
 *           type: string
 *           description: URL to profile image
 *         notes:
 *           type: string
 *           description: Additional notes about the family member
 */

/**
 * @swagger
 * /api/family/add:
 *   post:
 *     summary: Add a new family member
 *     tags: [Family]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FamilyMember'
 *           example:
 *             userId: "1"
 *             firstName: "John"
 *             lastName: "Doe"
 *             relationship: "Father"
 *             dateOfBirth: "1970-05-15"
 *             gender: "Male"
 *             phone: "1234567890"
 *             email: "john.doe@example.com"
 *             bloodGroup: "O+"
 *             emergencyContact: true
 *     responses:
 *       201:
 *         description: Family member added successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/add', familyController.addFamilyMember);

/**
 * @swagger
 * /api/family/user/{userId}:
 *   get:
 *     summary: Get all family members for a specific user
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get family members for (can be any string format like "1", "user123", etc.)
 *         example: "1"
 *       - in: query
 *         name: relationship
 *         schema:
 *           type: string
 *           enum: [Father, Mother, Spouse, Brother, Sister, Son, Daughter, Other]
 *         description: Filter by relationship type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Family members retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', familyController.getFamilyMembers);

/**
 * @swagger
 * /api/family/{id}:
 *   get:
 *     summary: Get a specific family member by ID
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Family member ID
 *     responses:
 *       200:
 *         description: Family member retrieved successfully
 *       404:
 *         description: Family member not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', familyController.getFamilyMemberById);

/**
 * @swagger
 * /api/family/{id}:
 *   put:
 *     summary: Update a family member
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Family member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FamilyMember'
 *     responses:
 *       200:
 *         description: Family member updated successfully
 *       404:
 *         description: Family member not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', familyController.updateFamilyMember);

/**
 * @swagger
 * /api/family/{id}:
 *   delete:
 *     summary: Soft delete a family member (sets isActive to false)
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Family member ID
 *     responses:
 *       200:
 *         description: Family member deleted successfully
 *       404:
 *         description: Family member not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', familyController.deleteFamilyMember);

/**
 * @swagger
 * /api/family/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a family member from the database
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Family member ID
 *     responses:
 *       200:
 *         description: Family member permanently deleted
 *       404:
 *         description: Family member not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/permanent', familyController.permanentDeleteFamilyMember);

/**
 * @swagger
 * /api/family/user/{userId}/relationship/{relationship}:
 *   get:
 *     summary: Get family members by specific relationship
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (can be any string format like "1", "user123", etc.)
 *       - in: path
 *         name: relationship
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Father, Mother, Spouse, Brother, Sister, Son, Daughter, Other]
 *         description: Relationship type
 *     responses:
 *       200:
 *         description: Family members by relationship retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId/relationship/:relationship', familyController.getFamilyMembersByRelationship);

/**
 * @swagger
 * /api/family/user/{userId}/emergency-contacts:
 *   get:
 *     summary: Get all emergency contacts for a user
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (can be any string format like "1", "user123", etc.)
 *     responses:
 *       200:
 *         description: Emergency contacts retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId/emergency-contacts', familyController.getEmergencyContacts);

/**
 * @swagger
 * /api/family/user/{userId}/search:
 *   get:
 *     summary: Search family members by name, relationship, phone, or email
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (can be any string format like "1", "user123", etc.)
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId/search', familyController.searchFamilyMembers);

/**
 * @swagger
 * /api/family/user/{userId}/statistics:
 *   get:
 *     summary: Get family statistics for a user
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (can be any string format like "1", "user123", etc.)
 *     responses:
 *       200:
 *         description: Family statistics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId/statistics', familyController.getFamilyStatistics);

/**
 * @swagger
 * /api/family/options:
 *   get:
 *     summary: Get available options for family member fields (relationships, blood groups, genders)
 *     tags: [Family]
 *     responses:
 *       200:
 *         description: Family options retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/options', familyController.getFamilyOptions);

/**
 * @swagger
 * /api/family/bulk-add:
 *   post:
 *     summary: Add multiple family members at once
 *     tags: [Family]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - familyMembers
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID who is adding the family members
 *               familyMembers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/FamilyMember'
 *           example:
 *             userId: "1"
 *             familyMembers:
 *               - firstName: "John"
 *                 lastName: "Doe"
 *                 relationship: "Father"
 *                 phone: "1234567890"
 *                 emergencyContact: true
 *               - firstName: "Jane"
 *                 lastName: "Doe"
 *                 relationship: "Mother"
 *                 phone: "0987654321"
 *                 emergencyContact: true
 *     responses:
 *       201:
 *         description: Family members added successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/bulk-add', familyController.bulkAddFamilyMembers);

module.exports = router; 