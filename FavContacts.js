/*------------------------------------------------------------------------------------------------------
Script: FavContacts.js
Author: Ankit Jain (<ajatkj@yahoo.co.in>)
Date: 21.03.2021
Version: 2.0
------------------------------------------------------------------------------------------------------*/
// This script generates a widget with your favourite contacts to quickly call, message, facetime etc.
// right from your home screen.
// There are 3 ways to fetch contact:
// 1. Create a group in iCloud called "Favourites" and your favourite contacts to this group.
// 2. Go to your Phone app and add a "Social Profile" called "Scriptable" with value "Scriptable". 
// 3. Add your contacts in this script in below format (not recommended!).
// Script will only do step 2+3 if it doesn't find the group "Favourites" or doesn't find any contacts in that group.
// Once above set-up is done, run the script in-app to update the cache. Widgets will pick contact details from cache.
// List of contacts to fetch
let allcontacts = [
    {firstname: 'Firstname', lastname: 'Lastname'},
]
// ============================================== CONFIGURABLE SECTION (START) ============================================== //
// valid avatar styles are "contact", "symbol" or "initials"
let AVATAR_STYLE = "contact"
let THEME = "antwerpBlue";
let SHOW_NAMES = false;
let NO_OF_ITEMS_TO_SHOW = 2; // Minimum 2, maximum 3;
// Valid values are "message","facetimeVideo","facetimeAudio","whatsapp","telegram","email","outlook","gmail","spark","twitter","twitterrific","tweetbot"
let ITEMS_TO_SHOW = ["twitter","facetimeVideo","message","whatsapp","spark","gmail"];
const CONTACTS_SYMBOL_STYLE = "person.circle.fill"; // Should be a valid SF Symbol

// ============================================== CONFIGURABLE SECTION (END) ============================================== //
// Variables used for testing
const PREVIEW_WIDGET = 'large';
const SHOW_GUIDES = false;
const LOG_FILE_NAME = "FavContacts.txt";
const LOG_FILE_PATH = "FavContactsLogs";
const LOG_TO_FILE = true; // Only set to true if you want to debug any issue
let LOG_STEP = 1;
let WIDGET_POSITION = "bottom";

let WIDGET_NO = 1;
// Pass argument in the form: widgetNo, {"theme": "color", "avatar": "contact"}
if (config.runsInWidget && args.widgetParameter) {
    // extract the dictionary parameters
    let params = args.widgetParameter.substring(args.widgetParameter.lastIndexOf("{"), args.widgetParameter.lastIndexOf("}") + 1);
    // Whatever left is widget no.
    WIDGET_NO = args.widgetParameter.replace(params,"").replace(",","");
    if (typeof WIDGET_NO === 'undefined' || WIDGET_NO == "") WIDGET_NO = 1;
    else WIDGET_NO = WIDGET_NO.toString();
    if (WIDGET_NO == 0) WIDGET_NO = 1;
    if (typeof params !== 'undefined' && params !== "") {
        param = JSON.parse(params)
        if (typeof param.theme !== 'undefined') THEME = param.theme;
        if (typeof param.avatar !== 'undefined') AVATAR_STYLE = param.avatar;
        // For small widgets: top-left, top-right, middle-left, middle-right, bottom-left, bottom-right;
        // For medium widgets: top, middle, bottom;
        // For large widgets: top, bottom;
        if (typeof param.pos !== 'undefined') {
            WIDGET_POSITION = param.pos;
            THEME = "transparent";
          }
    }
}

const smallFont = Font.regularRoundedSystemFont(8);
const mainFont = Font.regularRoundedSystemFont(14);
const bigFont = Font.regularRoundedSystemFont(20);
const symbolFont = Font.regularRoundedSystemFont(24);

itemList = {
    message: {symbol: "message.circle.fill", url: "sms://", use: "both"},
    facetimeVideo: {symbol: "video.circle.fill", url: "facetime://", use: "both"},
    facetimeAudio: {symbol: "phone.circle.fill", url: "facetime-audio://", use: "both"},
    whatsapp: {symbol: null, initial: "W", url: "https://wa.me/", use: "phone"},
    // signal: {symbol: "circle.dashed.inset.fill", initial: "L", url: "sgnl://", use: "phone"},
    telegram: {symbol: "paperplane.circle.fill", url: "telegram://", use: "phone"},
    email: {symbol: "envelope.circle.fill", url: "message://", use: "email"},
    spark: {symbol: "envelope.circle.fill", initial: "S", url: "readdle-spark://compose?recipient=", use: "email"},
    outlook: {symbol: "envelope.circle.fill", initial: "O", url: "ms-outlook://compose?to=", use: "email"},
    gmail: {symbol: "envelope.circle.fill", initial: "G", url: "googlegmail://co?to=", use: "email"},
    twitter: {symbol: null, initial: "t", url: "twitter://user?screen_name=", use: "twitter"},
    twitterrific: {symbol: null, initial: "t", url: "twitterrific://current/profile?screen_name=", use: "twitter"},
    tweetbot: {symbol: null, initial: "t", url: "tweetbot://current/user_profile/", use: "twitter"},
}

// Some of the Color schemes are inspired from Moleskine Time Page app
// dark BCG, light BCG, dark Text (text on dark BCG), ligth Text (text on light BCG)
allColors = {
    // Single color themes
    kraftBrown: ["A88862","937C5D","F4FAFA","F4FAFA"],
    orangeyellow: ["DC872A","BA7D39","F4FAFA","F4FAFA"],
    cadmiumOrange: ["D04119","AD4425","F4FAFA","F4FAFA"],
    red: ["B1201B","932A22","F4FAFA","F4FAFA"],
    scarletRed: ["94072A","7B1829","F4FAFA","F4FAFA"],
    peachBlossomPink: ["B28379","9A786F","F4FAFA","F4FAFA"],
    flourescentPink: ["BA174E","992647","F4FAFA","F4FAFA"],
    wednesdayPink: ["B2679F","98608C","F4FAFA","F4FAFA"],
    brilliantViolet: ["443A93","3C347F","F4FAFA","F4FAFA"],
    royalBlue: ["185395","264A83","F4FAFA","F4FAFA"],
    antwerpBlue: ["166FB1","2F6299","F4FAFA","F4FAFA"],
    skyBlue: ["4893B0","52839B","F4FAFA","F4FAFA"],
    articBlue: ["91B0CC","8A9CB3","F4FAFA","F4FAFA"],
    seaweedGreen: ["508080","527273","F4FAFA","F4FAFA"],
    oxideGreen: ["168155","36724F","F4FAFA","F4FAFA"],
    kiwiGreen: ["758E29","6E7F34","F4FAFA","F4FAFA"],
    bonoboGrey: ["274249","293B41","F4FAFA","F4FAFA"],
    lunaBlack: ["181D21","171A1E","F4FAFA","F4FAFA"],
    white: ["F4FAFA","EAEDED","181D21","181D21"],
    classic: ["181D21","F4FAFA","181D21","F4FAFA"],
    classicGrey: ["2C2C2E","1C1C1E","F4FAFA","F4FAFA"],
    black: ["000000","000000","F4FAFA","F4FAFA"],
    // Contrasting color themes
    ultraViolet: ["5F4B8B","E69A8D","F4FAFA","F4FAFA"],
    blueOrange: ["00A4CC","F95700","F4FAFA","F4FAFA"],
    sailorBlueMint:  ["00203F","ADEFD1","00203F","F1F4FF"],
    blackOrange:  ["101820","F2AA4C","F4FAFA","F4FAFA"],
    cherryTomatoRose:  ["ED2B33","D85A7F","F1F4FF","F1F4FF"],
    cherryTomatoBlack:  ["2D2926","E94B3C","F4FAFA","F4FAFA"],
    spaceCherry:  ["990011","FCF6F5","990011","FCF6F5"],
    forestMoss:  ["2C5F2D","97BC62","F4FAFA","F4FAFA"],
    electricBlueAqua:  ["0063B2","9CC3D5","0063B2","9CC3D5"],
    blazingYellowBlack:  ["101820","FEE715","101820","F4FAFA"],
    agingCopper:  ["B1624E","5CC8D7","F4FAFA","F4FAFA"],
    skyBlueWhite: ["89ABE3","FCF6F5","89ABE3","FCF6F5"],
    iceFlowPurple: ["603F83","C7D3D4","603F83","C7D3D4"],
    islandGreen: ["2BAE66","FCF6F5","2BAE66","FCF6F5"],
    greenBlack: ["006B38","101820","F4FAFA","F4FAFA"],
    powderedSugar: ["F1F4FF","A2A2A1","F1F4FF","A2A2A1"],
    lemonPurple: ["FCF951","422057","F1F4FF","422057"],
    fieryRedTeal: ["4B878B","D01C1F","FCF6F5","FCF6F5"],
    transparent: ["181D21","181D21","FCF6F5","FCF6F5"],
}

widgetType = config.widgetFamily ? config.widgetFamily : PREVIEW_WIDGET;0
if (widgetType == "small") {
    MAX_CONTACTS = 1;
    NO_OF_ITEMS_TO_SHOW = 0;
} else if (widgetType == "medium") {
    MAX_CONTACTS = 4;
} else {
    widgetType = "large";
    MAX_CONTACTS = 8;
}

// Update contacts.json when script is run in app
if (!config.runsInWidget) {
    await loadContacts();
}

// Fetch contact list from iCloud/Local drive
let fm = FileManager.local();
const iCloudUsed = fm.isFileStoredIniCloud(module.filename);
fm = iCloudUsed ? FileManager.iCloud() : fm;
const widgetFolder = "Favcon";
const offlinePath = fm.joinPath(fm.documentsDirectory(), widgetFolder);
if (!fm.fileExists(offlinePath)) fm.createDirectory(offlinePath);
contactsFile = fm.joinPath(offlinePath,'contacts.json');
if (!fm.isFileDownloaded(contactsFile) && fileExists(contactsFile)) fm.downloadFileFromiCloud(contactsFile);

contactList = JSON.parse(fm.readString(contactsFile));
widget = await createWidget(contactList);

if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
  if (widgetType == 'small') widget.presentSmall();
  else if (widgetType == 'medium') widget.presentMedium();
  else widget.presentLarge();
}
Script.complete();

///*------------------------------------------------------------------------------------------------------------------
// *                                               FUNCTION DEFINITION
// -------------------------------------------------------------------------------------------------------------------

async function createWidget(contacts){
    let fm = FileManager.local();
    const iCloudUsed = fm.isFileStoredIniCloud(module.filename);
    fm = iCloudUsed ? FileManager.iCloud() : fm;
    const widgetFolder = "Favcon";
    const offlinePath = fm.joinPath(fm.documentsDirectory(), widgetFolder);
    const imagePath = fm.joinPath(offlinePath,"images");

    let dynamicBCG, dynamicText, lightText, darkText, lightBCG, darkBCG;
    if (NO_OF_ITEMS_TO_SHOW == 1) NO_OF_ITEMS_TO_SHOW = 2; // single item spoils the layout -- need to figure this out
    if (NO_OF_ITEMS_TO_SHOW > 3) NO_OF_ITEMS_TO_SHOW = 3;
    contactsList = Object.keys(contacts);
    // Get background colors based on theme used
    [lightBCG, darkBCG, lightText, darkText, widgetPosition] = getBcgColors();

    if (WIDGET_NO > 1) START_NO = ((WIDGET_NO - 1) * MAX_CONTACTS);
    else START_NO = 0;
    writeLOG("Contacts favourited: " + contactsList.length + "\nStart no.: " + START_NO + "\nWidget No: " + WIDGET_NO + "\nMax contacts: " + MAX_CONTACTS);

    // If contacts list is empty
    if (contactsList.length == 0) {
        [dynamicBCG, dynamicText] = getDynamicColors(1);
        const widget = new ListWidget();
        widget.setPadding(5,5,5,5);
        if (THEME == "transparent") widget.backgroundImage = await nobg.getSlice(widgetPosition);
        else widget.backgroundColor = Color.dynamic(new Color(lightBCG), new Color(darkBCG))
        widget.addSpacer();
        widget.url = "https://github.com/ajatkj/scriptable#favcontacts";
        t = widget.addText("Set-up your contact list. Click here for more details.");
        t.font = bigFont;
        t.textColor = dynamicText;
        t.minimumScaleFactor = 0.5;
        widget.addSpacer();
        return widget;
    }

    // If more widgets are added than available contacts
    if ((START_NO) >= contactsList.length) {
        [dynamicBCG, dynamicText] = getDynamicColors(1);
        text = {
            small: {lines: ['_widgetNo_ small widgets','are too many!'], size: 14},
            medium: {lines: ['You don\'t need _widgetNo_ _widgetType_ widgets!!', 'You have favourited only _contacts_ contacts.'], size: 20},
            large: {lines: ['You don\'t need ', '_widgetNo_ _widgetType_ widgets!!', '','You have favourited', 'only _contacts_ contacts.'], size: 26},
        }
        const widget = new ListWidget();
        if (THEME == "transparent") widget.backgroundImage = await nobg.getSlice(widgetPosition);
        else widget.backgroundColor = Color.dynamic(new Color(lightBCG), new Color(darkBCG))
        const stack = widget.addStack();
        stack.layoutVertically();
        stack.setPadding(5,5,5,5);
        
        lines = eval(`text.${widgetType}.lines`);
        size = eval(`text.${widgetType}.size`);
        lines.forEach(function(line) {
            l = stack.addStack();
            l.addSpacer();
            line = line.replace("_widgetNo_",WIDGET_NO);
            line = line.replace("_widgetType_",widgetType);
            line = line.replace("_contacts_",contactsList.length)
            t = l.addText(line)
            t.font = Font.regularRoundedSystemFont(size);
            t.textColor = dynamicText;
            t.lineLimit = 1;
            t.minimumScaleFactor = 0.5;
            l.addSpacer();
        })
        return widget;
    }
    
    // If contacts list contains less than required contacts, fill the array with unknown data
    if (contactsList.length < (START_NO + MAX_CONTACTS)) {
        unknownFirstNames = ["Jane","Tom","Joe","Dick","John","Harry","Eddie"];
        unknownSecondNames = ["Doe","","Doe","","Doe","",""];
        for (let i = 0; i < ((START_NO + MAX_CONTACTS)); i++){
            key = "ZZZZZZZZZ" + i;
            contacts[key] = {};
            contacts[key]["givenName"] = unknownFirstNames[i];
            contacts[key]["familyName"] = unknownSecondNames[i];
            contacts[key]["nickName"] = unknownFirstNames[i];
            contacts[key]["phoneNumber"] = "0";
            contacts[key]["emailID"] = "0";
            contacts[key]["twitter"] = "0";
            contacts[key]["sfSymbol"] = "exclamationmark.circle.fill";
            contacts[key]["quickActions"] = ["message","whatsapp"];
        }
    }

    const widget = new ListWidget();
    widget.setPadding(0,0,0,0);
    // widget.backgroundColor = Color.dynamic(new Color(lightBCG), new Color(darkBCG))
    if (THEME == "transparent") widget.backgroundImage = await nobg.getSlice(widgetPosition);
    else widget.backgroundColor = Color.dynamic(new Color(lightBCG), new Color(darkBCG))
    let mainStack0 = widget.addStack();

    if (widgetType == "large") {
        mainStack0.layoutVertically();
        mainStack1 = mainStack0.addStack();
        mainStack1.layoutHorizontally();
        mainStack2 = mainStack0.addStack();
        mainStack2.layoutHorizontally();
    } else {
        mainStack0.layoutHorizontally();
        mainStack1 = mainStack0.addStack();
        mainStack1.layoutHorizontally();
    }
    // Create Widget
    let i = 0;
    let j = 0;
    for (const c in contacts){
        // Skip first start contacts
        if (j < START_NO) {
            j++;
            continue;
        }
        if (i == MAX_CONTACTS) break;
        // Decide color scheme
        [dynamicBCG, dynamicText] = getDynamicColors(i);

        // Extract data from dictionary
        let p = contacts[c].phoneNumber.replace(/ /g,"").replace(/-/g,"");
        let sfSymbol = contacts[c].sfSymbol;
        let name = contacts[c].givenName;
        let lastName = contacts[c].familyName;
        let em = contacts[c].emailID;
        let tw = contacts[c].twitter;
        let quickActions = contacts[c].quickActions;
        let radiusDelta = 10;

        // Create main stack
        if (i < 4) stack0 = mainStack1.addStack();
        else stack0 = mainStack2.addStack();

        stack0.layoutVertically();
        stack0.addSpacer()
  
        if (THEME != 'transparent') stack0.backgroundColor = dynamicBCG;
        // STACK 1 - For Name
        let nameStack = stack0.addStack();
        nameStack.layoutHorizontally();
        nameStack.centerAlignContent();
        if (SHOW_GUIDES) nameStack.backgroundColor = Color.blue();
        nameStack.addSpacer();
        if (SHOW_NAMES) {
            t = nameStack.addText(name);
            t.font = mainFont;
            t.minimumScaleFactor = 1;
            t.lineLimit = 1;
            t.textColor = dynamicText;
            radiusDelta = 0;
        }
        nameStack.addSpacer();
        stack0.addSpacer();

        // STACK 2 - For Avatar
        let avatarStack = stack0.addStack();
        avatarStack.layoutHorizontally();
        avatarStack.addSpacer();
        if (SHOW_GUIDES) avatarStack.backgroundColor = Color.cyan();
        
        if (AVATAR_STYLE == "symbol") {
            avatar = drawAvatar(sfSymbol, name, lastName, dynamicText, dynamicBCG);
            n = avatarStack.addImage(avatar);
            n.minimumScaleFactor = 0.5;
            n.tintColor = dynamicText;
        } else if (AVATAR_STYLE == "contact"){
            imageName = fm.joinPath(imagePath,c + ".png");
            if (fm.fileExists(imageName)) {
                if (!fm.isFileDownloaded(imageName)) fm.downloadFileFromiCloud(imageName);
                avatar = fm.readImage(imageName);
                n = avatarStack.addImage(avatar);
                n.minimumScaleFactor = 0.5;
                n.containerRelativeShape = false;
                if (MAX_CONTACTS == 1) n.cornerRadius = 50 + radiusDelta;
                else n.cornerRadius = 34;
                n.borderWidth = 6;
                n.borderColor = dynamicText;
            } else {
                avatar = drawAvatar(null, name, lastName, dynamicText, dynamicBCG);
                n = avatarStack.addImage(avatar);
                n.minimumScaleFactor = 0.5;                
            }
        } else { // For style "initials"
            avatar = drawAvatar(null, name, lastName, dynamicText, dynamicBCG);
            n = avatarStack.addImage(avatar);
            n.minimumScaleFactor = 0.5;
        }
        if (p != "0") avatarStack.url = 'tel://' + p;
        // For small widget, there can only be 1 url
        if (MAX_CONTACTS == 1) widget.url = 'tel://' + p;

        avatarStack.addSpacer();
        stack0.addSpacer();

        // STACK 3 - Icons
        let bottomStack = stack0.addStack();
        bottomStack.layoutHorizontally();
        bottomStack.addSpacer();

        if (SHOW_GUIDES) bottomStack.backgroundColor = Color.yellow();
        
        // Remove all quick actions which are not applicable
        itemsToShow = quickActions;
        if (em == "0") itemsToShow = itemsToShow.filter(function(it,idx,arr) {return eval(`itemList.${it}.use`) !== 'email'})
        if (tw == "0") itemsToShow = itemsToShow.filter(function(it,idx,arr) {return eval(`itemList.${it}.use`) !== 'twitter'})

        itemsToShow.slice(0,NO_OF_ITEMS_TO_SHOW).forEach(function(itemName){
            toUse = eval(`itemList.${itemName}.use`);
            if (toUse == "twitter") itemToUse = tw;
            else if (toUse == "phone") itemToUse = p;
            else if (toUse == "email") itemToUse = em;
            else if (p == "0") itemToUse = em;
            else itemToUse = p;
            let itemStack = bottomStack.addStack();
            itemStack.setPadding(0,3,0,3);
            itemStack.layoutHorizontally();
            if (SHOW_GUIDES) itemStack.backgroundColor = Color.brown();
            if (itemToUse != "0") symbolName = eval(`itemList.${itemName}.symbol`);
            else symbolName = "nosign"
            if (symbolName === null) {
                sy = drawIcon(eval(`itemList.${itemName}.initial`),dynamicText,dynamicBCG);
                symbolImage = itemStack.addImage(sy);
            } else {
                sy = SFSymbol.named(symbolName);
                sy.applyFont(symbolFont);
                symbolImage = itemStack.addImage(sy.image);
                symbolImage.tintColor = dynamicText;
            }
            if (itemToUse != "0") itemStack.url = eval(`itemList.${itemName}.url`) + itemToUse;    
        })
        if (ITEMS_TO_SHOW == 1) dummyItemStack = bottomStack1.addStack();
        bottomStack.addSpacer();
        stack0.addSpacer();
        i++;
    }
    return widget;
}

function drawAvatar(sfSymbol, name1, name2, bcgColor, textColor){
    // Use only mono-spaced font here
    let avatarFont = new Font("Menlo Bold", 100);
    let avatarCanvas = new DrawContext();
    avatarCanvas.opaque = false;
    avatarCanvas.size = new Size(200,200);
    let avatarRect = new Rect(0,0,200,200);
    if (sfSymbol === null) {
        if (name2 !== null && name2 != ""){
            text = name1.substr(0,1) + name2.substr(0,1)
            textRect = new Rect(40,40,150,150);
        } else {
            text = name1.substr(0,1)
            textRect = new Rect(70,40,150,150);
        }
        avatarCanvas.setFillColor(bcgColor);
        avatarCanvas.fillEllipse(avatarRect);
        avatarCanvas.setFont(avatarFont);
        avatarCanvas.setTextColor(textColor);
        avatarCanvas.drawTextInRect(text,textRect);
    } else {// SFSymbol
        symbol = SFSymbol.named(sfSymbol);
        symbol.applyFont(Font.regularRoundedSystemFont(100));
        avatarCanvas.drawImageInRect(symbol.image,avatarRect);
    }

    let avatar = avatarCanvas.getImage();
    return avatar;
}

function drawIcon(text, bcgColor, textColor){
    // Use only mono-spaced font here
    let iconFont = new Font("Menlo Bold", 60);
    let iconCanvas = new DrawContext();
    iconCanvas.opaque = false;
    iconCanvas.size = new Size(100,100);
    let iconRect = new Rect(0,0,100,100);
    text = text.substr(0,1)
    textRect = new Rect(30,15,70,85);
    iconCanvas.setFillColor(bcgColor);
    iconCanvas.fillEllipse(iconRect);
    iconCanvas.setFont(iconFont);
    iconCanvas.setTextColor(textColor);
    iconCanvas.drawTextInRect(text,textRect);
    let icon = iconCanvas.getImage();
    return icon;
}

function getBcgColors(){
    let widgetPosition = `${widgetType}-${WIDGET_POSITION}`;
    const validPositions = {
      "small": ["small-top-left","small-top-right","small-middle-left","small-middle-right","small-bottom-left","small-bottom-right"],
      "medium": ["medium-top","medium-middle","medium-bottom"],
      "large": ["large-top","large-bottom"]
    }
    if (THEME == "transparent") {
      try {
        nobg = importModule('no-background');
        widgetPosition = eval(`validPositions.${widgetType}`).includes(`${widgetPosition}`) ? widgetPosition: eval(`validPositions.${widgetType}`)[0];
        writeLOG("Valid widget position " + widgetPosition);
      }
      catch(error) {
        writeLOG(`Module no-background missing, defaulting the theme to ${DEFAULT_THEME}`)
        THEME = DEFAULT_THEME;
      }
    }
    const validThemes = Object.keys(allColors);
    THEME = validThemes.includes(THEME) ? THEME : "white";
    color = eval(`allColors.${THEME}`)
    darkBCG = color[0];
    lightBCG = color[1];
    darkText = color[2];
    lightText = color[3];
    return [lightBCG, darkBCG, lightText, darkText, widgetPosition];
}

function getDynamicColors(itemNo){
    // Decide dynamic colors
    dynamicBCG = new Color(darkBCG);
    dynamicText = new Color(lightText);
    if ((MAX_CONTACTS/itemNo) <= 2) {
        dynamicBCG = new Color(lightBCG);
        dynamicText = new Color(darkText);
    }
    return [dynamicBCG, dynamicText];
}

async function loadContacts(){
    const MAX_WIDTH = 200;
    const MAX_HEIGHT = 200;
    const GROUP_NAME = "Favourites";
    const PROFILE_NAME = "SCRIPTABLE"
    let containers = await ContactsContainer.all()
    writeLOG("Total containers fetched: " + containers.length)

    // First look for the Contacts group called "Favourites"
    let groups = await ContactsGroup.all(containers);
    let filteredGroups = groups.filter(g => g.name === GROUP_NAME);
    writeLOG("No. of filtered groups: " + filteredGroups.length);
    fetchAllContacts = true;
    if (filteredGroups.length > 0) {
        filteredContacts = await Contact.inGroups(filteredGroups);
        if (filteredContacts.length > 0) fetchAllContacts = false;
    }
    // Only fetch all contacts when group or contacts in group is not found 
    if (fetchAllContacts) {
        let contacts = await Contact.all(containers)
        writeLOG("Total contacts count: " + contacts.length);
        // First find out all contact with "Social Profile" "Scriptable: Scriptable"
        filteredContacts = contacts.filter(c => c.socialProfiles.some(sp => sp.service !== null && sp.service.replace(/\s*/g,"").toUpperCase() === PROFILE_NAME))
        writeLOG("Contacts with required profile: " + filteredContacts.length);
        // Then fetch using the list provided in the script
        filteredContacts = filteredContacts.concat(contacts.filter(c => allcontacts.some(ac => ac.firstname === c.givenName && ac.lastname === c.familyName)))
    }
    // Save contact details to cache file
    // Create folder to store contact IDs
    let fm = FileManager.local();
    const iCloudUsed = fm.isFileStoredIniCloud(module.filename);
    fm = iCloudUsed ? FileManager.iCloud() : fm;
    const widgetFolder = "Favcon";
    const offlinePath = fm.joinPath(fm.documentsDirectory(), widgetFolder);
    const imagePath = fm.joinPath(offlinePath,"images");
    if (!fm.fileExists(offlinePath)) fm.createDirectory(offlinePath);
    if (!fm.fileExists(imagePath)) fm.createDirectory(imagePath);
    contactsFile = fm.joinPath(offlinePath,'contacts.json');

    contactList = {};
    i = 0;
    filteredContacts.forEach(function(f){
        if (f.isPhoneNumbersAvailable || f.isEmailAddressesAvailable) {
            f1 = Object.keys(f);
            if (!f.isPhoneNumbersAvailable) phoneNumber = "0";
            else phoneNumber = f.phoneNumbers[0].value;
            if (!f.isEmailAddressesAvailable || f.emailAddresses == "") emailID = "0";
            else emailID = f.emailAddresses[0].value;
            twitterProfile = f.socialProfiles.filter(s => s.service.toUpperCase() === 'TWITTER');
            if (twitterProfile.length > 0) {
                twitter = twitterProfile[0].username;
            } else twitter = "0";
            quickActions=addAndValidateActions(f.socialProfiles);
            contactList[f.identifier] = {givenName: f.givenName, familyName: f.familyName, sfSymbol: CONTACTS_SYMBOL_STYLE, nickName: f.nickName, phoneNumber: phoneNumber, emailID: emailID, twitter: twitter, quickActions: quickActions};  
        }
        try {
            if (f.isImageAvailable || f.image !== null) {
                // Resize the image
                img = f.image;
                ratio = Math.max(MAX_WIDTH/img.size.width,MAX_HEIGHT/img.size.height);
                newW = img.size.width * ratio;
                newH = img.size.height * ratio;
                imgCanvas = new DrawContext();
                imgCanvas.size = new Size(newW,newH);
                r = new Rect(0,0,newW,newH);
                imgCanvas.drawImageInRect(f.image,r);
                // Then align the image
                imgCanvas1 = new DrawContext();
                imgCanvas1.opaque = false;
                imgCanvas1.size = new Size(MAX_WIDTH,MAX_HEIGHT);
                imgCanvas1.drawImageAtPoint(imgCanvas.getImage(), new Point(0,0))
                imageName = fm.joinPath(imagePath,f.identifier + ".png");
                // Save image to iCloud drive
                fm.writeImage(imageName,imgCanvas1.getImage())
            }
        } catch (error) {
            writeLOG("No image available for " + f.givenName)
        }
        i++;
    })
    fm.writeString(contactsFile, JSON.stringify(contactList));
}
function addAndValidateActions(profiles){
    // Find out if there is a specific preference for this contact
    // Social Profile "SCRIPTABLE" is used. Value is comma separated in the form whatsapp,facetimeAudio 
    const PROFILE_NAME = "SCRIPTABLE";
    let filteredProfile = [];
    filteredProfile = profiles.filter(p => p.service.replace(/\s*/g,"").toUpperCase() === PROFILE_NAME);
    try {
        actions = filteredProfile[0].username.replace(/\s*/g,"").split(',').concat(ITEMS_TO_SHOW);
    } catch (e) {
        actions = ITEMS_TO_SHOW;
    }
    actions = actions.filter(i => Object.keys(itemList).some(o => o === i))
    uniqueActions = [...new Set(actions)];
    return uniqueActions
}
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