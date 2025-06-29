const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const familyController = require('../controllers/family.controller');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: "JWT Authorization header using the Bearer scheme. Example: 'Authorization: Bearer {token}'"
 *   schemas:
 *     FamilyMember:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the family member
 *           example: 128
 *         name:
 *           type: string
 *           description: Full name of the family member
 *           example: "mybrother"
 *         relation_type:
 *           type: string
 *           description: Relationship to the main user
 *           enum: [Father, Mother, Brother, Sister, Spouse, Son, Daughter, Grandfather, Grandmother, Uncle, Aunt, Cousin]
 *           example: "Brother"
 *         phone:
 *           type: string
 *           nullable: true
 *           description: Phone number with country code
 *           example: "+918585858522"
 *         email:
 *           type: string
 *           nullable: true
 *           description: Email address
 *           format: email
 *           example: "brother55@gmail.com"
 *         age:
 *           type: integer
 *           nullable: true
 *           description: Age in years
 *           example: 50
 *         dob:
 *           type: string
 *           nullable: true
 *           description: Date of birth in ISO format
 *           format: date-time
 *           example: "1998-01-01T00:00:00.000Z"
 *         gender:
 *           type: string
 *           nullable: true
 *           description: Gender identity
 *           enum: [Male, Female, Other]
 *           example: "Male"
 *         marital_status:
 *           type: string
 *           nullable: true
 *           description: Marital status
 *           enum: [Single, Married, Divorced, Widowed, Separated]
 *           example: "Married"
 *         profession:
 *           type: string
 *           nullable: true
 *           description: Occupation or profession
 *           example: null
 *         image:
 *           type: string
 *           nullable: true
 *           description: Profile image URL or base64 encoded data
 *           example: null
 *         relatives:
 *           type: array
 *           description: Nested family members connected to this person
 *           items:
 *             $ref: '#/components/schemas/FamilyMember'
 *     FamilyTreeResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the request was successful
 *           example: true
 *         status_code:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Family tree retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: User ID of the authenticated user
 *                   example: 125
 *                 totalRelativMembers:
 *                   type: integer
 *                   description: Total number of family members
 *                   example: 4
 *             familyTree:
 *               type: array
 *               description: Array of family members with hierarchical relationships
 *               items:
 *                 $ref: '#/components/schemas/FamilyMember'
 *     AddFamilyMemberRequest:
 *       type: object
 *       required:
 *         - nodeUserId
 *         - relationName
 *         - name
 *       properties:
 *         nodeUserId:
 *           type: integer
 *           description: ID of the existing user to connect this family member to
 *           minimum: 1
 *           example: 141
 *         relationName:
 *           type: string
 *           description: Relationship type to the connected user
 *           enum: [Father, Mother, Brother, Sister, Spouse, Son, Daughter, Grandfather, Grandmother, Uncle, Aunt, Cousin]
 *           example: "Spouse"
 *         name:
 *           type: string
 *           description: Full name of the family member
 *           minLength: 2
 *           maxLength: 100
 *           example: "rohan sohan"
 *         phone:
 *           type: string
 *           description: Phone number with country code (E.164 format)
 *           pattern: '^\+[1-9]\d{1,14}$'
 *           example: "+919999966667"
 *         email:
 *           type: string
 *           description: Valid email address
 *           format: email
 *           maxLength: 255
 *           example: ""
 *         age:
 *           type: string
 *           description: Age with unit in format 'XX-year'
 *           pattern: '^\d{1,3}-year$'
 *           example: "25-year"
 *         dob:
 *           type: string
 *           description: Date of birth in YYYY-MM-DD format
 *           format: date
 *           example: ""
 *         gender:
 *           type: string
 *           description: Gender identity
 *           enum: [male, female, other]
 *           example: "male"
 *         marital_status:
 *           type: string
 *           description: Marital status
 *           enum: [Single, Married, Divorced, Widowed, Separated]
 *           example: "Married"
 *         profession:
 *           type: string
 *           description: Occupation or profession
 *           maxLength: 100
 *           example: "myprofession"
 *         height:
 *           type: string
 *           description: Height in centimeters with format 'XXX-cm'
 *           pattern: '^\d{2,3}-cm$'
 *           example: "160-cm"
 *         weight:
 *           type: string
 *           description: Weight in kilograms with format 'XXX-kg'
 *           pattern: '^\d{2,3}-kg$'
 *           example: "150-kg"
 *         diet:
 *           type: string
 *           description: Dietary preference
 *           enum: [Vegetarian, Non-Vegetarian, Vegan]
 *           example: "Non-Vegetarian"
 *         image:
 *           type: string
 *           description: Base64 encoded image data (JPEG/PNG)
 *           example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
 *     AddFamilyMemberResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the request was successful
 *           example: true
 *         status_code:
 *           type: integer
 *           description: HTTP status code
 *           example: 201
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Family member added successfully."
 *         familyUserId:
 *           type: integer
 *           description: ID of the newly created family member
 *           example: 113
 *     UpdateFamilyMemberRequest:
 *       type: object
 *       description: All fields are optional - include only the fields you want to update
 *       properties:
 *         name:
 *           type: string
 *           description: Updated name of the family member
 *           minLength: 2
 *           maxLength: 100
 *           example: "myname"
 *         relationName:
 *           type: string
 *           description: Updated relationship type
 *           enum: [Father, Mother, Brother, Sister, Spouse, Son, Daughter, Grandfather, Grandmother, Uncle, Aunt, Cousin]
 *           example: "sister"
 *         phone:
 *           type: string
 *           description: Updated phone number with country code
 *           pattern: '^\+[1-9]\d{1,14}$'
 *           example: "+911231231231"
 *         email:
 *           type: string
 *           description: Updated email address
 *           format: email
 *           maxLength: 255
 *           example: "email@email.email"
 *         age:
 *           type: string
 *           description: Updated age in 'XX-year' format
 *           pattern: '^\d{1,3}-year$'
 *           example: "45year"
 *         dob:
 *           type: string
 *           description: Updated date of birth in YYYY-MM-DD format
 *           format: date
 *           example: "1998-01-01"
 *         gender:
 *           type: string
 *           description: Updated gender identity
 *           enum: [male, female, other]
 *           example: "male"
 *         marital_status:
 *           type: string
 *           description: Updated marital status
 *           enum: [Single, Married, Divorced, Widowed, Separated]
 *           example: ""
 *         profession:
 *           type: string
 *           description: Updated profession or occupation
 *           maxLength: 100
 *           example: "Senior Developers"
 *         height:
 *           type: string
 *           description: Updated height
 *           example: "20 ft"
 *         weight:
 *           type: string
 *           description: Updated weight
 *           example: "500 pound"
 *         diet:
 *           type: string
 *           description: Updated dietary preference
 *           example: ""
 *         image:
 *           type: string
 *           description: Updated base64 encoded image data
 *           example: ""
 *     UpdateFamilyMemberResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the update was successful
 *           example: true
 *         status_code:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Family member details updated successfully"
 *     RemoveFamilyMemberRequest:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: integer
 *           description: ID of the reference user from which the family member should be removed
 *           minimum: 1
 *           example: 103
 *     RemoveFamilyMemberResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the removal was successful
 *           example: true
 *         status_code:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Family member removed successfully."
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: false
 *         status_code:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: "Error message description"
 */

/**
 * @swagger
 * /api/family/view-family-tree:
 *   get:
 *     summary: View user's family tree
 *     description: Retrieves the complete family tree structure for the authenticated user, including all family members and their hierarchical relationships
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Family tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FamilyTreeResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Family tree retrieved successfully"
 *               data:
 *                 user:
 *                   id: 125
 *                   totalRelativMembers: 4
 *                 familyTree:
 *                   - id: 128
 *                     name: "mybrother"
 *                     relation_type: "Brother"
 *                     phone: "+918585858522"
 *                     email: "brother55@gmail.com"
 *                     age: 50
 *                     dob: "1998-01-01T00:00:00.000Z"
 *                     gender: "Male"
 *                     marital_status: "Married"
 *                     profession: null
 *                     image: null
 *                     relatives:
 *                       - id: 129
 *                         name: "mysister"
 *                         relation_type: "Sister"
 *                         phone: "+918569856985"
 *                         email: "brother558@gmail.com"
 *                         age: 21
 *                         dob: "1998-01-01T00:00:00.000Z"
 *                         gender: "Male"
 *                         marital_status: "Married"
 *                         profession: null
 *                         image: null
 *                         relatives: []
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Internal server error while fetching family tree"
 */
router.get('/view-family-tree', auth, familyController.viewFamilyTree);

/**
 * @swagger
 * /api/family/add-family-connection:
 *   post:
 *     summary: Add a new family member connection
 *     description: Creates a new family member and establishes a relationship connection to an existing user in the family tree
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddFamilyMemberRequest'
 *           examples:
 *             basic_example:
 *               summary: Basic family member addition
 *               value:
 *                 nodeUserId: 141
 *                 relationName: "Spouse"
 *                 name: "rohan sohan"
 *                 phone: "+919999966667"
 *                 email: ""
 *                 age: "25-year"
 *                 dob: ""
 *                 gender: "male"
 *                 marital_status: "Married"
 *                 profession: "myprofession"
 *                 height: "160-cm"
 *                 weight: "150-kg"
 *                 diet: "Non-Vegetarian"
 *                 image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
 *     responses:
 *       201:
 *         description: Family member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddFamilyMemberResponse'
 *             example:
 *               status: true
 *               status_code: 201
 *               message: "Family member added successfully."
 *               familyUserId: 113
 *       400:
 *         description: Validation error - Missing required fields or invalid data format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Required fields: nodeUserId, relationName, name"
 *               invalid_age_format:
 *                 summary: Invalid age format
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Invalid age format. Use 'XX-year' format (e.g., '25-year')"
 *               invalid_email:
 *                 summary: Invalid email format
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Invalid email format"
 *               invalid_phone:
 *                 summary: Invalid phone format
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Phone number must include country code (E.164 format)"
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       404:
 *         description: Node user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 404
 *               message: "User with ID 141 not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Internal server error while adding family member"
 */
router.post('/add-family-connection', auth, familyController.addFamilyConnection);

/**
 * @swagger
 * /api/family/update-family-details/{familyMemberId}:
 *   post:
 *     summary: Update family member details
 *     description: Updates specific details of an existing family member. All fields are optional - include only the fields you want to update.
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: familyMemberId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Unique ID of the family member to update
 *         example: 134
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFamilyMemberRequest'
 *           examples:
 *             partial_update:
 *               summary: Update only specific fields
 *               value:
 *                 name: "myname"
 *                 relationName: "sister"
 *                 phone: "+911231231231"
 *                 email: "email@email.email"
 *                 age: "45year"
 *                 dob: "1998-01-01"
 *                 gender: "male"
 *                 marital_status: ""
 *                 profession: "Senior Developers"
 *                 height: "20 ft"
 *                 weight: "500 pound"
 *                 diet: ""
 *                 image: ""
 *     responses:
 *       200:
 *         description: Family member details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateFamilyMemberResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Family member details updated successfully"
 *       400:
 *         description: Validation error - Invalid data format or constraints violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_email:
 *                 summary: Invalid email format
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Invalid email format"
 *               invalid_age_format:
 *                 summary: Invalid age format
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Age must be in 'XX-year' format"
 *               empty_request:
 *                 summary: No fields provided for update
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "At least one field must be provided for update"
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       404:
 *         description: Family member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 404
 *               message: "Family member with ID 134 not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Internal server error while updating family member"
 */
router.post('/update-family-details/:familyMemberId', auth, familyController.updateFamilyDetails);

/**
 * @swagger
 * /api/family/remove-member/{relatedUserId}:
 *   delete:
 *     summary: Remove a family member
 *     description: Removes a family member from the family tree by deleting the relationship connection to a specific user. This is a destructive action and cannot be undone.
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: relatedUserId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Unique ID of the family member/related user to remove from the family tree
 *         example: 117
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveFamilyMemberRequest'
 *           example:
 *             userId: 103
 *     responses:
 *       200:
 *         description: Family member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RemoveFamilyMemberResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Family member removed successfully."
 *       400:
 *         description: Validation error - Missing or invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_user_id:
 *                 summary: Missing userId in request body
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "userId is required in request body"
 *               invalid_user_id:
 *                 summary: Invalid userId format
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Invalid userId format - must be a positive integer"
 *               cannot_remove_self:
 *                 summary: Cannot remove yourself
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Cannot remove yourself from the family tree"
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       404:
 *         description: Family member or relationship not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               member_not_found:
 *                 summary: Family member not found
 *                 value:
 *                   status: false
 *                   status_code: 404
 *                   message: "Family member with ID 117 not found"
 *               relationship_not_found:
 *                 summary: No relationship exists
 *                 value:
 *                   status: false
 *                   status_code: 404
 *                   message: "No family relationship found between users"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Internal server error while removing family member"
 */
router.delete('/remove-member/:relatedUserId', auth, familyController.removeFamilyMember);

module.exports = router; 