# Atmos — AI Weather Dashboard

A responsive weather dashboard that combines current conditions, a five-day forecast, and contextual activity advice.

## Live Demo

[Open the live dashboard](https://harijanayessarani24.github.io/ai-weather-dashboard/)

## What it demonstrates

- Real-time city search using Open-Meteo's geocoding and forecast APIs
- Responsive, accessible interface built with vanilla HTML, CSS, and JavaScript
- Unit conversion without another network request
- A transparent rules-based insight layer that can later be replaced by an LLM API
- Favourite cities retained in the browser using local storage
- Optional current-location weather lookup (with browser permission)

## Run it locally

Open `index.html` in a browser, or use the **Live Server** extension in VS Code.

## Planned improvements

1. Add hourly forecast and weather charts.
2. Build a FastAPI backend and add an LLM-powered weather assistant.
3. Add automated tests, deployment, and screenshots.

## APIs

Weather data is provided by [Open-Meteo](https://open-meteo.com/). No API key is required for this starter version.
