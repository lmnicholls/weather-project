$(document).ready(async function() {
  var options = {
    url: "citylist.json",
  
    getValue: function(element) {
      return element.name;
    },
  
    list: {
      match: {
        enabled: true
      }
    }
  };
  
  $("#search-query").easyAutocomplete(options);

  var API_key = '345e1c9864ad7ebda8d87ea4d60c53f1';
  var currentCityWeatherData = [];
  var fiveDayCityWeatherData = [];

  $('.search').on('click', function() {
    $('.processing').css('display', 'block');
    var $currentCity = $('#search-query').val();
    
    currentCityWeatherData = [];
    fiveDayCityWeatherData = [];

    $('#search-query').val('');
    $('.set-default').css('display', 'block');

    fetchDailyWeather($currentCity);
    fetchFiveDayForecast($currentCity);
  });

  $('.find-me').on('click', function() {
    $('.processing').css('display', 'block');

    currentCityWeatherData = [];
    fiveDayCityWeatherData = [];
    
    $('.set-default').css('display', 'block');

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var latitude = position.coords.latitude;
          var longitude = position.coords.longitude;

          fetchByLocation(latitude, longitude);
          fetchFiveDayForecastByLocation(latitude, longitude);
        });
    } else {
        alert("Sorry, your location was not found.");
    }
  });

  $('#search-query').keypress(function(event) {
    if (event.keyCode === 13) {
        $('.search').click();
    }
  });

  $('.set-default').on('click', function () {
      var defaultCity = currentCityWeatherData[0].city;
      localStorage.setItem('cityName', defaultCity);
      alert(defaultCity + ' is now your default city.');
  }); 

  window.onload = function() {
    var defaultCity = localStorage.getItem('cityName');
    if (defaultCity !== null) {
      $('#search-query').val(defaultCity); 
      $('.search').click();
      $('.set-default').css('display', 'none');
    }
  }

  $(document).ajaxComplete(function () {
    $('.processing').css('display', 'none');
  });

  var addCurrentCityWeatherData = function (data) {
    var currentWeatherImageCode = data.weather[0].icon;
    var imageSrc = 'http://openweathermap.org/img/wn/' + currentWeatherImageCode +'@2x.png';
    $('#current-weather-icon').attr('src', imageSrc);
    var weather_condition = data.weather[0].main;

    var city = data.name;
    var mapSrc = 'https://www.google.com/maps/embed/v1/place?key=AIzaSyCDyFxxpN5RtNUPm8u2aCKZ8XMqc9mfxdE&q=' + city;
    $('#map').attr('src', mapSrc);
    $('.map').css('display', 'block');

    currentCityWeatherData.push({
      temperature: data.main.temp,
      city: data.name,
      weather_conditions: data.weather[0].main,
    });

    tempToFahrenheit();
    renderCurrentWeatherCityData();
    generateBackgroundImage(weather_condition);
  }

  var addFiveDayCityWeatherData = function (data) {
    var forecastData = data.list;
    var forecastDataArray = [];
    forecastData.map(e => {
      var temp = e.main.temp_max;
      var conditions = e.weather[0].main;
      var weatherIcon = e.weather[0].icon;
      var date = new Date(e.dt_txt);
      forecastDataArray.push({ temp: temp, conditions: conditions, weatherIcon: weatherIcon, date: date});
    });

    convertToDayOfWeek(forecastDataArray);
    compressWeeklyWeatherData(forecastDataArray);
  }

  var fetchDailyWeather = function (currentCity) {
    $.ajax({
      method: 'GET',
      url: 'https://api.openweathermap.org/data/2.5/weather?q=' + currentCity + '&appid=345e1c9864ad7ebda8d87ea4d60c53f1',
      dataType: 'json',
      success: function (data) {
        addCurrentCityWeatherData(data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        alert(textStatus + ': City not found.');
      }
    })
  }

  var fetchByLocation = function (latitude, longitude) {
    $.ajax({
      method: 'GET',
      url: 'https://api.openweathermap.org/data/2.5/weather?lat=' + latitude + '&lon=' + longitude + '&appid=' + API_key,
      dataType: 'json',
      success: function (data) {
        addCurrentCityWeatherData(data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        alert(textStatus + ': City not found.');
      }
    })
  }

  var fetchFiveDayForecast = function (currentCity) {
    $.ajax({
      method: 'GET',
      url: 'https://api.openweathermap.org/data/2.5/forecast?q=' + currentCity + '&appid=' + API_key,
      dataType: 'json',
      success: function (data) {
        addFiveDayCityWeatherData(data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(errorThrown);
      }
    })
  }

  var fetchFiveDayForecastByLocation = function (latitude, longitude) {
    $.ajax({
      method: 'GET',
      url: 'https://api.openweathermap.org/data/2.5/forecast?lat=' + latitude + '&lon=' + longitude + '&appid=' + API_key,
      dataType: 'json',
      success: function (data) {
        addFiveDayCityWeatherData(data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(errorThrown);
      }
    })
  }
  
  var tempToFahrenheit = function () {
    var tempKelvin = currentCityWeatherData[0].temperature;
    var tempFahrenheit = Math.floor(1.8 * (tempKelvin - 273) + 32);

    currentCityWeatherData[0].temperature = tempFahrenheit.toString() + '°';
  }

  var convertToDayOfWeek = function (forecastDataArray) {
    var daysOfTheWeek = [ { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' } ];

    forecastDataArray.forEach(e => {
      var dayCode = e.date.getDay();
      return e.date = daysOfTheWeek[0][dayCode];
    })
  }

  var compressWeeklyWeatherData = function (forecastDataArray) {
    var weeklyData = _.values(_.groupBy(forecastDataArray, 'date'));

    fiveDayCityWeatherData = [];

    weeklyData.forEach(day => {
      var weekday = day[0].date;
      var highestTemp = 0;
      var dailyConditions = [];
      var dailyIcons = [];

      for (let i = 0; i < day.length; i++) {
        if (day[i].temp > highestTemp) {
          highestTemp = day[i].temp;
        }

      dailyConditions.push(day[i].conditions);  
      dailyIcons.push(day[i].weatherIcon);
      }

      var temp = Math.floor(1.8 * (highestTemp - 273) + 32);
      temp = temp.toString() + '°';

      var mostCommonDailyCondition = _.head(_(dailyConditions)
        .countBy()
        .entries()
        .maxBy(_.last));

      var mostCommonWeatherIcon = _.head(_(dailyIcons)
        .countBy()
        .entries()
        .maxBy(_.last));

      var weatherIconSrc = 'http://openweathermap.org/img/wn/' + mostCommonWeatherIcon +'@2x.png';

      fiveDayCityWeatherData.push({ day_of_the_week: weekday, temperature: temp, icon: weatherIconSrc, weather_conditions: mostCommonDailyCondition});
    })

    if (fiveDayCityWeatherData.length > 5) {
      fiveDayCityWeatherData.pop();
    };

    renderWeekyWeatherData(fiveDayCityWeatherData);
  }

  var renderCurrentWeatherCityData = function () {
    $('.current-city-data').empty();

    var source = $('#current-city-weather-template').html();
    var template = Handlebars.compile(source);
    var newHTML = template(currentCityWeatherData[0]);

    $('.current-city-data').append(newHTML);
  }

  var renderWeekyWeatherData = function (fiveDayCityWeatherData) {
    $('.weekly-weather').empty();

    fiveDayCityWeatherData.forEach(day => {
      var source = $('#five-day-forecast-template').html();
      var template = Handlebars.compile(source);
      var newHTML = template(day);
    
      $('.weekly-weather').append(newHTML);
    })
  }

  generateBackgroundImage = function (weather_condition) {
    var weather_conditions = [{Thunderstorm: 'thunderstorm.jpg', Rain: 'rain.jpg', Drizzle: 'drizzle.jpg', Snow: 'snow.jpg', Mist: 'mist.jpg', Smoke: 'smoke.jpg', Haze: 'haze.jpg', Dust: 'dust.jpg', Fog: 'fog.jpg', Sand: 'sand.jpg', Ash: 'ash.jpg', Squall: 'squall.jpg', Tornado: 'tornado.jpg', Clear: 'clear.jpg', Clouds: 'clouds.jpg'}];
    
    var weatherImage = weather_conditions[0][weather_condition];

    if (weatherImage) {
      $('.background').css('background', 'url(images/' + weatherImage + ') no-repeat center center fixed');
    }
  }
});