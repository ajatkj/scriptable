/*------------------------------------------------------------------------------------------------------
Script: LSWeather.js
Author: Ankit Jain (<ajatkj@yahoo.co.in>)
Date: 27.01.2021
------------------------------------------------------------------------------------------------------*/
// TODO: Replace the x-callback logic with Photos when Scriptable is updated to use specific albums in Photos

// This script takes a wallpaper as an input and generates a wallpaper with weather, calendar & other details. 
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
// To run the script an openweather API key is required. Get your own API key for free at: https://home.openweathermap.org/WEATHER_API_KEYs (account needed).
// Change the value of WEATHER_UNITS and WEATHER_LANG below as required. You can get valid values of WEATHER_UNITS & WEATHER_LANG at https://openweathermap.org/api/one-call-api.
// Change the values in the "layout" dictionary as per your liking. All relevant details are mentioned below.

// Below values are used when run from Scritapble app
const WALLPAPER_PATH = "LSWallpapers";
const WALLPAPER_NAME = "wallpaper.jpg";

// Logging parameters
const LOG_FILE_NAME = "LSWeather.txt";
const LOG_FILE_PATH = "LSWeatherLogs";
let LOG_STEP = 1;

// ============================================== CONFIGURABLE SECTION (START) ============================================== //

// Testing - set this to true if you don't want to call the API but test the layout with dummy data
const TESTING = true;

// Constants for openweather API call, change as per your requirement
const WEATHER_SHOW_WEATHER = true;
const WEATHER_UNITS = 'metric';
const WEATHER_LANG = 'en';

// If you desire to show details from any of the below weather data then remove that value from WEATHER_EXCLUDE and configure its key in the layout dictionary
const WEATHER_EXCLUDE = 'minutely,hourly,alerts';

// API key for openweather. 
const WEATHER_API_KEY = '';

// Constants for Calender Data
const CALENDAR_SHOW_CALENDARS = true;
const CALENDAR_SHOW_ALL_DAY_EVENTS = true;
const CALENDAR_SHOW_TOMORROW_EVENTS = true;
const CALENDAR_WORK_CALENDARS = []; // Leave blank if you don't want to display any work calendar
const CALENDAR_WORK_MAX_EVENTS = 3;
const CALENDAR_PERSONAL_CALENDARS = []; // Leave blank for using defualt iOS Calendar
const CALENDAR_PERSONAL_MAX_EVENTS = 3;
const CALENDAR_NO_EVENTS_TEXT = 'No Upcoming Events';
const CALENDAR_NOT_SET_TEXT = 'Calendar Not Set';

// Constants for Quotes
// You can find all available tags at https://api.quotable.io/tags
const QUOTE_SHOW_QUOTES = true;
const QUOTE_TAGS = ['wisdom','friendship'];
const QUOTE_MAX_LENGTH = 100; // Maximum characters of quote to be fetched, shorter quotes look better than big quotes on lock screen
const QUOTE_WRAP_LENGTH = 50; // Wrap quote at this length. Words are not broked, text is wrapped before word is broken

// Some predefined layouts - 'custom','welcome','minimalWeather','feelMotivated','mimimalCalendar','showMyWork';
const LAYOUT = 'welcome';

let welcome = {
  welcomeGreeting: {source: "function", key: "greetingText()", prefix: "", suffix: "", x: "center", y: "center - 150", w: "full", h: 100, font: "veryLarge", color: "light",  align: "center", hide: 0},
  welcomeClimate: {source: "function", key: "weatherText(weatherData)", prefix: "", suffix: "", x: "center", y: "center", w: "full", h: 100, font: "medium", color: "light",  align: "center", hide: 0},
  welcomeTemp: {source: "weather", key: "temp", prefix: "SFSymbol|weatherID", suffix: "temperature", x: "center", y: "center + 150", w: 100, h: 120, font: "extraLarge", color: "light",  align: "center"},
  welcomeCalendar: {source: "function", key: "calendarText(calendarData)", prefix: null, suffix: null, x: "center", y: "center + 300", w: "full", h: 120, font: "small", color: "light",  align: "center"},
};

let minimalWeather = {
  weatherID: {source: "weather", key: "weatherID", prefix: "SFSymbol|weatherID", suffix: null, x: -90, y: 130, w: 100, h: 120, font: "large", color: "light", align: "center"},
  temp: {source: "weather", key: "temp", prefix: null, suffix: "temperature", x: -100, y: 220, w: 100, h: 50, font: "medium", color: "light",  align: "center"},
  mainDescription: {source: "weather", key: "mainDesc", prefix: null, suffix: null, x: -100, y: 380, w: 120, h: 50, font: "extraSmall", color: "light", align: "center"},
  location: {source: "weather", key: "loc", prefix: "SFSymbol|mappin.and.ellipse", suffix: null, x: "center", y: 660, w: "half", h: 50, font: "small", color: "light", align: "center"},
  wind: {source: "weather", key: "wind", prefix: "SFSymbol|wind", suffix: "speed", x: -100, y: 280, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center"},
  sunrise: {source: "weather", key: "sunrise", prefix: "SFSymbol|sunrise.fill", suffix: "", x: -100, y: 330, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
  sunset: {source: "weather", key: "sunset", prefix: "SFSymbol|sunset.fill", suffix: "", x: -100, y: 330, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
};

let feelMotivated = {
  quotewithAuthor: {source: "quote", key: "quoteWithAuthor", prefix: "", suffix: "", x: "right_margin", y: 2050, w: "full", h: 50, font: "small", color: "light",  align: "center", hide: 0},
};

let showMyWork = {
  weatherID: {source: "weather", key: "weatherID", prefix: "SFSymbol|weatherID", suffix: null, x: -90, y: 130, w: 100, h: 120, font: "large", color: "light", align: "center"},
  temp: {source: "weather", key: "temp", prefix: null, suffix: "temperature", x: -100, y: 220, w: 100, h: 50, font: "medium", color: "light",  align: "center"},
  mainDescription: {source: "weather", key: "mainDesc", prefix: null, suffix: null, x: -100, y: 380, w: 120, h: 50, font: "extraSmall", color: "light", align: "center"},
  location: {source: "weather", key: "loc", prefix: "SFSymbol|mappin.and.ellipse", suffix: null, x: "center", y: 660, w: "half", h: 50, font: "small", color: "light", align: "center"},
  wind: {source: "weather", key: "wind", prefix: "SFSymbol|wind", suffix: "speed", x: -100, y: 280, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center"},
  sunrise: {source: "weather", key: "sunrise", prefix: "SFSymbol|sunrise.fill", suffix: "", x: -100, y: 330, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
  sunset: {source: "weather", key: "sunset", prefix: "SFSymbol|sunset.fill", suffix: "", x: -100, y: 330, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
  personalText: {source: "text", key: "H O M E", prefix: "SFSymbol|house", suffix: "", x: "left_margin", y: 940, w: "half", h: 60, font: "large", color: "light",  align: "center", hide: 0},
  personalEvents: {source: "calendar", key: "personalEvents", prefix: "", suffix: "", x: "left_margin", y: 1020, w: "half", h: 50, font: "extraSmall", color: "light",  align: "center", hide: 0},
  workText: {source: "text", key: "W O R K", prefix: "SFSymbol|desktopcomputer", suffix: "", x: "right_margin", y: 940, w: "half", h: 60, font: "large", color: "light",  align: "center", hide: 0},
  workEvents: {source: "calendar", key: "workEvents", prefix: "", suffix: "", x: "right_margin", y: 1020, w: "half", h: 50, font: "extraSmall", color: "light",  align: "center", hide: 0},
};

let minimalCalendar = {
  weatherID: {source: "weather", key: "weatherID", prefix: "SFSymbol|weatherID", suffix: null, x: -90, y: 130, w: 100, h: 120, font: "large", color: "light", align: "center"},
  temp: {source: "weather", key: "temp", prefix: null, suffix: "temperature", x: -100, y: 220, w: 100, h: 50, font: "medium", color: "light",  align: "center"},
  mainDescription: {source: "weather", key: "mainDesc", prefix: null, suffix: null, x: -100, y: 380, w: 120, h: 50, font: "extraSmall", color: "light", align: "center"},
  location: {source: "weather", key: "loc", prefix: "SFSymbol|mappin.and.ellipse", suffix: null, x: "center", y: 660, w: "half", h: 50, font: "small", color: "light", align: "center"},
  wind: {source: "weather", key: "wind", prefix: "SFSymbol|wind", suffix: "speed", x: -100, y: 280, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center"},
  sunrise: {source: "weather", key: "sunrise", prefix: "SFSymbol|sunrise.fill", suffix: "", x: -100, y: 330, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
  sunset: {source: "weather", key: "sunset", prefix: "SFSymbol|sunset.fill", suffix: "", x: -100, y: 330, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
  personalText: {source: "text", key: "M Y  D A Y", prefix: "SFSymbol|calendar", suffix: "", x: "center + 30", y: "center - 100", w: "full", h: 60, font: "large", color: "light",  align: "center", hide: 0},
  personalEvents: {source: "calendar", key: "personalEvents", prefix: "", suffix: "", x: "center", y: "center", w: "half", h: 50, font: "extraSmall", color: "light",  align: "center", hide: 0},
};

let maximalWeather = {
  weatherID: {source: "weather", key: "weatherID", prefix: "SFSymbol|weatherID", suffix: null, x: "center + 20 ", y: "center - 200", w: "half", h: 200, font: "veryBig", color: "light", align: "center"},
  temp: {source: "weather", key: "temp", prefix: null, suffix: "temperature", x: "center + 20", y: "center", w: "half", h: 200, font: "big", color: "light",  align: "center"},
  highTemp: {source: "weather", key: "high", prefix: "SFSymbol|arrow.up", suffix: "temperature", x: "center - 175", y: "center - 50", w: 50, h: 30, font: "extraSmall", color: "light", align: "left", hide: 0},
  lowTemp: {source: "weather", key: "low", prefix: "SFSymbol|arrow.down", suffix: "temperature", x: "center - 175", y: "center", w: 50, h: 30, font: "extraSmall", color: "light", align: "left", hide: 0},
  mainDescription: {source: "weather", key: "mainDesc", prefix: null, suffix: null, x: "center", y: "center + 150", w: 150, h: 50, font: "small", color: "light", align: "center", hide: 1},
  feelsLike: {source: "weather", key: "feelsLike", prefix: "... but feels like ", suffix: "temperature", x: "center", y: "center + 60", w: 400, h: 50, font: "small", color: "light", align: "center", hide: 0},
  humidity: {source: "weather", key: "humidity", prefix: "Humidity ", suffix: "%", x: "left_margin", y: "center + 150", w: "half - 50", h: 50, font: "medium", color: "light", align: "right", hide: 0},
  wind: {source: "weather", key: "wind", prefix: "Wind ", suffix: "speed", x: "right_margin", y: "center + 150", w: "half - 50", h: 50, font: "medium", color: "light",  align: "left"},
  pressure: {source: "weather", key: "pressure", prefix: "Pressure ", suffix: "hPa", x: "left_margin", y: "center + 225", w: "half - 50", h: 50, font: "medium", color: "light",  align: "right", hide: 0},
  uvi: {source: "weather", key: "uvi", prefix: "UV ", suffix: "", x: "right_margin", y: "center + 225", w: "half - 50", h: 50, font: "medium", color: "light",  align: "left", hide: 0},
  dewPoint: {source: "weather", key: "dewPoint", prefix: "Dew point ", suffix: "temperature", x: "left_margin", y: "center + 300", w: "half - 50", h: 50, font: "medium", color: "light",  align: "right", hide: 0},
  visibility: {source: "weather", key: "visibility", prefix: "Visibility ", suffix: "km", x: "right_margin", y: "center + 300", w: "half - 50", h: 50, font: "medium", color: "light",  align: "left", hide: 0},
  sunrise: {source: "weather", key: "sunrise", prefix: "SFSymbol|sunrise.fill", suffix: "", x: "left_margin", y: "center + 375", w: "half - 50", h: 50, font: "medium", color: "light",  align: "right", hide: 0},
  sunset: {source: "weather", key: "sunset", prefix: "SFSymbol|sunset.fill", suffix: "", x: "right_margin", y: "center + 375", w: "half - 50", h: 50, font: "medium", color: "light",  align: "left", hide: 0},
  description: {source: "weather", key: "desc", prefix: null, suffix: " today.", x: "right_margin", y: "center + 450", w: "full", h: 50, font: "small", color: "light", align: "center", hide: 0},
};

// source: Source of the data. Valid values are "weather", "calendar", "quote", "function" and "text".
// key: JSON key returned by functions fetchWeather(), fetchCalendar(), fetchQuote(). When source is "text", key will be displayed as data.
// prefix: If present, will be prefixed to the data. SFSymbols are allowed in prefix. Use "SFSymbol|symbolName".
// suffix: If present, will be suffixed to the data. Use "temperature" for temperature data and "speed" for wind data, any other string accepted.
// x: x co-ordinate of the data element. Valid values are "left_margin", "right_margin", "center" and numbers. Anything else will be defaulted to "left_margin".
//    Use -ve values to start from right margin i.e -50 will place the element at 50 pixels from the right margin.
// y: y co-ordinate of the data element. Valid values are numbers.
//    Use -ve values to start from bottom margin i.e -50 will place the element at 50 pixels from the bottom margin.
// w: Width of the data element. Valid values are "half", "full" and numbers. Anything else will be defaulted to DEFAULT_MARGIN
// h: Height of the data element. Valid values are numbers.
// font: Font for the data element. Valid values are Font type object. Can be null.
// color: Color for the data element (except icon). Valid values are "light", "dark" or hex code of the color. If null, white will be used.
// align: Alignment of the data element within the data rectangle. Valid values are "left", "right" or "center".
// hide: 0 or null to show this data element, 1 to hide, 2 for sunrise/sunset only (to show only 1 of them based on the time of the day).
// field: [source,key,prefix,suffix,x,y,width,height,font,color,align,hide]
let custom = {
  weatherID: {source: "weather", key: "weatherID", prefix: "SFSymbol|weatherID", suffix: null, x: -90, y: 130, w: 100, h: 120, font: "large", color: "light", align: "center"},
  lowTemp: {source: "weather", key: "low", prefix: null, suffix: "temperature", x: "left_margin", y: 375, w: 100, h: 75, font: "small", color: "light", align: "left", hide: 1},
  highTemp: {source: "weather", key: "high", prefix: null, suffix: "temperature", x: "left_margin", y: 200, w: 100, h: 75, font: "small", color: "light", align: "left", hide: 1},
  feelsLike: {source: "weather", key: "feelsLike", prefix: null, suffix: "temperature", x: "left_margin", y: 200, w: 100, h: 75, font: "small", color: "light", align: "left", hide: 1},
  humidity: {source: "weather", key: "humidity", prefix: null, suffix: "%", x: "left_margin", y: 200, w: 100, h: 75, font: "small", color: "light", align: "left", hide: 1},
  temp: {source: "weather", key: "temp", prefix: null, suffix: "temperature", x: -100, y: 220, w: 100, h: 50, font: "medium", color: "light",  align: "center"},
  mainDescription: {source: "weather", key: "mainDesc", prefix: null, suffix: null, x: -100, y: 380, w: 120, h: 50, font: "extraSmall", color: "light", align: "center"},
  description: {source: "weather", key: "desc", prefix: null, suffix: null, x: "center", y: 650, w: "half", h: 30, font: "extraSmall", color: "light", align: "center", hide: 1},
  location: {source: "weather", key: "loc", prefix: "SFSymbol|mappin.and.ellipse", suffix: null, x: "center", y: 660, w: "half", h: 50, font: "small", color: "light", align: "center"},
  icon: {source: "weather", key: "icon", prefix: null, suffix: null, x: -100, y: 120, w: 100, h: 100, font: null, color: "light", align: "center", hide: 1},
  wind: {source: "weather", key: "wind", prefix: "SFSymbol|wind", suffix: "speed", x: -100, y: 280, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center"},
  sunrise: {source: "weather", key: "sunrise", prefix: "SFSymbol|sunrise.fill", suffix: "", x: -100, y: 330, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
  sunset: {source: "weather", key: "sunset", prefix: "SFSymbol|sunset.fill", suffix: "", x: -100, y: 330, w: 120, h: 50, font: "extraSmall", color: "light",  align: "center", hide: 2},
  personalText: {source: "text", key: "H O M E", prefix: "SFSymbol|house", suffix: "", x: "left_margin", y: 940, w: "half", h: 60, font: "large", color: "light",  align: "center", hide: 1},
  personalEvents: {source: "calendar", key: "personalEvents", prefix: "", suffix: "", x: "left_margin", y: 1020, w: "half", h: 50, font: "extraSmall", color: "light",  align: "center", hide: 0},
  workText: {source: "text", key: "W O R K", prefix: "SFSymbol|desktopcomputer", suffix: "", x: "right_margin", y: 940, w: "half", h: 60, font: "large", color: "light",  align: "center", hide: 1},
  workEvents: {source: "calendar", key: "workEvents", prefix: "", suffix: "", x: "right_margin", y: 1020, w: "half", h: 50, font: "extraSmall", color: "light",  align: "center", hide: 0},
  quote: {source: "quote", key: "quote", prefix: "", suffix: "", x: "right_margin", y: 1500, w: "full", h: 50, font: "extraSmall", color: "light",  align: "center", hide: 1},
  author: {source: "quote", key: "author", prefix: "", suffix: "", x: "right_margin", y: 1500, w: "full", h: 50, font: "extraSmall", color: "light",  align: "center", hide: 1},
  quoteText: {source: "text", key: "Quote of the Day", prefix: "", suffix: "", x: "right_margin", y: 2000, w: "full", h: 50, font: "medium", color: "light",  align: "center", hide: 0},
  quotewithAuthor: {source: "quote", key: "quoteWithAuthor", prefix: "", suffix: "", x: "right_margin", y: 2050, w: "full", h: 50, font: "small", color: "light",  align: "center", hide: 0},
  welcomeGreeting: {source: "function", key: "greetingText()", prefix: "", suffix: "", x: "center", y: "center - 150", w: "full", h: 100, font: "veryLarge", color: "light",  align: "center", hide: 0},
  welcomeClimate: {source: "function", key: "weatherText(weatherData)", prefix: "", suffix: "", x: "center", y: "center", w: "full", h: 100, font: "medium", color: "light",  align: "center", hide: 0},
  welcomeTemp: {source: "weather", key: "temp", prefix: "SFSymbol|weatherID", suffix: "temperature", x: "center", y: "center + 150", w: 100, h: 120, font: "extraLarge", color: "light",  align: "center"},
};
// ============================================== CONFIGURABLE SECTION (END) ============================================== //

let layout;
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
const HEADER_RSIZE = "+1";
const DETAIL_RSIZE = "1";
const FOOTER_RSIZE = "-1";

// Define fonts and sizes
const SYSTEM_FONT_NAME = "SF-Pro-Text";   /* These variables are used to calculate the width of text */
const SYSTEM_FONT_WEIGHT = "Normal";      /* in pixel. If you're changing the font then update these as well */

const ULTRA_SMALL_TEXT_SIZE = 20;
const EXTRA_SMALL_TEXT_SIZE = 30;
const SMALL_TEXT_SIZE = 35;
const MEDIUM_TEXT_SIZE = 40;
const LARGE_TEXT_SIZE = 60;
const VERY_LARGE_TEXT_SIZE = 80;
const EXTRA_LARGE_TEXT_SIZE = 100;
const BIG_TEXT_SIZE = 120;
const VERY_BIG_TEXT_SIZE = 140;
const DEFAULT_TEXT_SIZE = 40;

const allfonts = {
  ultraSmall: {size: ULTRA_SMALL_TEXT_SIZE, font: Font.systemFont(ULTRA_SMALL_TEXT_SIZE)},
  extraSmall: {size: EXTRA_SMALL_TEXT_SIZE, font: Font.systemFont(EXTRA_SMALL_TEXT_SIZE)}, 
  small: {size: SMALL_TEXT_SIZE, font: Font.systemFont(SMALL_TEXT_SIZE)}, 
  medium: {size: MEDIUM_TEXT_SIZE, font: Font.systemFont(MEDIUM_TEXT_SIZE)}, 
  large: {size: LARGE_TEXT_SIZE, font: Font.systemFont(LARGE_TEXT_SIZE)}, 
  veryLarge: {size: VERY_LARGE_TEXT_SIZE, font: Font.systemFont(VERY_LARGE_TEXT_SIZE)},
  extraLarge: {size: EXTRA_LARGE_TEXT_SIZE, font: Font.systemFont(EXTRA_LARGE_TEXT_SIZE)},
  big: {size: BIG_TEXT_SIZE, font: Font.systemFont(BIG_TEXT_SIZE)},
  veryBig: {size: VERY_BIG_TEXT_SIZE, font: Font.systemFont(VERY_BIG_TEXT_SIZE)},
  default: {size: DEFAULT_TEXT_SIZE, font: Font.systemFont(DEFAULT_TEXT_SIZE)}
}

// URLs to fetch weather data and icons and quotes
// DO NOT CHANGE !!
const baseWeatherURL='https://api.openweathermap.org/data/2.5/onecall';
const baseWeatherIconURL='http://openweathermap.org/img/wn';
const baseQuotesURL='https://api.quotable.io/random';

const defaultWeatherDataForTesting = {
  loc: 'MUMBAI',
  weatherID: '500',
  mainDesc: 'Tornado',
  desc: 'thunderstorm with heavy drizzle',
  feelsLike: '23',
  dewPoint: '13',
  visibility: '10',
  pressure: '1012',
  uvi: '6',
  humidity: '10',
  temp: '21',
  wind: '40',
  high: '26',
  low: '18',
  icon: '50d',
  sunrise: '07:15',
  sunset: '06:26',
  isNight: false
};

const unknownWeatherData = {
  loc: 'UNKNOWN',
  weatherID: '999',
  desc: 'No weather data for you',
  feelsLike: '?',
  dewPoint: '?',
  visibility: '?',
  pressure: '?',
  uvi: '6',
  humidity: '?',
  temp: '?',
  wind: '?',
  high: '?',
  low: '?',
  icon: '?',
  sunrise: '?',
  sunset: '?',
  isNight: false
};

const unknownQuotesData = {
  quote: "Whether you think you can or think you can't, you're right.",
  author: "Henry Ford",
  quoteWithAuthor: [["1", "Whether you think you can or think you can't, you're right."],["-1", "[Henry Ford]"]]
}

const unknownCalendarData = {
  personalEvents: [['+1', 'Yay! No work!!']],
  workEvents: [['+1', 'Yay! No work!!']],
  pEventsTodayCount: 0, 
  pEventsTodayAllDayCount: 0, 
  pEventsTomorrowAllDayCount: 0, 
  pEventsTomorrowCount: 0,
  wEventsTodayCount: 0, 
  wEventsTodayAllDayCount: 0, 
  wEventsTomorrowAllDayCount: 0, 
  wEventsTomorrowCount: 0,
}

let inputParams = args.queryParameters;

const DEVICE_RESOLUTION = Device.screenResolution();
const DEVICE_SCALE = Device.screenScale();

/* Start script */

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

const calendarData = await fetchCalendar();
const weatherData = await fetchWeather();
const quotesData = await fetchQuotes();

try {
  await updateLayout(weatherData.isNight, weatherData.weatherID);
  const newWallapaper = await createNewWallpaper(WALLPAPER, weatherData, calendarData, quotesData);
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
  if (!WEATHER_SHOW_WEATHER) return unknownWeatherData;

  if (TESTING) return defaultWeatherDataForTesting;

  let response;

  Location.setAccuracyToThreeKilometers();
  locationData = await Location.current();
  const latitude = locationData.latitude;
  const longitude = locationData.longitude;
  const address = await Location.reverseGeocode(locationData.latitude, locationData.longitude);
  const weatherURL = baseWeatherURL + '?lat=' + latitude + '&lon=' + longitude + '&exclude=' + WEATHER_EXCLUDE + '&units=' + WEATHER_UNITS + '&lang=' + WEATHER_LANG + '&appid=' + WEATHER_API_KEY;
  
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
    loc: address[0].locality.toUpperCase(),
    weatherID: response.current.weather[0].id.toString(),
    desc: response.current.weather[0].description,
    mainDesc: response.current.weather[0].main,
    temp: Math.round(response.current.temp).toString(),
    feelsLike: Math.round(response.current.feels_like).toString(),
    humidity: Math.round(response.current.humidity).toString(),
    dewPoint: Math.round(response.current.dew_point).toString(),
    visibility: (Math.round(response.current.visibility) / 1000).toString(),
    pressure: response.current.pressure.toString(),
    uvi: response.current.uvi.toString(),
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
    const iconURL = baseWeatherIconURL + "/" + iconID + "@2x.png";
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
async function createNewWallpaper(wallpaper, weatherData, calendarData, quotesData) {
  try {
    let imgCanvas=new DrawContext();
    imgCanvas.size = DEVICE_RESOLUTION;
    const mainRect = new Rect(0,0,DEVICE_RESOLUTION.width,DEVICE_RESOLUTION.height);
    imgCanvas.drawImageInRect(wallpaper,mainRect);
    
    // Place elements on wallpaper
    let x, y, w, h, rect, font, color, iconImage;
    for (let item in layout){
      source = layout[item].source;
      x = layout[item].x;
      y = layout[item].y;
      w = layout[item].w;
      h = layout[item].h;
      font = layout[item].font;
      fontSize = layout[item].fontSize;
      fontName = layout[item].fontName;
      color = layout[item].color;
      align = layout[item].align;
      suffix = layout[item].suffix;
      prefix = layout[item].prefix;
      hide = layout[item].hide;
      repeat = false;

      if (source == 'weather') {
        element = eval(`${`weatherData.${layout[item].key}`}`);
      } else if (source == 'calendar') {
        element = eval(`${`calendarData.${layout[item].key}`}`);
      } else if (source == 'quote') {
        element = eval(`${`quotesData.${layout[item].key}`}`);
      } else if (source == 'function') {
        try {
          element = eval(`${layout[item].key}`)
        } catch (error) {
          errMsg = "getWeatherIcon_" + error.message.replace(/\s/g,"_");
          writeLOG(errMsg);
          element = "Invalid Function!";
        }
      } else {
        element = layout[item].key;
      } 

      if (typeof element  === 'undefined') {
        writeLOG(`Invalid item ${layout[item].key}`);
        continue; // Skip this element
      } else {
        if (Array.isArray(element)) repeat = true;
        writeLOG(`Processing item ${layout[item].key} with value ${element}`);
      }
      if (hide == 1) {
        writeLOG(`Hiding item ${layout[item].key}`);
        continue;
      }

      rect = new Rect(x,y,w,h)

      imgCanvas.setTextColor(new Color(color));

      if (align == 'left') imgCanvas.setTextAlignedLeft();
      else if (align == 'right') imgCanvas.setTextAlignedRight();
      else imgCanvas.setTextAlignedCenter();

      imgCanvas.setFont(font);

      if (item == 'icon') { // processing icon seperately since it is an image
        iconImage = await getWeatherIcon(element, weatherData.isNight);
        imgCanvas.drawImageInRect(iconImage,rect);
      } else { // Processing everything else
        if (repeat) { // If the element is an Array (for personal & work events)
          y = y - h;
          for (const e of element){
            // If inner element is also array, we are expecting 2 values - relative font size and data
            // Size is relative to original size i.e +1, 1 or -1
            if (Array.isArray(e)) {
              relativeSize = e[0];
              e0 = e[1];
              let delta = 0;
              if (relativeSize == FOOTER_RSIZE) delta = -10;
              else delta = 0;
              newFont = getRelativeFont(fontName,relativeSize);
              imgCanvas.setFont(newFont);
              y = y + h + delta;
              rect = new Rect (x,y,w,h);              
            } else {
              e0 = e;
              y = y + h;
              imgCanvas.setFont(font);
              rect = new Rect (x,y,w,h);            
            }
            
            imgCanvas = await placeDataElement(imgCanvas, rect, e0, suffix, prefix, item);
          }
        } // Normal text element
        else {
          imgCanvas = await placeDataElement(imgCanvas, rect, element, suffix, prefix, item);
        }
      }
    }
    newImage=imgCanvas.getImage();
  } catch (error) {
    errMsg = "createNewWallpaper_" + error.message.replace(/\s/g,"_");
    writeLOG(errMsg);
    return;
  }
  return newImage;
}
/*------------------------------------------------------------------
FUNCTION getRelativeFont
------------------------------------------------------------------*/
function getRelativeFont(fontName, relativeSize){
  newFont = eval(`allfonts.${fontName}.font`);   // This is the default
  switch (fontName){
    case "ultraSmall": 
      if (relativeSize == "+1") newFont = allfonts.extraSmall.font;
      else newFont = allfonts.ultraSmall.font;
      break;
    case "extraSmall":
      if (relativeSize == "+1") newFont = allfonts.small.font;
      else if (relativeSize == "-1") newFont = allfonts.ultraSmall.font;
      else newFont = allfonts.extraSmall.font;
      break;
    case "small":
      if (relativeSize == "+1") newFont = allfonts.medium.font;
      else if (relativeSize == "-1") newFont = allfonts.extraSmall.font;
      else newFont = allfonts.small.font;
      break;
    case "medium":
      if (relativeSize == "+1") newFont = allfonts.large.font;
      else if (relativeSize == "-1") newFont = allfonts.small.font;
      else newFont = allfonts.medium.font;
      break;
    case "large":
      if (relativeSize == "+1") newFont = allfonts.veryLarge.font;
      else if (relativeSize == "-1") newFont = allfonts.medium.font;
      else newFont = allfonts.large.font;
      break;
    case "veryLarge":
      if (relativeSize == "+1") newFont = allfonts.extraLarge.font;
      else if (relativeSize == "-1") newFont = allfonts.large.font;
      else newFont = allfonts.veryLarge.font;
      break;
    case "extraLarge":
      if (relativeSize == "+1") newFont = allfonts.big.font;
      else if (relativeSize == "-1") newFont = allfonts.veryLarge.font;
      else newFont = allfonts.extraLarge.font;
      break;
    case "big":
      if (relativeSize == "+1") newFont = allfonts.veryBig.font;
      else if (relativeSize == "-1") newFont = allfonts.extraLarge.font;
      else newFont = allfonts.big.font;
      break;
    case "veryBig":
      if (relativeSize == "+1") newFont = allfonts.veryBig.font;
      else if (relativeSize == "-1") newFont = allfonts.big.font;
      else newFont = allfonts.veryBig.font;
      break;
    case "default":
      if (relativeSize == "+1") newFont = allfonts.large.font;
      else if (relativeSize == "-1") newFont = allfonts.small.font;
      else newFont = allfonts.default.font;
      break;
  }
  return newFont;
}
/*------------------------------------------------------------------
FUNCTION placeDataElement
------------------------------------------------------------------*/
async function placeDataElement(imgCanvas, rect, e, suffix, prefix, item){
  const x = layout[item].x;
  const y = layout[item].y;
  const w = layout[item].w;
  const h = layout[item].h;
  const align = layout[item].align;
  let element0 = e.slice(0, 1).toUpperCase() + e.slice(1, e.length)  // Capitalize first letter of the data  
  if ( suffix !== null) { 
    element0 = element0 + suffix
  }
  // Prefix can be a text value or SFSymbol
  if (prefix !== null) {
    if (typeof prefix == 'object') {  // if prefix is an image i.e. SFSymbol
        const prefix0 = await prefixImage(prefix, element0, item);
        let newX;
        const newY = y;
        const newH = h;
        const newW = prefix0.size.width;
        if (align == 'right'){
          newX = x + w - newW;
        } else if (align == 'left') {
          newX = x
        } else {
          newX = x + (w/2) - (newW/2)
        }
        rect = new Rect(newX, newY, newW, newH);
        imgCanvas.drawImageInRect(prefix0, rect);
        return imgCanvas;
    } else {
      element0 = prefix + element0;
    }
  }
  imgCanvas.drawTextInRect(element0,rect);
  return imgCanvas;
}
/*------------------------------------------------------------------
FUNCTION prefixImage
------------------------------------------------------------------*/
async function prefixImage(prefixImage, text, item){
  let prefixCanvas;
  let gap;
  try {
    const oW = layout[item].w;  // original width
    const oH = layout[item].h;  // original height
    const font = layout[item].font;
    const fontSize = layout[item].fontSize;
    const fontSizeInPx = Math.ceil(layout[item].fontSize / DEVICE_SCALE + 1) + "px";
    const color = layout[item].color;
    const pW = prefixImage.size.width; // prefix width
    const pH = prefixImage.size.height; // prefix height
    const dW = (await getTextWidth(text, SYSTEM_FONT_WEIGHT + " " + fontSizeInPx + " " + SYSTEM_FONT_NAME)) * DEVICE_SCALE;

    if (fontSize <= 40) gap = 4;
    else if (fontSize <= 100) gap = 10;
    else if (fontSize > 100) gap = 20;

    // Create a new canvas for prefixImage + text of size item
    prefixCanvas=new DrawContext();
    prefixCanvas.opaque = false;
    prefixCanvas.size = new Size(pW + dW + gap,oH);

    // Draw prefixImage at (x,y) = (0,0)
    prefixCanvas.drawImageAtPoint(prefixImage, new Point(0,0));
    
    const dataRect = new Rect(pW + gap,0,dW,oH);
    prefixCanvas.setTextColor(new Color(color));
    prefixCanvas.setFont(font);
    prefixCanvas.setTextAlignedLeft();
    prefixCanvas.drawTextInRect(text, dataRect);
  } catch (error) {
    errMsg = "prefixImage_" + error.message.replace(/\s/g,"_");
    writeLOG(errMsg);
    return;
  }
  return prefixCanvas.getImage();
}
/*------------------------------------------------------------------
FUNCTION updateLayout
------------------------------------------------------------------*/
async function updateLayout(isNight, weatherID){
  const validLayouts = ['custom','welcome','minimalWeather','feelMotivated','minimalCalendar','showMyWork','maximalWeather'];
  layout = eval(validLayouts.includes(LAYOUT) ? LAYOUT : 'custom');
  try {
    const imageSize=DEVICE_RESOLUTION;
    let TEMPERATURE_UNIT;
    let SPEED_UNIT; 
    // set constants based on UNITS
    if (WEATHER_UNITS == 'imperial'){
        TEMPERATURE_UNIT = "°";
        SPEED_UNIT = "mph";
    } else if (WEATHER_UNITS == 'metric') {
        TEMPERATURE_UNIT = "°";
        SPEED_UNIT = "m/s";
    } else { // when WEATHER_UNITS is not applied or "standard"
        TEMPERATURE_UNIT = "°";
        SPEED_UNIT = "m/s";
    }  
    // loop through the layout dictionary and update necessary dynamic data
    for (let item in layout){
      // Hide elements if set
      if (!CALENDAR_SHOW_CALENDARS && layout[item].source == 'calendar') layout[item].hide = 1;
      if (!QUOTE_SHOW_QUOTES && layout[item].source == 'quote') layout[item].hide = 1;
      if (!WEATHER_SHOW_WEATHER && layout[item].source == 'weather') layout[item].hide = 1;

      // Evaluate width & height 
      layout[item].w = parseWidthHeight("w",layout[item].w);
      layout[item].h = parseWidthHeight("h",layout[item].h);

      // Evaluate x & y co-ordinates
      layout[item].x = parseCoordinates("x",layout[item].w,layout[item].x);
      layout[item].y = parseCoordinates("y",layout[item].h,layout[item].y);

      // Evaluate suffix for temperature and speed units
      if (layout[item].suffix == "temperature") layout[item].suffix = TEMPERATURE_UNIT;
      else if (layout[item].suffix == "speed") layout[item].suffix = SPEED_UNIT;
      
      // Evaluate color
      if (layout[item].color == "light") {
        if (!useDarkColor) layout[item].color = LIGHT_COLOR;
        else layout[item].color = DARK_COLOR;
      } else if (layout[item].color == "dark") {
        if (!useDarkColor) layout[item].color = LIGHT_COLOR;
        else layout[item].color = DARK_COLOR;
      }
      
      // Evaluate font
      if (layout[item].font === null) {
        layout[item].font = allfonts.default.font;
        layout[item].size = allfonts.default.size;
        layout[item].fontName = "default";
      }
      else {
        const fontName = layout[item].font;
        layout[item].font = eval(`${`allfonts.${fontName}.font`}`);
        layout[item].fontSize = eval(`${`allfonts.${fontName}.size`}`); // insert new field in the layout, fontSize
        layout[item].fontName = fontName;
      }

      // Evaluate prefix
      if (layout[item].prefix !== null && layout[item].hide != 1){
        // Prefix of the form SFSymbol|symbolname
        if (layout[item].prefix.split("|")[0] == "SFSymbol"){
          let symbolName = layout[item].prefix.split("|")[1];
          if (symbolName == 'weatherID') {
            symbolName = getWeatherSymbol(weatherID,isNight);
            // Change this to text type to show only symbol
            if (layout[item].key == 'weatherID'){
              layout[item].source = "text";
              layout[item].key = "";
            }
          }
          const symbol = SFSymbol.named(symbolName);
          symbol.applyFont(layout[item].font);
          // Tint using a custom function - Thanks to user [schl3ck] https://talk.automators.fm/u/schl3ck
          layout[item].prefix = await tintSFSymbol(symbol.image, new Color(layout[item].color));
        }
        // Everything else remains untouched
      }

      // Evaluate hide based on sunset/sunrise time
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
FUNCTION parseWidthHeight
------------------------------------------------------------------*/
function parseWidthHeight(wh,field){
  const imageSize=DEVICE_RESOLUTION;
  let half,full;
  if (wh == 'w') {
    half = imageSize.width/2;
    full = imageSize.width;
  } else {
    half = imageSize.height/2;
    full = imageSize.height;
  }
  return eval(`${field}`);
}
/*------------------------------------------------------------------
FUNCTION parseCoordinates
------------------------------------------------------------------*/
function parseCoordinates(xy,wh,field){
  const imageSize=DEVICE_RESOLUTION;
  let left_margin, right_margin, center, top_margin, bottom_margin;
  if (xy == 'x') {
    left_margin = 0;
    right_margin = imageSize.width - wh;
    center = (imageSize.width/2) - (wh/2);
    if (field < 0) field = "right_margin - " + (field * -1);
  } else {
    top_margin = 0;
    bottom_margin = imageSize.height - wh;
    center = (imageSize.height/2) - (wh/2);
    if (field < 0) field = "bottom_margin - " + (field * -1);
  }
  return eval(`${field}`);
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
  } else return "exclamationmark.circle"
}
/*------------------------------------------------------------------
FUNCTION fetchQuotes
------------------------------------------------------------------*/
async function fetchQuotes(){
  if (!QUOTE_SHOW_QUOTES) return unknownQuotesData;

  if (TESTING) return unknownQuotesData;

  let response;

  const quotesURL = baseQuotesURL + '?maxLength=' + QUOTE_MAX_LENGTH + '&tags=' + QUOTE_TAGS.join('%7C'); // %7C is code for |
  
  try {
    writeLOG(`Fetching quotes at url: ${quotesURL}`);
    const request = new Request(quotesURL);
    response = await request.loadJSON();
  } catch (error) {
      writeLOG(`Couldn't fetch quotes from ${quotesURL}`);
      return unknownQuotesData;
  }
  writeLOG("JSON Quotes Data: " + JSON.stringify(response));
  let quoteWithAuthor = [];
  // Wrap text 
  let wrapText = (s, w) => s.replace(
    new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), ' $1| '
  );
  quoteWithAuthor = wrapText(response.content,QUOTE_WRAP_LENGTH).split('|');
  quoteWithAuthor.push([DETAIL_RSIZE, "[" + response.author + "]"]);
  return {
    quote: response.content,
    author: response.author,
    quoteWithAuthor: quoteWithAuthor,
    length: response.length
  }
}
/*------------------------------------------------------------------
FUNCTION fetchCalendar
------------------------------------------------------------------*/
async function fetchCalendar() {
  if (!CALENDAR_SHOW_CALENDARS) return unknownCalendarData;
  let pEventsToday = [];
  let pEventsTomorrow = [];
  let wEventsToday = [];
  let wEventsTomorrow = [];
  let pEventsTodayCount = 0;
  let pEventsTodayAllDayCount = 0;
  let pEventsTomorrowCount = 0;
  let pEventsTomorrowAllDayCount = 0;
  let wEventsTodayCount = 0;
  let wEventsTodayAllDayCount = 0;
  let wEventsTomorrowCount = 0;
  let wEventsTomorrowAllDayCount = 0;

  // Fetch all personal calendar events for today and tomorrow
  for (const calendarName of CALENDAR_PERSONAL_CALENDARS) {
    const calendar = await Calendar.forEventsByTitle(calendarName);
    const todayEvents = await CalendarEvent.today([calendar]);
    for (const e of todayEvents) pEventsToday.push(e);
    if (CALENDAR_SHOW_TOMORROW_EVENTS){
      const tomorrowEvents = await CalendarEvent.tomorrow([calendar]);
      for (const e of tomorrowEvents) pEventsTomorrow.push(e);
    }
  }

  // If personal calendar not set, fetch default calendar for events
  if (CALENDAR_PERSONAL_CALENDARS.length == 0){
    const calendar = await Calendar.defaultForEvents();
    const todayEvents = await CalendarEvent.today([calendar]);
    for (const e of todayEvents) pEventsToday.push(e);
    if (CALENDAR_SHOW_TOMORROW_EVENTS){
      const tomorrowEvents = await CalendarEvent.tomorrow([calendar]);
      for (const e of tomorrowEvents) pEventsTomorrow.push(e);
    }
  }
  
  // Fetch all work calendar events for today and tomorrow
  if (CALENDAR_WORK_CALENDARS.length > 0) {
    for (const calendarName of CALENDAR_WORK_CALENDARS) {
      const calendar = await Calendar.forEventsByTitle(calendarName);
      const todayEvents = await CalendarEvent.today([calendar]);
      for (const e of todayEvents) wEventsToday.push(e);
      if (CALENDAR_SHOW_TOMORROW_EVENTS) {
        const tomorrowEvents = await CalendarEvent.tomorrow([calendar]);
        for (const e of tomorrowEvents) wEventsTomorrow.push(e);
      }
    }
  }
  
  // Filter out expired events from the event list
  pEventsToday = pEventsToday.filter(e => (new Date(e.endDate)).getTime() >= (new Date()).getTime());
  wEventsToday = wEventsToday.filter(e => (new Date(e.endDate)).getTime() >= (new Date()).getTime());

  // Filter out all day events if required
  if (!CALENDAR_SHOW_ALL_DAY_EVENTS) {
    pEventsToday = pEventsToday.filter(e => !e.isAllDay);
    wEventsToday = wEventsToday.filter(e => !e.isAllDay);
    pEventsTomorrow = pEventsTomorrow.filter(e => !e.isAllDay);
    wEventsTomorrow = wEventsTomorrow.filter(e => !e.isAllDay);
  }
  // Sort array based on start time and put all day events at the end of the list
  pEventsToday = pEventsToday.sort(sortEvents);
  pEventsTomorrow = pEventsTomorrow.sort(sortEvents);
  wEventsToday = wEventsToday.sort(sortEvents);
  wEventsTomorrow = wEventsTomorrow.sort(sortEvents);

  pEventsTodayAllDayCount = pEventsToday.reduce((n, x) => n + (x.isAllDay), 0);
  pEventsTodayCount = pEventsToday.length - pEventsTodayAllDayCount;
  
  pEventsTomorrowAllDayCount = pEventsTomorrow.reduce((n, x) => n + (x.isAllDay), 0);
  pEventsTomorrowCount = pEventsTomorrow.length - pEventsTomorrowAllDayCount;

  wEventsTodayAllDayCount = wEventsToday.reduce((n, x) => n + (x.isAllDay), 0);
  wEventsTodayCount = wEventsToday.length - wEventsTodayAllDayCount;
  
  wEventsTomorrowAllDayCount = wEventsTomorrow.reduce((n, x) => n + (x.isAllDay), 0);
  wEventsTomorrowCount = wEventsTomorrow.length - wEventsTomorrowAllDayCount;

  // Format output array as required
  personalEvents = formatEvents(pEventsToday, pEventsTomorrow, CALENDAR_PERSONAL_MAX_EVENTS,false);
  workEvents = formatEvents(wEventsToday, wEventsTomorrow, CALENDAR_WORK_MAX_EVENTS,true);
  return {
    personalEvents: personalEvents, 
    workEvents: workEvents, 
    pEventsTodayCount: pEventsTodayCount, 
    pEventsTodayAllDayCount: pEventsTodayAllDayCount, 
    pEventsTomorrowAllDayCount: pEventsTomorrowAllDayCount, 
    pEventsTomorrowCount: pEventsTomorrowCount,
    wEventsTodayCount: wEventsTodayCount, 
    wEventsTodayAllDayCount: wEventsTodayAllDayCount, 
    wEventsTomorrowAllDayCount: wEventsTomorrowAllDayCount, 
    wEventsTomorrowCount: wEventsTomorrowCount,
   };
}
/*------------------------------------------------------------------
FUNCTION sortEvents
------------------------------------------------------------------*/
function sortEvents(e1,e2) {
  if (e1.isAllDay) return 1;
  else if (e2.isAllDay) return -1;
  else if ((new Date(e1.startDate)).getTime() < (new Date(e2.startDate)).getTime()) return -1;
  else if ((new Date(e1.startDate)).getTime() > (new Date(e2.startDate)).getTime()) return 1;
  else return 0;
}
/*------------------------------------------------------------------
FUNCTION formatEvents
------------------------------------------------------------------*/
function formatEvents(eventsToday, eventsTomorrow, maxEvents, isWork){
  let formatLine = [];
  let eventsToShow = 0;
  const today = new Date();
  let tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayText = "T O D A Y";
  const tomorrowText = "T O M O R R O W";

  if (isWork && CALENDAR_WORK_CALENDARS.length == 0) {
    formatLine.push([DETAIL_RSIZE, CALENDAR_NOT_SET_TEXT]);
    return formatLine;
  }

  formatLine.push([HEADER_RSIZE, todayText]);
  eventsToShow = 0;
  for (const e of eventsToday) {
    if (eventsToShow < maxEvents) {
      let prefix="";
      // Mark ongoing events
      if ((new Date(e.endDate)).getTime() >= today.getTime() && (new Date(e.startDate)).getTime() <= today.getTime() && !e.isAllDay) prefix = " 🔴 ";
      formatLine.push([DETAIL_RSIZE,prefix + e.title]);
      if (e.isAllDay) formatLine.push([FOOTER_RSIZE,"[ALL DAY]"]);
      else {
        if (!isSameDay(e.startDate,e.endDate)){
          if (isSameDay(e.startDate,today)) // Starts today but ends on a later date, show only start time
            formatLine.push([FOOTER_RSIZE,`[${formatTime(e.startDate)}]`]);
          else formatLine.push([FOOTER_RSIZE,`[Ends ${formatTime(e.endDate)}]`])   // Starts earlier but ends today
        } else {
          formatLine.push([FOOTER_RSIZE,`[${formatTime(e.startDate)} - ${formatTime(e.endDate)}]`]);
        }
      }
      eventsToShow++;
    }
  }
  if (eventsToShow == 0 && maxEvents > 0) formatLine.push([DETAIL_RSIZE, CALENDAR_NO_EVENTS_TEXT]);
  if (eventsToShow < eventsToday.length) formatLine.push([FOOTER_RSIZE, `${eventsToday.length - eventsToShow} more event(s)`]);

  if (!CALENDAR_SHOW_TOMORROW_EVENTS) return formatLine;

  formatLine.push([HEADER_RSIZE, tomorrowText]);
  eventsToShow = 0;
  for (const e of eventsTomorrow) {
    if (eventsToShow < maxEvents) {
      formatLine.push([DETAIL_RSIZE,e.title]);
      if (e.isAllDay) formatLine.push([FOOTER_RSIZE,"[ALL DAY]"]);
      else {
        if (!isSameDay(e.startDate,e.endDate)){
          if (isSameDay(e.startDate,tomorrow)) // Starts tomorrow but ends on a later date, show only start time
            formatLine.push([FOOTER_RSIZE,`[${formatTime(e.startDate)}]`]);
          else formatLine.push([FOOTER_RSIZE,`[Ends ${formatTime(e.endDate)}]`]);   // Starts earlier but ends tomorrow
        } else {
          formatLine.push([FOOTER_RSIZE,`[${formatTime(e.startDate)} - ${formatTime(e.endDate)}]`]);
        }
      }
      eventsToShow++;
    }
  }

  if (eventsToShow == 0 && maxEvents > 0) formatLine.push([DETAIL_RSIZE, CALENDAR_NO_EVENTS_TEXT]);
  if (eventsToShow < eventsTomorrow.length) formatLine.push([FOOTER_RSIZE, `${eventsTomorrow.length - eventsToShow} more event(s)`]);

  return formatLine;
}
/*------------------------------------------------------------------
FUNCTION tintSFSymbol
------------------------------------------------------------------*/
async function tintSFSymbol(image, color) {
  let html = `
  <img id="image" src="data:image/png;base64,${Data.fromPNG(image).toBase64String()}" />
  <canvas id="canvas"></canvas>
  `;
  
  let js = `
    let img = document.getElementById("image");
    let canvas = document.getElementById("canvas");
    let color = 0x${color.hex};
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    let imgData = ctx.getImageData(0, 0, img.width, img.height);
    // ordered in RGBA format
    let data = imgData.data;
    for (let i = 0; i < data.length; i++) {
      // skip alpha channel
      if (i % 4 === 3) continue;
      // bit shift the color value to get the correct channel
      data[i] = (color >> (2 - i % 4) * 8) & 0xFF
    }
    ctx.putImageData(imgData, 0, 0);
    canvas.toDataURL("image/png").replace(/^data:image\\/png;base64,/, "");
  `;
  let wv = new WebView();
  await wv.loadHTML(html);
  let base64 = await wv.evaluateJavaScript(js);
  const tintedImage = Image.fromData(Data.fromBase64String(base64));

  // Above function expands the image based on Device scale, resize it to original image size
  const symbolCanvas=new DrawContext();
  symbolCanvas.opaque = false;
  symbolCanvas.size = image.size;
  symbolCanvas.drawImageInRect(tintedImage, new Rect(0,0,image.size.width,image.size.height));
  return symbolCanvas.getImage();
}
/*------------------------------------------------------------------
FUNCTION getTextWidth
------------------------------------------------------------------*/
async function getTextWidth(text, font){
  const buffer = 5; // This is a temporary solution until I figure out why width returned is a bit short.
  const html = `<canvas id="canvas"></canvas>`;
  const js = `
    function getTextWidth() {
      let canvas = document.getElementById("canvas");
      let ctx = canvas.getContext("2d");
      ctx.font = "${font}";
      let metrics = ctx.measureText("${text}");
      return metrics.width;
    }
    getTextWidth();
  `;
  let wv = new WebView();
  await wv.loadHTML(html);
  const width = await wv.evaluateJavaScript(js);
  return Math.ceil(width) + buffer;
}
/*------------------------------------------------------------------
FUNCTION writeLOG
------------------------------------------------------------------*/
async function writeLOG(logMsg){
  if (useShortcut) {
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
function convertFromUTC(unixTimestamp){
  var date = new Date(unixTimestamp * 1000);
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var formattedTime = hours + ':' + minutes.substr(-2)
  return formattedTime;
}
/*------------------------------------------------------------------
FUNCTION formatTime
------------------------------------------------------------------*/
function formatTime(unformattedDate){
  let date = new Date(unformattedDate);
  let hours = "0" + date.getHours();
  let minutes = "0" + date.getMinutes();
  return hours.substr(-2) + ':' + minutes.substr(-2);
}
/*------------------------------------------------------------------
FUNCTION getTimeDiff
------------------------------------------------------------------*/
function getTimeDiff(date1, date2){
  var diff = date2.getTime() - date1.getTime(); // this is a time in milliseconds
  var diff_as_date = new Date(diff);
  const hours = diff_as_date.getUTCHours();
  const mins = diff_as_date.getUTCMinutes();
  let timeDiff;
  if (hours > 0) {
    if (hours == 1) timeDiff = hours + " hr "
    else timeDiff = hours + " hrs ";
  }
  if (mins > 0) timeDiff = timeDiff + mins + " mins";
  return timeDiff;
}
/*------------------------------------------------------------------
FUNCTION isSameDay
------------------------------------------------------------------*/
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();
}
/*------------------------------------------------------------------
FUNCTION greetingText
------------------------------------------------------------------*/
function greetingText(){
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours >= 5 && (hours <= 11 && minutes <= 59)){
    return `Good Morning`;
  } else if (hours >= 12 && (hours <=16 && minutes <= 59)) {
    return `Good Afternoon`;
  } else return `Good Evening`;
}
/*------------------------------------------------------------------
FUNCTION weatherText
------------------------------------------------------------------*/
function weatherText(weatherData) {
  let desc = weatherData.desc.slice(0, 1).toUpperCase() + weatherData.desc.slice(1, weatherData.desc.length);  // capitalize first letter of the data  
  const text = `${desc} today. It's currently ${weatherData.temp}°; the high will be ${weatherData.high}°.`;
  let wrapText = (s, w) => s.replace(
    new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n'
  );
  const text0 = wrapText(text,50);
  return text0;
}
/*------------------------------------------------------------------
FUNCTION calendarText
------------------------------------------------------------------*/
function calendarText(calendarData) {
  const events = calendarData.pEventsTodayCount + calendarData.wEventsTodayCount;
  const allDayEvents = calendarData.pEventsTodayAllDayCount + calendarData.wEventsTodayAllDayCount;
  if (events == 0 && allDayEvents == 0){
    text = `Your day is clear.`;
  } else if (events == 0 && allDayEvents > 0) {
    text = `You've got ${allDayEvents} all day event(s) today.`;
  } else if (events > 0 && allDayEvents == 0) {
    text = `You've got ${events} event(s) today.`;
  } else {
    text = `You've got ${events} event(s) and ${allDayEvents} all day event(s) today.`;
  }
  let wrapText = (s, w) => s.replace(
    new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n'
  );
  const text0 = wrapText(text,50);
  return text0;
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