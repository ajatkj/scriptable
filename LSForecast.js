/*------------------------------------------------------------------------------------------------------
Script: LSForecast.js
Author: Ankit Jain (<ajatkj@yahoo.co.in>)
Date: 15.02.2021
Version: 1.1
------------------------------------------------------------------------------------------------------*/
// This script generates an overlay image with weather forecast
// The script is meant to be called from a Shortcut. 

// Logging parameters
const TESTING = false;
const LOG_FILE_NAME = "LSForecast.txt";
const LOG_FILE_PATH = "LSForecastLogs";
const LOG_TO_FILE = false; // Only set to true if you want to debug any issue
let LOG_STEP = 1;

// ============================================== CONFIGURABLE SECTION (START) ============================================== //

let ACCENT_COLOR = "#FFFFFF";
let ALPHA = 0.3; // 1 for opaque, 0 for tranparent
let NO_OF_HOURS = 8;
let NO_OF_DAYS = 7;

const WEATHER_UNITS = 'metric';
const WEATHER_LANG = 'en';
const WEATHER_SHOW_HOURLY_ICONS = true;

// API key for openweather. 
let WEATHER_API_KEY = '';
let errMsg;

const DEVICE_RESOLUTION = Device.screenResolution();
const DEVICE_SCALE = Device.screenScale();
const MAX_DEVICE_SCALE = 3;
// Define fonts and sizes
// Experimental - adjusting font size based on device scale
const ULTRA_SMALL_TEXT_SIZE = Math.round(20 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const EXTRA_SMALL_TEXT_SIZE = Math.round(30 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const SMALL_TEXT_SIZE = Math.round(35 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const MEDIUM_TEXT_SIZE = Math.round(40 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const LARGE_TEXT_SIZE = Math.round(60 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const VERY_LARGE_TEXT_SIZE = Math.round(80 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const EXTRA_LARGE_TEXT_SIZE = Math.round(100 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const BIG_TEXT_SIZE = Math.round(120 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const VERY_BIG_TEXT_SIZE = Math.round(130 * DEVICE_SCALE/MAX_DEVICE_SCALE);

const allfonts = {
  ultraSmall: {size: ULTRA_SMALL_TEXT_SIZE, font: Font.regularRoundedSystemFont(ULTRA_SMALL_TEXT_SIZE), boldFont: Font.boldSystemFont(ULTRA_SMALL_TEXT_SIZE), up: "extraSmall", down: "ultraSmall"},
  extraSmall: {size: EXTRA_SMALL_TEXT_SIZE, font: Font.regularRoundedSystemFont(EXTRA_SMALL_TEXT_SIZE), boldFont: Font.boldSystemFont(EXTRA_SMALL_TEXT_SIZE), up: "small", down: "ultraSmall"}, 
  small: {size: SMALL_TEXT_SIZE, font: Font.regularRoundedSystemFont(SMALL_TEXT_SIZE), boldFont: Font.boldSystemFont(SMALL_TEXT_SIZE), up: "medium", down: "extraSmall"},
  medium: {size: MEDIUM_TEXT_SIZE, font: Font.regularRoundedSystemFont(MEDIUM_TEXT_SIZE), boldFont: Font.boldSystemFont(MEDIUM_TEXT_SIZE), up: "large", down: "small"}, 
  large: {size: LARGE_TEXT_SIZE, font: Font.regularRoundedSystemFont(LARGE_TEXT_SIZE), boldFont: Font.boldSystemFont(LARGE_TEXT_SIZE), up: "veryLarge", down: "medium"}, 
  veryLarge: {size: VERY_LARGE_TEXT_SIZE, font: Font.regularRoundedSystemFont(VERY_LARGE_TEXT_SIZE), boldFont: Font.boldSystemFont(VERY_LARGE_TEXT_SIZE), up: "extraLarge", down: "large"},
  extraLarge: {size: EXTRA_LARGE_TEXT_SIZE, font: Font.regularRoundedSystemFont(EXTRA_LARGE_TEXT_SIZE), boldFont: Font.boldSystemFont(EXTRA_LARGE_TEXT_SIZE), up: "big", down: "veryLarge"},
  big: {size: BIG_TEXT_SIZE, font: Font.regularRoundedSystemFont(BIG_TEXT_SIZE), boldFont: Font.boldSystemFont(BIG_TEXT_SIZE), up: "veryBig", down: "extraLarge"},
  veryBig: {size: VERY_BIG_TEXT_SIZE, font: Font.regularRoundedSystemFont(VERY_BIG_TEXT_SIZE), boldFont: Font.boldSystemFont(VERY_BIG_TEXT_SIZE), up: "veryBig", down: "big"},
}

// URLs to fetch weather data and icons and quotes
// DO NOT CHANGE !!
const baseWeatherURL='https://api.openweathermap.org/data/2.5/onecall';

if (!config.runsInApp) {
  let inputParams = args.shortcutParameter;
  if (inputParams.apiKey) WEATHER_API_KEY = inputParams.apiKey;
  if (inputParams.accent) ACCENT_COLOR = inputParams.accent;
  if (inputParams.alpha >= 0 && inputParams.alpha <= 1) ALPHA = inputParams.alpha;
}

try {
  c = new Color(ACCENT_COLOR);
} catch (error) {
  writeLOG("Invalid hexadecimal color code " + ACCENT_COLOR + ", defaulting")
  ACCENT_COLOR = "#FFFFFF";
}

/* Start script */

let weatherData = await fetchWeather();
let overlayImage;
let overlayBase64String;
try {
  overlayImage = createOverlay();
  overlayBase64String = encodeOverlayImage(overlayImage);   // This will mark end of the script if successful
} catch (error) {
  errMsg = "Main_" + error.message.replace(/\s/g,"_");
  writeLOG(errMsg);
  Script.complete();
}
if (config.runsInApp) {
  QuickLook.present(overlayImage);
  Script.complete();
} else return overlayBase64String; // return to Shortcuts

/*------------------------------------------------------------------------------------------------------------------
*                                               FUNCTION DEFINITION
------------------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------
FUNCTION encodeOverlayImage
------------------------------------------------------------------*/
function encodeOverlayImage(overlayImage){
  let overlayBase64String;
  try {
    const rawOverlay = Data.fromPNG(overlayImage);
    if (rawOverlay === null) {
      errMsg = "Error_convert_Image_to_Data";
      writeLOG(errMsg);
      return;
    }
    overlayBase64String = rawOverlay.toBase64String();
    if (overlayBase64String === null) {
      errMsg = "Error_convert_Data_to_Base64String";
      writeLOG(errMsg);
      return;
    }
  } catch(error) {
    errMsg = "encodeOverlayImage_" + error.message.replace(/\s/g,"_");
    writeLOG(errMsg);
    return;
  }
  writeLOG("Encoded Overlay to base64 string successfully");
  return overlayBase64String;
}
/*------------------------------------------------------------------
FUNCTION fetchWeather
------------------------------------------------------------------*/
async function fetchWeather(){
  if (TESTING) return null;
  let weather;

  Location.setAccuracyToThreeKilometers();
  locationData = await Location.current();
  const latitude = locationData.latitude;
  const longitude = locationData.longitude;
  const address = await Location.reverseGeocode(locationData.latitude, locationData.longitude);
  const weatherURL = baseWeatherURL + '?lat=' + latitude + '&lon=' + longitude + '&exclude=minutely,alerts&units=' + WEATHER_UNITS + '&lang=' + WEATHER_LANG + '&appid=' + WEATHER_API_KEY;
  
  try {
    writeLOG(`Fetching url: ${weatherURL}`);
    const request = new Request(weatherURL);
    weather = await request.loadJSON();
  } catch (error) {
      writeLOG(`Couldn't fetch ${weatherURL}`);
      return null;
  }
  try {
    if (weather.cod == 401) {
      writeLOG('Invalid API Key');
      return null;
    }
  } catch(error) {
  }
  weather["location"] = address[0].locality;
  return weather;
}
/*------------------------------------------------------------------
FUNCTION createOverlay
------------------------------------------------------------------*/
function createOverlay() {
  // Create dummy data 
  if (weatherData === null) {
    NO_OF_HOURS = 8;
    NO_OF_DAYS = 7;
    weatherData = {
      "current":{"sunrise":1612717445,"sunset":1612703045,"temp":"?","weather":[{"id":999,"main":"Check script"}]},
      "location": "Unknown"
    }
    weatherData.current.dt = Math.round(new Date().getTime() / 1000);
    let t0 = Math.round(new Date().getTime() / 1000);
    weatherData.hourly = [];
    for (let i = 0; i < NO_OF_HOURS; i++) {
      weatherData.hourly[i] = {};
      weatherData.hourly[i].dt = t0;
      weatherData.hourly[i].temp = 0;
      weatherData.hourly[i].weather = [];
      weatherData.hourly[i].weather[0] = {};
      weatherData.hourly[i].weather[0].id = 999;
    }
    t0 = Math.round(new Date().getTime() / 1000);
    t1 = 0;
    weatherData.daily = [];
    for (let i = 0; i < NO_OF_DAYS; i++) {
      weatherData.daily[i] = {};
      weatherData.daily[i].dt = t0;
      weatherData.daily[i].temp = {};
      weatherData.daily[i].temp.day = 0;
      weatherData.daily[i].weather = [];
      weatherData.daily[i].weather[0] = {};
      weatherData.daily[i].weather[0].id = 999;
      t0 = t0 + 86400;
    }
  }
  if (NO_OF_HOURS < 3 || NO_OF_HOURS > 12) hours = 7;
  else hours = NO_OF_HOURS - 1;
  if (NO_OF_DAYS < 3 || NO_OF_DAYS > 7) days = 7;
  else days = 7;
  const blockWidth = 80;
  const blockHeight = 50;
  const lineWidth = 5;
  const pathColor = "#FFFFFF";
  const pathAlpha = ALPHA;
  const pathFillColor = ACCENT_COLOR;
  const textColor = "#FFFFFF";
  const textColor1 = "#BDC0C3";
  const pathHeight = 100;
  let yStepNumbers = 10;
  let xStart = 50;
  let yCenter = DEVICE_RESOLUTION.height/2;
  let yStart = yCenter - 250;
  let imgCanvas=new DrawContext();
  imgCanvas.opaque = false;
  imgCanvas.size = DEVICE_RESOLUTION;

  /* ------------------------------------------------------------------------------------------
  PART 1: Top section with Location + Weather + Description details
  ------------------------------------------------------------------------------------------ */
  // Current weather symbol
  imgCanvas.setFont(allfonts.large.font);
  imgCanvas.setTextAlignedLeft();
  imgCanvas.setTextColor(new Color(textColor));
  weatherSymbol = SFSymbol.named(getWeatherSymbol(weatherData.current.weather[0].id));
  weatherSymbol.applyFont(allfonts.big.font);
  image = weatherSymbol.image;
  r = new Rect (xStart, yStart, image.size.width,image.size.height);
  imgCanvas.drawImageInRect(image,r);

  r = new Rect (xStart + image.size.width + 25, yStart + 20, DEVICE_RESOLUTION.width - 400,100);
  imgCanvas.drawTextInRect(weatherData.location,r);
      
  imgCanvas.setFont(allfonts.medium.font);
  imgCanvas.setTextColor(new Color(textColor1));
  r = new Rect (xStart + image.size.width + 25, yStart + 100, DEVICE_RESOLUTION.width,100);
  imgCanvas.drawTextInRect(weatherData.current.weather[0].main,r);

  // Current temperature
  imgCanvas.setFont(allfonts.extraLarge.font);
  imgCanvas.setTextAlignedRight();
  imgCanvas.setTextColor(new Color(textColor));
  r = new Rect (DEVICE_RESOLUTION.width - 350, yStart + 25, 300 ,200);
  imgCanvas.drawTextInRect(Math.round(weatherData.current.temp).toString() + "°",r);

  yStart = yStart + image.size.height + 50;

  // Heading
  imgCanvas.setFont(allfonts.large.font);
  imgCanvas.setTextAlignedLeft();
  imgCanvas.setTextColor(new Color(textColor));
  r = new Rect (xStart, yStart, DEVICE_RESOLUTION.width ,100);
  imgCanvas.drawTextInRect(`Next ${hours + 1} Hours`,r);

  // Updated Date & Time
  imgCanvas.setFont(allfonts.small.font);
  imgCanvas.setTextAlignedRight();
  imgCanvas.setTextColor(new Color(textColor1));
  r = new Rect (xStart, yStart + 25, DEVICE_RESOLUTION.width - 100 ,100);
  imgCanvas.drawTextInRect(`Updated at ${getCurrentTime()}`,r);

  yStart = yStart + 150;

  /* ------------------------------------------------------------------------------------------
  PART 2: Middle graph section
  ------------------------------------------------------------------------------------------ */

  // Find minimum and maximum temperature to decide graph size
  let minTemp = 999;
  let maxTemp = -999;
  let i = 0;
  for (const w of weatherData.hourly){
    if (i <= hours) {
      if (minTemp > w.temp) minTemp = w.temp;
      if (maxTemp < w.temp) maxTemp = w.temp;
    }
    i++;
  }
  if (maxTemp == minTemp) {
    minTemp = 0;
    maxTemp = 1;
  }
  imgCanvas.setTextColor(new Color(textColor));
  imgCanvas.setTextAlignedCenter();
  imgCanvas.setFont(allfonts.extraSmall.font);
  let yDelta = Math.ceil((DEVICE_RESOLUTION.height/yStepNumbers)/(maxTemp - minTemp)); // Y Step size 
  let xDelta = Math.ceil((DEVICE_RESOLUTION.width - (xStart * 2))/hours); // X Step size
  let yBottom = yStart + ((maxTemp - minTemp) * yDelta) + pathHeight; // y co-ordinate for time line
  let allPoints = [];
  let linePoints = [];
  let closedCurvePath = new Path();  // Create filled path
  let curvePath = new Path(); // Create border path
  let linePath = new Path(); // Create bottom line
  closedCurvePath.move(new Point(xStart, yBottom));
  for (i = 0; i <= hours; i++){
    t = weatherData.hourly[i].temp;
    y = Math.round((maxTemp - t) * yDelta);
    // Create points array for curvePath
    allPoints.push(new Point(xStart,yStart + y));
    closedCurvePath.addLine(new Point(xStart,yStart + y));
    // Create path for bottom line
    linePoints.push(new Point(xStart,yBottom));
    // Print temperature and/or weather symbol
    if (WEATHER_SHOW_HOURLY_ICONS) {
      weatherSymbol = SFSymbol.named(getWeatherSymbol(weatherData.hourly[i].weather[0].id));
      weatherSymbol.applyFont(allfonts.small.font);
      image = weatherSymbol.image;
      r = new Rect (xStart - (blockWidth/2), yStart + y - blockHeight, image.size.width,image.size.height);
      imgCanvas.drawImageInRect(image,r);
      r = new Rect(xStart - (blockWidth/2), yStart + y + 5, blockWidth, blockHeight)
      imgCanvas.drawTextInRect(Math.round(t).toString() + "°",r);
    } else {
      r = new Rect(xStart - (blockWidth/2), yStart + y - blockHeight, blockWidth, blockHeight)
      imgCanvas.drawTextInRect(Math.round(t).toString() + "°",r);
    }
    // Print time
    if (i == 0) time = "now";
    else time = convertFromUTC(weatherData.hourly[i].dt, 1)
    r = new Rect(xStart - (blockWidth/2), yBottom + 20, blockWidth,blockHeight)
    imgCanvas.drawTextInRect(time,r);
    // Print sunset/sunrise
    sunriseSunset = null;
    sunriseSunsetTime = 0;
    if (i > 0) {
      if (weatherData.hourly[i - 1].dt <= weatherData.current.sunset && weatherData.hourly[i].dt >= weatherData.current.sunset) {
        sunriseSunset = "sunset.fill";
        sunriseSunsetTime = weatherData.current.sunset;
      } else if (weatherData.hourly[i - 1].dt <= weatherData.current.sunrise && weatherData.hourly[i].dt >= weatherData.current.sunrise) {
        sunriseSunset = "sunrise.fill";
        sunriseSunsetTime = weatherData.current.sunrise;
      }
    }
    if (sunriseSunset !== null) {
      // Sunrise/sunset symbol
      weatherSymbol = SFSymbol.named(sunriseSunset);
      weatherSymbol.applyFont(allfonts.medium.font);
      image = weatherSymbol.image;
      r = new Rect(xStart - (xDelta/2) - (image.size.width/2), yBottom + 20, image.size.width,image.size.height);
      imgCanvas.drawImageInRect(image,r);
      // Sunrise/sunset time
      time = convertFromUTC(sunriseSunsetTime,2)
      r = new Rect(xStart - (blockWidth/2) - (xDelta/2), yBottom - 40, blockWidth,blockHeight)
      imgCanvas.drawTextInRect(time,r);
    }
    // Print point
    curvePath.addEllipse(new Rect(xStart,yStart + y - (lineWidth/2),5,5));
    xStart = xStart + xDelta;
  }
  xStart = xStart - xDelta;
  closedCurvePath.addLine(new Point(xStart,yBottom));
  closedCurvePath.closeSubpath();

  curvePath.addLines(allPoints);
  linePath.addLines(linePoints);

  imgCanvas.addPath(curvePath);
  imgCanvas.setStrokeColor(new Color(pathColor));
  imgCanvas.setLineWidth(lineWidth);
  imgCanvas.strokePath();

  imgCanvas.addPath(linePath);
  imgCanvas.setStrokeColor(new Color(pathColor));
  imgCanvas.setLineWidth(lineWidth);
  imgCanvas.strokePath();

  imgCanvas.addPath(closedCurvePath);
  imgCanvas.setFillColor(new Color(pathFillColor, pathAlpha));
  imgCanvas.fillPath();
  imgCanvas.setStrokeColor(Color.red());
  imgCanvas.setLineWidth(lineWidth);
  imgCanvas.strokePath();

  /* ------------------------------------------------------------------------------------------
  PART 3: Daily weather forecast
  ------------------------------------------------------------------------------------------ */
  // Daily Weather for 7 days
  // day of the week 
  // symbol
  // temperature
  imgCanvas.setTextColor(new Color(textColor));
  imgCanvas.setTextAlignedCenter();
  xStart = 50; // start from beginning
  yStart = yBottom + blockHeight + 50;
  xDelta = Math.ceil((DEVICE_RESOLUTION.width - xStart)/days);

  // Heading
  imgCanvas.setFont(allfonts.large.font);
  imgCanvas.setTextAlignedLeft();
  imgCanvas.setTextColor(new Color(textColor));
  r = new Rect (xStart, yStart, DEVICE_RESOLUTION.width ,100);
  imgCanvas.drawTextInRect(`This Week`,r);

  yStart = yStart + 100;

  let ht = 0;
  for (i = 0; i < days; i++) { 
    // Day
    d = getDay(weatherData.daily[i].dt);
    r = new Rect (xStart, yStart, 80,60);
    imgCanvas.setFont(allfonts.medium.font);
    imgCanvas.setTextAlignedLeft();
    imgCanvas.drawTextInRect(d,r);

    // Daily weather symbol
    weatherSymbol = SFSymbol.named(getWeatherSymbol(weatherData.daily[i].weather[0].id));
    weatherSymbol.applyFont(allfonts.large.font);
    image = weatherSymbol.image;
    r = new Rect (xStart, yStart + 80, image.size.width,image.size.height);
    imgCanvas.drawImageInRect(image,r);

    // Daily temperature
    if (ht == 0) ht = image.size.height; 
    t = Math.round(weatherData.daily[i].temp.day).toString();
    r = new Rect (xStart, yStart + ht + 100, 75,50);
    imgCanvas.setFont(allfonts.medium.font);
    imgCanvas.setTextAlignedCenter();
    imgCanvas.drawTextInRect(t + "°",r);

    xStart = xStart + xDelta;
  }
  newImage=imgCanvas.getImage();
  writeLOG("Overlay created successfully");
  return newImage;
}

/*------------------------------------------------------------------
FUNCTION getWeatherSymbol
------------------------------------------------------------------*/
function getWeatherSymbol(weatherID, isNight){
  // Check all weather IDs at https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
  if (weatherID >= 200 && weatherID <= 211){
    if (isNight) return "cloud.moon.bolt";
    else return "cloud.sun.bolt.fill";
  } else if (weatherID > 211 && weatherID <= 232){
    if (isNight) return "cloud.bolt.rain";
    else return "cloud.bolt.rain.fill";
  } else if (weatherID >= 300 && weatherID <= 311) {
    if (isNight) return "cloud.drizzle";
    else return "cloud.drizzle.fill";
  } else if (weatherID > 311 && weatherID <= 321) {
    if (isNight) return "cloud.rain";
    else return "cloud.rain.fill";    
  } else if (weatherID >= 500 && weatherID <= 510) {
    if (isNight) return "cloud.moon.rain";
    else return "cloud.sun.rain.fill";    
  } else if (weatherID == 511) {
    if (isNight) return "cloud.hail";
    else return "cloud.hail.fill";    
  } else if (weatherID > 511 && weatherID <= 531) {
    if (isNight) return "cloud.heavyrain";
    else return "cloud.heavyrain.fill";
  } else if (weatherID >= 600 && weatherID <= 602) {
    if (isNight) return "snow";
    else return "snow";
  } else if (weatherID > 602 && weatherID <= 613) {
    if (isNight) return "cloud.sleet";
    else return "cloud.sleet.fill";
  } else if (weatherID > 613 && weatherID <= 622) {
    if (isNight) return "cloud.snow";
    else return "cloud.snow.fill";
  } else if (weatherID >= 701 && weatherID <= 731) {
    if (isNight) return "sun.haze";
    else return "sun.haze.fill";
  } else if (weatherID == 741) {
    if (isNight) return "sun.fog";
    else return "sun.fog.fill";
  } else if (weatherID > 741 && weatherID <= 771) {
    if (isNight) return "sun.dust";
    else return "sun.dust.fill";
  } else if (weatherID == 781) {
    if (isNight) return "tornado";
    else return "tornado";
  } else if (weatherID == 800) {
    if (isNight) return "moon.stars";
    else return "sun.max.fill";
  } else if (weatherID >= 801 && weatherID <= 899) {
    if (isNight) return "cloud.moon";
    else return "cloud.sun.fill";
  } else return "sun.max.fill"
}
/*------------------------------------------------------------------
FUNCTION writeLOG
------------------------------------------------------------------*/
async function writeLOG(logMsg){
  if (!config.runsInApp && LOG_TO_FILE) {
    const fm = FileManager.iCloud();
    let logPath = fm.joinPath(fm.documentsDirectory(), LOG_FILE_PATH);
    if (!fm.fileExists(logPath)) fm.createDirectory(logPath);
    const logFile = fm.joinPath(logPath, 'Step_' + LOG_STEP + '_' + LOG_FILE_NAME);
    fm.writeString(logFile, logMsg);
  } else console.log ("Step_" + LOG_STEP + ": " + logMsg);
  LOG_STEP++;
}
/*------------------------------------------------------------------
FUNCTION convertFromUTC
------------------------------------------------------------------*/
function convertFromUTC(unixTimestamp, format){
  var date = new Date(unixTimestamp * 1000);
  var hours = "0" + date.getHours();
  var minutes = "0" + date.getMinutes();
  if (format == 1) {
  var formattedTime = hours.substr(-2) //+ ':' + minutes.substr(-2)
  } else if (format == 2) {
    var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2)
  }
  return formattedTime;
}

function getCurrentTime(){
  const date = new Date();
  const d = "0" + date.getDate();
  const m = "0" + (date.getMonth() + 1);
  const y = date.getFullYear().toString();
  const H = "0" + date.getHours();
  const M = "0" + date.getMinutes();
  return H.substr(-2) + ":" + M.substr(-2);

}
function getDay(unixTimestamp){
  var date = new Date(unixTimestamp * 1000);
  let day = date.getDay();
  if (day == 0) return "Sun";
  if (day == 1) return "Mon";
  if (day == 2) return "Tue";
  if (day == 3) return "Wed";
  if (day == 4) return "Thu";
  if (day == 5) return "Fri";
  if (day == 6) return "Sat";
}