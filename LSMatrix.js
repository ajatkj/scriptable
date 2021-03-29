/*
Script: LSMatrix.js
Author: Ankit Jain (<ajatkj@yahoo.co.in>)
Date: 29.03.2021
Version: 1.0
Purpose: This script generates a Matrix wallpaper with famous quotes from the movie & other details
*/

let MATRIX_QUOTES = {
    q1: {quote: "It is remarkable how similar the pattern of love is to the pattern of insanity", author: "MEROVINGIAN"},
    q2: {quote: "Choice. The problem is choice", author: "NEO"},
    q3: {quote: "I don’t like the idea that I’m not in control of my life", author: "NEO"},
    q4: {quote: "Throughout human history, we have been dependent on machines to survive. Fate, it seems, is not without a sense of irony", author: "MORPHEUS"},
    q5: {quote: "I’m trying to free your mind, Neo. But I can only show you the door. You’re the one that has to walk through it", author: "MORPHEUS"},
    q6: {quote: "Denial is the most predictable of all human responses", author: "THE ARCHITECT"},
    q7: {quote: "That’s how it is with people. Nobody cares how it works as long as it works", author: "COUNCILLOR HAMANN"},
    q8: {quote: "To deny our own impulses is to deny the very thing that makes us human", author: "MOUSE"},
    q9: {quote: "There’s no escaping reason, no denying purpose. Because as we both know, without purpose, we would not exist", author: "AGENT SMITH"},
    q10: {quote: "What do all men with power want? More power", author: "THE ORACLE"},
    q11: {quote: "The body cannot live without the mind", author: "MORPHEUS"},
    q12: {quote: "Perhaps we are asking the wrong questions…", author: "AGENT BROWN"},
    q13: {quote: "What’s really going to bake your noodle later on is, would you still have broken it if I hadn’t said anything?", author: "THE ORACLE"},
    q14: {quote: "Remember, all I’m offering is the truth. Nothing more", author: "MORPHEUS"},
    q15: {quote: "Ignorance is bliss", author: "CYPHER"},
    q16: {quote: "There is no spoon", author: "SPOON BOY"},
    q17: {quote: "Goddamn it, Morpheus. Not everyone believes what you believe", author: "COMMANDER LOCK"},
    q18: {quote: "Choice is an illusion created between those with power and those without", author: "MEROVINGIAN"},
    q19: {quote: "If you tell me we’ll make it, I’ll believe you", author: "TRINITY"},
    q20: {quote: "You played a very dangerous game", author: "THE ARCHITECT"},
    q21: {quote: "Am I dead?", author: "NEO"},
    q22: {quote: "Unfortunately, no one can be told what The Matrix is. You'll have to see it for yourself", author: "MORPHEUS"},
    q23: {quote: "Whoa", author: "NEO"},
    q24: {quote: "Come on. Stop trying to hit me and hit me", author: "MORPHEUS"},
    q25: {quote: "What is the Matrix?", author: "NEO"},
    q26: {quote: "My name..... Is Neo!", author: "NEO"},
    q27: {quote: "Human beings are a disease, cancer of this planet", author: "AGENT SMITH"},
    q28: {quote: "Dodge this", author: "TRINITY"},
    q29: {quote: "You're empty", author: "AGENT SMITH"},
    q30: {quote: "I know Kung Fu!", author: "NEO"},
    q31: {quote: "Show me!", author: "MORPHEUS"},
    q32: {quote: "You have to let it all go Neo. Fear, doubt, and disbelief, Free your mind", author: "MORPHEUS"},
    q33: {quote: "Do you think that's air you're breathing now?", author: "MORPHEUS"},
    q34: {quote: "Goodbye, Mr. Anderson...", author: "AGENT SMITH"},
    q35: {quote: "Were you listening to me Neo? Or were you looking at the woman in the red dress?", author: "MORPHEUS"},
    q36: {quote: "Why oh why, didn't I take the blue pill?", author: "CYPHER"},
    q37: {quote: "He is the one", author: "MORPHEUS"},
    q38: {quote: "If you're killed in the matrix, you die here?", author: "NEO"},
    q39: {quote: "Guns. Lots of guns", author: "NEO"},
    q40: {quote: "You hear that Mr. Anderson?... That is the sound of inevitability...", author: "AGENT SMITH"},
}

let SHOW_QUOTES = true;
let SHOW_LAST_UPDATED = true;
let SHOW_WEATHER = true;
let TIME_FORMAT_24HR = true;
let CRYPTIC_TEXT = true;
let CALENDAR_SHOW_ALL_DAY_EVENTS = true;
let CALENDAR_NAMES = []; // Empty array will fetch ALL calendars
let CALENDAR_MAX_EVENTS = 3;
let WEATHER_DATA = {"sunriseSunsetType": "Sunrise", "condition": "Unknown Condition", "sunriseSunset": "06:34", "temp":"38°C","location":"Unknown","high":"42°C","low":"32°C"}
let DARK_MODE = true;
let SYSTEM_DARK_MODE = true;
let DEVICE_MODE = "Dark Mode";
let BINARY_MODE = false;
if (!config.runsInApp) {
    let input = args.shortcutParameter;
    if (typeof input.parameters !== 'undefined') {
        let inputParams = JSON.parse(input.parameters);
        if (typeof inputParams.showQuotes !== 'undefined') SHOW_QUOTES = inputParams.showQuotes;
        if (typeof inputParams.showLastUpdated !== 'undefined') SHOW_LAST_UPDATED = inputParams.showLastUpdated;
        if (typeof inputParams.showWeather !== 'undefined') SHOW_WEATHER = inputParams.showWeather;
        if (typeof inputParams.crypticText !== 'undefined') CRYPTIC_TEXT = inputParams.crypticText;
        if (typeof inputParams.calendars !== 'undefined') CALENDAR_NAMES = inputParams.calendars;
        if (typeof inputParams.maxEvents !== 'undefined') CALENDAR_MAX_EVENTS = inputParams.maxEvents;
        if (typeof inputParams.showAllDayEvents !== 'undefined') CALENDAR_SHOW_ALL_DAY_EVENTS = inputParams.showAllDayEvents;
        if (typeof inputParams.darkMode !== 'undefined') DARK_MODE = inputParams.darkMode;
        if (typeof inputParams.binaryMode !== 'undefined') BINARY_MODE = inputParams.binaryMode;
        if (typeof inputParams.timeFormat24Hr !== 'undefined') TIME_FORMAT_24HR = inputParams.timeFormat24Hr;
        if (typeof inputParams.systemDarkMode !== 'undefined') SYSTEM_DARK_MODE = inputParams.systemDarkMode;
    }
    if (typeof input.weatherData !== 'undefined') WEATHER_DATA = JSON.parse(input.weatherData);
    if (typeof input.deviceMode !== 'undefined') DEVICE_MODE = input.deviceMode;
}
if (SYSTEM_DARK_MODE) { // System dark mode will over ride dark mode
    if (config.runsInApp) {
        if (Device.isUsingDarkAppearance()) DARK_MODE = true;
        else DARK_MODE = false; 
    } else if (DEVICE_MODE == "Dark Mode") DARK_MODE = true;
        else DARK_MODE = false;
}
const DEVICE_RESOLUTION = Device.screenResolution();
const MATRIX_HEIGHT = DEVICE_RESOLUTION.height;
const MATRIX_WIDTH = DEVICE_RESOLUTION.width;
const TEXT_WIDTH = 40;
const TEXT_HEIGHT = 40;
const BUFFER_WIDTH = 4;
const COLUMNS = Math.floor(MATRIX_WIDTH/TEXT_WIDTH);
const ROWS = Math.floor(MATRIX_HEIGHT/TEXT_HEIGHT);
const KANA_TEXT = [" ","｡","｢","｣","､","･","ｦ","ｧ","ｨ","ｩ","ｪ","ｫ","ｬ","ｭ","ｮ","ｯ","ｰ","ｱ","ｲ","ｳ","ｴ","ｵ","ｶ","ｷ","ｸ","ｹ","ｺ","ｻ","ｼ","ｽ","ｾ","ｿ","ﾀ","ﾁ","ﾂ","ﾃ","ﾄ","ﾅ","ﾆ","ﾇ","ﾈ","ﾉ","ﾊ","ﾋ","ﾌ","ﾍ","ﾎ","ﾏ","ﾐ","ﾑ","ﾒ","ﾓ","ﾔ","ﾕ","ﾖ","ﾗ","ﾘ","ﾙ","ﾚ","ﾛ","ﾜ","ﾝ","ﾞ","ﾟ",];
const BINARY_TEXT = ["0","1"];
const CRYPTIC_CHARS = {"A": "Λ", "B": "β","C": "Ͻ","D": "Δ","E": "Σ","F": "Ϝ","G": "G","H": "Η","I": "Ȉ","J": "Ј","K": "ᛕ","L": "L","M": "Ϻ","N": "И","O": "θ","P": "Ρ","Q": "Ϙ","R": "Я","S": "S","T": "Ⱦ","U": "Ʉ","V": "V","W": "W","X": "χ","Y": "Ȳ","Z": "Z",}
if (DARK_MODE) {
    MATRIX_COLORS = ["#36E94A","#083D1A","#329343","#37793C","#062511","#07150A","#000000","#41AB4E","#68EB70","#021705"];
    BACKGROUND = "#000000";
    END_SYMBOL_COLOR = "#C2C2C2";
    TEXT_COLOR = "#FFFFFF";
} else {
    MATRIX_COLORS = ["#36E94A","#9DEDB8","#4FFF6E","#12E022","#DBFFDF","#B3F2C1","#FFFFFF","#41AB4E","#68EB70","#A6E0A2"];
    BACKGROUND = "#FFFFFF";
    END_SYMBOL_COLOR = "#363636";
    TEXT_COLOR = "#000000";
}
const CALENDAR_SYMBOLS = ["■","×","█","¦","║","▓","»","~",">","≡"]
const regex = /[^\u0000-\u00ff]/; 
const TIME_FORMAT_1 = 1; // HH:mm, hh:mm
const TIME_FORMAT_2 = 2; // HHmma, hhmma
// Import grapheme-splitter to split unicode string containing multiple diaeresis
splitModulePresent = false;
try {
    graphemeSplitter = importModule('GraphemeSplitter')
    splitModulePresent = true;
} catch (error) {
    splitModulePresent = false;
}

let calendarSymbolData = {"dummy" : "0"};
let lastUsedIdx = -1;

let overlayImage = await createOverlay();
let overlayBase64String = encodeOverlayImage(overlayImage);
if (config.runsInApp) {
    QuickLook.present(overlayImage);
    Script.complete();
} else return overlayBase64String; // return to Shortcuts

function encodeOverlayImage(overlayImage){
  let overlayBase64String;
  try {
    const rawOverlay = Data.fromPNG(overlayImage);
    if (rawOverlay === null) {
        console.log("Error converting Image to Data");
        return;
    }
    overlayBase64String = rawOverlay.toBase64String();
    if (overlayBase64String === null) {
        console.log("Error converting Date to Base64 String");
        return;
    }
  } catch(error) {
    console.log(error);
    return;
  }
  return overlayBase64String;
}

async function createOverlay(){
    const rowsMin = Math.floor(ROWS * 0.6);
    let matrixFont = new Font("Menlo", 40);
    let textFont = new Font("Menlo Bold", 40);
    let imgCanvas=new DrawContext();
    imgCanvas.opaque = true;
    imgCanvas.size = new Size(MATRIX_WIDTH,MATRIX_HEIGHT);
    let screenRect = new Rect(0,0,MATRIX_WIDTH, MATRIX_HEIGHT);
    imgCanvas.setFillColor(new Color(BACKGROUND));
    imgCanvas.fillRect(screenRect);
    imgCanvas.setFont(matrixFont);
    let i = 0;
    let j = 0;
    let x = 0;
    let y = 0;
    // Build the matrix
    if (BINARY_MODE) matrixSymbols = BINARY_TEXT;
    else matrixSymbols = KANA_TEXT;
    for (i = 0; i <= COLUMNS; i++){
        y = 0;
        rowsEff = Math.floor(Math.random() * (ROWS - rowsMin + 1) + rowsMin);
        for (j = 0; j < rowsEff; j++){
            index0 = Math.floor(Math.random() * matrixSymbols.length);
            index1 = Math.floor(Math.random() * matrixSymbols.length);
            colorIndex0 = Math.floor(Math.random() * MATRIX_COLORS.length);
            colorIndex1 = Math.floor(Math.random() * MATRIX_COLORS.length);
            if (j >= rowsEff - 2) imgCanvas.setTextColor(new Color(END_SYMBOL_COLOR));
            else imgCanvas.setTextColor(new Color(MATRIX_COLORS[colorIndex0]));
            imgCanvas.drawText(matrixSymbols[index0],new Point(x,y));
            if (!BINARY_MODE) {
                if (j >= rowsEff - 1) imgCanvas.setTextColor(new Color(END_SYMBOL_COLOR));
                else imgCanvas.setTextColor(new Color(MATRIX_COLORS[colorIndex1]));     
                imgCanvas.drawText(matrixSymbols[index1],new Point(x + 5,y + 5));
            }
            y = y + TEXT_HEIGHT;
        }
     x = x + TEXT_WIDTH;
    }

    let wrapText = (s, w) => s.replace(
        new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), ' $1^ '
    );
    // Push lines to print into this array
    allLines = [];

    // Quotes data
    if (SHOW_QUOTES) {
        // Pick a quote at random
        quoteKeys = Object.keys(MATRIX_QUOTES);
        quoteIndex = Math.floor(Math.random() * quoteKeys.length);
        quoteKeyNo = quoteKeys[quoteIndex];
        quote = MATRIX_QUOTES[quoteKeyNo].quote;
        author = "-" + MATRIX_QUOTES[quoteKeyNo].author + "";
        allLines.push(quote);
        allLines.push("");
        allLines.push(author);
    }
    // Calendar data
    if (CALENDAR_MAX_EVENTS > 0) {
        calendarData = await fetchCalendar();
        allLines.push("");
        allLines = allLines.concat(calendarData);
    }

    imgCanvas.setFont(textFont);
    imgCanvas.setTextColor(new Color(TEXT_COLOR));
    y = (Math.round(ROWS/2) - 6) * TEXT_HEIGHT; 

    allLines.forEach(function(line){
        lines = wrapText(line,(COLUMNS - BUFFER_WIDTH)).split('^');
        lines.forEach(function(line){
            [imgCanvas, x, y] = printLines(imgCanvas,line,"center",y,false);
        })
    })

    // Show weather Data on left & right (vertically)
    if (SHOW_WEATHER) {
        x = 1 * TEXT_WIDTH;
        y = 4 * TEXT_HEIGHT;
        [imgCanvas, x, y] = printLines(imgCanvas,WEATHER_DATA.location,x,y,true);
        y = 4 * TEXT_HEIGHT;
        [imgCanvas, x, y] = printLines(imgCanvas,WEATHER_DATA.condition,x,y,true);
        x = (COLUMNS - 4) * TEXT_WIDTH;
        y = 4 * TEXT_HEIGHT;
        [imgCanvas, x, y] = printLines(imgCanvas,"Currently " + WEATHER_DATA.temp,x,y,true);
        y = 4 * TEXT_HEIGHT;
        [imgCanvas, x, y] = printLines(imgCanvas,"Hi " + WEATHER_DATA.high + " Lo " + WEATHER_DATA.low,x,y,true);
        y = 4 * TEXT_HEIGHT;
        [imgCanvas, x, y] = printLines(imgCanvas,WEATHER_DATA.sunriseSunsetType + " " + adjustTimeFormat(WEATHER_DATA.sunriseSunset,TIME_FORMAT_1),x,y,true);
    }

    // Show last updated time at bottom
    if (SHOW_LAST_UPDATED) {
        y = (ROWS - 2) * TEXT_HEIGHT;
        [imgCanvas,x,y] = printLines(imgCanvas,getCurrentTime(TIME_FORMAT_1),"center",y,false);
    }
    img = imgCanvas.getImage();
    return img;
}

function printLines(imgCanvas,line,x,y,isVertical){
    // To split unicode characters you need special libraries
    if (containsDoubleByte(line) && splitModulePresent) chars = graphemeSplitter.splitGraphemes(line.toUpperCase());
    else chars = line.replace(/^\s+|\s+$/gm,'').toUpperCase().split("");

    if (x == "center") x = Math.round((COLUMNS - chars.length)/2) * TEXT_WIDTH;
    chars.forEach(function(ch){
        if (ch != " ") {
            r = new Rect(x,y,TEXT_WIDTH,TEXT_HEIGHT);
            imgCanvas.setFillColor(new Color(BACKGROUND));
            imgCanvas.fillRect(r);
        }
        randomize = CRYPTIC_TEXT ? Math.round(Math.random()): 0;
        if (randomize && CRYPTIC_CHARS.hasOwnProperty(ch)) ch = eval(`CRYPTIC_CHARS.${ch}`);
        imgCanvas.drawText(ch,new Point(x,y));
        if (isVertical) y = y + TEXT_HEIGHT;
        else x = x + TEXT_WIDTH;
    })
    // Move to next line at the end
    if (isVertical) x = x + TEXT_WIDTH;
    else y = y + TEXT_HEIGHT;
    return [imgCanvas,x,y];
}

function formatTime(unformattedDate, timeFormat){
    let date = new Date(unformattedDate);
    let dd = "0" + date.getDate();
    let m = "0" + (date.getMonth() + 1);
    let H = "0" + date.getHours();
    let mm = "0" + date.getMinutes();
    if (typeof timeFormat === 'undefined' || timeFormat === null || timeFormat == 0) {
        returnDate = dd.substr(-2) + "/" + m.substr(-2);
    } else returnDate = adjustTimeFormat(H.substr(-2) + ':' + mm.substr(-2),timeFormat);
    return returnDate;
}

function getCurrentTime(timeFormat){
    const date = new Date();
    let H = date.getHours();
    let a = H >= 12 ? "PM" : "AM";
    h = (H % 12) || 12;
    const M = "0" + date.getMinutes();
    time = ("0" + H).substr(-2) + ":" + M.substr(-2);
    time = adjustTimeFormat(time, timeFormat)
    return time;
}

function adjustTimeFormat(timeIn24Hour, returnFormat){
    let H = Number(timeIn24Hour.split(":")[0]);
    let M = Number(timeIn24Hour.split(":")[1]);
    let a = "";
    if (!TIME_FORMAT_24HR) {
        a = H >= 12 ? "PM" : "AM";
        H = (H % 12) || 12;
    }
    if (returnFormat == TIME_FORMAT_1) time = ("0" + H).substr(-2) + ":" + ("0" + M).substr(-2) + " " + a;
    else if (returnFormat == TIME_FORMAT_2) time = ("0" + H).substr(-2) + ("0" + M).substr(-2) + a;
    time = time.replace(/^\s+|\s+$/gm,'');
    return time;
}

async function fetchCalendar() {
    if (CALENDAR_MAX_EVENTS == 0) return "";
    const today = new Date();
    // Filter out falsy values
    CALENDAR_NAMES = CALENDAR_NAMES.filter(x => x);
    let calendars = [];
    for (const calendarName of CALENDAR_NAMES) {
        try {
            const c = await Calendar.forEventsByTitle(calendarName);
            calendars.push(c);
        } catch (error) {}
    }
    let upcomingEvents = await CalendarEvent.thisWeek(calendars);
    upcomingEvents = upcomingEvents.concat(await CalendarEvent.nextWeek(calendars));

    // Filter out expired events from the event list
    upcomingEvents = upcomingEvents.filter(e => (new Date(e.endDate)).getTime() >= (new Date()).getTime());
  
    // Filter out all day events if required
    if (!CALENDAR_SHOW_ALL_DAY_EVENTS) {
        upcomingEvents = upcomingEvents.filter(e => !e.isAllDay);
    }
    // Sort array based on start time and put all day events at the end of the list
    upcomingEvents = upcomingEvents.sort(sortEvents);

    if (upcomingEvents.length == 0) return ">NO UPCOMING EVENTS<";

    returnText = [];
    returnText.push(">UPCOMING EVENTS<");
    returnText.push("");
    upcomingEvents.length = CALENDAR_MAX_EVENTS; 
    upcomingEvents.forEach(function(e){
        eventText = "";
        const symbol = getchCalendarSymbol(e.calendar.title);
        returnText.push(symbol + e.title);
        if (isSameDay(e.startDate,today)) {
            if (e.isAllDay) eventTime = "ALL DAY";
            else eventTime = formatTime(e.startDate,TIME_FORMAT_2) + "-" + formatTime(e.endDate,TIME_FORMAT_2);
        } else {
            if (e.isAllDay) eventTime = formatTime(e.startDate) + "|ALL DAY";
            else eventTime = formatTime(e.startDate) + "|" + formatTime(e.startDate,TIME_FORMAT_2) + "-" + formatTime(e.endDate,TIME_FORMAT_2);
        }
        returnText.push("[" + eventTime + "]");
        returnText.push("");
    })
    return returnText;
  }

function getchCalendarSymbol(calendarName) {
    if (Object.keys(calendarSymbolData).length > 0 && calendarSymbolData.hasOwnProperty(calendarName)) {
        return calendarSymbolData[calendarName];
    }
    if (lastUsedIdx == CALENDAR_SYMBOLS.length) lastUsedIdx = -1; // Assign symbols from start
    calendarSymbolData[calendarName] = CALENDAR_SYMBOLS[lastUsedIdx + 1];
    lastUsedIdx = lastUsedIdx + 1;
    return calendarSymbolData[calendarName];
}

function sortEvents(e1,e2) {
    // if (e1.isAllDay) return 1;
    // else if (e2.isAllDay) return -1;
    // else if ((new Date(e1.startDate)).getTime() < (new Date(e2.startDate)).getTime()) return -1;
    if ((new Date(e1.startDate)).getTime() < (new Date(e2.startDate)).getTime()) return -1;
    else if ((new Date(e1.startDate)).getTime() > (new Date(e2.startDate)).getTime()) return 1;
    else return 0;
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();
}

function containsDoubleByte(str) {
    if (!str.length) return false;
    if (str.charCodeAt(0) > 255) return true;
    return regex.test(str);
}