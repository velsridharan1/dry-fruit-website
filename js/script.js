document.getElementById('myButton').addEventListener('click', function() {
    window.location.href = 'madhyapradesh.html';
    // You can also use window.location.replace('/madhyapradesh.html'); to replace the current page in history
    window.location.assign('madhyapradesh.html'); // This is another way to navigate
})
const flashText = document.getElementById('flash-text');
            flashText.style.opacity = 0;
            flashText.style.transition = 'opacity 0.5s';

    let visible = false;
    setInterval(() => {
        visible = !visible;
        flashText.style.opacity = visible ? 1 : 0;
    }, 1200); 

    fetch('https://api.open-meteo.com/v1/forecast?latitude=23.2599&longitude=77.4126&current_weather=true')
        .then(response => response.json())
        .then(data => {
            const weatherDiv = document.getElementById('weather-info');
            if (data.current_weather) {
                const temp = data.current_weather.temperature;
                const wind = data.current_weather.windspeed;
                weatherDiv.textContent = `Temperature: ${temp}°C, Wind Speed: ${wind} km/h`;
            } else {
                weatherDiv.textContent = 'Weather data not available.';
            }
        })
        .catch(error => {
            const weatherDiv = document.getElementById('weather-info');
            weatherDiv.textContent = 'Failed to load weather data.';
            console.error(error);
        });
