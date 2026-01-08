# Mediblues Serverless Backend

Production-ready serverless backend built with AWS Lambda, API Gateway, and Node.js 20 LTS. Optimized for fast cold starts and local development.

## 🚀 Tech Stack

- **Runtime**: Node.js 20 LTS (ES Modules)
- **Cloud**: AWS Lambda + HTTP API Gateway
- **Framework**: Serverless Framework v3
- **Local Dev**: serverless-offline
- **Region**: ap-south-1 (Mumbai)

## 📁 Project Structure

```
mediblues-api/
├── src/
│   ├── handlers/
│   │   ├── health.js       # GET /health endpoint
│   │   └── contact.js      # POST /contact endpoint
│   └── utils/
│       └── response.js     # Response utilities
├── .env.local              # Local environment variables
├── .env.example            # Environment template
├── package.json
├── serverless.yml          # Serverless configuration
└── README.md
```

## 🛠️ Prerequisites

- Node.js 20+ ([Download](https://nodejs.org/))
- npm or yarn
- AWS CLI configured (for deployment)
- AWS Account with appropriate permissions

## 📦 Installation

1. **Navigate to the backend directory**:
   ```bash
   cd mediblues-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Copy environment file**:
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables** (`.env.local`):
   ```env
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

## 🏃‍♂️ Local Development

### Start Local Server

```bash
npm run dev
```

This starts the backend at **http://localhost:3000**

### Test APIs Locally

**Health Check**:
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T10:30:00.000Z",
  "environment": "local",
  "version": "1.0.0"
}
```

**Contact Form**:
```bash
curl -X POST http://localhost:3000/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello from the API!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "receivedAt": "2026-01-08T10:30:00.000Z"
  }
}
```

## 🔌 Connect Frontend to Backend

### Vite Frontend Configuration

1. **Create `.env.local` in `mediblues-ui/`**:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

2. **Update your API calls** (example):
   ```javascript
   // src/utils/api.js or similar
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

   export const checkHealth = async () => {
     const response = await fetch(`${API_BASE_URL}/health`);
     return response.json();
   };

   export const submitContact = async (formData) => {
     const response = await fetch(`${API_BASE_URL}/contact`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(formData),
     });
     return response.json();
   };
   ```

3. **Run both servers**:
   ```bash
   # Terminal 1 - Backend
   cd mediblues-api
   npm run dev

   # Terminal 2 - Frontend
   cd mediblues-ui
   npm run dev
   ```

## ☁️ AWS Deployment

### Prerequisites

1. **Configure AWS CLI**:
   ```bash
   aws configure
   ```
   Enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `ap-south-1`
   - Output format: `json`

2. **Verify configuration**:
   ```bash
   aws sts get-caller-identity
   ```

### Deploy to AWS

**Deploy to Production**:
```bash
npm run deploy
```

**Deploy to Development**:
```bash
npm run deploy:dev
```

### Post-Deployment

After deployment, you'll receive output like:
```
endpoint: https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com
functions:
  health: mediblues-api-prod-health
  contact: mediblues-api-prod-contact
```

**Update your frontend `.env.production`**:
```env
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com
```

### Update CORS for Production

1. Add your Amplify domain to `serverless.yml`:
   ```yaml
   httpApi:
     cors:
       allowedOrigins:
         - http://localhost:5173
         - https://your-app.amplifyapp.com  # Add your domain
   ```

2. Redeploy:
   ```bash
   npm run deploy
   ```

## 🧪 Testing Production API

```bash
# Replace with your actual API endpoint
API_URL=https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com

# Test health check
curl $API_URL/health

# Test contact form
curl -X POST $API_URL/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello"}'
```

## 📊 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local development server |
| `npm run deploy` | Deploy to AWS (production) |
| `npm run deploy:dev` | Deploy to AWS (development) |
| `npm run remove` | Remove deployed stack from AWS |
| `npm run logs -f health` | View logs for health function |

## 🔧 Configuration

### CORS Configuration

CORS is configured in `serverless.yml` to allow:
- Local frontend: `http://localhost:5173`
- Production frontend: Set via `FRONTEND_URL` environment variable

### Environment Variables

- **Local**: `.env.local`
- **Development**: `.env.dev`
- **Production**: `.env.prod`

Never commit `.env.*` files to git.

## ⚡ Performance Optimizations

1. **HTTP API instead of REST API**: 70% cheaper, faster
2. **Minimal dependencies**: Faster cold starts
3. **Individual packaging**: Smaller function sizes
4. **ES Modules**: Native Node.js 20 support
5. **No Express**: Direct Lambda handler for minimal overhead

## 🐛 Troubleshooting

### Local Development Issues

**Port already in use**:
```bash
# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Module not found errors**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Deployment Issues

**AWS credentials not configured**:
```bash
aws configure
```

**Insufficient permissions**:
Ensure your IAM user has policies:
- `AWSLambda_FullAccess`
- `IAMFullAccess`
- `AmazonAPIGatewayAdministrator`
- `CloudFormationFullAccess`

**CORS errors**:
1. Verify frontend URL in `serverless.yml`
2. Redeploy after changes
3. Clear browser cache

## 📝 API Documentation

### GET /health

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T10:30:00.000Z",
  "environment": "prod",
  "version": "1.0.0"
}
```

### POST /contact

Submit contact form.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your message here"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "receivedAt": "2026-01-08T10:30:00.000Z"
  }
}
```

**Error Response** (400):
```json
{
  "error": "Missing required fields: name, email, message",
  "statusCode": 400,
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

## 🚀 Next Steps

1. **Add database**: Integrate DynamoDB for data persistence
2. **Add authentication**: Implement JWT or Cognito
3. **Add more endpoints**: Build out your API
4. **Add monitoring**: CloudWatch, X-Ray for tracing
5. **Add tests**: Unit and integration tests
6. **CI/CD**: GitHub Actions for automated deployment

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ for Mediblues
