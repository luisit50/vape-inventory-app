# Backend Setup Instructions

## Prerequisites

- Node.js (v16 or later)
- MongoDB (local or MongoDB Atlas)

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Edit `.env` file
   - Update `MONGODB_URI` with your MongoDB connection string
   - Change `JWT_SECRET` to a secure random string

## MongoDB Setup

### Option 1: Local MongoDB
1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   - Windows: MongoDB runs as a service automatically
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

### Option 2: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string and update `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vape-inventory
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires token)

### Inventory
- `GET /api/inventory` - Get all bottles
- `GET /api/inventory/:id` - Get single bottle
- `POST /api/inventory` - Create new bottle
- `PUT /api/inventory/:id` - Update bottle
- `DELETE /api/inventory/:id` - Delete bottle
- `GET /api/inventory/search?q=query` - Search bottles
- `GET /api/inventory/expiring` - Get expiring bottles

## Testing the API

Use tools like Postman or curl to test endpoints:

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running: `mongo --version`
- Check connection string in `.env`
- For Atlas, whitelist your IP address

### Port Already in Use
Change the PORT in `.env` file to a different number (e.g., 5001)

### CORS Issues
The server allows all origins. For production, update CORS settings in `server.js`
