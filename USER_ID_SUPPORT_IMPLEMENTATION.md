# User ID Support Implementation for Family Member Consultations

## Overview

This document outlines the comprehensive changes made to support proper distinction between `userId` (platform owner) and `patientId` (consultation recipient) to enable family member consultations.

## Key Concepts

- **userId**: The ID of the platform user who owns the account and initiates consultations
- **patientId**: The ID of the patient for whom the consultation is being conducted (could be the user themselves or a family member)
- **userSocketMap**: Maps userId to socket connections (previously patientSocketMap)

## Database Schema Changes

### 1. PatientQueue Model Updates

**File**: `src/models/patientQueue.model.js`

**Changes Made**:
```javascript
// Added new userId column
userId: {
  type: DataTypes.INTEGER,
  allowNull: false,
  comment: 'Platform owner/user ID who initiated the consultation'
},
patientId: {
  type: DataTypes.INTEGER,
  allowNull: false,
  comment: 'Patient ID for consultation (can be userId or family member)',
  // ... existing configuration
},
```

**Migration Required**: Add userId column to existing patient_queue table
```sql
ALTER TABLE patient_queue ADD COLUMN userId INTEGER NOT NULL DEFAULT 0;
-- Update existing records to set userId = patientId for backward compatibility
UPDATE patient_queue SET userId = patientId WHERE userId = 0;
```

## Socket Management Changes

### 2. Socket Handler Updates

**File**: `src/socket/socketHandlers.js`

**Key Changes**:
```javascript
// Renamed patientSocketMap to userSocketMap
const userSocketMap = new Map(); // Maps userId to socketId

// Updated functions
const getUserSocketId = (userId) => userSocketMap.get(userId);
const getPatientSocketId = (patientId) => userSocketMap.get(patientId); // Deprecated

// Socket connection handling
if (userType === 'patient' && userId) {
  userSocketMap.set(Number(userId), socket.id);
  console.log(`User connected: ${userId}, socket: ${socket.id}`);
}

// Position updates now use userId instead of patientId
const userSocketId = getUserSocketId(entry.userId || entry.patientId);
if (userSocketId) {
  io.to(userSocketId).emit('POSITION_UPDATE', positionData);
  console.log(`Position update sent to user ${entry.userId || entry.patientId} for patient ${entry.patientId}`);
}
```

**Exports Updated**:
```javascript
module.exports = {
  getUserSocketId,           // New primary function
  getPatientSocketId,       // Deprecated - use getUserSocketId
  userSocketMap,            // New primary map
  patientSocketMap: userSocketMap, // Backward compatibility
};
```

## API Controller Changes

### 3. Patient Queue Controller Updates

**File**: `src/controllers/patientQueue.controller.js`

**Join Queue API Changes**:
```javascript
const joinPatientQueue = async (req, res) => {
  const { doctorId, patientId, userId } = req.body; // Added userId

  // Validation
  if (!userId) {
    return res.status(400).json({
      message: 'Missing userId - required to identify platform user',
    });
  }

  // Check existing queue by userId (not patientId)
  const existingQueueEntry = await PatientQueue.findOne({
    where: {
      doctorId,
      userId, // Key change: check by userId
      status: ['waiting', 'in_consultation'],
    },
  });

  // Create queue entry with userId
  const queueEntry = await PatientQueue.create({
    doctorId,
    userId,     // Added
    patientId,
    position: nextPosition,
    roomName,
    status: 'waiting',
  });
};
```

**Leave Queue API Changes**:
```javascript
const leavePatientQueue = async (req, res) => {
  const { patientId, doctorId, userId } = req.body; // Added userId

  const queueEntry = await PatientQueue.findOne({
    where: {
      userId,     // Key change: find by userId
      doctorId,
      status: 'waiting',
    },
  });
};
```

**Data Fetching Updates**:
```javascript
// Enhanced getPatientDataForDisplay to handle family members
const getPatientDataForDisplay = async (patientId, userId = null, authToken = null) => {
  // If userId is provided and different from patientId, try family API first
  if (userId && parseInt(userId) !== parseInt(patientId)) {
    try {
      const { getFamilyMemberData } = require('./family.controller');
      const familyMemberData = await getFamilyMemberData(userId, patientId, authToken);
      if (familyMemberData) {
        return {
          name: familyMemberData.name,
          phone: familyMemberData.phone,
          email: familyMemberData.email,
        };
      }
    } catch (familyError) {
      // Fall through to direct patient validation
    }
  }
  
  // Direct patient validation for self-consultations
  const patientData = await validatePatientExternally(patientId, userId, authToken);
  return { name: patientData.name, phone: patientData.phone, email: patientData.email };
};
```

### 4. Consultation Controller Updates

**File**: `src/controllers/consultation.controller.js`

**Socket Import Updates**:
```javascript
const {
  getDoctorSocketId,
  getUserSocketId,                    // New primary function
  getPatientSocketId,                // Deprecated
} = require('../socket/socketHandlers');
```

**Enhanced Patient Validation**:
```javascript
const validatePatientExternally = async (patientId, userId = null, authToken = null) => {
  // Family member validation logic
  if (userId && parseInt(userId) !== parseInt(patientId)) {
    try {
      const { validateFamilyMembership, getFamilyMemberData } = require('./family.controller');
      
      const isValidFamily = await validateFamilyMembership(userId, patientId, authToken);
      if (isValidFamily) {
        const familyData = await getFamilyMemberData(userId, patientId, authToken);
        if (familyData) {
          return {
            id: parseInt(patientId),
            name: familyData.name,
            phone: familyData.phone,
            email: familyData.email,
            status: 'Active',
            isFamilyMember: true,
            relatedUserId: userId,
          };
        }
      }
    } catch (familyError) {
      console.warn(`Family validation failed: ${familyError.message}`);
    }
  }

  // Direct patient validation for self-consultations
  const result = await patientController.getUserById(patientId, authToken);
  // ... process external API response
};
```

**Start Consultation Updates**:
```javascript
const startConsultation = async (req, res) => {
  const { doctorId, patientId, userId } = req.body; // Added userId support

  // Enhanced validation with family support
  const authToken = req.header('Authorization')?.replace('Bearer ', '');
  await validatePatientExternally(patientId, userId, authToken);

  // Queue entry creation includes userId
  // Socket notifications use getUserSocketId(queueEntry.userId)
};
```

**Socket Notification Updates**:
```javascript
// Updated all socket notifications to use userId
const userSocketId = getUserSocketId(queueEntry.userId);
if (userSocketId) {
  const payload = {
    roomName: queueEntry.roomName,
    consultationId: consultation.id,
    doctorId,
    patientId,
    userId: queueEntry.userId, // Added for clarity
  };
  io.to(userSocketId).emit('CONSULTATION_STARTED', payload);
  console.log(`Notification sent to user ${queueEntry.userId} for patient ${patientId}`);
}
```

### 5. Family Controller Enhancements

**File**: `src/controllers/family.controller.js`

**New Function Added**:
```javascript
// Function to get family member data by patientId
const getFamilyMemberData = async (userId, patientId, authToken) => {
  // Self-consultation check
  if (parseInt(userId) === parseInt(patientId)) {
    return null; // Let calling function use direct patient validation
  }

  // Get family tree data
  const familyData = await getFamilyTreeData(userId, authToken);
  
  // Find specific family member data
  const memberData = findMemberInFamilyTree(familyData.data.familyTree, patientId);
  
  if (!memberData) {
    throw new Error(`Family member with ID ${patientId} not found`);
  }

  return memberData;
};

// Recursive function to find specific member data in family tree
const findMemberInFamilyTree = (familyTree, patientId) => {
  for (const member of familyTree) {
    if (parseInt(member.id) === parseInt(patientId)) {
      return {
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        // ... other member data
      };
    }
    
    // Recursive search in children and relatives
    // ... implementation
  }
  
  return null;
};
```

**Exports Updated**:
```javascript
module.exports = {
  validateFamilyMembership,
  getFamilyTreeData,
  getFamilyMemberData,    // New export
  // ... existing exports
};
```

## API Changes Summary

### Request/Response Changes

**Before**:
```json
// Join Queue Request
{
  "doctorId": 4,
  "patientId": 284
}

// Position Update Response
{
  "position": 1,
  "estimatedWait": "0 mins",
  "status": "waiting"
}
```

**After**:
```json
// Join Queue Request
{
  "doctorId": 4,
  "patientId": 284,
  "userId": 243
}

// Position Update Response
{
  "position": 1,
  "estimatedWait": "0 mins",
  "status": "waiting",
  "patientId": 284,
  "userId": 243
}
```

### Queue Entry Structure

**Before**:
```json
{
  "id": 1,
  "patientId": 284,
  "doctorId": 4,
  "position": 1,
  "status": "waiting",
  "roomName": "room-uuid"
}
```

**After**:
```json
{
  "id": 1,
  "userId": 243,
  "patientId": 284,
  "doctorId": 4,
  "position": 1,
  "status": "waiting",
  "roomName": "room-uuid"
}
```

## Data Flow Examples

### Scenario 1: Self-Consultation
```
User 243 consults for themselves:
- userId: 243
- patientId: 243
- Socket: userSocketMap[243] -> socketId
- Validation: Direct external API validation
- Data: Direct patient data fetch
```

### Scenario 2: Family Member Consultation
```
User 243 consults for family member 284 (Father - Rahul):
- userId: 243
- patientId: 284
- Socket: userSocketMap[243] -> socketId (notification goes to user 243)
- Validation: Family relationship validation via family API
- Data: Family member data fetch via family tree API
```

## Backward Compatibility

### Legacy Support
```javascript
// Maintained deprecated functions for backward compatibility
const getPatientSocketId = (patientId) => userSocketMap.get(patientId);
const patientSocketMap = userSocketMap; // Alias

// Fallback logic in socket notifications
const userSocketId = getUserSocketId(entry.userId || entry.patientId);
```

### Migration Strategy
1. **Phase 1**: Add userId column to database with default values
2. **Phase 2**: Update all API endpoints to accept userId parameter
3. **Phase 3**: Frontend integration to pass userId in all requests
4. **Phase 4**: Remove deprecated functions (future release)

## Benefits

### 1. **Proper Family Support**
- Family members can have consultations without separate accounts
- Clear distinction between platform user and consultation patient
- Proper socket notifications to account owners

### 2. **Improved Data Integrity**
- Correct patient data fetching via family API when needed
- Proper validation of family relationships
- Clear audit trail of who initiated consultations

### 3. **Enhanced Security**
- Validation of family membership before allowing consultations
- Proper authorization checks for family member access
- Clear separation of user and patient contexts

### 4. **Better User Experience**
- Notifications go to the correct user (account owner)
- Family member data displayed properly
- Clear indication of consultation context

## Testing Scenarios

### Test Case 1: Self-Consultation
```
Request: { doctorId: 4, patientId: 243, userId: 243 }
Expected: Direct validation, consultation for user themselves
Socket: Notification to user 243
```

### Test Case 2: Family Member Consultation
```
Request: { doctorId: 4, patientId: 284, userId: 243 }
Expected: Family validation, consultation for family member
Socket: Notification to user 243 (not 284)
```

### Test Case 3: Invalid Family Member
```
Request: { doctorId: 4, patientId: 999, userId: 243 }
Expected: Family validation fails, error response
Result: { success: false, action: 'invalid_family_member' }
```

## Next Steps

1. **Database Migration**: Run migration to add userId column to production
2. **Frontend Updates**: Update all frontend API calls to include userId
3. **Testing**: Comprehensive testing of all family member scenarios
4. **Documentation**: Update API documentation with new request/response formats
5. **Monitoring**: Monitor socket connections and notifications for proper routing

This implementation provides a robust foundation for family member consultations while maintaining backward compatibility and ensuring proper data validation and security. 