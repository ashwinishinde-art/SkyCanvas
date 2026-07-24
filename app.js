const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const statusMessage = document.getElementById("statusMessage");
const cityName = document.getElementById("cityName");
const dateText = document.getElementById("dateText");
const temperature = document.getElementById("temperature");
const weatherIcon = document.getElementById("weatherIcon");
const weatherDescription = document.getElementById("weatherDescription");
const feelsLike = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const airQualityEl = document.getElementById("airQuality");
const uvOutlookEl = document.getElementById("uvOutlook");
const forecastCards = document.getElementById("forecastCards");
const hourlyStrip = document.getElementById("hourlyStrip");
const lastUpdated = document.getElementById("lastUpdated");
const aiInsight = document.getElementById("aiInsight");
const aiAction = document.getElementById("aiAction");
const currentLocationButton = document.getElementById("currentLocationButton");
const favoriteButton = document.getElementById("favoriteButton");
const shareButton = document.getElementById("shareButton");
const unitToggle = document.getElementById("unitToggle");
const themeToggle = document.getElementById("themeToggle");
const authArea = document.getElementById("authArea");
const chipRow = document.getElementById("chipRow");
const skyParticles = document.getElementById("skyParticles");
const cropSelect = document.getElementById("cropSelect");
const frostBanner = document.getElementById("frostBanner");
const soilTempEl = document.getElementById("soilTemp");
const soilMoistureEl = document.getElementById("soilMoisture");
const rainfallTotalEl = document.getElementById("rainfallTotal");
const gddTotalEl = document.getElementById("gddTotal");
const gddSubEl = document.getElementById("gddSub");
const sprayWindowEl = document.getElementById("sprayWindow");
const irrigationTipEl = document.getElementById("irrigationTip");

const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "☀️", mood: "clear" },
  1: { label: "Mostly clear", icon: "🌤️", mood: "clear" },
  2: { label: "Partly cloudy", icon: "⛅", mood: "cloudy" },
  3: { label: "Overcast", icon: "☁️", mood: "cloudy" },
  45: { label: "Fog", icon: "🌫️", mood: "fog" },
  48: { label: "Rime fog", icon: "🌫️", mood: "fog" },
  51: { label: "Light drizzle", icon: "🌦️", mood: "rain" },
  53: { label: "Moderate drizzle", icon: "🌦️", mood: "rain" },
  55: { label: "Dense drizzle", icon: "🌧️", mood: "rain" },
  61: { label: "Light rain", icon: "🌧️", mood: "rain" },
  63: { label: "Moderate rain", icon: "🌧️", mood: "rain" },
  65: { label: "Heavy rain", icon: "⛈️", mood: "storm" },
  71: { label: "Light snow", icon: "🌨️", mood: "snow" },
  73: { label: "Moderate snow", icon: "🌨️", mood: "snow" },
  75: { label: "Heavy snow", icon: "❄️", mood: "snow" },
  95: { label: "Thunderstorm", icon: "⛈️", mood: "storm" },
  96: { label: "Thunderstorm with hail", icon: "⛈️", mood: "storm" },
  99: { label: "Thunderstorm with hail", icon: "⛈️", mood: "storm" },
};

const AQI_LABELS = [
  { max: 50, label: "Good" },
  { max: 100, label: "Moderate" },
  { max: 150, label: "Unhealthy (sensitive)" },
  { max: 200, label: "Unhealthy" },
  { max: 300, label: "Very unhealthy" },
  { max: Infinity, label: "Hazardous" },
];

let currentQuery = "London";
let currentPlace = null;
let currentWeatherData = null;
let unit = localStorage.getItem("skylight-unit") || "metric";
let map = null;
let marker = null;
let isAuthenticated = false;

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  themeToggle.textContent = theme === "light" ? "☀️" : "🌙";
  localStorage.setItem("skylight-theme", theme);
}
applyTheme(localStorage.getItem("skylight-theme") || "dark");
themeToggle.addEventListener("click", () => {
  applyTheme(document.body.dataset.theme === "light" ? "dark" : "light");
});

function applyUnitLabel() {
  unitToggle.textContent = unit === "metric" ? "°C" : "°F";
}
applyUnitLabel();
unitToggle.addEventListener("click", () => {
  unit = unit === "metric" ? "imperial" : "metric";
  localStorage.setItem("skylight-unit", unit);
  applyUnitLabel();
  if (currentPlace && currentWeatherData) {
    renderWeather(currentPlace, currentWeatherData);
  }
});

function formatTemp(celsius) {
  if (celsius === null || celsius === undefined) return "--";
  const value = unit === "metric" ? celsius : celsius * (9 / 5) + 32;
  return `${Math.round(value)}°${unit === "metric" ? "C" : "F"}`;
}

function formatWind(kmh) {
  if (kmh === null || kmh === undefined) return "--";
  const value = unit === "metric" ? kmh : kmh * 0.621371;
  return `${Math.round(value)} ${unit === "metric" ? "km/h" : "mph"}`;
}

function applySkyMood(weatherCode, isDay) {
  const meta = WEATHER_CODES[weatherCode] || { mood: "clear" };
  document.body.dataset.mood = meta.mood;
  document.body.dataset.daypart = isDay ? "day" : "night";
  renderParticles(meta.mood);
}

function renderParticles(mood) {
  skyParticles.innerHTML = "";
  if (mood !== "rain" && mood !== "storm" && mood !== "snow") return;

  const count = mood === "snow" ? 40 : 60;
  const symbol = mood === "snow" ? "❄" : "|";
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const drop = document.createElement("span");
    drop.className = `particle particle--${mood}`;
    drop.textContent = mood === "snow" ? symbol : "";
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDelay = `${Math.random() * 4}s`;
    drop.style.animationDuration = `${(mood === "snow" ? 6 : 1) + Math.random() * 2}s`;
    fragment.appendChild(drop);
  }
  skyParticles.appendChild(fragment);
}

async function refreshAuthArea() {
  try {
    const res = await fetch("backend/session_check.php", { credentials: "same-origin" });
    const data = await res.json();
    isAuthenticated = Boolean(data.authenticated);
    if (isAuthenticated) {
      authArea.innerHTML = `
        <span class="auth-greeting">Hi, ${escapeHtml(data.username)}</span>
        <button id="logoutBtn" class="pill-toggle" type="button">Log out</button>
      `;
      document.getElementById("logoutBtn").addEventListener("click", async () => {
        await fetch("backend/logout.php", { credentials: "same-origin" });
        window.location.reload();
      });
      loadFavorites();
    } else {
      authArea.innerHTML = `<a class="signin-link" href="login.html">Sign in</a>`;
      renderRecentChips();
    }
  } catch (error) {
    isAuthenticated = false;
    authArea.innerHTML = `<a class="signin-link" href="login.html">Sign in</a>`;
    renderRecentChips();
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

async function loadFavorites() {
  try {
    const res = await fetch("backend/favorites_list.php", { credentials: "same-origin" });
    const data = await res.json();
    if (!data.success) return;
    chipRow.innerHTML = "";
    data.favorites.forEach((fav) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.innerHTML = `★ ${escapeHtml(fav.city_name)} <span class="chip-remove" data-id="${fav.id}">✕</span>`;
      chip.addEventListener("click", (event) => {
        if (event.target.classList.contains("chip-remove")) {
          event.stopPropagation();
          removeFavorite(fav.id);
          return;
        }
        fetchWeather(fav.city_name).catch((error) => updateStatus(error.message, true));
      });
      chipRow.appendChild(chip);
    });
  } catch (error) {
    console.warn("Could not load favorites", error);
  }
}

async function removeFavorite(id) {
  await fetch("backend/favorites_remove.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  loadFavorites();
}

async function saveFavorite() {
  if (!currentPlace) return;
  const res = await fetch("backend/session_check.php", { credentials: "same-origin" });
  const session = await res.json();
  if (!session.authenticated) {
    updateStatus("Sign in to save favorite cities.", true);
    return;
  }
  await fetch("backend/favorites_add.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city_name: currentPlace.name,
      country: currentPlace.country || "",
      latitude: currentPlace.latitude,
      longitude: currentPlace.longitude,
    }),
  });
  loadFavorites();
}
favoriteButton.addEventListener("click", saveFavorite);

function renderRecentChips() {
  const recent = JSON.parse(localStorage.getItem("skylight-recent") || "[]");
  chipRow.innerHTML = "";
  recent.forEach((city) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.textContent = city;
    chip.addEventListener("click", () => fetchWeather(city).catch((error) => updateStatus(error.message, true)));
    chipRow.appendChild(chip);
  });
}

async function fetchWeather(query) {
  updateStatus("Checking weather…", false);
  currentQuery = query;
  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;

  const geoRes = await fetch(geocodeUrl);
  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error("Location not found.");
  }

  const place = geoData.results[0];
  const lat = place.latitude;
  const lon = place.longitude;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m&hourly=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum&timezone=auto&forecast_days=6`;
  const weatherRes = await fetch(weatherUrl);
  const weatherData = await weatherRes.json();

  currentPlace = {
    name: place.name,
    country: place.country,
    latitude: lat,
    longitude: lon,
  };
  currentWeatherData = weatherData;
  renderWeather(currentPlace, weatherData);

  const recent = JSON.parse(localStorage.getItem("skylight-recent") || "[]");
  const nextRecent = [query, ...recent.filter((item) => item !== query)].slice(0, 6);
  localStorage.setItem("skylight-recent", JSON.stringify(nextRecent));
  renderRecentChips();
}

function updateStatus(message, isError) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "var(--error)" : "var(--muted)";
}

function renderWeather(place, data) {
  const current = data.current;
  const meta = WEATHER_CODES[current.weather_code] || WEATHER_CODES[0];
  const isDay = current.is_day === 1;
  applySkyMood(current.weather_code, isDay);

  cityName.textContent = `${place.name}, ${place.country}`;
  dateText.textContent = new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  temperature.textContent = formatTemp(current.temperature_2m);
  weatherIcon.textContent = meta.icon;
  weatherDescription.textContent = `${meta.label} · ${isDay ? "Daylight" : "Night"}`;
  feelsLike.textContent = formatTemp(current.apparent_temperature);
  humidityEl.textContent = `${current.relative_humidity_2m}%`;
  windEl.textContent = formatWind(current.wind_speed_10m);
  pressureEl.textContent = `${Math.round(current.pressure_msl)} hPa`;
  sunriseEl.textContent = new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  sunsetEl.textContent = new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  airQualityEl.textContent = "—";
  uvOutlookEl.textContent = "—";
  lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  aiInsight.textContent = `A ${meta.label.toLowerCase()} outlook is shaping up for ${place.name}.`;
  aiAction.textContent = "Plan around temperature swings and keep an eye on rain risk.";
  renderForecast(data);
  renderHourly(data);
  renderFarmInsights(data);
  updateStatus("Weather loaded.", false);
  
  // Update map marker with location
  updateMapMarker(place.latitude, place.longitude);
}

function renderForecast(data) {
  forecastCards.innerHTML = "";
  const days = data.daily.time.slice(0, 6);
  days.forEach((day, index) => {
    const card = document.createElement("div");
    card.className = "forecast-card";
    const meta = WEATHER_CODES[data.daily.weather_code[index]] || WEATHER_CODES[0];
    card.innerHTML = `
      <div class="forecast-day">${new Date(day).toLocaleDateString([], { weekday: "short" })}</div>
      <div class="forecast-icon">${meta.icon}</div>
      <div class="forecast-description">${meta.label}</div>
      <div class="forecast-temps">
        <span class="forecast-high">${Math.round(data.daily.temperature_2m_max[index])}°</span>
        <span class="forecast-low">${Math.round(data.daily.temperature_2m_min[index])}°</span>
      </div>
    `;
    forecastCards.appendChild(card);
  });
}

function renderHourly(data) {
  hourlyStrip.innerHTML = "";
  data.hourly.time.slice(0, 8).forEach((time, index) => {
    const item = document.createElement("div");
    item.className = "hourly-item";
    const meta = WEATHER_CODES[data.hourly.weather_code[index]] || WEATHER_CODES[0];
    item.innerHTML = `
      <div class="hourly-time">${new Date(time).toLocaleTimeString([], { hour: "numeric" })}</div>
      <div class="hourly-icon">${meta.icon}</div>
      <div class="hourly-temp">${Math.round(data.hourly.temperature_2m[index])}°</div>
    `;
    hourlyStrip.appendChild(item);
  });
}

function renderFarmInsights(data) {
  const rainfall = data.daily.precipitation_sum[0] || 0;
  const maxTemp = data.daily.temperature_2m_max[0] || 0;
  const minTemp = data.daily.temperature_2m_min[0] || 0;
  const crop = cropSelect.value;

  frostBanner.textContent = "";
  frostBanner.classList.remove("is-caution");

  if (minTemp < 2) {
    frostBanner.textContent = `Frost risk for ${crop}: protect seedlings tonight.`;
    frostBanner.classList.add("is-caution");
  }

  soilTempEl.textContent = `${Math.round((maxTemp + minTemp) / 2)}°C`;
  soilMoistureEl.textContent = `${Math.round(rainfall * 10)}%`;
  rainfallTotalEl.textContent = `${Math.round(rainfall)} mm`;
  gddTotalEl.textContent = `${Math.round(Math.max(0, maxTemp - 10) + Math.max(0, minTemp - 10))}`;
  gddSubEl.textContent = `${Math.round(Math.max(0, maxTemp - 10))}`;
  sprayWindowEl.textContent = rainfall > 0 ? "Delay spray until surfaces dry." : "Good window for field work.";
  irrigationTipEl.textContent = "Monitor soil moisture and adjust irrigation by crop stage.";
}

searchButton.addEventListener("click", () => {
  fetchWeather(cityInput.value || currentQuery).catch((error) => updateStatus(error.message, true));
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    fetchWeather(cityInput.value || currentQuery).catch((error) => updateStatus(error.message, true));
  }
});

currentLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    updateStatus("Geolocation is not supported by this browser.", true);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const reverseUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`;
      const res = await fetch(reverseUrl);
      const data = await res.json();
      const place = data.results?.[0];
      if (!place) {
        updateStatus("Could not determine your location.", true);
        return;
      }
      currentPlace = { name: place.name, country: place.country, latitude: lat, longitude: lon };
      currentWeatherData = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m&hourly=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum&timezone=auto&forecast_days=6`).then((response) => response.json());
      renderWeather(currentPlace, currentWeatherData);
    },
    () => updateStatus("Location access denied.", true)
  );
});

shareButton.addEventListener("click", async () => {
  if (navigator.share) {
    await navigator.share({ title: "Skylight Farm", text: "Check out this weather outlook!", url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
  }
});

// Initialize map when page loads
function initializeMap() {
  const mapContainer = document.getElementById("mapContainer");
  if (!mapContainer) {
    console.warn("Map container not found");
    return;
  }
  
  // Using Leaflet (already included in HTML)
  if (typeof L !== "undefined" && !map) {
    try {
      map = L.map("mapContainer").setView([20, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      console.log("✓ Map initialized successfully");
    } catch (error) {
      console.error("✗ Map initialization error:", error);
    }
  } else if (typeof L === "undefined") {
    console.warn("⚠ Leaflet library not loaded");
  }
}

function updateMapMarker(lat, lon) {
  if (!map) {
    console.warn("Map not initialized, skipping marker update");
    return;
  }
  try {
    if (marker) {
      map.removeLayer(marker);
    }
    marker = L.marker([lat, lon]).addTo(map);
    map.setView([lat, lon], 10);
  } catch (error) {
    console.error("Map marker error:", error);
  }
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready, initializing app...");
  initializeMap();
  refreshAuthArea();
  fetchWeather(currentQuery).catch((error) => updateStatus(error.message, true));
});
