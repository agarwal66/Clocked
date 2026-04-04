# Environment Variables Setup

## 🎯 Easy Port Management

This project now uses environment variables to manage backend and frontend ports, making it easy to configure for different environments.

## 📁 Environment Files

### Frontend (.env)
```
# Frontend Environment Variables
REACT_APP_API_BASE_URL=http://localhost:5004/api
REACT_APP_BACKEND_PORT=5004
REACT_APP_FRONTEND_PORT=3001
```

### Backend (.env)
```
# Backend Configuration
NODE_ENV=development
PORT=5004
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=http://localhost:3001
```

## 🔧 How to Change Ports

### Option 1: Update Environment Files
1. **Backend Port**: Change `PORT` in `backend/.env`
2. **Frontend Port**: Change `REACT_APP_FRONTEND_PORT` in `frontend/.env`
3. **API URL**: Change `REACT_APP_API_BASE_URL` in `frontend/.env`

### Option 2: Use Different Environment Files
Create `.env.development`, `.env.production`, etc. for different environments.

## 🚀 Usage in Code

### Frontend Code
```javascript
// Uses environment variable with fallback
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5004/api';

// API calls automatically use correct port
await apiRequest('/api/auth/login', { ... });
```

### Backend Code
```javascript
// Uses environment variable from .env
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

## 📊 Benefits

✅ **Easy Configuration**: Change ports in one place
✅ **Environment Specific**: Different configs for dev/prod
✅ **No Hardcoded URLs**: All API calls use environment variables
✅ **Team Friendly**: Each developer can have their own config

## 🔄 Quick Port Changes

### Change Backend Port (e.g., to 5005)
1. Update `backend/.env`: `PORT=5005`
2. Update `frontend/.env`: `REACT_APP_API_BASE_URL=http://localhost:5005/api`
3. Restart both servers

### Change Frontend Port (e.g., to 3002)
1. Update `frontend/.env`: `REACT_APP_FRONTEND_PORT=3002`
2. Update `backend/.env`: `FRONTEND_URL=http://localhost:3002`
3. Restart both servers

## 🎯 Default Configuration

- **Backend**: `http://localhost:5004`
- **Frontend**: `http://localhost:3001`
- **Admin Panel**: `http://localhost:3001/admin`

## 📝 Notes

- Environment variables are automatically loaded by React and Node.js
- Restart servers after changing environment variables
- Use `.env.example` for template configuration
- Never commit `.env` files to version control
