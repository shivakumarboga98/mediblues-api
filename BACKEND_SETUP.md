# Mediblues Backend - AWS RDS MySQL Integration

Complete backend setup for Mediblues with AWS RDS MySQL database integration.

## 🎯 Overview

The backend is built using:
- **Node.js 20** with ES Modules
- **Serverless Framework** for AWS Lambda deployment
- **AWS RDS MySQL** for database
- **mysql2/promise** for async MySQL connections
- **Connection Pooling** for efficient database access

## 📋 Database Configuration

### Connection Details
```
Host: mediblues.cx0kwauy6qv8.eu-north-1.rds.amazonaws.com
Port: 3306
Database: mediblues
User: admin
Password: 8O4SXOzMy1AC37MLiXKe
```

### Environment Variables
The database credentials are stored in `.env.local`:

```dotenv
DB_HOST=mediblues.cx0kwauy6qv8.eu-north-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=mediblues
DB_USER=admin
DB_PASSWORD=8O4SXOzMy1AC37MLiXKe
DB_POOL_MIN=2
DB_POOL_MAX=10
```

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

This installs:
- `mysql2@^3.6.5` - MySQL client library
- `dotenv@^16.4.5` - Environment variable management
- `serverless@^3.38.0` - Framework
- Development tools (serverless-offline, serverless-dotenv-plugin)

### 2. Initialize Database
Create all tables and seed initial data:

```bash
node scripts/init-db.js
```

This will:
- ✅ Test connection to AWS RDS
- ✅ Create 5 tables: locations, departments, doctors, banners, helpline
- ✅ Seed initial helpline data
- ✅ Output status messages

## 📚 Database Schema

### Tables Created

#### 1. **locations**
```sql
- id (PRIMARY KEY)
- name (UNIQUE)
- address
- phone
- email
- image (LONGTEXT)
- enabled (BOOLEAN)
- createdAt, updatedAt
```

#### 2. **departments**
```sql
- id (PRIMARY KEY)
- name (UNIQUE)
- heading
- description
- procedures (JSON)
- locations (JSON)
- image (LONGTEXT)
- createdAt, updatedAt
```

#### 3. **doctors**
```sql
- id (PRIMARY KEY)
- name
- qualifications (JSON array)
- experience (INT)
- department (JSON array)
- specializations (JSON array)
- image (LONGTEXT)
- createdAt, updatedAt
```

#### 4. **banners**
```sql
- id (PRIMARY KEY)
- title
- description
- imageUrl (LONGTEXT)
- dimensions
- size
- uploadDate (DATE)
- isActive (BOOLEAN)
- createdAt, updatedAt
```

#### 5. **helpline**
```sql
- id (PRIMARY KEY)
- phone (UNIQUE)
- description
- isActive (BOOLEAN)
- createdAt, updatedAt
```

## 🔌 API Endpoints

### Health Check
```
GET /health
```
Returns API status and environment info.

### Locations (CRUD)
```
GET    /locations              # Get all locations
GET    /locations/{id}         # Get single location
POST   /locations              # Create location
PUT    /locations/{id}         # Update location
DELETE /locations/{id}         # Delete location
```

### Departments (CRUD)
```
GET    /departments            # Get all departments
GET    /departments/{id}       # Get single department
POST   /departments            # Create department
PUT    /departments/{id}       # Update department
DELETE /departments/{id}       # Delete department
```

### Doctors (CRUD)
```
GET    /doctors                # Get all doctors
GET    /doctors/{id}           # Get single doctor
POST   /doctors                # Create doctor
PUT    /doctors/{id}           # Update doctor
DELETE /doctors/{id}           # Delete doctor
```

### Banners (CRUD)
```
GET    /banners                # Get all banners
GET    /banners/{id}           # Get single banner
POST   /banners                # Create banner
PUT    /banners/{id}           # Update banner
DELETE /banners/{id}           # Delete banner
```

### Helpline
```
GET    /helpline               # Get active helpline
GET    /helpline/all           # Get all helpline entries
POST   /helpline               # Create/Update helpline
PUT    /helpline/{id}          # Update specific entry
DELETE /helpline/{id}          # Delete entry
```

## 💻 Development

### Local Development
```bash
npm run dev
```

Starts serverless-offline on `http://localhost:3000`
- Auto-reloads on file changes
- Uses .env.local for configuration
- Connects to real AWS RDS database

### Testing Endpoints
Use curl, Postman, or your frontend to test:

```bash
# Get all locations
curl http://localhost:3000/locations

# Create a new location
curl -X POST http://localhost:3000/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hyderabad Main",
    "address": "123 Main St",
    "phone": "+91-1234567890",
    "email": "hyderabad@mediblues.com",
    "enabled": true
  }'
```

## 🌐 Deployment

### Deploy to AWS
```bash
# Deploy to development environment
npm run deploy:dev

# Deploy to production
npm run deploy
```

### Pre-Deployment Checklist
- [ ] Database tables created via `node scripts/init-db.js`
- [ ] AWS credentials configured (`aws configure`)
- [ ] AWS region set to `eu-north-1` (or update in serverless.yml)
- [ ] Environment variables in production set in `.env.prod`

## 📁 Project Structure

```
mediblues-api/
├── src/
│   ├── handlers/
│   │   ├── health.js              # Health check
│   │   ├── contact.js             # Contact form
│   │   ├── locations.js           # Location CRUD
│   │   ├── departments.js         # Department CRUD
│   │   ├── doctors.js             # Doctor CRUD
│   │   ├── banners.js             # Banner CRUD
│   │   └── helpline.js            # Helpline management
│   └── utils/
│       ├── database.js            # DB connection pool
│       ├── schema.js              # Table creation & seeding
│       └── response.js            # Response formatting
├── scripts/
│   └── init-db.js                 # Database initialization script
├── .env.local                     # Local environment variables
├── .env.example                   # Example template
├── serverless.yml                 # Serverless configuration
├── package.json                   # Dependencies
└── README.md                      # This file
```

## 🛠 Utilities

### Database (src/utils/database.js)
- `getPool()` - Get connection pool
- `getConnection()` - Get single connection
- `query(sql, values)` - Execute query
- `testConnection()` - Test DB connectivity
- `closePool()` - Close all connections

### Schema (src/utils/schema.js)
- `initializeTables()` - Create all tables
- `seedInitialData()` - Insert initial data
- `dropAllTables()` - Drop all tables (dev only)

### Response (src/utils/response.js)
- `successResponse(data, statusCode)` - Success response
- `errorResponse(message, statusCode)` - Error response

## 🐛 Troubleshooting

### Cannot connect to database
1. Verify AWS RDS endpoint is correct
2. Check security group allows your IP on port 3306
3. Verify credentials in `.env.local`
4. Test: `node scripts/init-db.js`

### Table doesn't exist
Run initialization: `node scripts/init-db.js`

### JSON parsing errors
Arrays and objects are stored as JSON strings in MySQL. Handlers automatically parse them.

### Connection pool warnings
Increase `DB_POOL_MAX` or `DB_CONNECTION_LIMIT` if seeing queue warnings.

## 📝 Request/Response Format

### Success Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": { ... }
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "body": {
    "success": false,
    "error": "Error message"
  }
}
```

## 🔐 Security Notes

- Keep `.env.local` in `.gitignore` (already configured)
- Never commit passwords to git
- Use strong passwords for production
- Enable SSL/TLS for RDS connections
- Use IAM authentication in production
- Rotate credentials regularly

## 📖 More Information

- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review serverless.yml configuration
3. Check CloudWatch logs (for deployed functions)
4. Run `npm run logs -f functionName` to see function logs
