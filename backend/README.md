# Clocked Backend API

Authentication and API backend for the Clocked platform.

## 🚀 Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- **MongoDB URI**: Your MongoDB Atlas connection string
- **JWT Secret**: Generate a strong secret key
- **Email Settings**: Configure SMTP for email verification
- **Frontend URL**: Where your frontend is hosted

### 3. Database Setup
```bash
# Seed the database with schema and reference data
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```

## 📡 API Endpoints

### Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123",
  "default_identity": "anonymous" // optional: "anonymous" | "named"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "user@example.com", // email or username
  "password": "Password123"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

#### Resend Verification
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewPassword123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### Users (`/api/users`)

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "username": "newusername", // optional
  "instagram_handle": "handle", // optional
  "default_identity": "named" // optional
}
```

#### Update Me Profile
```http
PUT /api/users/me-profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "me_misunderstood": "What people get wrong about me...",
  "me_pride": "What I'm most proud of..."
}
```

#### Update Notification Preferences
```http
PUT /api/users/notifications
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "notif": {
    "handle_searched": true,
    "new_flag_on_me": true,
    "watched_activity": true,
    "weekly_radar": true,
    "flag_requests": false
  },
  "push": {
    "enabled": false,
    "handle_searched": true,
    "new_flag_on_me": true
  }
}
```

#### Update Push Permission
```http
POST /api/users/push-permission
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "granted": true
}
```

#### Get Public User Profile
```http
GET /api/users/:username
```

#### Delete Account
```http
DELETE /api/users/account
Authorization: Bearer <jwt_token>
```

### Health Check
```http
GET /api/health
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Login/Register**: Returns a JWT token
2. **Include Token**: Add `Authorization: Bearer <token>` header to protected requests
3. **Token Expiry**: Tokens expire after 7 days (configurable)

## 📧 Email Templates

The backend includes email templates for:
- Email verification
- Password reset
- Welcome email

Emails are sent using Nodemailer with SMTP configuration.

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Password Hashing**: bcrypt with configurable rounds
- **Input Validation**: express-validator for all inputs
- **CORS**: Configured for your frontend domain
- **Helmet**: Security headers
- **JWT Security**: Proper token validation and expiry

## 🗄️ Database Schema

The backend uses the MongoDB schema defined in `clocked_mongo.js`:
- **Users**: Authentication and profiles
- **Handles**: Instagram handles database
- **Flags**: Red/green flags system
- **Categories**: Flag categories
- **Notifications**: In-app notifications
- And more...

## 🚀 Deployment

### Production Environment Variables
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@clocked.in
FRONTEND_URL=https://your-domain.com
PORT=5000
```

### Start Production Server
```bash
npm start
```

## 📝 Development Tips

1. **Use npm run dev** for auto-restart during development
2. **Check MongoDB connection** in console logs
3. **Test email sending** with a real SMTP service
4. **Monitor rate limiting** in development
5. **Use .env.local** for environment-specific overrides

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MONGODB_URI in .env
   - Verify network connectivity
   - Check MongoDB Atlas IP whitelist

2. **Email Not Sending**
   - Verify SMTP credentials
   - Check "Less secure apps" setting for Gmail
   - Use App Password instead of regular password

3. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token hasn't expired
   - Ensure proper Authorization header format

4. **CORS Errors**
   - Verify FRONTEND_URL in .env
   - Check browser console for preflight requests

## 📞 Support

For backend issues:
1. Check console logs for detailed error messages
2. Verify all environment variables are set
3. Ensure MongoDB is accessible
4. Test with Postman/Insomnia first
