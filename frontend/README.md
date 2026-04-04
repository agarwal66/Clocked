# 🚩 Clocked React Frontend

Modern React frontend for the Clocked platform, built with TypeScript and connected to the Node.js backend API.

## 🚀 Features

### ✅ Authentication System
- **Login** - Email/username authentication with JWT tokens
- **Signup** - 4-step registration process with validation
- **Password Reset** - Forgot password flow with email verification
- **Protected Routes** - Route guards for authenticated users
- **Auto-login** - Persistent sessions using localStorage

### 📱 Responsive Design
- **Mobile-first** design approach
- **Modern UI** with Clocked branding
- **Smooth animations** and transitions
- **Accessibility** features

### 🔗 Backend Integration
- **API Client** - Axios-based HTTP client
- **Context API** - Global state management
- **Error Handling** - Comprehensive error management
- **Token Management** - Automatic JWT token handling

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Modern styling with CSS variables

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   └── auth.ts           # API functions
│   ├── contexts/
│   │   └── AuthContext.tsx   # Global auth state
│   ├── pages/
│   │   ├── LoginPage.tsx     # Login component
│   │   ├── SignupPage.tsx    # Registration flow
│   │   └── DashboardPage.tsx # Main dashboard
│   ├── types/
│   │   └── auth.ts           # TypeScript interfaces
│   ├── App.tsx               # Main app component
│   └── index.tsx             # Entry point
├── package.json
└── README.md
```

## 🔌 API Configuration

The frontend connects to your backend running on **port 5001**:

```typescript
const API_BASE_URL = 'http://localhost:5001/api';
```

### Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User authentication |
| `/auth/register` | POST | User registration |
| `/auth/forgot-password` | POST | Password reset |
| `/auth/verify-email` | POST | Email verification |
| `/auth/me` | GET | Get current user |
| `/users/profile` | PUT | Update profile |

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- Backend server running on port 5001
- MongoDB database connected

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

## 🔄 Development Workflow

### Running Both Frontend & Backend

1. **Terminal 1 - Start Backend:**
   ```bash
   cd backend
   npm run dev
   # Backend runs on http://localhost:5001
   ```

2. **Terminal 2 - Start Frontend:**
   ```bash
   cd frontend
   npm start
   # Frontend runs on http://localhost:3000
   ```

### Environment Variables

Create `.env` file in frontend root if needed:
```bash
REACT_APP_API_URL=http://localhost:5001/api
```

## 🎨 UI Components

### Authentication Flow
1. **Login Page** - Clean, modern login interface
2. **Signup Flow** - 4-step registration process
3. **Dashboard** - Protected main application area

### Design System
- **Colors** - Consistent with Clocked brand
- **Typography** - Syne (display) + DM Sans (body)
- **Spacing** - 8px grid system
- **Components** - Reusable UI patterns

## 🔐 Authentication Flow

### Login Process
1. User enters email/username + password
2. Frontend calls `POST /api/auth/login`
3. Backend validates credentials
4. JWT token returned and stored
5. User redirected to dashboard

### Registration Process
1. 4-step signup flow with validation
2. Email verification required
3. Auto-login after successful registration
4. Redirect to dashboard

### Session Management
- **Token Storage** - localStorage
- **Auto-refresh** - Token validation on app load
- **Logout** - Clear token and redirect

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based auth
- **Protected Routes** - Route guards for private pages
- **Input Validation** - Client and server-side validation
- **Error Handling** - Secure error message display
- **Token Management** - Automatic token injection

## 📱 Responsive Design

### Breakpoints
- **Mobile** - < 768px
- **Tablet** - 768px - 1024px
- **Desktop** - > 1024px

### Features
- **Touch-friendly** buttons and inputs
- **Readable text** on all screen sizes
- **Optimized layouts** for different devices
- **Smooth animations** and transitions

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Setup
Update API URL for production:
```bash
REACT_APP_API_URL=https://your-backend-domain.com/api
```

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend allows frontend origin
   - Check CORS middleware settings

2. **API Connection Issues**
   - Verify backend is running on port 5001
   - Check network connectivity

3. **Authentication Issues**
   - Clear browser localStorage
   - Verify JWT secret matches backend

4. **Build Errors**
   - Check TypeScript types
   - Verify all imports are correct

## 📞 Next Steps

### Phase 1 Features (Current)
- ✅ Authentication system
- ✅ Basic dashboard
- ✅ Responsive design

### Phase 2 Features (Planned)
- 🔄 Handle search interface
- 🔄 Flag posting system
- 🔄 User profiles
- 🔄 Notifications

### Phase 3 Features (Future)
- 🔄 Real-time updates
- 🔄 Advanced search
- 🔄 Analytics dashboard
- 🔄 Admin panel

## 🤝 Contributing

1. Follow existing code patterns
2. Use TypeScript for all new code
3. Test responsive design
4. Update documentation

---

**Built with ❤️ for the Clocked community**

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.
The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
