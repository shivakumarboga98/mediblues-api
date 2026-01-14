# API Testing Guide - Relational Schema

Quick reference for testing all Mediblues backend endpoints with the new relational database design.

## 🚀 Setup

1. Initialize database (first time only):
```bash
npm run init-db
```

2. Start the server:
```bash
npm run dev
```

3. Server runs at: `http://localhost:3000`

## 📝 Test Examples

### Health Check
```bash
curl http://localhost:3000/health
```

### Locations (with FK constraints)

#### Get all locations (with doctors and departments)
```bash
curl http://localhost:3000/locations | jq
```

**Response includes:**
- All location details
- Array of doctors assigned to location
- Array of departments available at location

#### Create location
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

**Required:** name, address, phone, email

#### Get single location
```bash
curl http://localhost:3000/locations/1 | jq
```

#### Update location
```bash
curl -X PUT http://localhost:3000/locations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91-44-9999999"
  }'
```

#### Delete location (with FK check)
```bash
curl -X DELETE http://localhost:3000/locations/1
```

**⚠️ Note:** Will fail (409 Conflict) if doctors are assigned to this location.

---

### Departments (with junction tables)

#### Get all departments (with linked locations)
```bash
curl http://localhost:3000/departments | jq
```

**Response includes:**
- Department details
- Array of location objects where department is available

#### Create department with locations
```bash
curl -X POST http://localhost:3000/departments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cardiology",
    "heading": "Heart & Vascular Care",
    "description": "Expert cardiologists providing comprehensive cardiac care",
    "locations": [1, 2, 3],
    "image": "https://example.com/cardiology.jpg"
  }'
```

**Parameters:**
- `name` (required): Department name
- `heading`: Department heading/title
- `description`: Department description
- `locations`: Array of location IDs to link
- `image`: Department image URL

#### Get single department
```bash
curl http://localhost:3000/departments/1 | jq
```

#### Update department locations
```bash
curl -X PUT http://localhost:3000/departments/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cardiology - Advanced",
    "locations": [1, 2]
  }'
```

**Note:** Providing `locations` replaces all location links for this department.

#### Delete department
```bash
curl -X DELETE http://localhost:3000/departments/1
```

---

### Doctors (with location FK and department junctions)

#### Get all doctors (with location and departments)
```bash
curl http://localhost:3000/doctors | jq
```

**Response includes:**
- Doctor details (id, name, qualifications, experience)
- `location_id` and full location object
- Array of departments doctor works in
- Array of specializations

#### Create doctor (MUST specify location_id)
```bash
curl -X POST http://localhost:3000/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Priya Nair",
    "qualifications": ["MBBS", "DCH", "Pediatrics Fellow"],
    "experience": 7,
    "location_id": 1,
    "departments": [1, 2],
    "specializations": ["Neonatal Care", "Vaccination", "Child Development"],
    "image": "https://example.com/doctor1.jpg"
  }'
```

**Parameters:**
- `name` (required): Doctor name
- `location_id` (required): ID of location where doctor works
- `qualifications`: Array of qualifications
- `experience`: Years of experience
- `departments`: Array of department IDs
- `specializations`: Array of specialization strings
- `image`: Doctor photo URL

**Error if location_id missing:** 400 Bad Request

#### Get single doctor
```bash
curl http://localhost:3000/doctors/1 | jq
```

**Full response structure:**
```json
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
      "description": "..."
    }
  ],
  "specializations": ["Interventional Cardiology", "Coronary Angiography"]
}
```

#### Update doctor (change location or departments)
```bash
curl -X PUT http://localhost:3000/doctors/1 \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": 2,
    "departments": [1],
    "specializations": ["Interventional Cardiology"]
  }'
```

**Note:** 
- Changing `location_id` reassigns doctor to new location
- Providing `departments` replaces all department links
- Providing `specializations` replaces all specializations

#### Delete doctor (cascades to relationships)
```bash
curl -X DELETE http://localhost:3000/doctors/1
```

**Cascades:**
- Deletes all doctor_departments links
- Deletes all doctor_specializations records

---

### Banners

#### Get all banners
```bash
curl http://localhost:3000/banners
```

#### Create banner
```bash
curl -X POST http://localhost:3000/banners \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Health Checkup",
    "description": "Special offer on health checkups",
    "imageUrl": "https://example.com/banner.jpg",
    "dimensions": "1920x600",
    "size": "2.5 MB",
    "isActive": true
  }'
```

#### Update banner
```bash
curl -X PUT http://localhost:3000/banners/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "isActive": false
  }'
```

#### Delete banner
```bash
curl -X DELETE http://localhost:3000/banners/1
```

---

### Helpline

#### Get active helpline
```bash
curl http://localhost:3000/helpline/active
```

#### Get all helpline entries
```bash
curl http://localhost:3000/helpline
```

#### Create helpline
```bash
curl -X POST http://localhost:3000/helpline \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91-1234-567-890",
    "description": "Available 24/7 for medical emergencies",
    "isActive": true
  }'
```

#### Update helpline
```bash
curl -X PUT http://localhost:3000/helpline/1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91-9999-999-999",
    "isActive": true
  }'
```

#### Delete helpline
```bash
curl -X DELETE http://localhost:3000/helpline/1
```

---

## ✅ Sample Data

After running `npm run init-db`, test data is pre-populated:

**Locations:** 3 (Hyderabad, Bangalore, Delhi)
**Departments:** 3 (Cardiology, Neurology, Orthopedics)
**Doctors:** 5 (all with location_id assigned)
**Helpline:** 1 default entry

Try immediately:
```bash
curl http://localhost:3000/doctors/1 | jq '.data.location'
curl http://localhost:3000/locations/1 | jq '.data.doctors'
curl http://localhost:3000/departments/1 | jq '.data.locations'
```

---

## 🔍 Error Codes

| Status | Example Error | Cause |
|--------|---------------|-------|
| 400 | Missing required fields | POST without location_id on doctor |
| 404 | Location not found | Invalid ID |
| 409 | Cannot delete location - doctors assigned | FK constraint |
| 500 | Database error | Connection or query issue |

---

## 📋 Relational Integrity Rules

1. **Doctors must have location_id:**
   - Cannot create/update doctor without valid location_id
   - Error: 400 Bad Request

2. **Cannot delete location with doctors:**
   - Must reassign doctors first
   - Error: 409 Conflict

3. **Duplicate relationships prevented:**
   - Can't link doctor to same department twice
   - Unique constraints on junction tables

4. **Automatic cleanup:**
   - Deleting doctor cascades to doctor_departments and doctor_specializations
   - Deleting department cascades to doctor_departments

---

## 🧪 Testing Workflow

```bash
# 1. Create a location
LOCATION_ID=$(curl -X POST http://localhost:3000/locations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","address":"...","phone":"...","email":"..."}' \
  | jq -r '.data.id')

# 2. Create a department
DEPT_ID=$(curl -X POST http://localhost:3000/departments \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Dept","locations":[1]}' \
  | jq -r '.data.id')

# 3. Create doctor in that location and department
curl -X POST http://localhost:3000/doctors \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Dr. Test\",\"location_id\":$LOCATION_ID,\"departments\":[$DEPT_ID]}"

# 4. View complete structure
curl http://localhost:3000/locations/$LOCATION_ID | jq '.data.doctors'
curl http://localhost:3000/doctors/1 | jq '.data | {location, departments}'
```

---

## 📚 Full Documentation

See `API_RELATIONAL_GUIDE.md` for detailed endpoint documentation with all parameters and response structures.

### Doctors

#### Get all doctors
```bash
curl http://localhost:3000/doctors
```

#### Create doctor
```bash
curl -X POST http://localhost:3000/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Rajesh Kumar",
    "qualifications": ["MBBS", "MS Orthopaedics", "DNB"],
    "experience": 15,
    "department": ["Orthopaedics & Sports Medicine"],
    "specializations": ["Joint Replacement", "Sports Medicine"],
    "image": "https://example.com/doctor.jpg"
  }'
```

#### Get single doctor
```bash
curl http://localhost:3000/doctors/1
```

#### Update doctor
```bash
curl -X PUT http://localhost:3000/doctors/1 \
  -H "Content-Type: application/json" \
  -d '{
    "experience": 16,
    "department": ["Orthopaedics & Sports Medicine", "General Medicine"]
  }'
```

#### Delete doctor
```bash
curl -X DELETE http://localhost:3000/doctors/1
```

### Banners

#### Get all banners
```bash
curl http://localhost:3000/banners
```

#### Create banner
```bash
curl -X POST http://localhost:3000/banners \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Main Banner",
    "description": "Primary homepage banner",
    "imageUrl": "https://example.com/banner.jpg",
    "dimensions": "1920x600",
    "size": "2.3 MB"
  }'
```

#### Get single banner
```bash
curl http://localhost:3000/banners/1
```

#### Update banner
```bash
curl -X PUT http://localhost:3000/banners/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Banner",
    "imageUrl": "https://example.com/new-banner.jpg"
  }'
```

#### Delete banner
```bash
curl -X DELETE http://localhost:3000/banners/1
```

### Helpline

#### Get active helpline
```bash
curl http://localhost:3000/helpline
```

#### Get all helpline entries
```bash
curl http://localhost:3000/helpline/all
```

#### Create/Update helpline
```bash
curl -X POST http://localhost:3000/helpline \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91-9876543210",
    "description": "Available 24/7 for customer support",
    "isActive": true
  }'
```

#### Update specific helpline entry
```bash
curl -X PUT http://localhost:3000/helpline/1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91-9999999999"
  }'
```

#### Delete helpline entry
```bash
curl -X DELETE http://localhost:3000/helpline/1
```

## 📊 Expected Response Format

### Success (2xx)
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": { ... }
  }
}
```

### Error (4xx/5xx)
```json
{
  "statusCode": 400,
  "body": {
    "success": false,
    "error": "Error description"
  }
}
```

## 🧪 Postman Collection

Import this as a Postman collection for easier testing:

```json
{
  "info": {
    "name": "Mediblues API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Locations",
      "item": [
        {
          "name": "Get All",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/locations"
          }
        },
        {
          "name": "Create",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/locations",
            "body": {
              "mode": "raw",
              "raw": "{\"name\": \"\", \"address\": \"\", \"phone\": \"\", \"email\": \"\"}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

## 💡 Tips

- Replace `1` with actual ID numbers
- Use `-H "Content-Type: application/json"` for POST/PUT requests
- Use `-d` for request body in curl
- Use `jq` for pretty JSON output: `curl ... | jq .`
- Check server logs in terminal for errors

## 🔍 Debugging

### Check if server is running
```bash
curl http://localhost:3000/health
```

### View server logs
Check your terminal running `npm run dev`

### Test specific function
```bash
# From serverless logs
npm run logs -f getLocations
```

### Database connection
Run: `node scripts/init-db.js` to test DB connection

## ✅ Common Issues

**400 Bad Request**
- Check JSON syntax
- Verify required fields are present
- Ensure Content-Type header is set

**404 Not Found**
- Check resource ID exists
- Verify endpoint path is correct

**500 Internal Server Error**
- Check server logs
- Verify database connection
- Check if tables exist (run init-db.js)
