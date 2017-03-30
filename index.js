const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const Bot = require('./BotCore.js');
var cache = require('memory-cache');
var mongoose = require('mongoose');
var Profile = require('./profile/profileController.js');
const app = express();

var mongoURI = process.env.MONGODB_URI ||'mongodb://localhost/bot';
mongoose.connect(mongoURI);
db = mongoose.connection;

app.set('port', (process.env.PORT || 8000));

db.once('open',function () {
	console.log('mongoDB is open');
});

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

var bot = new Bot({
	token : "EAAFstjN7RN0BADQQ2RcuQzjlfuMXg4hZBfIHYZC04kSfkraqvsOym4HkVFdH7K3GpcXlttg1Q95PWENR9NS5AnZAZBQKBh5XGd9UwTpJmsL55WxR5rUtFwh1ZCwfmCngDqdOhdX05gy3n4tegIeheBGYbFL4oH9JimkOZATVy8bwZDZD",
	verify_token : "twk_verify_token"
});


// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot 1')
})

// return all profiles
app.get('/profiles', function (req, res, next) {
	Profile.getAll(req, res, next);
})
// for Facebook verification
app.get('/webhook/', function (req, res) {
	bot._verify(req, res);
})


app.post('/webhook/', function (req, res) {

	var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    res.sendStatus(200);
  }

});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var message = event.message;
  var messageText = message.text;
  // check the message
  if (messageText) {
  	// check the cache if i have name of user
  	if(!cache.get('name')){
  		// if not get profile and save in my db
  		bot.getProfile2(senderID)
			.then((body) => {
				cache.put('name', body.first_name);
				console.log(body)
				Profile.newProfile(body);
				return sendMessageProcess(senderID, cache.get('name'), messageText);
  			})
  			.catch((err)=> {
				console.log(`Error is :${err}`)
			})
	}	
  	else {
  		// else just send message back
  		sendMessageProcess(senderID, cache.get('name'), messageText);
  	}
  }
}

function addToCach(text) {
	// simple function for save last 10 resp messages
	cache.put('mess1', cache.get('mess2'));
	cache.put('mess2', cache.get('mess3'));
	cache.put('mess3', cache.get('mess4'));
	cache.put('mess4', cache.get('mess5'));
	cache.put('mess5', cache.get('mess6'));
	cache.put('mess6', cache.get('mess7'));
	cache.put('mess7', cache.get('mess8'));
	cache.put('mess8', cache.get('mess9'));
	cache.put('mess9', cache.get('mess10'));
	cache.put('mess10', text);

}

function sendMessageProcess(senderID, name, messageText) {
	// make seen mark
	bot.sendSenderAction(senderID, "mark_seen")
		.then((body) =>{
			// make typing mark on
			return bot.sendSenderAction(senderID, "typing_on");
		})
		.then((body) =>{
			// make delay 3 secound
			setTimeout(function () {
				// make typing mark on
				bot.sendSenderAction(senderID, "typing_off")
				.then((body) =>{
					// add message to cache
					addToCach(messageText);
					// send message back with name
					return bot.sendMessage(senderID, cache.get('name') + " : you wrote " + messageText)
				})
			}, 3000)

		})
		// one catch for all promises
		.catch((err)=> {
			console.log(`Error is :${err}`)
		})
}


// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})