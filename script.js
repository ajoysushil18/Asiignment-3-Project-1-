const API_KEY = '364MRZMQQS3HAAPZEBCYSJE96';

const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const refreshBtn = document.getElementById('refresh-btn');

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error-message');
const weatherContent = document.getElementById('weather-content');

const cityNameEl = document.getElementById('city-name');
const updateTimeEl = document.getElementById('update-time');
const tempEl = document.getElementById('temperature');
const conditionEl = document.getElementById('weather-condition');
const windSpeedEl = document.getElementById('wind-speed');
const rainChanceEl = document.getElementById('rain-chance');
const feelsLikeEl = document.getElementById('feels-like');
const weatherIconEl = document.getElementById('weather-icon');
const hourlySliderEl = document.getElementById('hourly-slider');

let currentQuery = '';
let globalDaysData = [];
let activeTab = 'next'; 

// Enable/Disable "Get Weather" button based on input text
locationInput.addEventListener('input', () => {
    if (locationInput.value.trim().length > 0) {
        searchBtn.removeAttribute('disabled');
    } else {
        searchBtn.setAttribute('disabled', 'true');
    }
});

searchBtn.addEventListener('click', () => {
    const query = locationInput.value.trim();
    if (query) fetchWeatherData(query);
});

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && locationInput.value.trim().length > 0) {
        fetchWeatherData(locationInput.value.trim());
    }
});

// "Use My Location" Button Click Event
locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }

    showLoading();
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const coords = `${position.coords.latitude},${position.coords.longitude}`;
            fetchWeatherData(coords);
        },
        () => {
            showError('Unable to retrieve your location. Please check browser permissions.');
        }
    );
});

window.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = `${position.coords.latitude},${position.coords.longitude}`;
                fetchWeatherData(coords);
            },
            () => {
                fetchWeatherData('Dhaka'); 
            }
        );
    } else {
        fetchWeatherData('Dhaka');
    }
});

async function fetchWeatherData(location) {
    showLoading();
    currentQuery = location;

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${API_KEY}&contentType=json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Location not found or API limit reached.');
        }

        const data = await response.json();
        renderWeather(data);
    } catch (err) {
        showError(err.message);
    }
}

function renderWeather(data) {
    hideLoading();

    const current = data.currentConditions;
    globalDaysData = data.days;

    cityNameEl.textContent = data.resolvedAddress;
    updateTimeEl.textContent = `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    tempEl.textContent = Math.round(current.temp);
    conditionEl.textContent = current.conditions;
    windSpeedEl.textContent = `${current.windspeed} km/h`;
    rainChanceEl.textContent = `${current.precipprob ?? 0}%`;
    feelsLikeEl.textContent = `${Math.round(current.feelslike)}°C`;
    weatherIconEl.textContent = getWeatherIcon(current.conditions);

    updateHourlyDisplay();
    weatherContent.classList.remove('hidden');
}

prevBtn.addEventListener('click', () => {
    activeTab = 'prev';
    prevBtn.classList.add('active');
    nextBtn.classList.remove('active');
    updateHourlyDisplay();
});

nextBtn.addEventListener('click', () => {
    activeTab = 'next';
    nextBtn.classList.add('active');
    prevBtn.classList.remove('active');
    updateHourlyDisplay();
});

function updateHourlyDisplay() {
    hourlySliderEl.innerHTML = '';
    if (!globalDaysData || globalDaysData.length === 0) return;

    let allHours = [];
    globalDaysData.forEach(day => {
        if (day.hours) {
            allHours = allHours.concat(day.hours);
        }
    });

    const currentHourIndex = new Date().getHours();
    const todayStartIndex = globalDaysData[0]?.hours ? currentHourIndex : 0;

    if (activeTab === 'prev') {
        const prevStart = Math.max(0, todayStartIndex - 24);
        const previousHours = allHours.slice(prevStart, todayStartIndex);
        previousHours.forEach(hour => appendHourlyCard(hourlySliderEl, hour));
    } else {
        const nextHours = allHours.slice(todayStartIndex, todayStartIndex + 24);
        nextHours.forEach(hour => appendHourlyCard(hourlySliderEl, hour));
    }
}

function appendHourlyCard(container, hourData) {
    const card = document.createElement('div');
    card.className = 'hourly-item';

    const timeParts = hourData.datetime.split(':');
    const hourNum = parseInt(timeParts[0], 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = `${hourNum % 12 || 12} ${ampm}`;

    card.innerHTML = `
        <div class="time">${formattedHour}</div>
        <div style="font-size:16px; margin: 4px 0;">${getWeatherIcon(hourData.conditions)}</div>
        <div class="temp">${Math.round(hourData.temp)}°C</div>
    `;
    container.appendChild(card);
}

function getWeatherIcon(condition) {
    if (!condition) return '⛅';
    const cond = condition.toLowerCase();
    if (cond.includes('clear') || cond.includes('sunny')) return '☀️';
    if (cond.includes('rain') || cond.includes('shower')) return '🌧️';
    if (cond.includes('cloud')) return '☁️';
    if (cond.includes('snow')) return '❄️';
    return '⛅';
}

refreshBtn.addEventListener('click', () => {
    if (currentQuery) fetchWeatherData(currentQuery);
});

function showLoading() {
    loadingDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    weatherContent.classList.add('hidden');
}

function hideLoading() {
    loadingDiv.classList.add('hidden');
}

function showError(message) {
    hideLoading();
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    weatherContent.classList.add('hidden');
}