# Relational API Guide

This document describes the new API endpoints after the relational schema conversion.

## Overview

The API now uses proper relational database design with:
- **Foreign Key Constraints**: Enforced data integrity
- **Junction Tables**: Many-to-many relationships
- **Cascade Delete**: Automatic cleanup of related data
- **Referential Integrity**: Can't delete referenced records

## Key Relationships

```
Locations (1) ──── (M) Doctors
              ──── (M) Departments (via department_locations junction)

Departments (1) ──── (M) Doctors (via doctor_departments junction)
              ──── (M) Locations (via department_locations junction)

Doctors (1) ──── (M) Specializations
        └─ (1) Location (required FK)
        └─ (M) Departments (via doctor_departments junction)
```

---

## Locations API

### GET /locations
Get all locations with related doctors and departments.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Hyderabad Center",
      "address": "Hitech City, Hyderabad",
      "phone": "+91-40-1234567",
      "email": "hyderabad@mediblues.com",
      "image": null,
      "enabled": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "doctors": [
        {
          "id": 1,
          "name": "Dr. Rajesh Kumar",
          "qualifications": ["MBBS", "MD Cardiology"],
          "experience": 12,
          "location_id": 1,
          "image": null,
          "createdAt": "2024-01-15T10:05:00Z"
        }
      ],
      "departments": [
        {
          "id": 1,
          "name": "Cardiology",
          "heading": "Heart & Vascular Care",
          "description": "Expert cardiologists...",
          "image": null,
          "createdAt": "2024-01-15T10:03:00Z"
        }
      ]
    }
  ]
}
```

### GET /locations/{id}
Get a specific location with its doctors and departments.

**Response:** Same structure as above, single location object.

### POST /locations
Create a new location.

**Request:**
```json
{
  "name": "Mumbai Center",
  "address": "Bandra, Mumbai",
  "phone": "+91-22-1234567",
  "email": "mumbai@mediblues.com",
  "image": "https://...",
  "enabled": true
}
```

**Response:** Same location structure with id, createdAt, updatedAt.

**Required Fields:** name, address, phone, email

### PUT /locations/{id}
Update a location.

**Request:** Same as POST (any or all fields optional)

### DELETE /locations/{id}
Delete a location and all related doctors and their relationships.

⚠️ **CASCADE DELETE**: Deleting a location will automatically delete:
- All doctors assigned to this location
- All doctor-department relationships for those doctors
- All specializations for those doctors
- All department-location relationships

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Location and all related doctors/relationships deleted successfully"
  }
}
```

---

## Departments API

### GET /departments
Get all departments with their locations.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cardiology",
      "heading": "Heart & Vascular Care",
      "description": "Expert cardiologists...",
      "image": null,
      "createdAt": "2024-01-15T10:03:00Z",
      "updatedAt": "2024-01-15T10:03:00Z",
      "locations": [
        {
          "id": 1,
          "name": "Hyderabad Center",
          "address": "Hitech City, Hyderabad",
          "phone": "+91-40-1234567",
          "email": "hyderabad@mediblues.com",
          "image": null,
          "enabled": true,
          "createdAt": "2024-01-15T10:00:00Z"
        },
        {
          "id": 2,
          "name": "Bangalore Center",
          "address": "Indiranagar, Bangalore",
          "phone": "+91-80-2234567",
          "email": "bangalore@mediblues.com",
          "image": null,
          "enabled": true,
          "createdAt": "2024-01-15T10:02:00Z"
        }
      ]
    }
  ]
}
```

### GET /departments/{id}
Get a specific department with its locations.

**Response:** Single department object with locations array.

### POST /departments
Create a new department and link to locations.

**Request:**
```json
{
  "name": "Oncology",
  "heading": "Cancer Care Center",
  "description": "Comprehensive cancer treatment...",
  "locations": [1, 2, 3],
  "image": "https://..."
}
```

**Parameters:**
- `name` (required): Department name
- `heading`: Department heading
- `description`: Department description
- `locations`: Array of location IDs to link
- `image`: Department image URL

**Response:** Department object with locations array.

### PUT /departments/{id}
Update department and/or change location links.

**Request:**
```json
{
  "name": "Oncology - Updated",
  "locations": [1, 2]
}
```

**Notes:**
- Partial updates supported (any field can be omitted)
- If `locations` provided, existing links are replaced
- Remove all locations: `"locations": []`

### DELETE /departments/{id}
Delete department (cascades to doctor_departments junction).

---

## Doctors API

### GET /doctors
Get all doctors with their location and departments.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Dr. Rajesh Kumar",
      "qualifications": ["MBBS", "MD Cardiology"],
      "experience": 12,
      "location_id": 1,
      "image": null,
      "createdAt": "2024-01-15T10:05:00Z",
      "updatedAt": "2024-01-15T10:05:00Z",
      "location": {
        "id": 1,
        "name": "Hyderabad Center",
        "address": "Hitech City, Hyderabad",
        "phone": "+91-40-1234567",
        "email": "hyderabad@mediblues.com",
        "enabled": true
      },
      "departments": [
        {
          "id": 1,
          "name": "Cardiology",
          "heading": "Heart & Vascular Care",
          "description": "Expert cardiologists..."
        }
      ],
      "specializations": [
        "Interventional Cardiology",
        "Coronary Angiography"
      ]
    }
  ]
}
```

### GET /doctors/{id}
Get a specific doctor with location and departments.

**Response:** Single doctor object with location, departments, specializations.

### POST /doctors
Create a new doctor with location and departments.

**Request:**
```json
{
  "name": "Dr. Akshay Desai",
  "qualifications": ["MBBS", "MD Medicine", "DM Gastroenterology"],
  "experience": 9,
  "location_id": 2,
  "departments": [1, 2],
  "specializations": ["Upper GI Endoscopy", "ERCP"],
  "image": "https://..."
}
```

**Parameters:**
- `name` (required): Doctor name
- `location_id` (required): Location where doctor works
- `qualifications`: Array of qualifications
- `experience`: Years of experience (number)
- `departments`: Array of department IDs
- `specializations`: Array of specialization strings
- `image`: Doctor photo URL

**Response:** Doctor object with location, departments, specializations arrays.

**Error:** 400 if location_id missing or invalid

### PUT /doctors/{id}
Update doctor information.

**Request:**
```json
{
  "experience": 13,
  "location_id": 1,
  "departments": [1],
  "specializations": ["Interventional Cardiology"]
}
```

**Notes:**
- Partial updates supported
- Changing `location_id` moves doctor to new location
- Changing `departments` replaces all department links
- Changing `specializations` replaces all specializations

### DELETE /doctors/{id}
Delete doctor (cascades to doctor_departments and doctor_specializations).

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

### Common Error Codes

| Status | Meaning | Cause |
|--------|---------|-------|
| 400 | Bad Request | Missing required fields, invalid data |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | FK constraint violation |
| 500 | Server Error | Database or server error |

### FK Constraint Errors

**ER_NO_REFERENCED_ROW_2 (400):**
```json
{
  "success": false,
  "message": "Invalid location_id or department_id",
  "statusCode": 400
}
```
Cause: Trying to assign doctor to non-existent location/department

**ER_ROW_IS_REFERENCED_2 (409):**
```json
{
  "success": false,
  "message": "Cannot delete location - doctors are assigned to this location...",
  "statusCode": 409
}
```
Cause: Trying to delete location with doctors assigned

---

## Sample Data Included

After running `npm run init-db`, the database contains:

**Locations (3):**
- Hyderabad Center (3 departments, 2 doctors)
- Bangalore Center (2 departments, 2 doctors)
- Delhi Center (1 department, 1 doctor)

**Departments (3):**
- Cardiology (2 locations, 2 doctors)
- Neurology (2 locations, 1 doctor)
- Orthopedics (2 locations, 2 doctors)

**Doctors (5):**
- Dr. Rajesh Kumar (Cardiology, Hyderabad)
- Dr. Priya Sharma (Neurology, Hyderabad)
- Dr. Amit Patel (Orthopedics, Bangalore)
- Dr. Sarah Johnson (Cardiology, Bangalore)
- Dr. Vikram Singh (Orthopedics, Delhi)

---

## Quick Test Commands

### Create location
```bash
curl -X POST http://localhost:3000/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chennai Center",
    "address": "T. Nagar, Chennai",
    "phone": "+91-44-1234567",
    "email": "chennai@mediblues.com",
    "enabled": true
  }'
```

### Create department with locations
```bash
curl -X POST http://localhost:3000/departments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pediatrics",
    "heading": "Child Health Care",
    "description": "Pediatric care...",
    "locations": [1, 2]
  }'
```

### Create doctor with location and departments
```bash
curl -X POST http://localhost:3000/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Priya Nair",
    "qualifications": ["MBBS", "DCH"],
    "experience": 7,
    "location_id": 1,
    "departments": [4],
    "specializations": ["Neonatal Care", "Vaccination"],
    "image": null
  }'
```

### Get doctor with full details
```bash
curl http://localhost:3000/doctors/1 | jq
```

### Update doctor location
```bash
curl -X PUT http://localhost:3000/doctors/1 \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": 2
  }'
```

### Try to delete location with doctors (FK error)
```bash
curl -X DELETE http://localhost:3000/locations/1
```
Response: 409 Conflict

---

## Migration from JSON Schema

If you had old JSON-based data, the junction tables now provide:

**Old (JSON):**
```javascript
departments[0].locations = ["Hyderabad", "Bangalore"]
```

**New (Relational):**
```javascript
GET /departments/1
// Returns locations array of full location objects
departments[0].locations = [
  { id: 1, name: "Hyderabad Center", ... },
  { id: 2, name: "Bangalore Center", ... }
]
```

---

## Database Constraints

### Foreign Keys

1. **doctors.location_id → locations.id**
   - ON DELETE: RESTRICT (can't delete location if doctors exist)
   - Each doctor must be assigned to exactly one location

2. **department_locations**
   - Department → Department FK: CASCADES
   - Location → Location FK: CASCADES
   - UNIQUE(department_id, location_id) prevents duplicates

3. **doctor_departments**
   - Doctor → Doctor FK: CASCADES
   - Department → Department FK: CASCADES
   - UNIQUE(doctor_id, department_id) prevents duplicates

4. **doctor_specializations**
   - Doctor → Doctor FK: CASCADES
   - Specialization automatically deleted when doctor deleted

### Indexes

All foreign key columns are indexed for query performance:
- `doctors.location_id`
- `department_locations.department_id`
- `department_locations.location_id`
- `doctor_departments.doctor_id`
- `doctor_departments.department_id`
- `doctor_specializations.doctor_id`
