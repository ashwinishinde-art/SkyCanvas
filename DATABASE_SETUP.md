# Skylight Farm - Database Setup Guide

## Quick Setup

### Option 1: Using phpMyAdmin (Recommended for Windows/XAMPP)

1. **Open phpMyAdmin**
   - Go to: http://localhost/phpmyadmin/

2. **Import the schema**
   - Click "Import" tab
   - Select file: `schema.sql` (or `database/upgrade.sql`)
   - Click "Go"

This will automatically create:
- Database: `skylight_weather`
- Table: `users` (for authentication)
- Table: `favorite_cities` (for saved locations)
- Table: `search_history` (for search tracking)

### Option 2: Using MySQL Command Line

```bash
mysql -u root -p < C:\xampp\htdocs\skycanvas\schema.sql
```

Or manually run in MySQL:

```sql
mysql> SOURCE C:/xampp/htdocs/skycanvas/schema.sql;
```

### Option 3: If You Have an Existing "skycanvas" Database

If you already have a database called "skycanvas" with a "registration" table, you can either:

**A. Keep your current database and update the config:**

Edit `backend/config.php`:
```php
define('DB_NAME', 'skycanvas');  // Change from 'skylight_weather'
```

Then update your "registration" table to match the "users" schema:
```sql
ALTER TABLE registration RENAME TO users;
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL;
ALTER TABLE users ADD COLUMN home_city VARCHAR(120) DEFAULT NULL;
ALTER TABLE users ADD COLUMN unit_pref ENUM('metric','imperial') DEFAULT 'metric';
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

**B. Create fresh database (Recommended):**

```sql
DROP DATABASE skycanvas;
SOURCE C:/xampp/htdocs/skycanvas/schema.sql;
```

## Database Structure

### users Table
```
id (INT) - Primary Key
username (VARCHAR 50) - Unique
email (VARCHAR 190) - Unique
password_hash (VARCHAR 255) - bcrypt hashed
home_city (VARCHAR 120) - Optional
unit_pref (ENUM) - 'metric' or 'imperial'
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### favorite_cities Table
```
id (INT) - Primary Key
user_id (INT) - Foreign Key → users.id
city_name (VARCHAR 120)
country (VARCHAR 120)
latitude (DECIMAL 9,6)
longitude (DECIMAL 9,6)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### search_history Table
```
id (INT) - Primary Key
user_id (INT) - Foreign Key → users.id
city_name (VARCHAR 120)
searched_at (TIMESTAMP)
```

## Verify Setup

1. Test the database connection:
   - Open http://localhost/xampp/htdocs/skycanvas/index.html
   - Open browser console (F12)
   - Check for connection errors

2. Test registration:
   - Go to http://localhost/xampp/htdocs/skycanvas/register.html
   - Create an account
   - Check phpMyAdmin → skylight_weather → users table

3. Test login:
   - Go to http://localhost/xampp/htdocs/skycanvas/login.html
   - Sign in with your account

## Credentials

After setup, you can use:
- **Demo User**: username: `demo`, password: `demo123`
- Or create your own account via the register page

## Troubleshooting

### "Database connection failed"
- Ensure MySQL is running
- Check `DB_HOST`, `DB_USER`, `DB_PASS` in `backend/config.php`
- Verify database and tables exist in phpMyAdmin

### "Table 'skylight_weather.users' doesn't exist"
- Run the schema.sql script again
- Check phpMyAdmin for the tables

### Registration not working
- Check browser console for errors (F12)
- Check MySQL error logs
- Verify `users` table has all required columns

## App Requirements

The app uses:
- **PHP 7.4+** (or 8.0+)
- **MySQL 5.7+** or **MariaDB 10.3+**
- **Sessions** for authentication (server-side)
- **HTTPS** recommended for production (use `Secure` and `HttpOnly` cookies)

## Security Notes

- Passwords are hashed with bcrypt (PASSWORD_BCRYPT)
- SQL uses prepared statements (PDO)
- CSRF protection via session verification
- HttpOnly cookies for session IDs
