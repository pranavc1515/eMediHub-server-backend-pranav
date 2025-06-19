/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin panel & management APIs
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */

/**
 * @swagger
 * /api/admin/doctors:
 *   get:
 *     summary: List doctors (filterable)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated doctor list
 */

/**
 * @swagger
 * /api/admin/doctors/{id}:
 *   put:
 *     summary: Update doctor's profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Doctor updated
 */

/**
 * @swagger
 * /api/admin/doctors/{id}/verify:
 *   patch:
 *     summary: Verify or unverify a doctor
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Verification toggled
 */

/**
 * @swagger
 * /api/admin/patients:
 *   get:
 *     summary: List patients
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated patient list
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated user list
 */

/**
 * @swagger
 * /api/admin/patients/{id}/status:
 *   patch:
 *     summary: Update patient active status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Patient status updated
 */

/**
 * @swagger
 * /api/admin/consultations:
 *   get:
 *     summary: Get all consultations with filtering options
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, ongoing, completed, cancelled]
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: consultationType
 *         schema:
 *           type: string
 *           enum: [video, in-person]
 *     responses:
 *       200:
 *         description: Paginated consultation list
 */

/**
 * @swagger
 * /api/admin/consultations/statistics:
 *   get:
 *     summary: Get consultation statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Consultation statistics
 */

/**
 * @swagger
 * /api/admin/consultations/{id}:
 *   patch:
 *     summary: Update consultation status (cancel or reschedule)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, ongoing, completed, cancelled]
 *               cancelReason:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Consultation updated successfully
 */

/**
 * @swagger
 * /api/admin/consultations/report:
 *   get:
 *     summary: Generate consultation report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Consultation report generated
 */

/**
 * @swagger
 * /api/admin/prescriptions:
 *   get:
 *     summary: Get all prescriptions with filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: prescriptionType
 *         schema:
 *           type: string
 *           enum: [file, custom]
 *     responses:
 *       200:
 *         description: Paginated prescription list
 */

/**
 * @swagger
 * /api/admin/prescriptions/audit:
 *   get:
 *     summary: Audit prescription patterns
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prescription audit results
 */

/**
 * @swagger
 * /api/admin/prescriptions/suspicious:
 *   get:
 *     summary: Flag suspicious prescriptions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of flagged suspicious prescriptions
 */

/**
 * @swagger
 * /api/admin/prescriptions/report:
 *   get:
 *     summary: Generate prescription report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Prescription report generated
 */

/**
 * @swagger
 * /api/admin/analytics/patient-demographics:
 *   get:
 *     summary: Get patient demographics analysis
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient demographics data
 */

/**
 * @swagger
 * /api/admin/analytics/doctor-performance:
 *   get:
 *     summary: Get doctor performance metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Doctor performance metrics
 */

/**
 * @swagger
 * /api/admin/analytics/system-usage:
 *   get:
 *     summary: Get system usage statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: System usage statistics
 */

/**
 * @swagger
 * /api/admin/analytics/revenue-report:
 *   get:
 *     summary: Generate revenue report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *     responses:
 *       200:
 *         description: Revenue report data
 */

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get all system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System settings grouped by category
 *   post:
 *     summary: Update system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *                     category:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */

/**
 * @swagger
 * /api/admin/notification-templates:
 *   get:
 *     summary: Get notification templates
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notification templates
 *   post:
 *     summary: Update notification template
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [html, text]
 *                 default: html
 *     responses:
 *       200:
 *         description: Template updated successfully
 */

/**
 * @swagger
 * /api/admin/fee-structure:
 *   post:
 *     summary: Set fee structure
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platformFeePercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               taxPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               minimumPayoutAmount:
 *                 type: number
 *                 minimum: 0
 *               specialtyFees:
 *                 type: object
 *     responses:
 *       200:
 *         description: Fee structure updated successfully
 */

/**
 * @swagger
 * /api/admin/working-hours:
 *   post:
 *     summary: Set working hours
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workingHours:
 *                 type: object
 *                 properties:
 *                   monday:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       end:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       enabled:
 *                         type: boolean
 *                   tuesday:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       end:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       enabled:
 *                         type: boolean
 *                   wednesday:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       end:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       enabled:
 *                         type: boolean
 *                   thursday:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       end:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       enabled:
 *                         type: boolean
 *                   friday:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       end:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       enabled:
 *                         type: boolean
 *                   saturday:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       end:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       enabled:
 *                         type: boolean
 *                   sunday:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       end:
 *                         type: string
 *                         pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                       enabled:
 *                         type: boolean
 *     responses:
 *       200:
 *         description: Working hours updated successfully
 */

/**
 * @swagger
 * /api/admin/specializations:
 *   get:
 *     summary: Get all specializations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of specializations
 *   post:
 *     summary: Create new specialization
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               baseConsultationFee:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Specialization created successfully
 */

/**
 * @swagger
 * /api/admin/specializations/{id}:
 *   get:
 *     summary: Get specialization by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Specialization details
 *   put:
 *     summary: Update specialization
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               baseConsultationFee:
 *                 type: number
 *                 minimum: 0
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Specialization updated successfully
 *   delete:
 *     summary: Delete specialization
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Specialization deleted successfully
 */

/**
 * @swagger
 * /api/admin/specializations/{id}/doctors:
 *   get:
 *     summary: Get doctors by specialization
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated list of doctors in specialization
 */

/**
 * @swagger
 * /api/admin/specializations/{id}/fee:
 *   patch:
 *     summary: Set consultation fee for specialization
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - baseConsultationFee
 *             properties:
 *               baseConsultationFee:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Consultation fee updated successfully
 */

/**
 * @swagger
 * /api/admin/content:
 *   get:
 *     summary: Get all content
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [faq, policy, help, about, other]
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of content items
 *   post:
 *     summary: Create new content
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *               - title
 *               - content
 *             properties:
 *               slug:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [faq, policy, help, about, other]
 *                 default: other
 *               isPublished:
 *                 type: boolean
 *                 default: true
 *               order:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Content created successfully
 */

/**
 * @swagger
 * /api/admin/content/{idOrSlug}:
 *   get:
 *     summary: Get content by ID or slug
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content details
 */

/**
 * @swagger
 * /api/admin/content/{id}:
 *   put:
 *     summary: Update content
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slug:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [faq, policy, help, about, other]
 *               isPublished:
 *                 type: boolean
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Content updated successfully
 *   delete:
 *     summary: Delete content
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Content deleted successfully
 */

/**
 * @swagger
 * /api/admin/content/faqs:
 *   post:
 *     summary: Manage FAQs (update or reorder)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [update, reorder]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - faqs
 *             properties:
 *               faqs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     slug:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     order:
 *                       type: integer
 *                     isPublished:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: FAQs managed successfully
 */

/**
 * @swagger
 * /api/admin/content/policies/{slug}:
 *   post:
 *     summary: Update policy
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Policy updated successfully
 */

/**
 * @swagger
 * /api/admin/content/help/{slug}:
 *   post:
 *     summary: Update help documentation
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Help document updated successfully
 */

const express = require('express');
const router = express.Router();

// Controllers
const adminController = require('../controllers/admin.controller');
const adminConsultationController = require('../controllers/admin.consultation.controller');
const adminPrescriptionController = require('../controllers/admin.prescription.controller');
const adminAnalyticsController = require('../controllers/admin.analytics.controller');
const adminConfigController = require('../controllers/admin.config.controller');
const adminSpecializationController = require('../controllers/admin.specialization.controller');
const adminContentController = require('../controllers/admin.content.controller');

// Middleware
const { auth, authorize } = require('../middleware/auth.middleware');

// All admin routes require authentication and admin role
router.use(auth, authorize('admin'));

// Dashboard statistics
router.get('/dashboard', adminController.getDashboardStatistics);

// Doctor management
router.get('/doctors', adminController.getAllDoctors);
router.put('/doctors/:id', adminController.updateDoctorProfile);
router.patch('/doctors/:id/verify', adminController.toggleDoctorVerification);

// Patient/User management
router.get('/patients', adminController.getAllPatients);
router.get('/users', adminController.getAllUsers);
router.patch('/patients/:id/status', adminController.updateUserStatus);

// Consultation Management
router.get('/consultations', adminConsultationController.getAllConsultations);
router.get('/consultations/statistics', adminConsultationController.getConsultationStatistics);
router.patch('/consultations/:id', adminConsultationController.updateConsultationStatus);
router.get('/consultations/report', adminConsultationController.generateConsultationReport);

// Prescription Management
router.get('/prescriptions', adminPrescriptionController.getAllPrescriptions);
router.get('/prescriptions/audit', adminPrescriptionController.auditPrescriptionPatterns);
router.get('/prescriptions/suspicious', adminPrescriptionController.flagSuspiciousPrescriptions);
router.get('/prescriptions/report', adminPrescriptionController.generatePrescriptionReport);

// Analytics and Reporting
router.get('/analytics/patient-demographics', adminAnalyticsController.getPatientDemographics);
router.get('/analytics/doctor-performance', adminAnalyticsController.getDoctorPerformanceMetrics);
router.get('/analytics/system-usage', adminAnalyticsController.getSystemUsageStatistics);
router.get('/analytics/revenue-report', adminAnalyticsController.generateRevenueReport);

// System Configuration
router.get('/settings', adminConfigController.getAllSettings);
router.post('/settings', adminConfigController.updateSettings);
router.get('/notification-templates', adminConfigController.getNotificationTemplates);
router.post('/notification-templates', adminConfigController.updateNotificationTemplate);
router.post('/fee-structure', adminConfigController.setFeeStructure);
router.post('/working-hours', adminConfigController.setWorkingHours);

// Doctor Specialization Management
router.get('/specializations', adminSpecializationController.getAllSpecializations);
router.get('/specializations/:id', adminSpecializationController.getSpecializationById);
router.post('/specializations', adminSpecializationController.createSpecialization);
router.put('/specializations/:id', adminSpecializationController.updateSpecialization);
router.delete('/specializations/:id', adminSpecializationController.deleteSpecialization);
router.get('/specializations/:id/doctors', adminSpecializationController.getDoctorsBySpecialization);
router.patch('/specializations/:id/fee', adminSpecializationController.setConsultationFee);

// Content Management
router.get('/content', adminContentController.getAllContent);
router.get('/content/:idOrSlug', adminContentController.getContentByIdOrSlug);
router.post('/content', adminContentController.createContent);
router.put('/content/:id', adminContentController.updateContent);
router.delete('/content/:id', adminContentController.deleteContent);
router.post('/content/faqs', adminContentController.manageFAQs);
router.post('/content/policies/:slug', adminContentController.updatePolicy);
router.post('/content/help/:slug', adminContentController.updateHelpDoc);

module.exports = router; 