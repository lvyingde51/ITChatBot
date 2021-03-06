// This loads the environment variables from the .env file
require('dotenv-extended').load();
var builder = require('botbuilder');
var restify = require('restify');
var cog = require("botbuilder-cognitiveservices");



// Setup Restify Server
var server = restify.createServer();
// The actual start of the server
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
// Create connector and listen for messages
var connector = new builder.ChatConnector({
    // appId: process.env.MICROSOFT_APP_ID,
    // appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// The HTTP route that we can listen on for the servers incoming requests
server.post('/api/messages', connector.listen());

// We are establishing the Universal bot instance here. The bot will take an arguemnt of session.
var bot = new builder.UniversalBot(connector)

// Allow the libraries of Shop and address. Create Library allows the CLone method to be brought down to the sevrer and used
bot.library(require("./dialogs/ticket").createLibrary());
bot.library(require("./dialogs/calendar").createLibrary());
bot.library(require("./dialogs/sharedmb").createLibrary());


// Establish the LUIS connection through the API which is hiden
var luisRecognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);

// This is the actual creation of the bot itself, with the recognizers that are beging given to it.
var intentDialog = new builder.IntentDialog({recognizers: [luisRecognizer]});
// Starts the actual dialog.
bot.dialog("/", intentDialog)

// Set the default dialog for the response.
intentDialog.matches("Greeting", (session, args, next)=>{
    session.send("Hello! Welcome to the Biogen chat bot!")
})

intentDialog.matches("CreateTicket", (session,arg, next)=>{
    session.beginDialog("ticket:/")

});

intentDialog.matches("SharedMailbox", (session,arg, next)=>{
    // If it matches, begin the dialog for the "Shop"
     session.beginDialog("sharedMB:/");
});

intentDialog.matches("Calendar", (session,arg, next)=>{
    session.beginDialog("calendar:/")
});


intentDialog.onDefault([
    function (session) {
        session.send("Sorry I do not see anything in the prebuilt")
    }
]);


module.exports = {
    bot: bot,
    intentDialog: intentDialog
}