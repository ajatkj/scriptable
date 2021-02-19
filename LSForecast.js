/*------------------------------------------------------------------------------------------------------
Script: LSForecast.js
Author: Ankit Jain (<ajatkj@yahoo.co.in>)
Date: 19.02.2021
Version: 1.2
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
let PREFERRED_LANG = "system"

let WEATHER_UNITS = "metric";

let WEATHER_SHOW_HOURLY_ICONS = true;
let WEATHER_SHOW_POP_GRAPH = true;
let WEATHER_SHOW_POP_VALUES = true;
let WEATHER_SHOW_ZERO_POP_VALUES = true;

// API key for openweather. 
let WEATHER_API_KEY = '';
let errMsg;

const DEVICE_RESOLUTION = Device.screenResolution();
const DEVICE_SCALE = Device.screenScale();
const MAX_DEVICE_SCALE = 3;
// Define fonts and sizes
// Experimental - adjusting font size based on device scale
const ULTRA_SMALL_TEXT_SIZE = Math.round(15 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const EXTRA_SMALL_TEXT_SIZE = Math.round(30 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const SMALL_TEXT_SIZE = Math.round(35 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const MEDIUM_TEXT_SIZE = Math.round(40 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const LARGE_TEXT_SIZE = Math.round(60 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const VERY_LARGE_TEXT_SIZE = Math.round(80 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const EXTRA_LARGE_TEXT_SIZE = Math.round(100 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const BIG_TEXT_SIZE = Math.round(120 * DEVICE_SCALE/MAX_DEVICE_SCALE);
const VERY_BIG_TEXT_SIZE = Math.round(130 * DEVICE_SCALE/MAX_DEVICE_SCALE);

const allfonts = {
  ultraSmall: {size: ULTRA_SMALL_TEXT_SIZE, font: Font.regularRoundedSystemFont(ULTRA_SMALL_TEXT_SIZE), boldFont: Font.boldSystemFont(ULTRA_SMALL_TEXT_SIZE)},
  extraSmall: {size: EXTRA_SMALL_TEXT_SIZE, font: Font.regularRoundedSystemFont(EXTRA_SMALL_TEXT_SIZE), boldFont: Font.boldSystemFont(EXTRA_SMALL_TEXT_SIZE)}, 
  small: {size: SMALL_TEXT_SIZE, font: Font.regularRoundedSystemFont(SMALL_TEXT_SIZE), boldFont: Font.boldSystemFont(SMALL_TEXT_SIZE)},
  medium: {size: MEDIUM_TEXT_SIZE, font: Font.regularRoundedSystemFont(MEDIUM_TEXT_SIZE), boldFont: Font.boldSystemFont(MEDIUM_TEXT_SIZE)}, 
  large: {size: LARGE_TEXT_SIZE, font: Font.regularRoundedSystemFont(LARGE_TEXT_SIZE), boldFont: Font.boldSystemFont(LARGE_TEXT_SIZE)}, 
  veryLarge: {size: VERY_LARGE_TEXT_SIZE, font: Font.regularRoundedSystemFont(VERY_LARGE_TEXT_SIZE), boldFont: Font.boldSystemFont(VERY_LARGE_TEXT_SIZE)},
  extraLarge: {size: EXTRA_LARGE_TEXT_SIZE, font: Font.regularRoundedSystemFont(EXTRA_LARGE_TEXT_SIZE), boldFont: Font.boldSystemFont(EXTRA_LARGE_TEXT_SIZE)},
  big: {size: BIG_TEXT_SIZE, font: Font.regularRoundedSystemFont(BIG_TEXT_SIZE), boldFont: Font.boldSystemFont(BIG_TEXT_SIZE)},
  veryBig: {size: VERY_BIG_TEXT_SIZE, font: Font.regularRoundedSystemFont(VERY_BIG_TEXT_SIZE), boldFont: Font.boldSystemFont(VERY_BIG_TEXT_SIZE)},
}

// Get language settings
const labels = getLanguage();

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
  overlayBase64String = encodeOverlayImage(overlayImage);
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
  const currentTime = new Date().getTime() / 1000;
  isNight = currentTime >= weather.current.sunset || currentTime <= weather.current.sunrise;
  weather["location"] = address[0].locality;
  weather["isNight"] = isNight;
  return weather;
}
/*------------------------------------------------------------------
FUNCTION createOverlay
------------------------------------------------------------------*/
function createOverlay() {
  // Create dummy data when unable to fetch data
  if (weatherData === null) {
    NO_OF_HOURS = 8;
    NO_OF_DAYS = 7;
    weatherData = {
      "current":{"sunrise":1612717445,"sunset":1612703045,"temp":"?","weather":[{"id":999,"main":`${labels.checkScript}`}]},
      "location": `${labels.unknown}`
    }
    weatherData.current.dt = Math.round(new Date().getTime() / 1000);
    let t0 = Math.round(new Date().getTime() / 1000);
    weatherData.hourly = [];
    for (let i = 0; i < NO_OF_HOURS; i++) {
      weatherData.hourly[i] = {};
      weatherData.hourly[i].dt = t0;
      weatherData.hourly[i].temp = 0;
      weatherData.hourly[i].pop = 0;
      weatherData.hourly[i].weather = [];
      weatherData.hourly[i].weather[0] = {};
      weatherData.hourly[i].weather[0].id = 999;
      t0 = t0 + 3600;
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
  let popPathAlpha = pathAlpha + 0.1;
  if (popPathAlpha > 1) popPathAlpha = 1;
  const pathFillColor = ACCENT_COLOR;
  const textColor = "#FFFFFF";
  const textColor1 = "#BDC0C3";
  const pathHeight = 100;
  const popPathHeight = 100;
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
  weatherSymbol = SFSymbol.named(getWeatherSymbol(weatherData.current.weather[0].id, weatherData.isNight));
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
  imgCanvas.drawTextInRect(`${labels.next} ${hours + 1} ${labels.hours}`,r);

  // Updated Date & Time
  imgCanvas.setFont(allfonts.small.font);
  imgCanvas.setTextAlignedRight();
  imgCanvas.setTextColor(new Color(textColor1));
  r = new Rect (xStart, yStart + 25, DEVICE_RESOLUTION.width - 100 ,100);
  imgCanvas.drawTextInRect(`${labels.updated} ${getCurrentTime()}`,r);

  yStart = yStart + 150;

  /* ------------------------------------------------------------------------------------------
  PART 2: Middle graph section
  ------------------------------------------------------------------------------------------ */
  // Find minimum and maximum temperature to decide graph size
  let minTemp = 999;
  let maxTemp = -999;
  let minPop = 999;
  let maxPop = -999;
  let i = 0;
  for (const w of weatherData.hourly){
    if (i <= hours) {
      if (minTemp > w.temp) minTemp = w.temp;
      if (maxTemp < w.temp) maxTemp = w.temp;
      if (minPop > w.pop) minPop = w.pop;
      if (maxPop < w.pop) maxPop = w.pop;
    }
    i++;
  }
  if (maxTemp == minTemp) {
    minTemp = 0;
    maxTemp = 1;
  }
  if (maxPop == minPop) {
    if (WEATHER_SHOW_ZERO_POP_VALUES && minPop == 0) WEATHER_SHOW_POP_GRAPH = false;
    minPop = 0;
    maxPop = 1;
  }

  imgCanvas.setTextColor(new Color(textColor));
  imgCanvas.setTextAlignedCenter();
  imgCanvas.setFont(allfonts.extraSmall.font);
  let yDelta = Math.ceil((DEVICE_RESOLUTION.height/yStepNumbers)/(maxTemp - minTemp)); // Y Step size 
  let yPopDelta = (pathHeight - 20)/(maxPop - minPop); // POP graph should always be below the minimum point of temperature graph
  let xDelta = Math.ceil((DEVICE_RESOLUTION.width - (xStart * 2))/hours); // X Step size
  let yBottom = yStart + ((maxTemp - minTemp) * yDelta) + pathHeight; // y co-ordinate for time line
  let yPopStart = yBottom - pathHeight + 10;
  let allPoints = [];
  let allPopPoints = [];
  let linePoints = [];
  let closedCurvePath = new Path();  // Create filled path
  let curvePath = new Path(); // Create border path
  let linePath = new Path(); // Create bottom line
  let closedPopCurvePath = new Path();  // Create filled path
  let curvePopPath = new Path(); // Create border path
  closedCurvePath.move(new Point(xStart, yBottom));
  closedPopCurvePath.move(new Point(xStart, yBottom));
  for (i = 0; i <= hours; i++){
    t = weatherData.hourly[i].temp;
    p = weatherData.hourly[i].pop;
    y = Math.round((maxTemp - t) * yDelta);
    yPop = Math.round((maxPop - p) * yPopDelta) - 10;
    // y co-ordinate for pop block
    yPop1 = yPopStart + yPop - blockHeight/2;
    if (yPop == -10) {
      yPop = 10; // to handle "max" element
      yPop1 = yPopStart - yPop - blockHeight/2;
    }
    if (!WEATHER_SHOW_POP_GRAPH) yPop1 = 999999;
    // Create points array for curvePath
    allPoints.push(new Point(xStart,yStart + y));
    closedCurvePath.addLine(new Point(xStart,yStart + y));
    allPopPoints.push(new Point(xStart,yPopStart + yPop));
    closedPopCurvePath.addLine(new Point(xStart,yPopStart + yPop));
    // Create path for bottom line
    linePoints.push(new Point(xStart,yBottom));
    // Print temperature and/or weather symbol
    if (WEATHER_SHOW_HOURLY_ICONS) {
      y1 = yStart + y + 5;                      /* Use these values to find overlapping */
      y2 = yStart + y + blockHeight - 10;       /* with pop values */
      weatherSymbol = SFSymbol.named(getWeatherSymbol(weatherData.hourly[i].weather[0].id, weatherData.isNight));
      weatherSymbol.applyFont(allfonts.small.font);
      image = weatherSymbol.image;
      r = new Rect (xStart - (blockWidth/2), yStart + y - blockHeight, image.size.width,image.size.height);
      imgCanvas.drawImageInRect(image,r);
      // If pop value is over-lapping with temperature
      if (yPop1 <= y1) r = new Rect(xStart - 5, yStart + y - blockHeight, blockWidth, blockHeight)
      else r = new Rect(xStart - (blockWidth/2), yStart + y + 5, blockWidth, blockHeight)
      imgCanvas.drawTextInRect(Math.round(t).toString() + "°",r);
    } else {
      y1 = yStart + y - blockHeight;   /* Use these values to find overlapping */
      y2 = yStart + y;                 /* with pop values */
      r = new Rect(xStart - (blockWidth/2), yStart + y - blockHeight, blockWidth, blockHeight)
      imgCanvas.drawTextInRect(Math.round(t).toString() + "°",r);
    }
    // Print pop
    if (WEATHER_SHOW_POP_GRAPH) {
      imgCanvas.setFont(allfonts.ultraSmall.font);
      if (WEATHER_SHOW_POP_VALUES || i == 0 || i == hours) {
        if ((yPop1 >= y1 && yPop1 <= y2) || yPop1 <= y1) { // Show below the graph
        r = new Rect(xStart - 25, yPopStart + yPop + 5, blockWidth/2, blockHeight/2)
        imgCanvas.drawTextInRect(Math.round(p * 100).toString() + "%",r);
        } else { // Show above the graph
          r = new Rect(xStart - 25, yPopStart + yPop - blockHeight/2, blockWidth/2, blockHeight/2)
          imgCanvas.drawTextInRect(Math.round(p * 100).toString() + "%",r);
        }
      }
      imgCanvas.setFont(allfonts.extraSmall.font);
    }
    // Print time
    if (i == 0) time = `${labels.now}`;
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
    // Print points
    curvePath.addEllipse(new Rect(xStart,yStart + y - (lineWidth/2),5,5));
    if (WEATHER_SHOW_POP_GRAPH) curvePopPath.addEllipse(new Rect(xStart,yPopStart + yPop - (lineWidth/2),5,5));
    xStart = xStart + xDelta;
  }
  xStart = xStart - xDelta;
  closedCurvePath.addLine(new Point(xStart,yBottom));
  closedCurvePath.closeSubpath();

  curvePath.addLines(allPoints);
  imgCanvas.addPath(curvePath);
  imgCanvas.setStrokeColor(new Color(pathColor));
  imgCanvas.setLineWidth(lineWidth);
  imgCanvas.strokePath();

  imgCanvas.addPath(closedCurvePath);
  imgCanvas.setFillColor(new Color(pathFillColor, pathAlpha));
  imgCanvas.fillPath();

  // POP closed graph
  if (WEATHER_SHOW_POP_GRAPH) {
    closedPopCurvePath.addLine(new Point(xStart,yBottom));
    closedPopCurvePath.closeSubpath();
    curvePopPath.addLines(allPopPoints);
    imgCanvas.addPath(curvePopPath);
    imgCanvas.setStrokeColor(new Color(pathColor));
    imgCanvas.setLineWidth(lineWidth);
    imgCanvas.strokePath();
    imgCanvas.addPath(closedPopCurvePath);
    imgCanvas.setFillColor(new Color(pathColor, popPathAlpha));
    imgCanvas.fillPath();
  }

  // Add bottom line at the end
  linePath.addLines(linePoints);
  imgCanvas.addPath(linePath);
  imgCanvas.setStrokeColor(new Color(pathColor));
  imgCanvas.setLineWidth(lineWidth);
  imgCanvas.strokePath();

  /* ------------------------------------------------------------------------------------------
  PART 3: Daily weather forecast
  ------------------------------------------------------------------------------------------ */
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
  imgCanvas.drawTextInRect(`${labels.thisWeek}`,r);

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
    weatherSymbol = SFSymbol.named(getWeatherSymbol(weatherData.daily[i].weather[0].id,weatherData.isNight));
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
    if (isNight) return "cloud.moon.bolt.fill";
    else return "cloud.sun.bolt.fill";
  } else if (weatherID > 211 && weatherID <= 232){
    if (isNight) return "cloud.bolt.rain.fill";
    else return "cloud.bolt.rain.fill";
  } else if (weatherID >= 300 && weatherID <= 311) {
    if (isNight) return "cloud.drizzle.fill";
    else return "cloud.drizzle.fill";
  } else if (weatherID > 311 && weatherID <= 321) {
    if (isNight) return "cloud.moon.rain.fill";
    else return "cloud.moon.rain.fill";    
  } else if (weatherID >= 500 && weatherID <= 510) {
    if (isNight) return "cloud.moon.rain.fill";
    else return "cloud.sun.rain.fill";    
  } else if (weatherID == 511) {
    if (isNight) return "cloud.hail.fill";
    else return "cloud.hail.fill";    
  } else if (weatherID > 511 && weatherID <= 531) {
    if (isNight) return "cloud.heavyrain.fill";
    else return "cloud.heavyrain.fill";
  } else if (weatherID >= 600 && weatherID <= 602) {
    if (isNight) return "snow";
    else return "snow";
  } else if (weatherID > 602 && weatherID <= 613) {
    if (isNight) return "cloud.sleet.fill";
    else return "cloud.sleet.fill";
  } else if (weatherID > 613 && weatherID <= 622) {
    if (isNight) return "cloud.snow.fill";
    else return "cloud.snow.fill";
  } else if (weatherID >= 701 && weatherID <= 731) {
    if (isNight) return "sun.haze.fill";
    else return "sun.haze.fill";
  } else if (weatherID == 741) {
    if (isNight) return "cloud.fog.fill";
    else return "cloud.fog.fill";
  } else if (weatherID > 741 && weatherID <= 771) {
    if (isNight) return "sun.dust.fill";
    else return "sun.dust.fill";
  } else if (weatherID == 781) {
    if (isNight) return "tornado";
    else return "tornado";
  } else if (weatherID == 800) {
    if (isNight) return "moon.stars.fill";
    else return "sun.max.fill";
  } else if (weatherID >= 801 && weatherID <= 899) {
    if (isNight) return "cloud.moon.fill";
    else return "cloud.sun.fill";
  } else if (isNight) return "moon.zzz.fill";
    else return "sun.max.fill";
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
/*------------------------------------------------------------------
FUNCTION getCurrentTime
------------------------------------------------------------------*/
function getCurrentTime(){
  const date = new Date();
  const d = "0" + date.getDate();
  const m = "0" + (date.getMonth() + 1);
  const y = date.getFullYear().toString();
  const H = "0" + date.getHours();
  const M = "0" + date.getMinutes();
  return H.substr(-2) + ":" + M.substr(-2);

}
/*------------------------------------------------------------------
FUNCTION getDay
------------------------------------------------------------------*/
function getDay(unixTimestamp){
  var date = new Date(unixTimestamp * 1000);
  let day = date.getDay();
  if (day == 0) return `${labels.sun}`;
  if (day == 1) return `${labels.mon}`;
  if (day == 2) return `${labels.tue}`;
  if (day == 3) return `${labels.wed}`;
  if (day == 4) return `${labels.thu}`;
  if (day == 5) return `${labels.fri}`;
  if (day == 6) return `${labels.sat}`;
}
/*------------------------------------------------------------------
FUNCTION getLanguage
------------------------------------------------------------------*/
function getLanguage() {
  const text = {
      en: {
          next: "Next",
          hours: "Hours",
          updated: "Updated at",
          thisWeek: "This Week",
          now: "now",
          mon: "Mon",
          tue: "Tue",
          wed: "Wed",
          thu: "Thu",
          fri: "Fri",
          sat: "Sat",
          sun: "Sun",
          unknown: "Unknown",
          checkScript: "Check Script",
      },
      pt: {
          next: "Próximas",
          hours: "Horas",
          updated: "Atualizado em",
          thisWeek: "Essa Semana",
          now: "now",
          mon: "Seg",
          tue: "Ter",
          wed: "Qua",
          thu: "Qui",
          fri: "Sex",
          sat: "Sab",
          sun: "Dom",
          unknown: "Desconhecido",
          checkScript: "Verificar Script",
      },
      es: {
          next: "Próximas",
          hours: "Horas",
          updated: "Actualizado en",
          thisWeek: "Esta Semana",
          now: "now",
          mon: "Lun",
          tue: "Mar",
          wed: "Mié",
          thu: "Jue",
          fri: "Vie",
          sat: "Sáb",
          sun: "Dom",
          unknown: "Desconocido",
          checkScript: "Comprobar Script",
      },
      fr: {
          next: "Suivantes",
          hours: "Les heures",
          updated: "Mis à jour à",
          thisWeek: "Cette Semaine",
          now: "now",
          mon: "lun",
          tue: "mar",
          wed: "mer",
          thu: "jeu",
          fri: "ven",
          sat: "sam",
          sun: "dim",
          unknown: "Inconnu",
          checkScript: "Vérifier le script",
      },
      de: {
          next: "Die nächste",
          hours: "Stunden",
          updated: "Sktualisiert am",
          thisWeek: "Diese Woche",
          now: "now",
          mon: "Mon",
          tue: "Die",
          wed: "Mit",
          thu: "Don",
          fri: "Fre",
          sat: "Sam",
          sun: "Son",
          unknown: "Unbekannt",
          checkScript: "Überprüfen Sie das Skript",
      },
      hi: {
        next: "अगले",
        hours: "घंटे",
        updated: "अद्यतन",
        thisWeek: "इस सप्ताह",
        now: "now",
        mon: "सोम",
        tue: "मंगल",
        wed: "बुध",
        thu: "गुरु",
        fri: "शुक्र",
        sat: "शनि",
        sun: "रवि",
        unknown: "अनजान",
        checkScript: "स्क्रिप्ट की जाँच करें",
    },
  };
  let language;
  if (PREFERRED_LANG == "system") {
    let systemLanguage = Device.preferredLanguages()[0];
    language = systemLanguage.split("-")[0];
  } else {
    language = PREFERRED_LANG;
  }
  supportedLanguages = Object.keys(text);
  if (!(supportedLanguages.includes(language))) {
      writeLOG("Language Error: Language not found, defaulting to English.")
      language = "en";
  };
  // Check valid weather language
  const openweatherLangs = {
    af: {LanguageName: "Afrikaans"},
    al: {LanguageName: "Albanian"},
    ar: {LanguageName: "Arabic"},
    az: {LanguageName: "Azerbaijani"},
    bg: {LanguageName: "Bulgarian"},
    ca: {LanguageName: "Catalan"},
    cz: {LanguageName: "Czech"},
    da: {LanguageName: "Danish"},
    de: {LanguageName: "German"},
    el: {LanguageName: "Greek"},
    en: {LanguageName: "English"},
    eu: {LanguageName: "Basque"},
    fa: {LanguageName: "Persian (Farsi)"},
    fi: {LanguageName: "Finnish"},
    fr: {LanguageName: "French"},
    gl: {LanguageName: "Galician"},
    he: {LanguageName: "Hebrew"},
    hi: {LanguageName: "Hindi"},
    hr: {LanguageName: "Croatian"},
    hu: {LanguageName: "Hungarian"},
    id: {LanguageName: "Indonesian"},
    it: {LanguageName: "Italian"},
    ja: {LanguageName: "Japanese"},
    kr: {LanguageName: "Korean"},
    la: {LanguageName: "Latvian"},
    lt: {LanguageName: "Lithuanian"},
    mk: {LanguageName: "Macedonian"},
    no: {LanguageName: "Norwegian"},
    nl: {LanguageName: "Dutch"},
    pl: {LanguageName: "Polish"},
    pt: {LanguageName: "Portuguese"},
    pt_br: {LanguageName: "Português Brasil"},
    ro: {LanguageName: "Romanian"},
    ru: {LanguageName: "Russian"},
    sv: {LanguageName: "Swedish"},
    se: {LanguageName: "Swedish"},
    sk: {LanguageName: "Slovak"},
    sl: {LanguageName: "Slovenian"},
    sp: {LanguageName: "Spanish"},
    es: {LanguageName: "Spanish"},
    sr: {LanguageName: "Serbian"},
    th: {LanguageName: "Thai"},
    tr: {LanguageName: "Turkish"},
    ua: {LanguageName: "Ukrainian"},
    uk: {LanguageName: "Ukrainian"},
    vi: {LanguageName: "Vietnamese"},
    zh_cn: {LanguageName: "Chinese Simplified"},
    zh_tw: {LanguageName: "Chinese Traditional"},
    zu: {LanguageName: "Zulu"}
  }
  WEATHER_LANG = language;
  supportedLanguages = Object.keys(openweatherLangs);
  if (!(supportedLanguages.includes(language))) {
      writeLOG("Language Error: Language not found, defaulting to English.")
      WEATHER_LANG = "en";
  };
  return text[language];
}