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

bot.library(require("./dialogs/shop").createLibrary());
bot.library(require("./dialogs/address").createLibrary());



// Establish the LUIS connection through the API which is hiden
// var LuisModelUrl = "./biogen-helper-bot.json"
// // set your LUIS url with LuisActionBinding models (see samples/LuisActionBinding/LUIS_MODEL.json)
// var luisRecognizer = new builder.LuisRecognizer(LuisModelUrl);
var luisRecognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);


// Establishes the QNA bot to be usable using the API keys provided.
var qnaRecognizer = new cog.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QAID,
    subscriptionKey: process.env.SUB_KEY
})

// This is the actual creation of the bot itself, with the recognizers that are beging given to it.
var intentDialog = new builder.IntentDialog({ recognizers: [luisRecognizer]});
// Starts the actual dialog.
bot.dialog("/", intentDialog)

// Set the default dialog for the response.

intentDialog.matches("Greeting", (session, args, next)=>{
    session.send("Hello! Welcome to the Biogen chat bot!")
})

intentDialog.matches("ActiveDialog", (session, args, next) =>{
    console.log("INSIDE THE QNA")
    // Go through the builder EntryRecognizer method and find the entity with an answer
    console.log("here are the args: " + JSON.stringify(args))
    var answerEntity = builder.EntityRecognizer.findEntity(args.entities, "answer");
     // The answerEntity variable throws back 3 parameters. A score = the certainrty of the processing. An entity, the answer and the type of eneity which we will look for the answer as state above. We then send the entity
    session.send(answerEntity.entity);  
});


intentDialog.matches("CreateTicket", (session,arg, next)=>{
    console.log(JSON.stringify(arg))
    session.send("Inside the Create ticket")
});

intentDialog.matches("SharedMailbox", (session,arg, next)=>{
     session.beginDialog("shop:/");


});

intentDialog.matches("Calendar", (session,arg, next)=>{
    console.log("Hit the calendar")
    session.send(`Sure we can schedule a meeting for ${arg.entities.values[1].value}`)
});


// Finally, bind the actions to the bot and intentDialog, using the same URL from the LuisRecognizer
// LuisActions.bindToBotDialog(bot, intentDialog, luisRecognizer , SampleActions);

intentDialog.onDefault([
    function (session) {
        session.send("Sorry I do not see anything in the prebuilt")
    }
]);

bot.dialog("survey", [
  function(session) {
    builder.Prompts.text(session, "Hello... What's your name?");
  },
  function(session, results) {
    session.userData.name = results.response;
    builder.Prompts.number(
      session,
      "Hi " + results.response + ", How many years have you been coding?"
    );
  },
  function(session, results) {
    session.userData.coding = results.response;
    builder.Prompts.choice(session, "What language do you code Node using? ", [
      "JavaScript",
      "CoffeeScript",
      "TypeScript"
    ]);
  },
  function(session, results) {
    session.userData.language = results.response.entity;
    session.endDialog(
      "Got it... " +
        session.userData.name +
        " you've been programming for " +
        session.userData.coding +
        " years and use " +
        session.userData.language +
        "."
    );
  }
]);


module.exports = {
    bot: bot,
    intentDialog: intentDialog
}