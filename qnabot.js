// This loads the environment variables from the .env file
require("dotenv-extended").load();
var builder = require("botbuilder");
var restify = require("restify");
var cog = require("botbuilder-cognitiveservices");
var shared = require("./SampleActions/SharedMailbox");

// Setup Restify Server
var server = restify.createServer();
// The actual start of the server
server.listen(process.env.port || process.env.PORT || 3978, function() {
  console.log("%s listening to %s", server.name, server.url);
});
// Create connector and listen for messages
var connector = new builder.ChatConnector({
  // appId: process.env.MICROSOFT_APP_ID,
  // appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// The HTTP route that we can listen on for the servers incoming requests
server.post("/api/messages", connector.listen());

// We are establishing the Universal bot instance here. The bot will take an arguemnt of session.
var bot = new builder.UniversalBot(connector);

// Establish the LUIS connection through the API which is hiden
// var LuisModelUrl = "./biogen-helper-bot.json"
// // set your LUIS url with LuisActionBinding models (see samples/LuisActionBinding/LUIS_MODEL.json)
// var luisRecognizer = new builder.LuisRecognizer(LuisModelUrl);
var luisRecognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);

// Establishes the QNA bot to be usable using the API keys provided.
var qnaRecognizer = new cog.QnAMakerRecognizer({
  knowledgeBaseId: process.env.QAID,
  subscriptionKey: process.env.SUB_KEY
});

// This is the actual creation of the bot itself, with the recognizers that are beging given to it.
var intentDialog = new builder.IntentDialog({
  recognizers: [qnaRecognizer, luisRecognizer]
});
// Starts the actual dialog.
bot.dialog("/", intentDialog);

// Set the default dialog for the response.

intentDialog.matches("Greeting", (session, args, next) => {
  session.send("Hello! Welcome to the Biogen chat bot!");
});

intentDialog.matches("ActiveDialog", (session, args, next) => {
  console.log("INSIDE THE QNA");
  // Go through the builder EntryRecognizer method and find the entity with an answer
  console.log("here are the args: " + JSON.stringify(args));
  var answerEntity = builder.EntityRecognizer.findEntity(
    args.entities,
    "answer"
  );
  // The answerEntity variable throws back 3 parameters. A score = the certainrty of the processing. An entity, the answer and the type of eneity which we will look for the answer as state above. We then send the entity
  session.send(answerEntity.entity);
});
