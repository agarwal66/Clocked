# 🔐 GMAIL APP PASSWORD SETUP FOR agarwalprateek55@gmail.com

## 📋 **STEP-BY-STEP INSTRUCTIONS**

### **🔐 Step 1: Enable 2-Factor Authentication**
1. Go to: https://myaccount.google.com/
2. Login with: `agarwalprateek55@gmail.com`
3. Click on **"Security"** (left sidebar)
4. Scroll to **"Signing in to Google"** section
5. Click on **"2-Step Verification"**
6. Click **"Get Started"**
7. Follow the setup process (phone verification, etc.)

### **🔑 Step 2: Generate App Password**
1. After enabling 2-Step Verification, go back to Security page
2. Scroll to **"Signing in to Google"** section
3. Click on **"App passwords"**
4. You might need to re-enter your password
5. Under "Select app", choose **"Mail"**
6. Under "Select device", choose **"Other (Custom name)"**
7. Enter name: **"Clocked App"**
8. Click **"Generate"**
9. **Copy the 16-character password** (without spaces)

### **📧 Step 3: Update .env File**
Edit your `backend/.env` file:

```bash
# CURRENT
SMTP_PASS=your-app-password

# UPDATE WITH YOUR APP PASSWORD
SMTP_PASS=the-16-character-password-from-google
```

### **🔄 Step 4: Restart Backend**
```bash
cd backend
npm restart
# or
node server.js
```

---

## 🧪 **TEST AFTER SETUP**

### **📋 Test Password Reset:**
```
1. Go to: http://localhost:3001/login
2. Click: "Forgot password?"
3. Enter: agarwalprateek55@gmail.com
4. Click: "Send reset link"
5. Check your Gmail inbox
6. Click the reset link in the email
7. Set new password
```

### **📋 Test Registration:**
```
1. Go to: http://localhost:3001/signup
2. Register with: agarwalprateek55@gmail.com
3. Check your Gmail for verification email
4. Click verification link
```

---

## 🔧 **TROUBLESHOOTING**

### **❌ If App Password Doesn't Work:**
- Make sure 2-factor authentication is enabled
- Generate a new app password (they expire)
- Copy the password without spaces

### **❌ If Email Still Not Sending:**
- Check backend console for error messages
- Verify Gmail credentials are correct
- Make sure backend is restarted

### **❌ If Link Not Working:**
- Check if FRONTEND_URL is correct in .env
- Make sure token hasn't expired (30 minutes)
- Try generating a new reset link

---

## 🎯 **CURRENT STATUS**

### **✅ Already Done:**
- ✅ Email address updated in .env: `agarwalprateek55@gmail.com`
- ✅ Email service configured for Gmail
- ✅ Backend ready for Gmail integration

### **🔧 Still Needed:**
- 🔐 Enable 2-factor authentication on Gmail
- 🔑 Generate app password from Google
- 📧 Update SMTP_PASS in .env file
- 🔄 Restart backend server

---

## 🚀 **EXPECTED RESULT**

After setup, you'll receive:
- **Password reset emails** at `agarwalprateek55@gmail.com`
- **Email verification emails** for new registrations
- **Welcome emails** for new users

**Complete email functionality will be working!** ✨

---

## 📞 **QUICK HELP**

### **🔧 Common Issues:**
- **"App password not working"**: Regenerate from Google settings
- **"2-factor authentication required"**: Must enable it first
- **"Email not sending"**: Check backend console for errors

### **🔧 Alternative:**
If Gmail setup is too complex, the system will fall back to console logging, so you can still test the functionality.

---

## 🎉 **READY TO GO!**

**📧 Your email is configured: agarwalprateek55@gmail.com**
**🔐 Just need to generate app password and update .env**
**🚀 After that, you'll receive real emails!**

**Follow the steps above and you'll have working email service in 5 minutes!** ✨
