# Admin Panel Guide

## 🔐 Changing Admin Credentials

### Current Credentials:
- **Email**: `admin@clocked.in`
- **Password**: `admin123`

### How to Change Credentials:

1. **Backend Changes** - Edit `backend/routes/admin.js`:
   ```javascript
   // Line 52 - Change these values
   if (email === 'your-email@example.com' && password === 'your-password') {
     mockAdminSession.authenticated = true;
     mockAdminSession.admin = {
       name: 'Your Name',
       email: email
     };
   ```

2. **Restart Backend**: After changing credentials, restart the backend server:
   ```bash
   # Kill existing server and restart
   taskkill /F /IM node.exe
   node server.js
   ```

## 🚧 Enabling Disabled Features

### Currently Disabled (Showing "Soon" badge):
- Meta Items
- Content Blocks  
- Notifications
- Widgets
- Settings Fields

### How to Enable Features:

#### Option 1: Remove `disabled: true` (Simple Method)
Edit `frontend/src/pages/AdminPanel.js`:
```javascript
const ADMIN_ROUTES = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "meta-groups", label: "Meta Groups", icon: "🧩" },
  { key: "meta-items", label: "Meta Items", icon: "🏷️" }, // Removed disabled: true
  { key: "content", label: "Content Blocks", icon: "📝" }, // Removed disabled: true
  // ... remove disabled: true from all routes you want to enable
];
```

#### Option 2: Add Backend APIs First (Recommended)
Before enabling features in frontend, add the corresponding backend APIs in `backend/routes/admin.js`:

1. **Add Meta Items API**:
```javascript
// GET /api/admin/meta/items
router.get('/meta/items', async (req, res) => {
  try {
    const mockItems = {
      items: [
        {
          _id: 'item1',
          group_key: 'search_reasons',
          key: 'date',
          label: 'Going on a date',
          icon: '👀',
          active: true
        }
        // ... more items
      ]
    };
    res.json(mockItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});
```

2. **Add POST/PATCH/DELETE for items**

3. **Add similar APIs for content, notifications, widgets, settings**

## 🛠️ Adding New Fields to Meta Groups

### Current Meta Group Fields:
- Key
- Label  
- Description
- Sort Order
- Active

### How to Add New Fields:

1. **Frontend Form** - Edit `frontend/src/pages/AdminPanel.js`:
```javascript
// Add to GROUP_FORM_DEFAULT
const GROUP_FORM_DEFAULT = {
  key: "",
  label: "",
  description: "",
  sort_order: 1,
  active: true,
  // Add new fields here:
  icon: "",           // New field
  color: "",          // New field
  custom_field: ""     // New field
};
```

2. **Add Form Fields**:
```javascript
<label className="field">
  <span>Icon</span>
  <input
    type="text"
    value={groupForm.icon}
    onChange={(e) => setGroupForm((s) => ({ ...s, icon: e.target.value }))}
    placeholder="👀"
  />
</label>

<label className="field">
  <span>Color</span>
  <input
    type="text"
    value={groupForm.color}
    onChange={(e) => setGroupForm((s) => ({ ...s, color: e.target.value }))}
    placeholder="red"
  />
</label>
```

3. **Backend Update** - Modify `backend/routes/admin.js`:
```javascript
// In POST /api/admin/meta/groups
const newGroup = {
  _id: `group_${Date.now()}`,
  ...groupData,
  // Add new fields
  icon: groupData.icon || "",
  color: groupData.color || "",
  custom_field: groupData.custom_field || "",
  createdAt: new Date(),
  updatedAt: new Date()
};
```

## 🔄 Adding New Admin Sections

### Steps to Add New Admin Section:

1. **Add Route to ADMIN_ROUTES**:
```javascript
const ADMIN_ROUTES = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "meta-groups", label: "Meta Groups", icon: "🧩" },
  { key: "your-new-section", label: "Your Section", icon: "🔧" }, // New route
];
```

2. **Add State Management**:
```javascript
const [yourData, setYourData] = useState([]);
const [yourLoading, setYourLoading] = useState(false);
const [selectedId, setSelectedId] = useState(null);
```

3. **Add Backend API**:
```javascript
// GET /api/admin/your-section
router.get('/your-section', async (req, res) => {
  // Your implementation
});
```

4. **Add UI Component**:
```javascript
{activeRoute === "your-section" ? (
  <div className="your-section-layout">
    {/* Your UI components */}
  </div>
) : null}
```

## 🎯 Quick Fixes

### Common Issues:

1. **"Soon" Badge Not Disappearing**:
   - Remove `disabled: true` from the route in `ADMIN_ROUTES`
   - Make sure the backend API exists for that route

2. **Form Not Saving**:
   - Check if all required fields are filled
   - Check browser console for API errors
   - Verify backend API is implemented

3. **Login Not Working**:
   - Verify credentials match backend exactly
   - Check backend server is running
   - Clear browser cache and try again

4. **Data Not Loading**:
   - Check network tab in browser dev tools
   - Verify API endpoints return data
   - Check CORS configuration

## 📱 Testing

### Test Your Changes:
1. **Login Test**: Try logging in with new credentials
2. **API Test**: Use curl or Postman to test endpoints
3. **UI Test**: Test all CRUD operations
4. **Responsive Test**: Test on mobile and desktop

## 🚀 Production Deployment Notes

For production:
- Replace mock data with real database operations
- Add proper authentication with JWT or sessions
- Add proper error handling and validation
- Add logging and monitoring
- Set up proper CORS and security headers
