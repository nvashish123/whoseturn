/* This code has been generated from your interaction model by skillinator.io */


let reprompt;
let welcomeOutput = "Welcome to the whos turn skill. What would you like to do, you can ask for a turn or add a new user.";
let welcomeReprompt = "would you like to continue?";

"use strict";
const Alexa = require('alexa-sdk');
const APP_ID = undefined; // TODO replace with your app ID (OPTIONAL).
let speechOutput = '';

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
const docClient = new AWS.DynamoDB.DocumentClient();


const handlers = {
    'LaunchRequest': function() {
        this.emit(':ask', welcomeOutput, welcomeReprompt);
    },
    'AMAZON.HelpIntent': function() {
        speechOutput = 'Placeholder response for AMAZON.HelpIntent.';
        reprompt = 'you can ask for a turn or add a new user.';
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function() {
        speechOutput = 'bye, talk to you later.';
        this.emit(':tell', speechOutput);
    },
    'AMAZON.StopIntent': function() {
        speechOutput = 'bye, talk to you later.';
        this.emit(':tell', speechOutput);
    },
    'SessionEndedRequest': function() {
        speechOutput = '';
        this.emit(':tell', speechOutput);
    },
    'AMAZON.FallbackIntent': function() {
        speechOutput = '';

        speechOutput = "Sorry, I do not understand this command. I can either find whos turn is next or add a new user.";
        this.emit(":ask", speechOutput, speechOutput);
    },
    'AddUserIntent': function() {
        speechOutput = '';

        let userNameSlotRaw = this.event.request.intent.slots.userName.value;
        console.log(userNameSlotRaw);

        putItem(userNameSlotRaw)
            .then(data => {

                speechOutput = "new user " + userNameSlotRaw + " has been added to the skill. Would you like to knwo who's turn is it? Say yes or no";
                this.emit(":ask", speechOutput, speechOutput);

            })
            .catch(err => {
                console.log(err);
            })

    },

    'ResponseIntent': function() {
        speechOutput = '';
        let names = [];
        let counter = 0;

        let responseSlotRaw = this.event.request.intent.slots.response.value;
        console.log(responseSlotRaw);
        let responseSlot = resolveCanonical(this.event.request.intent.slots.response);
        console.log(responseSlot);

        if (responseSlot.trim() === 'yes') {
            speechOutput = "";

            scanDdbData()
                .then(data => {
                    console.log(data);

                    data.Items.forEach(function(item) {
                        names[counter] = item.name.S;
                        console.log(" item -", item.name.S);
                        counter++;

                    });

                    // find a random name from the populated names array

                    var name = names[getRandomInt(names.length)];

                    speechOutput = " The Next turn is..." + name + "'s";
                    this.emit(":ask", speechOutput, speechOutput);
                })
                .catch(err => {
                    console.log(err);
                })

        } else if (responseSlot.trim() === 'no') {
            speechOutput = "bye for now, talk to you later";
            this.emit(":ask", speechOutput, speechOutput);
        } else {
            speechOutput = "Please say either yes or no";
            this.emit(":ask", speechOutput, speechOutput);
        }


        //Your custom intent handling goes here


    },

    'WhosTurnIntent': function() {
        speechOutput = '';
        let names = [];
        let counter = 0;
        
        scanDdbData()
            .then(data => {
                console.log(data);

                data.Items.forEach(function(item) {
                    names[counter] = item.name.S;
                    //console.log(" item -", item.name.S);
                    counter++;

                });

                if (counter < 1) {
                    speechOutput = " There is no user exists yet, say 'add' followed by a username to add a new user";
                    this.emit(":ask", speechOutput, speechOutput);
                } else {
                    var name = names[getRandomInt(names.length)];
                    speechOutput = " The Next turn is..." + name + "'s";
                    this.emit(":ask", speechOutput, speechOutput);
                }

            })
            .catch(err => {
                console.log(err);
            })

    },



    'Unhandled': function() {
        speechOutput = "The skill didn't quite understand what you wanted.  Do you want to try something else?";
        this.emit(':ask', speechOutput, speechOutput);
    }
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    //alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    //alexa.dynamoDBTableName = 'DYNAMODB_TABLE_NAME'; //uncomment this line to save attributes to DB
    alexa.execute();
};

//    END of Intent Handlers {} ========================================================================================
// 3. Helper Function  =================================================================================================


function scanDdbData() {

    var params = {
        TableName: 'whoseturn',
    }

    return new Promise((resolve, reject) => {

        dynamodb.scan(params, function(err, data) {
            if (err) {
                reject(err);
                console.log(err, err.stack); // an error occurred
            } else {
                //console.log(data);    
                resolve(data);
            }
        });

    });
}

function putItem(userNameSlotRaw) {

    var params = {
        TableName: 'whoseturn',
        Item: {
            "name": userNameSlotRaw
        }
    };

    return new Promise((resolve, reject) => {

        docClient.put(params, function(err, data) {
            if (err) {
                reject(err);
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Added item:", JSON.stringify(data, null, 2));
                resolve(data);
            }

        });
    });

}

/* Boilerplate functions from skillinator */

function resolveCanonical(slot) {
    //this function looks at the entity resolution part of request and returns the slot value if a synonyms is provided
    let canonical;
    try {
        canonical = slot.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    } catch (err) {
        console.log(err.message);
        canonical = slot.value;
    };
    return canonical;
};

function delegateSlotCollection() {
    console.log("in delegateSlotCollection");
    console.log("current dialogState: " + this.event.request.dialogState);
    if (this.event.request.dialogState === "STARTED") {
        console.log("in Beginning");
        let updatedIntent = null;
        // updatedIntent=this.event.request.intent;
        //optionally pre-fill slots: update the intent object with slot values for which
        //you have defaults, then return Dialog.Delegate with this updated intent
        // in the updatedIntent property
        //this.emit(":delegate", updatedIntent); //uncomment this is using ASK SDK 1.0.9 or newer

        //this code is necessary if using ASK SDK versions prior to 1.0.9 
        if (this.isOverridden()) {
            return;
        }
        this.handler.response = buildSpeechletResponse({
            sessionAttributes: this.attributes,
            directives: getDialogDirectives('Dialog.Delegate', updatedIntent, null),
            shouldEndSession: false
        });
        this.emit(':responseReady', updatedIntent);

    } else if (this.event.request.dialogState !== "COMPLETED") {
        console.log("in not completed");
        // return a Dialog.Delegate directive with no updatedIntent property.
        //this.emit(":delegate"); //uncomment this is using ASK SDK 1.0.9 or newer

        //this code necessary is using ASK SDK versions prior to 1.0.9
        if (this.isOverridden()) {
            return;
        }
        this.handler.response = buildSpeechletResponse({
            sessionAttributes: this.attributes,
            directives: getDialogDirectives('Dialog.Delegate', null, null),
            shouldEndSession: false
        });
        this.emit(':responseReady');

    } else {
        console.log("in completed");
        console.log("returning: " + JSON.stringify(this.event.request.intent));
        // Dialog is now complete and all required slots should be filled,
        // so call your normal intent handler.
        return this.event.request.intent;
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function isSlotValid(request, slotName) {
    let slot = request.intent.slots[slotName];
    //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
    let slotValue;

    //if we have a slot, get the text and store it into speechOutput
    if (slot && slot.value) {
        //we have a value in the slot
        slotValue = slot.value.toLowerCase();
        return slotValue;
    } else {
        //we didn't get a value in the slot.
        return false;
    }
}

//These functions are here to allow dialog directives to work with SDK versions prior to 1.0.9
//will be removed once Lambda templates are updated with the latest SDK

function createSpeechObject(optionsParam) {
    if (optionsParam && optionsParam.type === 'SSML') {
        return {
            type: optionsParam.type,
            ssml: optionsParam['speech']
        };
    } else {
        return {
            type: optionsParam.type || 'PlainText',
            text: optionsParam['speech'] || optionsParam
        };
    }
}

function buildSpeechletResponse(options) {
    let alexaResponse = {
        shouldEndSession: options.shouldEndSession
    };

    if (options.output) {
        alexaResponse.outputSpeech = createSpeechObject(options.output);
    }

    if (options.reprompt) {
        alexaResponse.reprompt = {
            outputSpeech: createSpeechObject(options.reprompt)
        };
    }

    if (options.directives) {
        alexaResponse.directives = options.directives;
    }

    if (options.cardTitle && options.cardContent) {
        alexaResponse.card = {
            type: 'Simple',
            title: options.cardTitle,
            content: options.cardContent
        };

        if (options.cardImage && (options.cardImage.smallImageUrl || options.cardImage.largeImageUrl)) {
            alexaResponse.card.type = 'Standard';
            alexaResponse.card['image'] = {};

            delete alexaResponse.card.content;
            alexaResponse.card.text = options.cardContent;

            if (options.cardImage.smallImageUrl) {
                alexaResponse.card.image['smallImageUrl'] = options.cardImage.smallImageUrl;
            }

            if (options.cardImage.largeImageUrl) {
                alexaResponse.card.image['largeImageUrl'] = options.cardImage.largeImageUrl;
            }
        }
    } else if (options.cardType === 'LinkAccount') {
        alexaResponse.card = {
            type: 'LinkAccount'
        };
    } else if (options.cardType === 'AskForPermissionsConsent') {
        alexaResponse.card = {
            type: 'AskForPermissionsConsent',
            permissions: options.permissions
        };
    }

    let returnResult = {
        version: '1.0',
        response: alexaResponse
    };

    if (options.sessionAttributes) {
        returnResult.sessionAttributes = options.sessionAttributes;
    }
    return returnResult;
}

function getDialogDirectives(dialogType, updatedIntent, slotName) {
    let directive = {
        type: dialogType
    };

    if (dialogType === 'Dialog.ElicitSlot') {
        directive.slotToElicit = slotName;
    } else if (dialogType === 'Dialog.ConfirmSlot') {
        directive.slotToConfirm = slotName;
    }

    if (updatedIntent) {
        directive.updatedIntent = updatedIntent;
    }
    return [directive];
}