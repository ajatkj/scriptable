// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;
/*
Script: LSQuotes.js
Author: Ankit Jain (<ajatkj@yahoo.co.in>)
Date: 25.03.2022
Version: 1.1
Purpose: This script generates an overlay with a quotes (from api)
*/
/* Change Log 
31.03.2022 - Add support for multi-byte characters (depends on external module GraphemeSplitter)
             Download from https://github.com/orling/grapheme-splitter and leave a star!!
*/

const LOG_FILE_PATH = "LSQuotesLogs";
const LOG_TO_FILE = true; // Only set to true if you want to debug any issue
let LOG_STEP = 1;

const SIZES = {
    small: {font: 50, width: 50, height: 50, radius: 15},
    medium: {font: 60, width: 60, height: 60, radius: 20},
    large: {font: 80, width: 80, height: 80, radius: 25},
    extraLarge: {font: 100, width: 100, height: 100, radius: 50}
}
const DEVICE_RESOLUTION = Device.screenResolution();
const IMAGE_HEIGHT = DEVICE_RESOLUTION.height;
const IMAGE_WIDTH = DEVICE_RESOLUTION.width;
const BASE_QUOTES_URL='https://api.quotable.io/random';

let TEXT_SIZE = 'small'
let DARK_MODE = true;
let CUSTOM_QUOTE = null
let DEFAULT_QUOTE = "😀Be the change you want to see in the world!"
let CUSTOM_QUOTE_FLAG = true
let QUOTE_MAX_LENGTH = 50
let QUOTE_TAGS_DICTIONARY = {'business': true, 'wisdom': false, 'faith': false}

if (!config.runsInApp) {
    let input = args.shortcutParameter;
    if (typeof input.parameters !== 'undefined') {
        let inputParams = JSON.parse(input.parameters);
        if (typeof inputParams.customQuoteFlag !== 'undefined') CUSTOM_QUOTE_FLAG = inputParams.customQuoteFlag;
        if (typeof inputParams.quotesMaxLength !== 'undefined') QUOTE_MAX_LENGTH = inputParams.quotesMaxLength;
        if (typeof inputParams.quoteTags !== 'undefined') QUOTE_TAGS_DICTIONARY = inputParams.quoteTags;
        if (typeof inputParams.darkMode !== 'undefined') DARK_MODE = inputParams.darkMode;
        if (typeof inputParams.textSize !== 'undefined') TEXT_SIZE = inputParams.textSize.toLowerCase();
    }
    if (typeof input.customQuote !== 'undefined') CUSTOM_QUOTE = input.customQuote;
}

if (CUSTOM_QUOTE_FLAG && CUSTOM_QUOTE === null) CUSTOM_QUOTE_FLAG = false;

if (TEXT_SIZE !== 'small' && TEXT_SIZE !== 'medium' && TEXT_SIZE !== 'large') TEXT_SIZE = 'medium'

if (DARK_MODE) {
    BG = '#000000'
    FG = '#F4FAFA'
} else {
    BG = '#F4FAFA'
    FG = '#000000'
}
const REGEX = /[^\u0000-\u00ff]/; 
// Import grapheme-splitter to split unicode string containing multiple diaeresis
splitModulePresent = false;
try {
    graphemeSplitter = importModule('GraphemeSplitter')
    splitModulePresent = true;
} catch (error) {
    splitModulePresent = false;
}

let TEXT_WIDTH = SIZES[TEXT_SIZE].width;
let TEXT_HEIGHT = SIZES[TEXT_SIZE].height;
let TEXT_FONT = new Font("TrebuchetMS", SIZES[TEXT_SIZE].font);
let TEXT_COLS = Math.floor(IMAGE_WIDTH/(TEXT_WIDTH+5));

let overlayImage = await createOverlay();
let overlayBase64String = encodeOverlayImage(overlayImage);
if (config.runsInApp) {
    QuickLook.present(overlayImage);
    Script.complete();
} else return overlayBase64String; // return to Shortcut

/*---------------------------------------------------------------
Function definitions
---------------------------------------------------------------*/
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
    let wrapText = (s, w) => s.replace(
        new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), ' $1^ '
    );
    
    let imgCanvas=new DrawContext();
    let bufferWidth = 4;
    imgCanvas.opaque = false;
    imgCanvas.size = new Size(IMAGE_WIDTH,IMAGE_HEIGHT);
    imgCanvas.setFont(TEXT_FONT);
    imgCanvas.setTextColor(new Color(FG));
    
    quote = await fetchQuotes()
    writeLOG(quote)
    lines = wrapText(quote,(TEXT_COLS - bufferWidth)).split('^');
    writeLOG(lines.join(','))

    let x = bufferWidth
    let y = (IMAGE_HEIGHT/2) - (lines.length * TEXT_HEIGHT/2)
    
    lines.forEach(function(line){
        [imgCanvas, x, y] = print(imgCanvas,line,"center",y)
    })
    img = imgCanvas.getImage();
    return img;
}

function createRoundedRect(w,h){
    let imgCanvas = new DrawContext();
    imgCanvas.opaque = false;
    imgCanvas.size = new Size(w,h);
    radius = SIZES[TEXT_SIZE].radius
    path = new Path()
    path.addRoundedRect(new Rect(0,0,w,h),radius,radius)
    imgCanvas.setFillColor(new Color(BG, 0.5))
    imgCanvas.addPath(path)
    imgCanvas.fillPath()
    return imgCanvas.getImage()
}

function print(imgCanvas,line,x,y){
    space = ' '
    gap = 5
    roundedRect = createRoundedRect(TEXT_WIDTH,TEXT_HEIGHT)
    // To split unicode characters you need special libraries
    if (containsDoubleByte(line) && splitModulePresent) chars = graphemeSplitter.splitGraphemes(line.toUpperCase());
    else chars = line.replace(/^\s+|\s+$/gm,'').toUpperCase().split("");
    
    if (x == "center") x = Math.round((TEXT_COLS - chars.length)/2) * (TEXT_WIDTH+gap);
    chars.forEach(function(ch){
        if (ch != space) imgCanvas.drawImageInRect(roundedRect,new Rect(x,y,TEXT_WIDTH,TEXT_HEIGHT));
        imgCanvas.drawText(ch,new Point(x+10,y-2));
        x = x + TEXT_WIDTH + gap;
    })
    y = y + TEXT_HEIGHT + gap;
    return [imgCanvas,x,y];
}

async function fetchQuotes(){
  
  writeLOG(JSON.stringify(QUOTE_TAGS_DICTIONARY))

  if (CUSTOM_QUOTE_FLAG) return CUSTOM_QUOTE;

  // convert quote tags dictionary with "true" values to array
  var QUOTE_TAGS = Object.keys(QUOTE_TAGS_DICTIONARY).reduce(function (QUOTE_TAGS, key) {
    if (QUOTE_TAGS_DICTIONARY[key]) QUOTE_TAGS[key] = QUOTE_TAGS_DICTIONARY[key];
        return QUOTE_TAGS;
    }, {}); 

  let quotesURL;
  if ((Object.keys(QUOTE_TAGS).length === 0 && QUOTE_TAGS.constructor === Object) || (QUOTE_TAGS.all !== undefined && QUOTE_TAGS.all)) {
    quotesURL = BASE_QUOTES_URL + '?maxLength=' + QUOTE_MAX_LENGTH;
  } else {
    quotesURL = BASE_QUOTES_URL + '?maxLength=' + QUOTE_MAX_LENGTH + '&tags=' + Object.keys(QUOTE_TAGS).join('%7C'); // %7C is code for |
  }

  writeLOG("URL " + quotesURL)

  let response;
  try {
    const request = new Request(quotesURL);
    request.timeoutInterval = 30;
    response = await request.loadJSON();
  } catch (error) {
    writeLOG("Error in fetching request " + error)
    return DEFAULT_QUOTE;
  }

  // Error in fetching - statusCode is present in response in case of error
  if (response.statusCode !== undefined) {
    writeLOG("No quotes found")
    return DEFAULT_QUOTE
  }

  writeLOG("Response: " + JSON.stringify(response))
  return response.content
}

async function writeLOG(logMsg){
  if (!config.runsInApp && LOG_TO_FILE) {
    const fm = FileManager.iCloud();
    let logPath = fm.joinPath(fm.documentsDirectory(), LOG_FILE_PATH);
    if (!fm.fileExists(logPath)) fm.createDirectory(logPath);
    const logFile = fm.joinPath(logPath, 'Step_' + LOG_STEP);
    fm.writeString(logFile, logMsg);
  } else console.log ("Step_" + LOG_STEP + ": " + logMsg);
  LOG_STEP++;
}

function containsDoubleByte(str) {
    if (!str.length) return false;
    if (str.charCodeAt(0) > 255) return true;
    return REGEX.test(str);
}