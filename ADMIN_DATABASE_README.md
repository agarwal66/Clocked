# 📊 Clocked Admin Database - Complete Guide

## 🎯 **Quick Access Overview**

### **🔐 Admin Login**
- **URL**: `http://localhost:3001/admin`
- **Email**: `admin@clocked.in`
- **Password**: `admin123`

---

## 📁 **Database Structure Overview**

### **👥 Users & Authentication**
```
📦 Collection: users
├── _id: ObjectId (Primary Key)
├── username: String
├── email: String
├── password_hash: String (bcrypt)
├── active: Boolean
├── flags_posted_count: Number
├── flags_on_me_count: Number
├── last_seen_at: Date
├── created_at: Date
└── updated_at: Date
```

### **🏷️ Instagram Handles**
```
📦 Collection: handles
├── _id: ObjectId (Primary Key)
├── instagram_handle: String
├── handle_username: String
├── city: String
├── active: Boolean
├── total_flag_count: Number
├── vibe_score: Number
├── stats: Object
│   ├── total_flag_count: Number
│   ├── red_flag_count: Number
│   └── green_flag_count: Number
├── me_misunderstood: String
├── me_pride: String
├── created_at: Date
└── updated_at: Date
```

### **🚩 Flags (User Reports)**
```
📦 Collection: flags
├── _id: ObjectId (Primary Key)
├── handle_id: ObjectId (Reference to handles)
├── user_id: ObjectId (Reference to users)
├── flag_type: String ("red" | "green")
├── category_name: String
├── comment: String
├── relationship: String
├── timeframe: String
├── credibility_weight: Number (1-5)
├── is_disputed: Boolean
├── is_expired: Boolean
├── viewer_knows: Boolean
├── know_count: Number
├── posted_by_username: String
├── posted_by_user_id: ObjectId
├── identity: String
├── status: String ("pending" | "approved" | "rejected" | "shadowed" | "review")
├── created_at: Date
└── updated_at: Date
```

### **💬 Flag Replies**
```
📦 Collection: flag_replies
├── _id: ObjectId (Primary Key)
├── flag_id: ObjectId (Reference to flags)
├── user_id: ObjectId (Reference to users)
├── handle_id: ObjectId (Reference to handles)
├── content: String
├── reply_type: String ("comment" | "poster_reply" | "handle_owner_reply" | "both_sides")
├── author_username: String
├── author_user_id: ObjectId
├── flag_comment: String
├── flag_content: String
├── status: String ("pending" | "approved" | "rejected" | "hidden" | "shadowed" | "review")
├── created_at: Date
└── updated_at: Date
```

### **📋 Reports**
```
📦 Collection: reports
├── _id: ObjectId (Primary Key)
├── reporter_user_id: ObjectId (Reference to users)
├── reporter_username: String
├── target_user_id: ObjectId
├── target_username: String
├── target_handle_id: ObjectId
├── target_handle_username: String
├── entity_type: String ("flag" | "reply" | "handle" | "user")
├── entity_id: ObjectId
├── reason: String
├── description: String
├── linked_content_preview: String
├── status: String ("open" | "investigating" | "resolved" | "dismissed" | "escalated")
├── created_at: Date
└── updated_at: Date
```

### **🔔 Notifications**
```
📦 Collection: notification_logs
├── _id: ObjectId (Primary Key)
├── user_id: ObjectId (Reference to users)
├── type: String
├── title: String
├── body: String
├── channel: String ("in_app" | "push" | "email" | "sms" | "whatsapp")
├── delivery_status: String ("queued" | "sent" | "failed" | "read")
├── payload: Object
├── provider_response: Object
├── error_message: String
├── sent_at: Date
├── read_at: Date
├── created_at: Date
└── updated_at: Date
```

### **👁️ Watchlists**
```
📦 Collection: watchlists
├── _id: ObjectId (Primary Key)
├── user_id: ObjectId (Reference to users)
├── handle_id: ObjectId (Reference to handles)
├── notify_new_flag: Boolean
├── notify_reply: Boolean
├── notify_report: Boolean
├── muted: Boolean
├── active: Boolean
├── source: String ("manual" | "auto" | "suggested" | "admin")
├── created_at: Date
└── updated_at: Date
```

### **🔍 Search Logs**
```
📦 Collection: search_logs
├── _id: ObjectId (Primary Key)
├── user_id: ObjectId (Reference to users)
├── handle_id: ObjectId (Reference to handles)
├── searched_handle: String
├── handle_username: String
├── reason: String
├── source: String
├── ip_address: String
├── user_agent: String
├── location: Object
├── created_at: Date
└── updated_at: Date
```

### **👥 Admin Users**
```
📦 Collection: admin_users
├── _id: ObjectId (Primary Key)
├── name: String
├── email: String
├── password_hash: String (bcrypt)
├── role_id: ObjectId (Reference to admin_roles)
├── is_active: Boolean
├── last_login_at: Date
├── created_at: Date
└── updated_at: Date
```

### **🏷️ Admin Roles**
```
📦 Collection: admin_roles
├── _id: ObjectId (Primary Key)
├── key: String (unique)
├── label: String
├── description: String
├── is_active: Boolean
├── permissions: Object
│   ├── can_manage_meta: Boolean
│   ├── can_manage_content: Boolean
│   ├── can_manage_notifications: Boolean
│   ├── can_manage_widgets: Boolean
│   ├── can_manage_settings: Boolean
│   ├── can_manage_users: Boolean
│   ├── can_manage_handles: Boolean
│   ├── can_moderate_flags: Boolean
│   ├── can_moderate_replies: Boolean
│   ├── can_manage_reports: Boolean
│   ├── can_view_analytics: Boolean
│   └── can_manage_system: Boolean
├── created_at: Date
└── updated_at: Date
```

---

## 🔗 **API Endpoints Overview**

### **📊 Admin Dashboard APIs**
```
🔗 Authentication:
POST /api/admin/login
POST /api/admin/logout
GET  /api/admin/dashboard

🔗 Users Management:
GET    /api/admin/users
PATCH  /api/admin/users/:id/status
GET    /api/admin/users/:id

🔗 Handles Management:
GET    /api/admin/handles
PATCH  /api/admin/handles/:id/status
GET    /api/admin/handles/:id

🔗 Flags Moderation:
GET    /api/admin/flags
POST   /api/admin/flags/:id/approve
POST   /api/admin/flags/:id/reject
POST   /api/admin/flags/:id/shadow
GET    /api/admin/flags/:id

🔗 Replies Moderation:
GET    /api/admin/flag-replies
POST   /api/admin/flag-replies/:id/approve
POST   /api/admin/flag-replies/:id/reject
POST   /api/admin/flag-replies/:id/hide
GET    /api/admin/flag-replies/:id

🔗 Reports Management:
GET    /api/admin/reports
POST   /api/admin/reports/:id/investigate
POST   /api/admin/reports/:id/resolve
POST   /api/admin/reports/:id/dismiss
GET    /api/admin/reports/:id
```

### **🔔 Notification System APIs**
```
🔗 Notification Logs:
GET    /api/notifications/admin/log
POST   /api/notifications/admin/log/:id/mark-read
POST   /api/notifications/admin/log/:id/retry
GET    /api/notifications/admin/log/:id

🔗 Notification Templates:
GET    /api/admin/notification-templates
POST   /api/admin/notification-templates
PUT    /api/admin/notification-templates/:id
DELETE /api/admin/notification-templates/:id
```

### **👁️ Watchlist System APIs**
```
🔗 Watchlist Management:
GET    /api/watchlists/admin
GET    /api/watchlists/admin/trending/summary
PATCH  /api/watchlists/admin/:id
DELETE /api/watchlists/admin/:id

🔗 User Watchlist:
GET    /api/watchlists/mine
POST   /api/watchlists/follow
POST   /api/watchlists/unfollow
PATCH  /api/watchlists/:id
GET    /api/watchlists/status/:handleId
GET    /api/watchlists/count/:handleId
```

### **🔍 Search Analytics APIs**
```
🔗 Search Logs:
GET    /api/admin/search-logs
GET    /api/admin/search-logs/trending
POST   /api/admin/search-logs
GET    /api/admin/search-logs/statistics
```

### **🔐 Access Control APIs**
```
🔗 User Management:
GET    /api/admin/access/users
PATCH  /api/admin/access/users/:id

🔗 Role Management:
GET    /api/admin/access/roles
POST   /api/admin/access/roles
PATCH  /api/admin/access/roles/:id

🔗 Permission Management:
GET    /api/admin/access/permissions
PUT    /api/admin/access/permissions/:id
```

---

## 🚀 **Quick Start Guide**

### **📋 Step 1: Access Admin Panel**
```bash
# Open admin panel in browser
http://localhost:3001/admin

# Login with admin credentials
Email: admin@clocked.in
Password: admin123
```

### **📋 Step 2: Navigate to Features**

#### **📊 Dashboard Overview**
- **Users**: Total registered users
- **Handles**: Instagram handles in system
- **Flags**: User reports and flags
- **Replies**: Comments and responses
- **Reports**: System reports

#### **⚙️ Operations Panel**
- **Users**: Activate/deactivate users
- **Handles**: Manage Instagram handles
- **Flags**: Approve/reject flags
- **Replies**: Moderate comments
- **Reports**: Handle user reports

#### **📊 Activity Monitoring**
- **Notifications**: System notifications
- **Search Logs**: User search activity
- **Watchlists**: User subscriptions
- **Trending**: Popular content

#### **🔐 Access Control**
- **Admin Users**: Manage admin accounts
- **Roles**: Define user permissions
- **Permissions**: Set access rights

---

## 🛠️ **Database Connection**

### **🔗 MongoDB Connection String**
```javascript
// Development
mongodb://localhost:27017/clocked

// Production
mongodb+srv://agarwalprateek666_db_user:dZEKHNbL7tHfC5eJ@cluster0.ucnkfcc.mongodb.net/clocked
```

### **📁 Environment Variables**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/clocked

# Authentication
JWT_SECRET=supersecret123
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=5004
FRONTEND_URL=http://localhost:3001

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📊 **Data Relationships**

### **🔗 Entity Relationships**
```
Users (1) ←→ (N) Handles
Users (1) ←→ (N) Flags
Users (1) ←→ (N) Flag Replies
Users (1) ←→ (N) Reports
Users (1) ←→ (N) Watchlists
Users (1) ←→ (N) Search Logs
Users (1) ←→ (N) Notifications

Handles (1) ←→ (N) Flags
Handles (1) ←→ (N) Flag Replies
Handles (1) ←→ (N) Reports
Handles (1) ←→ (N) Watchlists
Handles (1) ←→ (N) Search Logs

Flags (1) ←→ (N) Flag Replies
Flags (1) ←→ (N) Reports
```

### **📈 Data Flow Diagram**
```
User Registration → Users Collection
Handle Search → Search Logs → Watchlists
Flag Creation → Flags Collection → Flag Replies
Report Filing → Reports Collection
Notifications → Notification Logs
```

---

## 🔧 **Common Admin Tasks**

### **👥 User Management**
```bash
# View all users
GET /api/admin/users

# Deactivate user
PATCH /api/admin/users/:id/status
Body: { "active": false }

# View user details
GET /api/admin/users/:id
```

### **🚩 Flag Moderation**
```bash
# Get pending flags
GET /api/admin/flags?status=pending

# Approve flag
POST /api/admin/flags/:id/approve

# Reject flag
POST /api/admin/flags/:id/reject
```

### **📊 Analytics & Reports**
```bash
# Get system metrics
GET /api/admin/dashboard

# Get search analytics
GET /api/admin/search-logs/statistics

# Get trending handles
GET /api/admin/search-logs/trending
```

### **🔔 System Administration**
```bash
# Create admin user
POST /api/admin/users
Body: { "name": "Admin", "email": "admin@clocked.in", "password": "password123" }

# Manage roles
GET /api/admin/access/roles
POST /api/admin/access/roles
```

---

## 🎯 **Key Features Summary**

### **✅ Core Features**
- **User Management**: Complete user lifecycle
- **Handle Management**: Instagram handle tracking
- **Flag System**: User reporting and moderation
- **Reply System**: Comment and response management
- **Report System**: Issue tracking and resolution
- **Notifications**: Multi-channel notifications
- **Watchlists**: User subscription management
- **Search Analytics**: User behavior tracking
- **Access Control**: Role-based permissions

### **✅ Admin Features**
- **Dashboard**: System overview and metrics
- **Operations**: Quick moderation actions
- **Activity**: Real-time monitoring
- **Access Control**: User and permission management
- **Notifications**: System notifications
- **Analytics**: Search and trending data

### **✅ User Features**
- **Profile Management**: User accounts
- **Handle Search**: Find Instagram handles
- **Flag Reporting**: Report inappropriate content
- **Watchlist**: Follow handles for updates
- **Notifications**: Receive alerts and updates

---

## 📞 **Support & Help**

### **🆘 Quick Access Links**
- **Admin Panel**: http://localhost:3001/admin
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5004
- **Health Check**: http://localhost:5004/api/health

### **📚 Common Issues**
- **Login Problems**: Check admin credentials
- **Database Issues**: Verify MongoDB connection
- **API Errors**: Check authentication tokens
- **Permission Issues**: Verify role assignments

### **🔧 Development Setup**
```bash
# Start Backend
cd backend
npm start

# Start Frontend
cd frontend
npm start

# Seed Database
node scripts/seedAccessControl.js
```

---

## 📈 **Database Statistics (Current)**

### **👥 Users**
- **Total Users**: 8
- **Active Users**: 8 (all users are active by default)
- **Flag Activity**: 8 users in system

### **🏷️ Handles**
- **Total Handles**: 11
- **Active Handles**: 11 (all handles are active by default)
- **Flag Distribution**: 7 total flags across handles

### **🚩 Content Moderation**
- **Total Flags**: 7
- **Pending**: 6
- **Approved**: 1
- **Rejected**: 0

### **📊 System Activity**
- **Total Replies**: 10
- **Total Reports**: 0
- **Total Watchlists**: 5
- **Total Notifications**: 0
- **Daily Searches**: 0
- **Total Content Items**: 17
- **User Engagement**: 5 watchlist subscriptions
- **System Activity**: 0 search activities

---

## 🎉 **Conclusion**

This database structure supports the complete Clocked application with:
- **User Management** and authentication
- **Content Moderation** with flags and replies
- **Issue Tracking** with reports system
- **Real-time Notifications** across channels
- **User Engagement** with watchlists and search
- **Admin Tools** for system management
- **Analytics** for insights and monitoring

**For any questions or issues, refer to the admin panel or contact the development team.**

---

*Last Updated: April 1, 2026*
*Version: 1.0*
