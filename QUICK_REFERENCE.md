# Quick Reference - Relational API

## 🚀 Quick Start

```bash
# 1. Initialize
npm run init-db

# 2. Start
npm run dev

# 3. Test
curl http://localhost:3000/doctors/1 | jq
```

---

## 📦 Entity Structure

### Location
```json
{
  "id": 1,
  "name": "Hyderabad Center",
  "address": "Hitech City, Hyderabad",
  "phone": "+91-40-1234567",
  "email": "hyderabad@mediblues.com",
  "enabled": true,
  "doctors": [...],
  "departments": [...]
}
```

### Department
```json
{
  "id": 1,
  "name": "Cardiology",
  "heading": "Heart & Vascular Care",
  "description": "...",
  "image": null,
  "locations": [...]
}
```

### Doctor ⭐ (with location_id FK)
```json
{
  "id": 1,
  "name": "Dr. Rajesh Kumar",
  "qualifications": ["MBBS", "MD Cardiology"],
  "experience": 12,
  "location_id": 1,
  "image": null,
  "location": {...},
  "departments": [...],
  "specializations": ["Interventional Cardiology", "..."]:
}
```

---

## 🔗 API Endpoints Cheat Sheet

### Locations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/locations` | All locations + doctors + departments |
| GET | `/locations/{id}` | Single location + doctors + departments |
| POST | `/locations` | Create location |
| PUT | `/locations/{id}` | Update location |
| DELETE | `/locations/{id}` | Delete (⚠️ FK RESTRICT) |

### Departments
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/departments` | All with linked locations |
| GET | `/departments/{id}` | Single with linked locations |
| POST | `/departments` | Create with `locations: [ids]` |
| PUT | `/departments/{id}` | Update location links |
| DELETE | `/departments/{id}` | Delete (cascades) |

### Doctors
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/doctors` | All with location + departments |
| GET | `/doctors/{id}` | Single with full details |
| POST | `/doctors` | Create (⚠️ location_id required) |
| PUT | `/doctors/{id}` | Update location/departments |
| DELETE | `/doctors/{id}` | Delete (cascades) |

---

## ✍️ Create/Update Examples

### Create Doctor (location_id REQUIRED)
```bash
curl -X POST http://localhost:3000/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. New",
    "location_id": 1,
    "qualifications": ["MBBS"],
    "experience": 5,
    "departments": [1, 2],
    "specializations": ["Skill1", "Skill2"]
  }'
```

### Update Doctor Location
```bash
curl -X PUT http://localhost:3000/doctors/1 \
  -H "Content-Type: application/json" \
  -d '{"location_id": 2}'
```

### Create Department with Locations
```bash
curl -X POST http://localhost:3000/departments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Surgery",
    "heading": "Surgical Services",
    "description": "...",
    "locations": [1, 2, 3]
  }'
```

### Update Department Locations
```bash
curl -X PUT http://localhost:3000/departments/1 \
  -H "Content-Type: application/json" \
  -d '{"locations": [2, 3]}'
```

---

## ⚠️ Important Constraints

| Rule | Error | Solution |
|------|-------|----------|
| Doctor without location_id | 400 Bad Request | Provide valid location_id |
| Delete location with doctors | 200 OK | All doctors auto-deleted (CASCADE) |
| Invalid location in doctor | 400 Bad Request | Use existing location ID |
| Duplicate doctor-dept link | Prevented by DB | System prevents automatically |

---

## 🎯 FK Relationships

```
doctors.location_id
  → references: locations.id
  → on delete: CASCADE
  → meaning: Deletes doctor when location deleted

department_locations
  → department_id → departments.id (CASCADE)
  → location_id → locations.id (CASCADE)
  → unique: (department_id, location_id)

doctor_departments
  → doctor_id → doctors.id (CASCADE)
  → department_id → departments.id (CASCADE)
  → unique: (doctor_id, department_id)

doctor_specializations
  → doctor_id → doctors.id (CASCADE)
```

---

## 🐛 Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Location ID is required",
  "statusCode": 400
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Doctor not found",
  "statusCode": 404
}
```

### 409 - Conflict (FK Violation)
```json
{
  "success": false,
  "message": "Cannot delete location - doctors are assigned to this location...",
  "statusCode": 409
}
```

---

## 🧪 Test Workflow

```bash
# 1. Get all locations
curl http://localhost:3000/locations | jq '.data | length'

# 2. Get first location's doctors
curl http://localhost:3000/locations/1 | jq '.data.doctors'

# 3. Get all doctors (with locations)
curl http://localhost:3000/doctors | jq '.data[] | {name, location: .location.name}'

# 4. Create new doctor
curl -X POST ... (see examples above)

# 5. Verify doctor in location
curl http://localhost:3000/locations/1 | jq '.data.doctors[] | select(.name == "Dr. New")'
```

---

## 📋 Sample Data Reference

**Locations (3):**
- ID 1: Hyderabad Center
- ID 2: Bangalore Center
- ID 3: Delhi Center

**Departments (3):**
- ID 1: Cardiology
- ID 2: Neurology
- ID 3: Orthopedics

**Doctors (5):**
- ID 1: Dr. Rajesh Kumar → Location 1, Dept 1
- ID 2: Dr. Priya Sharma → Location 1, Dept 2
- ID 3: Dr. Amit Patel → Location 2, Dept 3
- ID 4: Dr. Sarah Johnson → Location 2, Dept 1
- ID 5: Dr. Vikram Singh → Location 3, Dept 3

---

## 🔐 Data Integrity Rules

✅ **Enforced by Database:**
- Doctor must have location_id (NOT NULL constraint)
- Doctor can't be in same department twice (UNIQUE junction)
- Can't reference non-existent location (FK constraint)
- Deleting doctor auto-deletes its department links (CASCADE)
- Can't delete location if doctors exist (RESTRICT)

---

## 📚 Full Documentation Files

- `API_RELATIONAL_GUIDE.md` - Complete endpoint reference
- `API_TESTING.md` - Testing examples
- `RELATIONAL_SCHEMA_COMPLETE.md` - Implementation details
- `src/utils/schema.js` - Database schema code

---

## 🎓 Key Concepts

**Junction Table:** Many-to-many relationship bridge
- `doctor_departments`: One doctor can work in many departments
- `department_locations`: One department can be in many locations

**Foreign Key:** Reference to another table's primary key
- `doctors.location_id` → `locations.id`
- Ensures doctor's location exists in locations table

**Cascade Delete:** Auto-delete related records
- Delete doctor → Auto-delete doctor_departments rows
- Prevents orphaned relationships

**Restrict Delete:** Prevent delete if referenced
- Can't delete location while doctors exist
- Forces cleanup of relationships first

**Unique Constraint:** Prevent duplicate combinations
- Can't have same doctor in same department twice
- Enforced at database level

---

## 💡 Common Tasks

### Reassign Doctor to Different Location
```bash
curl -X PUT http://localhost:3000/doctors/1 \
  -H "Content-Type: application/json" \
  -d '{"location_id": 2}'
```

### Add Doctor to New Department
```bash
# Get current departments
DEPTS=$(curl http://localhost:3000/doctors/1 | jq '.data.departments[].id')

# Add new department
curl -X PUT http://localhost:3000/doctors/1 \
  -H "Content-Type: application/json" \
  -d '{"departments": [1, 2, 3]}'
```

### Remove Doctor from Location (actually: delete)
```bash
curl -X DELETE http://localhost:3000/doctors/1
```

### Make Department Available in New Location
```bash
curl -X PUT http://localhost:3000/departments/1 \
  -H "Content-Type: application/json" \
  -d '{"locations": [1, 2, 3, 4]}'
```

---

## ✨ What's Different from Old Design

| Old | New |
|-----|-----|
| `doctor.department: string[]` | `doctor.departments: object[]` + `doctor.location: object` |
| `dept.locations: string[]` | `dept.locations: object[]` |
| No location for doctors | `doctor.location_id: number` (required FK) |
| `doctor.specializations: string[]` | `doctor.specializations: string[]` + stored in table |
| No data integrity | FK constraints prevent orphans |
| JSON parsing in code | Database handles relationships |

---

## 🚀 Ready to Go!

**Status:** ✅ Full relational schema implemented and tested

**Run:** `npm run dev` and start making requests!

**Reference:** This file for quick lookups, detailed docs for full info.
