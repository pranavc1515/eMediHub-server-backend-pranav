# VDC (Video/Digital Consultation) Implementation Summary

## Overview
This document summarizes the implementation of the VDC (Video/Digital Consultation) opt-in functionality for doctors. The implementation allows doctors to enable/disable video consultation services and manage their consultation fees and availability separately from their professional details.

## Changes Made

### 1. Database Model Updates
**File: `src/models/doctor.model.js`**
- Added `vdcEnabled` field to `DoctorProfessional` model
  - Type: BOOLEAN
  - Default: false
  - Description: Whether doctor has opted for Video/Digital Consultation services

### 2. Professional Details API Updates
**File: `src/routes/doctor.routes.js`**
- **REMOVED** `consultationFees` and `availableDays` from professional details API
- Updated PUT `/api/doctors/professional-details/:id` endpoint
- Updated Swagger documentation to reflect the changes
- These fields are now managed through the VDC settings API

### 3. New VDC Controller
**File: `src/controllers/doctor.vdc.controller.js`**
- `getVDCSettings(req, res)`: Retrieve doctor's VDC settings
- `updateVDCSettings(req, res)`: Update VDC settings with validation
- Includes comprehensive validation for consultation fees and available days
- Automatically clears VDC-related data when VDC is disabled

### 4. New VDC Routes
**File: `src/routes/doctor.routes.js`** (VDC section added)
- GET `/api/doctors/vdc-status`: Check if doctor has opted for VDC
- GET `/api/doctors/vdc-settings`: Get VDC settings
- PUT `/api/doctors/vdc-settings`: Update VDC settings
- Complete Swagger documentation with examples and validation rules

### 5. Profile API Updates
**File: `src/routes/doctor.routes.js`**
- Updated GET `/api/doctors/profile` endpoint
- Now only returns `consultationFees`, `availableDays`, and `availableTimeSlots` if `vdcEnabled` is true
- Always includes `vdcEnabled` field for transparency

### 6. Doctor Listing APIs Updates
**File: `src/controllers/doctor.controller.js`**
- Updated `getAllDoctors()` method
- Updated `getAvailableDoctors()` method
- Both methods now filter out VDC-related fields if VDC is not enabled
- Maintains backward compatibility while respecting VDC settings

## API Endpoints

### New VDC Endpoints

#### GET /api/doctors/vdc-status
Checks if doctor has opted for VDC services.
- **Authentication**: Required (Bearer token)
- **Response**: 
```json
{
  "success": true,
  "data": {
    "vdcEnabled": true,
    "hasOptedVDC": true
  }
}
```

#### GET /api/doctors/vdc-settings
Retrieves doctor's VDC settings.
- **Authentication**: Required (Bearer token)
- **Response**: 
```json
{
  "success": true,
  "data": {
    "vdcEnabled": true,
    "consultationFees": 500.00,
    "availableDays": ["monday", "tuesday", "wednesday"],
    "availableTimeSlots": {"monday": {"start": "09:00", "end": "17:00"}}
  }
}
```

#### PUT /api/doctors/vdc-settings
Updates doctor's VDC settings.
- **Authentication**: Required (Bearer token)
- **Request Body**:
```json
{
  "vdcEnabled": true,
  "consultationFees": 500.00,
  "availableDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "availableTimeSlots": {
    "monday": {"start": "09:00", "end": "17:00"},
    "tuesday": {"start": "10:00", "end": "18:00"}
  }
}
```

### Updated Endpoints

#### PUT /api/doctors/professional-details/:id
- **REMOVED**: `consultationFees` and `availableDays` from request body
- **Focus**: Now only handles professional credentials and qualifications
- **VDC Data**: Must be managed through VDC settings API

#### GET /api/doctors/profile
- **Enhanced**: Now includes `vdcEnabled` field
- **Conditional**: Only returns VDC-related fields if VDC is enabled

#### GET /api/doctors and GET /api/doctors/available
- **Enhanced**: Automatically filter VDC-related fields based on doctor's VDC status
- **Backward Compatible**: Existing integrations continue to work

## Key Features

### 1. Opt-in System
- Doctors must explicitly enable VDC to provide video consultation services
- Default state is disabled for all doctors
- Clear separation between professional credentials and VDC services

### 2. Data Validation
- Consultation fees cannot be negative
- Available days must be valid weekday names
- Time slots must be properly formatted JSON objects
- Comprehensive error messages for validation failures

### 3. Automatic Data Management
- When VDC is disabled, all VDC-related data is cleared
- When VDC is enabled, doctors can set their consultation fees and availability
- Data integrity is maintained through proper validation

### 4. Privacy and Security
- VDC settings are only accessible by the doctor themselves
- Public profiles only show VDC data if explicitly enabled
- Doctor listings respect VDC preferences

### 5. Backward Compatibility
- Existing APIs continue to work
- No breaking changes for frontend applications
- Gradual migration path for existing data

## Frontend Integration Guide

### 1. Professional Details Form
Remove consultation fees and availability fields from the professional details form. These should now be managed through the VDC settings interface.

### 2. VDC Settings Interface
Create a new interface for VDC settings with:
- Toggle for enabling/disabling VDC
- Consultation fee input (only shown when VDC is enabled)
- Available days selector (only shown when VDC is enabled)
- Time slots configurator (only shown when VDC is enabled)

### 3. Doctor Profile Display
Check the `vdcEnabled` field before displaying consultation fees and availability information.

### 4. Doctor Listings
The API will automatically handle filtering, but you may want to add indicators for VDC-enabled doctors.

## Migration Notes

### For Existing Doctors
- All existing doctors will have `vdcEnabled` set to `false` by default
- They need to explicitly opt-in to VDC services
- Existing consultation fees and availability data is preserved but only shown if VDC is enabled

### For Frontend Applications
- Update professional details forms to remove VDC-related fields
- Implement new VDC settings interface
- Add VDC status checks before displaying consultation information
- Test backward compatibility with existing integrations

## Testing Recommendations

1. **VDC Enable/Disable Flow**: Test the complete flow of enabling and disabling VDC
2. **Data Validation**: Test all validation rules for consultation fees and availability
3. **Profile API**: Verify that VDC data is only shown when enabled
4. **Doctor Listings**: Confirm that listings respect VDC settings
5. **Professional Details**: Ensure professional details API no longer accepts VDC fields
6. **Backward Compatibility**: Test existing frontend integrations

## Security Considerations

- VDC settings are protected by authentication middleware
- Doctors can only modify their own VDC settings
- Input validation prevents malicious data entry
- Proper error handling prevents information disclosure

This implementation provides a complete, secure, and scalable solution for VDC opt-in functionality while maintaining backward compatibility and following best practices for API design. 