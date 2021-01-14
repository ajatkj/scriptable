/*------------------------------------------------------------------------------------------------------
Script: LSWeather.js
Author: Ankit Jain (<ajatkj@yahoo.co.in>)
Date: 14.01.2021
------------------------------------------------------------------------------------------------------*/
// This script takes a wallpaper as an input and generates a wallpaper with weather details. 
// The script is meant to be called from a Shortcut. 

// When run from a Shortcuts app-
// The script is expected to be called using x-callback URL with 2 parameters - "image" and "mode". 
// "image" is a Base64 encoded string which is decoded back to an image in the script.
// "mode" value can be dark or light depending on the colors in your wallpaper.
// The script then modifies the image to add weather details and encondes it to Base64 string and calls the Shortcut using "newImage" parameter (x-success).
// In case of an error (x-error), appropriate error message is sent back to the Shortcuts app.
// Note: Sometimes the script doesn't do anything for some wallpapers. This is probably due to the wallpaper itself. But if someone figures it out, send out an email to me.

// When run from Scriptables app- (This is only meant for testing while changing the layout)
// Create a folder called Wallpapers within your iCloud/Scriptables folder. Place (.jpg) wallpaper and rename it to wallpaper.jpg
// The script will create the modified wallpaper lswallpaper.jpg in the same location

// Script configuration-
// To run the script an openweather API key is required. Get your own API key for free at: https://home.openweathermap.org/api_keys (account needed).
// Change the value of UNITS and LANG below as required. You can get valid values of UNITS & LANG at https://openweathermap.org/api/one-call-api.
// Change the values in the "layout" dictionary as per your liking. All relevant details are mentioned below.

// Below values are used when run from Scritapble app
const WALLPAPER_PATH = "LSWallpapers";
const WALLPAPER_NAME = "wallpaper.jpg";

// Logging parameters
const LOG_FILE_NAME = "LSWeather.txt";
const LOG_FILE_PATH = "LSWeatherLogs";
let LOG_STEP = 1;

// Testing - set this to true if you don't want to call the API but test the layout with dummy data
const TESTING = true;

// Constants for openweather API call, change as per your requirement
const UNITS = 'metric'
const LANG = 'en'

// If you desire to show details from any of the below weather data then remove that value from exclude and configure its key in the layout dictionary
const EXCLUDE='minutely,hourly,alerts';

// API key for openweather. 
const API_KEY = '';

let WALLPAPER;
let useShortcut = false;
let useDarkColor = false;
let success = true;
let errMsg;

const LIGHT_COLOR = "#FFFFFF";
const DARK_COLOR = "#000000";

// Default values for layout
const LEFT_MARGIN = 15;
const RIGHT_MARGIN = 15;
const DEFAULT_WIDTH = 100;

// Define fonts and sizes
const ULTRA_SMALL_TEXT_SIZE = 15;
const EXTRA_SMALL_TEXT_SIZE = 30;
const SMALL_TEXT_SIZE = 35;
const MEDIUM_TEXT_SIZE = 40;
const LARGE_TEXT_SIZE = 60;
const VERY_LARGE_TEXT_SIZE = 80;
const EXTRA_LARGE_TEXT_SIZE = 100;
const DEFAULT_TEXT_SIZE = 40;

const allfonts = {
  ultraSmall: {size: ULTRA_SMALL_TEXT_SIZE, font: Font.systemFont(ULTRA_SMALL_TEXT_SIZE)},
  extraSmall: {size: EXTRA_SMALL_TEXT_SIZE, font: Font.systemFont(EXTRA_SMALL_TEXT_SIZE)}, 
  small: {size: SMALL_TEXT_SIZE, font: Font.systemFont(SMALL_TEXT_SIZE)}, 
  medium: {size: MEDIUM_TEXT_SIZE, font: Font.systemFont(MEDIUM_TEXT_SIZE)}, 
  large: {size: LARGE_TEXT_SIZE, font: Font.systemFont(LARGE_TEXT_SIZE)}, 
  veryLarge: {size: VERY_LARGE_TEXT_SIZE, font: Font.systemFont(VERY_LARGE_TEXT_SIZE)},
  extraLarge: {size: EXTRA_LARGE_TEXT_SIZE, font: Font.systemFont(EXTRA_LARGE_TEXT_SIZE)},
  default: {size: DEFAULT_TEXT_SIZE, font: Font.systemFont(DEFAULT_TEXT_SIZE)}
}

// URLs to fetch weather data and icons
// DO NOT CHANGE !!
const baseAPIURL='https://api.openweathermap.org/data/2.5/onecall';
const baseIconURL='http://openweathermap.org/img/wn';

// key: JSON key returned by function fetchWeather(), anything else will not be displayed
// prefix: If present, will be prefixed to the data.
// suffix: If present, will be suffixed to the data. Use "temperature" for temperature data and "speed" for wind data, any other string accepted.
// x: x co-ordinate of the data element. Valid values are "left_margin", "right_margin", "center" and numbers. Anything else will be defaulted to "left_margin".
//    use -ve values to start from right margin i.e -50 will place the element at 50 pixels from the right margin.
// y: y co-ordinate of the data element. Valid values are numbers.
// w: width of the data element. Valid values are "half", "full" and numbers. Anything else will be defaulted to DEFAULT_MARGIN
// h: height of the data element. Valid values are numbers.
// font: Font for the data element. Valid values are Font type object. Can be null.
// color:Ccolor for the data element (except icon). Valid values are "light", "dark" or hex code of the color. If null, white will be used.
// align: Alignment of the data element within the data rectangle. Valid values are "left", "right" or "center".
// hide: 0 or null to show this data element, 1 to hide, 2 for sunrise/sunset only (to show only 1 of them based on the time of the day).
var layout = {
  // field: [key,prefix,suffix,x,y,width,height,font,color,align]
  lowTemp: {key: "low", prefix: null, suffix: "temperature", x: "left_margin", y: 375, w: 100, h: 75, font: "small", color: "light", align: "left", hide: 1},
  highTemp: {key: "high", prefix: null, suffix: "temperature", x: "left_margin", y: 200, w: 100, h: 75, font: "small", color: "light", align: "left", hide: 1},
  temp: {key: "temp", prefix: null, suffix: "temperature", x: -100, y: 200, w: 100, h: 50, font: "medium", color: "light",  align: "center"},
  description: {key: "desc", prefix: null, suffix: null, x: "center", y: 650, w: "half", h: 30, font: "extraSmall", color: "light", align: "center"},
  location: {key: "loc", prefix: null, suffix: null, x: "center", y: 690, w: "half", h: 30, font: "extraSmall", color: "light", align: "center"},
  icon: {key: "icon", prefix: null, suffix: null, x: -100, y: 120, w: 100, h: 100, font: null, color: "light", align: "center"},
  wind: {key: "wind", prefix: "🌬️", suffix: "speed", x: -100, y: 260, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center"},
  //Tinting of SFSymbol is not supported without Widgets currently, so using unicode icons
  //sunrise: {key: "sunrise", prefix: "SFSymbol.sunrise", suffix: "", x: -100, y: 310, w: 100, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
  //sunset: {key: "sunset", prefix: "SFSymbol.sunset", suffix: "", x: -100, y: 310, w: 100, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2}
  sunrise: {key: "sunrise", prefix: "🔆 ", suffix: "", x: -100, y: 310, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
  sunset: {key: "sunset", prefix: "🔅 ", suffix: "", x: -100, y: 310, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2}
};

const defaultWeatherDataForTesting = {
  loc: 'Mars',
  desc: 'thunderstorm with heavy drizzle',
  temp: '-27',
  wind: '400',
  high: '-12',
  low: '-52',
  icon: '02d',
  sunrise: '0:01',
  sunset: '23:59',
  isNight: false
};

const unknownWeatherData = {
  loc: 'Unknown',
  desc: 'No weather data for you',
  temp: '-',
  wind: '-',
  high: '-',
  low: '-',
  icon: '-',
  sunrise: '-',
  sunset: '-',
  isNight: false
};

let inputParams = args.queryParameters;

// Check where is the script called from
if (typeof inputParams["image"] == "undefined") 
  useShortcut = false;
else useShortcut = true;  // if called from Shortcuts app using x-callback

// check if script is called from a shortcut for light wallpapers or dark wallpapers
if (typeof inputParams["mode"] == "undefined") {
  useDarkColor = false;
}
else if (inputParams["mode"] == "dark") // mode is w.r.t. the wallpaper. i.e. dark for dark wallpapers
  useDarkColor = false;
else useDarkColor = true;

const DEVICE_RESOLUTION = Device.screenResolution();
const DEVICE_SCALE = Device.screenScale();

if (!useShortcut) { // if called from Scriptable app
  writeLOG("Running script in APP");
  WALLPAPER = await fetchWallpaper();
} else {
  writeLOG("Running script from Shortcut");
  let inputBase64String = inputParams["image"];
  writeLOG("Input base64 string: " + inputBase64String);
  // convert to raw data
  const rawWallpaper = Data.fromBase64String(inputBase64String);
  if (rawWallpaper === null) {
    errMsg = "Error_covert_Base64_String"
    writeLOG(errMsg);
    callBackError(inputParams);
  }
  // convert to image
  WALLPAPER = Image.fromData(rawWallpaper);
  if (WALLPAPER === null) {
    errMsg = "Error_convert_Data_to_Image"
    writeLOG(errMsg);
    callBackError(inputParams);
  }
}
if (TESTING) weatherData = defaultWeatherDataForTesting;
else weatherData = await fetchWeather();
try {
  updateLayout(weatherData.isNight);
  const newWallapaper = await createNewWallpaper(WALLPAPER, weatherData);
  if (!useShortcut) {
    saveWallpaper(newWallapaper);     // This will mark end of the script if successsful
  } else {
    encodeWallpaper(newWallapaper);   // This will mark end of the script if successful
  }
} catch (error) {
  errMsg = "Main_" + error.message.replace(/\s/g,"_");
  writeLOG(errMsg);
  if (useShortcut) {
    callBackError(inputParams);  // Call the Shortcuts app with appropriate error message
  } else {
    Script.complete();
  }
}

/*------------------------------------------------------------------------------------------------------------------
*                                               FUNCTION DEFINITION
------------------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------
FUNCTION fetchWallpaper
------------------------------------------------------------------*/
// Function to fetch the wallpaper from iCloud - This is used when the script is run from App
async function fetchWallpaper(){
  const fm = FileManager.iCloud();
  const cachePath = fm.joinPath(fm.documentsDirectory(), WALLPAPER_PATH);
  const imgFile = fm.joinPath(cachePath,WALLPAPER_NAME);
  return Image.fromFile(imgFile);
}
/*------------------------------------------------------------------
FUNCTION saveWallpaper
------------------------------------------------------------------*/
// Function to save the wallpaper in iCloud - This is used when the script is run from App
async function saveWallpaper(newWallapaper){
  const fm = FileManager.iCloud();
  const cachePath = fm.joinPath(fm.documentsDirectory(), WALLPAPER_PATH);
  const imgFile=fm.joinPath(cachePath,"ls" + WALLPAPER_NAME);
  fm.writeImage(imgFile,newWallapaper);
  writeLOG("Wallpaper saved successfully");
  Script.complete();
}
/*------------------------------------------------------------------
FUNCTION encodeWallpaper
------------------------------------------------------------------*/
function encodeWallpaper(newWallapaper){
  let newBase64String;
  try {
    const newRawWallpaper = Data.fromPNG(newWallapaper);
    if (newRawWallpaper === null) {
      errMsg = "Error_convert_Image_to_Data";
      writeLOG(errMsg);
      return;
    }
    newBase64String = newRawWallpaper.toBase64String();
    if (newBase64String === null) {
      errMsg = "Error_convert_Data_to_Base64String";
      writeLOG(errMsg);
      return;
    }
  } catch(error) {
    errMsg = "encodeWallpaper_" + error.message.replace(/\s/g,"_");
    writeLOG(errMsg);
    callBackError(inputParams);
    return;
  }

  callBackSucess(inputParams, newBase64String);
}

/*------------------------------------------------------------------
FUNCTION fetchWeather
------------------------------------------------------------------*/
async function fetchWeather(){
  if (!success) return unknownWeatherData;
  let response;

  Location.setAccuracyToThreeKilometers();
  locationData = await Location.current();
  const latitude = locationData.latitude;
  const longitude = locationData.longitude;
  const address = await Location.reverseGeocode(locationData.latitude, locationData.longitude);
  const weatherURL = baseAPIURL + '?lat=' + latitude + '&lon=' + longitude + '&exclude=' + EXCLUDE + '&units=' + UNITS + '&lang=' + LANG + '&appid=' + API_KEY;
  
  try {
    writeLOG(`Fetching url: ${weatherURL}`);
    const request = new Request(weatherURL);
    response = await request.loadJSON();
  } catch (error) {
      writeLOG(`Couldn't fetch ${weatherURL}`);
      return unknownWeatherData;
  }
  writeLOG("JSON Data: " + JSON.stringify(response));
  const currentTime = new Date().getTime() / 1000;
  const isNight = currentTime >= response.current.sunset || currentTime <= response.current.sunrise;

  return {
    loc: address[0].locality,
    desc: response.current.weather[0].description,
    temp: Math.round(response.current.temp).toString(),
    wind: Math.round(response.current.wind_speed).toString(),
    high: Math.round(response.daily[0].temp.max).toString(),
    low: Math.round(response.daily[0].temp.min).toString(),
    icon: response.current.weather[0].icon,
    sunrise: convertFromUTC(response.current.sunrise),
    sunset: convertFromUTC(response.current.sunset),
    isNight: isNight
  }
}

/*------------------------------------------------------------------
FUNCTION getWeatherIcon
------------------------------------------------------------------*/
async function getWeatherIcon(iconID, isNight){
  try {
    const iconIDNight = iconID.replace("d","n");
    if (isNight) iconID = iconIDNight;
    const iconURL = baseIconURL + "/" + iconID + "@2x.png";
    writeLOG(`Fetching url: ${iconURL}`);
    let request = new Request(iconURL);
    return await request.loadImage();
  } catch (error) {
    errMsg = "getWeatherIcon_" + error.message.replace(/\s/g,"_");
    writeLOG(errMsg);
    return;
  }
}

/*------------------------------------------------------------------
FUNCTION createNewWallpaper
------------------------------------------------------------------*/
async function createNewWallpaper(wallpaper, weatherData) {
  if (!success) return null;
  try {
    const imgCanvas=new DrawContext();
    imgCanvas.size = DEVICE_RESOLUTION;
    const mainRect = new Rect(0,0,DEVICE_RESOLUTION.width,DEVICE_RESOLUTION.height);
    imgCanvas.drawImageInRect(wallpaper,mainRect);
    
    // Place elements on wallpaper
    let x, y, w, h, rect, font, color, iconImage;
    for (let item in layout){
      x = layout[item].x;
      y = layout[item].y;
      w = layout[item].w;
      h = layout[item].h;
      font = layout[item].font;
      color = layout[item].color;
      align = layout[item].align;
      suffix = layout[item].suffix;
      prefix = layout[item].prefix;
      hide = layout[item].hide;

      element = eval(`${`weatherData.${layout[item].key}`}`);
      if (typeof element  === 'undefined') {
        writeLOG("Invalid item " + layout[item].key);
        continue; // skip this element
      } else {
        writeLOG("Processing item " + layout[item].key + " with value " + element);
      }
      if (hide == 1) {
        writeLOG("Hiding item " + layout[item].key);
        continue;
      }

      rect = new Rect(x,y,w,h)

      imgCanvas.setTextColor(new Color(color));

      if (align == 'left') {
        imgCanvas.setTextAlignedLeft();
      } else if (align == 'right') {
        imgCanvas.setTextAlignedRight();
      } else {
        imgCanvas.setTextAlignedCenter();
      }

      imgCanvas.setFont(font);

      if (item == 'icon') { // processing icon seperately since it is an image
        iconImage = await getWeatherIcon(element, weatherData.isNight);
        imgCanvas.drawImageInRect(iconImage,rect);
      } else { // processing everything else
        let element0 = element.slice(0, 1).toUpperCase() + element.slice(1, element.length)  // capitalize first letter of the data
        if ( suffix !== null) { 
          element0 = element0 + suffix
        }
        // prefix can be a text value or SFSymbol
        if (prefix !== null) {
          if (typeof prefix == 'object') {  // if prefix is an image i.e. SFSymbol
              const prefix0 = prefixImage(prefix, element0, item);
              rect = new Rect(x,y,prefix0.size.width,prefix0.size.height);
              imgCanvas.drawImageInRect(prefix0, rect);
              continue;
          } else {
            element0 = prefix + element0
          }
        }
        imgCanvas.drawTextInRect(element0,rect)
      }
    }
    newImage=imgCanvas.getImage()
  } catch (error) {
    errMsg = "createNewWallpaper_" + error.message.replace(/\s/g,"_");
    writeLOG(errMsg);
    return;
  }
  return newImage;
}

/*------------------------------------------------------------------
FUNCTION prefixImage
------------------------------------------------------------------*/
function prefixImage(prefixImage, text, item){
  if (!success) return null;

  try {
    const oW = layout[item].w;  // original width
    const oH = layout[item].h;  // original height
    const font = layout[item].font;
    const pW = prefixImage.size.width; // prefix width
    const pH = prefixImage.size.height; // prefix height
    const dW = (layout[item].fontSize / (DEVICE_SCALE - 1)) * text.length; // data width

    // create a new canvas for prefixImage + text of size item
    const prefixCanvas=new DrawContext();
    prefixCanvas.opaque = false;
    prefixCanvas.size = new Size(pW + dW,oH);

    // create new rectangle of prefixImage size
    const prefixRect = new Rect(0,0,pW,pH);
    // align prefixImage to right
    prefixCanvas.setTextAlignedRight();
    // draw prefixImage at (x,y) = (0,0)
    prefixCanvas.drawImageAtPoint(prefixImage, new Point(0,0));
    
    const dataRect = new Rect(pW + 2,0,dW,oH);
    prefixCanvas.setFont(font);
    prefixCanvas.setTextAlignedLeft();
    prefixCanvas.drawTextInRect(text, dataRect);
  } catch (error) {
    errMsg = error.message.replace(/\s/g,"_");
    writeLOG(errMsg);
    return;
  }
  return prefixCanvas.getImage();

}

/*------------------------------------------------------------------
FUNCTION updateLayout
------------------------------------------------------------------*/
// update co-ordinates based on the image size
function updateLayout(isNight){
  if (!success) return null;
  try {
    const imageSize=DEVICE_RESOLUTION;
    let TEMPERATURE_UNIT;
    let SPEED_UNIT; 
    // set constants based on UNITS
    if (UNITS == 'imperial'){
        TEMPERATURE_UNIT = "°";
        SPEED_UNIT = "mph";
    } else if (UNITS == 'metric') {
        TEMPERATURE_UNIT = "°";
        SPEED_UNIT = "m/s";
    } else { // when UNITS is not applied or "standard"
        TEMPERATURE_UNIT = "°";
        SPEED_UNIT = "m/s";
    }  
    // loop through the layout dictionary and update necessary dynamic data
    for (let item in layout){
      // evaluate width first
      if (layout[item].w == "half") {
        layout[item].w = imageSize.width / 2;
      } else if (layout[item].w == "full") {
        layout[item].w = imageSize.width;
      } else {
        if(isNaN(layout[item].w)){
          layout[item].w = DEFAULT_WIDTH;
        }
      }
      // evaluate x co-ordinate
      if (layout[item].x == "left_margin") {
        layout[item].x = LEFT_MARGIN;
      } else if (layout[item].x == "right_margin") {
        layout[item].x = imageSize.width - layout[item].w - RIGHT_MARGIN;
      } else if (layout[item].x == "center"){
        layout[item].x = (imageSize.width / 2) - (layout[item].w / 2)
      } else if (layout[item].x < 0) {  // aligh from right margin
        const xminus = (layout[item].x * -1);
        layout[item].x = (imageSize.width) - layout[item].w  - xminus;
      } else {
        layout[item].x = layout[item].x;
      }
      // evaluate y co-ordinate
      if (layout[item].y < 0) {  // aligh from bottom
        const yminus = (layout[item].y * -1);
        layout[item].y = (imageSize.height) - layout[item].h  - yminus;
      } else {
        layout[item].y = layout[item].y;
      }
      // evaluate suffix for temperature and speed units
      if (layout[item].suffix == "temperature") {
        layout[item].suffix = TEMPERATURE_UNIT;
      } else if (layout[item].suffix == "speed") {
        layout[item].suffix = SPEED_UNIT;
      }
      // evaluate color
      if (layout[item].color == "light") {
        if (!useDarkColor) {
          layout[item].color = LIGHT_COLOR;
        } else {
          layout[item].color = DARK_COLOR;
        }
      } else if (layout[item].color == "dark") {
        if (!useDarkColor) {
          layout[item].color = LIGHT_COLOR;
        } else {
          layout[item].color = DARK_COLOR;
        }
      }
      // evaluate font
      if (layout[item].font === null) {
        layout[item].font = allfonts.default.font;
        layout[item].size = allfonts.default.size;
      }
      else {
        const fontName = layout[item].font;
        layout[item].font = eval(`${`allfonts.${fontName}.font`}`);
        layout[item].fontSize = eval(`${`allfonts.${fontName}.size`}`); // insert new field in the layout, fontSize
      }

      // evaluate prefix
      if (layout[item].prefix !== null){
        // prefix of the form SFSymbol.symbolname
        // convert to image
        if (layout[item].prefix.split(".")[0] == "SFSymbol"){
          const symbol = SFSymbol.named(layout[item].prefix.split(".")[1]);
          symbol.applyFont(layout[item].font);
          layout[item].prefix = symbol.image;
        }
        // everything else remains untouched
      }

      // evaluate hide based on sunset/sunrise time
      if (layout[item].hide == 2){
        if (layout[item].key == "sunrise") {
          if (isNight) layout[item].hide = 0;
          else layout[item].hide = 1;
        } 
        if (layout[item].key == "sunset") {
          if (!isNight) layout[item].hide = 0;
          else layout[item].hide = 1;
        }
      }
    }
  } catch (error) {
    errMsg = "updateLayout_" + error.message.replace(/\s/g,"_");
    writeLOG(errMsg);
    return;
  }
}

/*------------------------------------------------------------------
FUNCTION writeLOG
------------------------------------------------------------------*/
async function writeLOG(logMsg){
  if (useShortcut) {
    const fm = FileManager.iCloud();
    let logPath = fm.joinPath(fm.documentsDirectory(), LOG_FILE_PATH);
    if (!fm.fileExists(logPath)) {
      fm.createDirectory(logPath);
    }
    const logFile = fm.joinPath(logPath, 'Step_' + LOG_STEP + '_' + LOG_FILE_NAME);
    fm.writeString(logFile, logMsg);
  } else {
    console.log ("Step_" + LOG_STEP + ": " + logMsg);
  }
  LOG_STEP++;
}

/*------------------------------------------------------------------
FUNCTION convertFromUTC
------------------------------------------------------------------*/
function convertFromUTC(unixTimestamp){
  // multiplied by 1000 so that the argument is in milliseconds, not seconds.
  var date = new Date(unixTimestamp * 1000);
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();

  // Will display time in 10:30 format
  var formattedTime = hours + ':' + minutes.substr(-2)
  return formattedTime;
}

/*------------------------------------------------------------------
FUNCTION callBackError
------------------------------------------------------------------*/
 function callBackError(){
  const callbackBaseURL = inputParams["x-error"]
  const callBackURL = callbackBaseURL + "?errorMessage=" + errMsg;
  writeLOG("callBackURL Error :" + callBackURL);
  Safari.open(callBackURL);
  Script.complete();
 }

/*------------------------------------------------------------------
FUNCTION callBackSucess
------------------------------------------------------------------*/
function callBackSucess(inputParams, newBase64String){
  const callbackBaseURL = inputParams["x-success"]
  const callBackURL = callbackBaseURL + "?newImage=" + newBase64String;
  writeLOG("callBackURL Success :" + callBackURL);
  Safari.open(callBackURL);
  Script.complete();
}
