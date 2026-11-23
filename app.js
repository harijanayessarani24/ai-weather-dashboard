const weatherCodes = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"]
};

let data;
let locationName;
let unit = "celsius";
let currentSearch = "Bengaluru";

const $ = (id) => document.getElementById(id);

const temp = (celsius) => {
  if (unit === "celsius") {
    return Math.round(celsius);
  }

  return Math.round((celsius * 9) / 5 + 32);
};

const symbol = () => (unit === "celsius" ? "C" : "F");

const codeInfo = (code) => {
  return weatherCodes[code] || ["Changing skies", "🌥️"];
};

async function searchCity(query) {
  setStatus(`Finding ${query}…`);

  const geoResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=1&language=en&format=json`
  );

  const geoData = await geoResponse.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error("City not found. Try a more specific search.");
  }

  const place = geoData.results[0];

  currentSearch = place.name;
  locationName = `${place.name}${place.country ? `, ${place.country}` : ""}`;

  await getWeather(place.latitude, place.longitude);
}

async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "5"
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!response.ok) {
    throw new Error("Weather service is unavailable. Please try again.");
  }

  data = await response.json();
  render();
}

function render() {
  const current = data.current;
  const daily = data.daily;
  const [condition, icon] = codeInfo(current.weather_code);

  $("location-name").textContent = locationName;
  $("condition").textContent = condition;
  $("weather-icon").textContent = icon;

  $("today-label").textContent = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());

  $("current-temp").textContent = temp(current.temperature_2m);
  $("feels-like").textContent = `${temp(
    current.apparent_temperature
  )}°${symbol()}`;

  $("humidity").textContent = `${current.relative_humidity_2m}%`;
  $("wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  $("rain-chance").textContent = `${daily.precipitation_probability_max[0]}%`;

  $("high-low").textContent =
    `H: ${temp(daily.temperature_2m_max[0])}° ` +
    `L: ${temp(daily.temperature_2m_min[0])}°`;

  $("unit-toggle").textContent = `°${symbol()}`;

  renderForecast();
  renderInsight();
  renderSavedCities();

  $("weather-content").hidden = false;
  setStatus("");
}

function renderForecast() {
  const list = $("forecast-list");
  list.innerHTML = "";

  data.daily.time.forEach((day, index) => {
    const node = $("forecast-template").content.cloneNode(true);
    const [name, icon] = codeInfo(data.daily.weather_code[index]);

    node.querySelector(".forecast-date").textContent =
      index === 0
        ? "Today"
        : new Intl.DateTimeFormat("en", {
            weekday: "short"
          }).format(new Date(`${day}T12:00:00`));

    node.querySelector(".forecast-icon").textContent = icon;
    node.querySelector(".forecast-condition").textContent = name;
    node.querySelector(".forecast-max").textContent =
      `${temp(data.daily.temperature_2m_max[index])}°`;

    node.querySelector(".forecast-min").textContent =
      `${temp(data.daily.temperature_2m_min[index])}°`;

    list.append(node);
  });
}

function renderInsight() {
  const current = data.current;
  const rainChance = data.daily.precipitation_probability_max[0];
  const maxTemp = data.daily.temperature_2m_max[0];

  let summary;

  if (rainChance >= 60) {
    summary =
      `Rain is likely in ${locationName} today, ` +
      "so build a little extra time into your plans.";
  } else if (maxTemp >= 32) {
    summary =
      `It will feel warm in ${locationName} today. ` +
      "Plan outdoor time for the cooler part of the day.";
  } else {
    summary =
      `Conditions in ${locationName} look comfortable ` +
      "for most plans today.";
  }

  $("ai-summary").textContent = summary;

  const tips = [
    [
      rainChance >= 40 ? "☂️" : "🧴",
      rainChance >= 40
        ? "Take an umbrella—rain probability is elevated."
        : "Sunscreen is a sensible idea if you will be outside."
    ],
    [
      current.wind_speed_10m > 25 ? "🌬️" : "👟",
      current.wind_speed_10m > 25
        ? "Wind is strong; secure loose items if you are travelling."
        : "A good day for a walk or light outdoor activity."
    ],
    [
      "💧",
      current.relative_humidity_2m > 70
        ? "Humidity is high—choose breathable clothing."
        : "Keep water nearby, especially through the afternoon."
    ]
  ];

  $("advice-list").innerHTML = tips
    .map(
      ([icon, text]) =>
        `<div class="advice"><span>${icon}</span><span>${text}</span></div>`
    )
    .join("");
}

function setStatus(message) {
  $("status").textContent = message;
}

function savedCities() {
  return JSON.parse(localStorage.getItem("atmos-saved-cities") || "[]");
}

function renderSavedCities() {
  const list = $("saved-city-list");
  const cities = savedCities();

  list.innerHTML = cities.length
    ? ""
    : '<p class="empty-saved">Save a city to see it here on your next visit.</p>';

  cities.forEach((city) => {
    const chip = document.createElement("div");

    chip.className = "city-chip";
    chip.innerHTML =
      `<span>${city}</span>` +
      `<button class="remove-city" aria-label="Remove ${city}">×</button>`;

    chip.querySelector("span").onclick = () => {
      searchCity(city).catch((error) => setStatus(error.message));
    };

    chip.querySelector("button").onclick = () => {
      const updatedCities = savedCities().filter((item) => item !== city);

      localStorage.setItem(
        "atmos-saved-cities",
        JSON.stringify(updatedCities)
      );

      renderSavedCities();
    };

    list.append(chip);
  });

  $("save-city").textContent = cities.includes(currentSearch)
    ? "✓ City saved"
    : "＋ Save this city";
}

function saveCurrentCity() {
  const cities = savedCities();

  if (!cities.includes(currentSearch)) {
    localStorage.setItem(
      "atmos-saved-cities",
      JSON.stringify([...cities, currentSearch])
    );
  }

  renderSavedCities();
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    setStatus("Your browser does not support location access.");
    return;
  }

  setStatus("Requesting your location…");

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const reverseResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&count=1&language=en&format=json`
        );

        const reverseData = await reverseResponse.json();
        const place = reverseData.results?.[0];

        if (!place) {
          throw new Error("We could not name your location.");
        }

        await searchCity(place.name);
      } catch (error) {
        setStatus(error.message);
      }
    },
    () => {
      setStatus("Location access was not granted. Search for a city instead.");
    }
  );
}

$("search-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await searchCity($("city-input").value.trim());
  } catch (error) {
    setStatus(error.message);
  }
});

$("unit-toggle").addEventListener("click", () => {
  unit = unit === "celsius" ? "fahrenheit" : "celsius";
  render();
});

$("refresh-insight").addEventListener("click", renderInsight);
$("save-city").addEventListener("click", saveCurrentCity);
$("location-button").addEventListener("click", useCurrentLocation);

searchCity("Bengaluru").catch((error) => {
  setStatus(error.message);
});