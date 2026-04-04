# 🚩 Clocked Backend Integration Guide

## 📋 Project Analysis

Your `clocked_mongo.js` file contains the **complete MongoDB schema** with **23 collections** that define the entire Clocked platform. This backend is now properly integrated to use that existing schema.

## 🗄️ Database Schema Integration

### ✅ What's Already Set Up

The backend now works with your existing `clocked_mongo.js` schema:

1. **Users Collection** - Authentication & profiles
2. **Handles Collection** - Instagram handles database  
3. **Flags Collection** - Red/green flag system
4. **All other collections** - Ready for implementation

### 🔗 How Integration Works

```javascript
// Your clocked_mongo.js creates collections with validators & indexes
mongosh "mongodb://..." --file clocked_mongo.js

// Backend Mongoose models work with those collections
const User = require('./models/User'); // Uses 'users' collection
const Handle = require('./models/Handle'); // Uses 'handles' collection
const Flag = require('./models/Flag'); // Uses 'flags' collection
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas credentials
```

### 3. Database Setup (Uses your clocked_mongo.js)
```bash
npm run setup
```

### 4. Start Backend
```bash
npm run dev
```

## 📁 File Structure

```
backend/
├── models/
│   ├── User.js          # Works with 'users' collection
│   ├── Handle.js        # Works with 'handles' collection  
│   ├── Flag.js          # Works with 'flags' collection
│   └── index.js         # Model exports
├── routes/
│   ├── auth.js          # Authentication endpoints
│   └── users.js         # User management
├── middleware/
│   └── auth.js          # JWT middleware
├── utils/
│   └── emailService.js  # Email templates
├── config/
│   └── database.js      # MongoDB connection
├── scripts/
│   └── setup-database.js # Runs clocked_mongo.js
├── clocked_mongo.js     # Your complete schema (copied)
├── server.js            # Express server
└── package.json
```

## 🔐 Authentication Features

### ✅ Implemented Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `POST /api/auth/register` | User signup | ✅ Complete |
| `POST /api/auth/login` | User login | ✅ Complete |
| `POST /api/auth/verify-email` | Email verification | ✅ Complete |
| `POST /api/auth/resend-verification` | Resend verification | ✅ Complete |
| `POST /api/auth/forgot-password` | Forgot password | ✅ Complete |
| `POST /api/auth/reset-password` | Reset password | ✅ Complete |
| `GET /api/auth/me` | Get current user | ✅ Complete |

### 🔧 User Management

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `PUT /api/users/profile` | Update profile | ✅ Complete |
| `PUT /api/users/me-profile` | Update me profile | ✅ Complete |
| `PUT /api/users/notifications` | Update preferences | ✅ Complete |
| `POST /api/users/push-permission` | Push permissions | ✅ Complete |
| `GET /api/users/:username` | Public profile | ✅ Complete |
| `DELETE /api/users/account` | Delete account | ✅ Complete |

## 🗄️ Collections Ready for Implementation

Your `clocked_mongo.js` defines these collections. Backend models can be added as needed:

### 📊 Core Collections
- ✅ **users** - User model created
- ✅ **handles** - Handle model created  
- ✅ **flags** - Flag model created
- 🔄 **flag_categories** - Ready for model
- 🔄 **credibility_weights** - Ready for model

### 🔔 Notification Collections
- 🔄 **notifications** - In-app notifications
- 🔄 **push_notifications** - Push notification queue

### 📈 Activity Collections
- 🔄 **searches** - Search logs
- 🔄 **watches** - User watchlists
- 🔄 **know_counts** - "I know this person" counts
- 🔄 **flag_requests** - Community board requests

### 💬 Interaction Collections
- 🔄 **flag_replies** - Poster & both sides replies
- 🔄 **flag_gossip** - Unverified gossip

### 🏛️ Admin Collections
- 🔄 **sessions** - DB-backed sessions
- 🔄 **grievances** - Takedown requests
- 🔄 **unsent_letters** - Private encrypted letters

## 🎯 Next Steps

### Phase 1: Core Features (Ready Now)
1. ✅ Authentication system
2. ✅ User profiles
3. 🔄 Flag posting system
4. 🔄 Handle search system

### Phase 2: Social Features
1. 🔄 Flag replies & gossip
2. 🔄 Watchlists & notifications
3. 🔄 Search analytics

### Phase 3: Advanced Features
1. 🔄 Credibility scoring
2. 🔄 Push notifications
3. 🔄 Admin tools

## 🔗 MongoDB Atlas Connection

In `.env`:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clocked
```

The backend will:
1. Connect to your Atlas cluster
2. Use the collections created by `clocked_mongo.js`
3. Respect all validators and indexes from your schema

## 📧 Email Configuration

For email verification:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use Gmail App Password
EMAIL_FROM=noreply@clocked.in
```

## 🛡️ Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ Input validation
- ✅ CORS protection
- ✅ Security headers

## 🔧 Development Workflow

1. **Database Setup**: `npm run setup` (runs your clocked_mongo.js)
2. **Development**: `npm run dev` (auto-restart on changes)
3. **Testing**: Use Postman/Insomnia with the API endpoints
4. **Frontend Integration**: Use the API endpoints from your HTML files

## 📞 Integration Support

The backend is designed to work seamlessly with your existing frontend HTML files. All authentication flows (signup, login, verification, password reset) are implemented and ready to connect to your frontend.

Your `clocked_mongo.js` schema is the foundation - the backend respects and uses all the collections, validators, and indexes you've defined!
