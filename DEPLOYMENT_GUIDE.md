# School Management System - cPanel Deployment Guide

## 📋 Files & Folders to Upload

### ⚡ RECOMMENDED: Upload ZIP Files (Easier & Faster)

I've created two ZIP files for you in the project folder:

#### 1. Frontend ZIP
**File:** `frontend-dist.zip`
**Upload to:** `public_html/`

**Steps:**
1. In cPanel File Manager, go to `public_html/`
2. Click **Upload**
3. Select `frontend-dist.zip` from your computer
4. After upload, right-click the ZIP file
5. Select **Extract**
6. Delete the ZIP file after extraction

#### 2. Backend ZIP
**File:** `backend-dist.zip`
**Upload to:** `public_html/`

**Steps:**
1. In cPanel File Manager, go to `public_html/`
2. Click **Upload**
3. Select `backend-dist.zip` from your computer
4. After upload, right-click the ZIP file
5. Select **Extract**
6. This will create a `backend/` folder
7. Delete the ZIP file after extraction

---

### Manual Upload (If ZIP doesn't work)

### 1. Frontend Files (Public HTML)
Upload these files to your **public_html** folder (or your domain's root folder):

```
From project folder: dist/
Upload to: public_html/
```

**Files to upload:**
- `index.html`
- `.htaccess` (root .htaccess file)
- `assets/` folder (contains all CSS and JS files)
- `images/` folder (contains all PNG images)
- `schema.sql` (for database import)
- `seed.sql` (for database import)

**Tip:** Upload files in small batches (5-10 files at a time) to avoid failures.

### 2. Backend Files (PHP API)
Upload these files to your **backend** folder:

```
From project folder: backend/
Upload to: public_html/backend/
```

**Folder structure:**
```
backend/
├── .htaccess
├── index.php
├── config/
│   └── config.php
├── api/
│   ├── auth.php
│   ├── students.php
│   ├── teachers.php
│   ├── parents.php
│   ├── classes.php
│   ├── subjects.php
│   ├── lessons.php
│   ├── exams.php
│   ├── assignments.php
│   ├── results.php
│   ├── attendance.php
│   ├── events.php
│   ├── announcements.php
│   ├── dashboard.php
│   └── grades.php
├── database/
│   ├── Database.php
│   ├── schema.sql
│   └── seed.sql
├── models/
│   └── (empty or any model files)
└── utils/
    ├── Response.php
    ├── JWTHandler.php
    ├── AuthMiddleware.php
    └── CorsMiddleware.php
```

## 🗄️ Database Setup

### Option 1: Import via phpMyAdmin
1. Log in to cPanel
2. Go to **phpMyAdmin**
3. Select your database: `if0_42784359_myscmanagement`
4. Go to **Import** tab
5. Upload and import `schema.sql` (from dist/ or backend/database/)
6. Upload and import `seed.sql` (from dist/ or backend/database/)

**Important:** The SQL files have been modified to work with your existing database. They no longer try to create a new database - they only create tables and insert data into your existing database.

### Option 2: Import via cPanel MySQL Database Wizard
1. Go to **MySQL Database Wizard** in cPanel
2. Select your database
3. Go to **phpMyAdmin** to import the SQL files

## 🔐 File Permissions

After uploading, set these permissions:

### Frontend files:
- All files: `644`
- All folders: `755`

### Backend files:
- All PHP files: `644`
- All folders: `755`
- `.htaccess` files: `644`

## ✅ Verification Steps

1. **Test Frontend:**
   - Visit: `http://maneschool.site.je`
   - Should see the login page

2. **Test Backend API:**
   - Visit: `http://maneschool.site.je/backend/api`
   - Should see JSON response with API info

3. **Test Database Connection:**
   - Try to login with default admin credentials:
     - Username: `admin`
     - Password: `admin123`

## 📝 Default Login Credentials

### Admin
- Username: `admin`
- Password: `admin123`

### Teacher
- Username: `johndoe`
- Password: `teacher123`

### Student
- Username: `johnconnor`
- Password: `student123`

### Parent
- Username: `sarahconnor`
- Password: `parent123`

## 🔧 Troubleshooting

### 500 Internal Server Error
- Check file permissions (should be 644 for files, 755 for folders)
- Check `.htaccess` file syntax
- Check PHP error logs in cPanel

### Database Connection Error
- Verify database credentials in `backend/config/config.php`
- Ensure database exists and tables are imported
- Check if MySQL server is accessible

### CORS Error
- Verify CORS settings in `backend/config/config.php`
- Ensure your domain is listed in `CORS_ALLOWED_ORIGINS`

### 404 Not Found
- Check if `.htaccess` is uploaded
- Verify mod_rewrite is enabled on server
- Check file paths and folder structure

## 🚀 After Deployment

1. **Change default passwords** for all users
2. **Update JWT_SECRET** in `backend/config/config.php` with a secure random key
3. **Enable HTTPS** if SSL certificate is available
4. **Set up regular backups** of your database
5. **Monitor error logs** in cPanel

## 📞 Support

If you encounter any issues:
- Check cPanel error logs: `/home/your-username/logs/error_log`
- Check PHP error logs in cPanel
- Verify all files are uploaded correctly
- Ensure database tables are created
