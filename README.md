# Skylight Farm — Weather for Growers

A live weather app (Open-Meteo, no API key needed) with a PHP + MySQL login
system for saving favorite locations, now tuned for farmers with soil,
frost, spray-window, and irrigation guidance.

## Bug fixes in this update

- **Backend paths matched the code.** The frontend has always called
  `backend/login.php`, `backend/session_check.php`, etc., and the README
  described a `backend/` folder, but the PHP files shipped flat at the
  project root. They're now actually organized into `backend/` (and
  `schema.sql` into `database/`) so the app runs as documented.
- **Favorites were being wiped after every search.** For signed-in users,
  `fetchWeather()` unconditionally called the guest "recent searches"
  renderer after every lookup, which overwrote the favorites chip row you'd
  just loaded. Recent-search chips now only render for guests; signed-in
  users keep seeing their saved favorites.
- **Inconsistent branding.** `index.html`'s `<title>` and header still said
  "SkySnap" while every other page said "Skylight" — unified to
  **Skylight Farm** everywhere.
- **`favorites_add.php` silently dropped country changes** on repeat saves
  (`ON DUPLICATE KEY UPDATE` only touched lat/lon). It now also refreshes
  `country`.

## What's new: farmer-focused features

- 🌱 **Crop selector** in the top bar (wheat/maize, rice, cotton,
  cool-season vegetables) sets the base temperature used for growing degree
  day (GDD) math.
- 🌡️ **Frost / freeze alerts** — a banner appears when the forecast low for
  the next 3 days drops to 2 °C or below, with a stronger warning at or
  below 0 °C.
- 🌾 **Farm Insights panel**:
  - Soil temperature and soil moisture (0 cm / 0–1 cm, from Open-Meteo's
    agricultural fields).
  - 7-day accumulated rainfall.
  - Growing degree days accumulated over the forecast, based on the
    selected crop's base temperature.
  - **Spray window** — scans the next 24 hours for a 2+ hour stretch with
    wind under 15 km/h and low rain probability, so you know when it's
    actually safe to spray.
  - **Irrigation need** — compares forecast rainfall against FAO reference
    evapotranspiration (ET₀) to flag a water deficit.
- The **AI Assistant panel** now gives field-relevant advice (spraying
  conditions, frost/irrigation timing, disease-risk humidity, heat stress
  for livestock) instead of generic "grab an umbrella" tips.

## Setup

1. **Database** — import the schema:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
2. **Backend config** — edit `backend/config.php` with your MySQL
   credentials (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).
3. **Serve the project root with PHP** (needs PHP 8+ with PDO MySQL):
   ```bash
   php -S localhost:8000
   ```
   Or drop the folder into your XAMPP/MAMP `htdocs` and browse to it.
4. Visit `login.html` to create an account, or open `index.html` directly —
   the app works fully as a guest and only asks you to sign in when you try
   to save a favorite location.

## File map

```
index.html          main weather + farm insights app
login.html / register.html   auth pages
app.js               weather logic, farm calculations, UI
auth.js              shared login/register form handler
styles.css           main app styles (themes, sky mood, farm cards)
auth.css             login/register styles
backend/
  config.php         DB credentials — edit this
  db.php             PDO connection + small JSON helpers
  register.php       POST username/email/password -> creates account
  login.php          POST identifier/password -> starts session
  logout.php         destroys session
  session_check.php  GET -> { authenticated, username }
  favorites_add.php / favorites_list.php / favorites_remove.php
database/schema.sql  users, favorite_cities, search_history tables
```

## Notes

- Weather, geocoding, soil, evapotranspiration, and air-quality data all
  come from the free Open-Meteo APIs and require no API key.
- Sessions are cookie-based (`credentials: "same-origin"` on every fetch to
  `backend/*`), so the frontend and PHP backend must be served from the
  same origin.
- Growing degree days and irrigation deficit numbers are planning estimates
  from forecast data, not a substitute for local agronomic advice.
