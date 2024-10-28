const getCurrentWeather = async () => {
  try {
    const response = await fetch("https://api.weather.gov/points/37.10792,-113.58585");
    
    if (!response.ok) {
      throw new Error("Failed to fetch grid points");
    }

    const data = await response.json();
    const url = data.properties.forecastHourly;

    const weatherResponse = await fetch(url);
    if (!weatherResponse.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const weatherData = await weatherResponse.json();
    const forecastPeriods = weatherData.properties.periods;

    const currentTime = new Date();
    const currentDay = currentTime.getDate();
    const temperatures = [];

    let closestPeriod = forecastPeriods[0];
    let smallestTimeDiff = Infinity;

    for (let i = 0; i < forecastPeriods.length; i++) {
      const startTime = new Date(forecastPeriods[i].startTime);

      if (startTime.getDate() === currentDay) {
        const temperature = forecastPeriods[i].temperature;
        const hour = startTime.getHours();
        const formattedHour = hour % 12 || 12; // Convert 24-hour time to 12-hour time

        temperatures.push({ time: `${formattedHour} ${hour < 12 ? 'AM' : 'PM'}`, temperature });

        // Find the closest period to current time
        const timeDiff = Math.abs(currentTime - startTime);
        if (timeDiff < smallestTimeDiff) {
          smallestTimeDiff = timeDiff;
          closestPeriod = forecastPeriods[i];
        }
      }
    }

    const currentTemp = closestPeriod.temperature;
    const windSpeed = closestPeriod.windSpeed;
    const shortForecast = closestPeriod.shortForecast;

    return { currentTemp, windSpeed, shortForecast, temperatures };

  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

const getAlerts = async () => {
  try {
    const response = await fetch("https://api.weather.gov/alerts/active/zone/UTZ123");
    if (!response.ok) {
      throw new Error("Failed to fetch alert");
    }

    const data = await response.json();
    const alert = data.features[0].properties.event;
    return alert;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

const displayWeatherAndAlerts = async () => {
  const weatherData = await getCurrentWeather();
  if (weatherData) {
    document.getElementById("weatherDetails").innerHTML = `
            <p>Hourly Temperature: ${weatherData.currentTemp} °F</p>
            <p>Wind: ${weatherData.windSpeed}</p>
            <p>Forecast: ${weatherData.shortForecast}</p>
        `;
  } else {
    document.getElementById("currentWeather").innerText = "No current weather data available";
  }

  const alerts = await getAlerts();
  if (alerts) {
    document.getElementById("currentAlerts").innerHTML = `
            <p>${alerts}</p>
        `;
  } else {
    document.getElementById("currentAlerts").innerText = "No current alerts";
  }
};

const createTemperatureCharts = async () => {
  const weatherData = await getCurrentWeather();

  if (!weatherData) {
    console.log("No data available to create chart.");
    return;
  }

  const ctx = document.getElementById('temperatureChart').getContext('2d');

  const temps = weatherData.temperatures.map(entry => entry.temperature);
  const labels = weatherData.temperatures.map(entry => entry.time);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Temperature (°F)',
        data: temps,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time of Day'
          },
          ticks: {
            maxRotation: 0,
            autoSkip: false,
            maxTicksLimit: 24
          }
        },
        y: {
          title: {
            display: true,
            text: 'Temperature (°F)'
          },
          suggestedMin: Math.min(...temps) - 5,
          suggestedMax: Math.max(...temps) + 5,
        }
      },
      plugins: {
        legend: {
          display: false 
        }
      },
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      }
    }
  });
}
document.addEventListener('DOMContentLoaded', async () => {
  await displayWeatherAndAlerts();
  await createTemperatureCharts();
});


