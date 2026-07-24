# Registration Troubleshooting Guide

## Issue: Account not registering

If you can't create a new account, follow these steps:

### Step 1: Check Browser Console
1. Open register.html
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Fill out the form and click "Create account"
5. Check for error messages

### Step 2: Check Network Response
1. In Developer Tools, go to **Network** tab
2. Fill out the form and click "Create account"
3. Look for the **register.php** request
4. Click on it and check the **Response** tab
5. You should see one of these responses:

**Success:**
```json
{"success": true, "message": "Account created successfully. Redirecting...", "username": "yourname"}
```

**Error Examples:**
```json
{"success": false, "message": "All fields are required."}
{"success": false, "message": "Database connection failed..."}
{"success": false, "message": "An account with that username or email already exists."}
```

### Step 3: Verify Database Connection

**Check if the database exists:**
1. Go to http://localhost/phpmyadmin/
2. Look for `skylight_weather` database
3. If it doesn't exist, import the schema:
   - Click **Import**
   - Choose file: `schema.sql` from your project
   - Click **Go**

**Check if the users table exists:**
1. In phpMyAdmin, go to `skylight_weather` → **Tables**
2. You should see: `users`, `favorite_cities`, `search_history`
3. If missing, re-import `schema.sql`

**Check database credentials:**
1. Open `backend/config.php`
2. Verify these match your MySQL setup:
   ```php
   DB_HOST = 'localhost'
   DB_NAME = 'skylight_weather'
   DB_USER = 'root'
   DB_PASS = 'root'
   ```

### Step 4: Check users Table Structure

In phpMyAdmin, go to `skylight_weather` → `users` → **Structure**

You should see these columns:
- `id` (INT, Primary Key)
- `username` (VARCHAR 50, UNIQUE)
- `email` (VARCHAR 190, UNIQUE)
- `password_hash` (VARCHAR 255)
- `home_city` (VARCHAR 120, nullable)
- `unit_pref` (ENUM)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

If columns are missing, run this SQL in phpMyAdmin:

```sql
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN home_city VARCHAR(120) DEFAULT NULL;
ALTER TABLE users ADD COLUMN unit_pref ENUM('metric','imperial') DEFAULT 'metric';
ALTER TABLE users MODIFY password_hash VARCHAR(255) NOT NULL;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### Step 5: Test MySQL Connection Directly

Create a test file `test-db.php` in your project root:

```php
<?php
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=skylight_weather;charset=utf8mb4',
        'root',
        'root',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    echo json_encode(['success' => true, 'message' => 'Database connection OK']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
```

Then visit: http://localhost/xampp/htdocs/skycanvas/test-db.php

### Step 6: Check Form Validation

Make sure you're entering:
- **Username**: 3-50 characters, only letters/numbers/dots/underscores
  - ✓ Valid: `john_doe`, `user123`, `test.user`
  - ✗ Invalid: `jo`, `user@name`, `user-123`

- **Email**: Valid email format
  - ✓ Valid: `user@example.com`, `john.doe@company.co.uk`
  - ✗ Invalid: `user@`, `@example.com`, `user example.com`

- **Password**: Minimum 8 characters
  - ✓ Valid: `MyPass123`, `Secure!Pass2024`
  - ✗ Invalid: `pass123`, `12345678`

- **Confirm Password**: Must match password exactly

### Step 7: Check PHP Error Logs

If you see "Database error" messages, check PHP error logs:

**XAMPP on Windows:**
- Logs are in: `C:\xampp\apache\logs\error.log`
- Or: `C:\xampp\mysql\data\mysql_error.log`

Open these files and look for recent errors.

### Step 8: Verify Sessions are Enabled

Create a file `test-session.php`:

```php
<?php
session_start();
$_SESSION['test'] = 'ok';
echo json_encode([
    'session_status' => session_status(),
    'session_id' => session_id(),
    'session_test' => $_SESSION['test'] ?? 'NOT SET'
]);
?>
```

Visit: http://localhost/xampp/htdocs/skycanvas/test-session.php

Should show: `"session_status": 2` (PHP_SESSION_ACTIVE)

---

## Common Error Messages & Solutions

### "Database connection failed"
- ✓ Check MySQL is running (xampp-control.exe)
- ✓ Verify DB_HOST, DB_USER, DB_PASS in config.php
- ✓ Run `test-db.php` to verify connection

### "All fields are required"
- ✓ Fill all 4 fields (username, email, password, confirm password)
- ✓ Don't leave any field blank

### "Enter a valid email address"
- ✓ Use format: `example@domain.com`
- ✓ Must include @ and domain

### "Password must be at least 8 characters"
- ✓ Password must be 8+ characters long
- ✓ Example: `MySecure123`

### "Passwords do not match"
- ✓ Type the same password in both fields
- ✓ Check for extra spaces

### "Username may only contain..."
- ✓ Use only: letters (A-Z, a-z), numbers (0-9), dots (.), underscores (_)
- ✗ No: spaces, hyphens, special characters

### "An account with that username or email already exists"
- ✓ Use a different username or email
- ✓ Or check phpMyAdmin to delete old account if needed

---

## Still Having Issues?

1. **Share these with your developer:**
   - Browser console error message (F12 → Console)
   - Network response from register.php (F12 → Network)
   - PHP error log contents
   - Output of `test-db.php`
   - Output of `test-session.php`

2. **Quick Reset (if stuck with duplicate account):**
   ```sql
   -- In phpMyAdmin, run this to delete an account:
   DELETE FROM users WHERE username = 'yourname' OR email = 'youremail@example.com';
   ```

3. **Full Database Reset:**
   ```sql
   -- Delete and recreate the database
   DROP DATABASE skylight_weather;
   SOURCE /xampp/htdocs/skycanvas/schema.sql;
   ```
