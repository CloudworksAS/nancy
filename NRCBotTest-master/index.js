var VERIFY_TOKEN = process.env.VERIFY_TOKEN,
	ACCESS_TOKEN = process.env.ACCESS_TOKEN,
	APP_SECRET = process.env.APP_SECRET;
	
var http = require('http'),
     express = require('express'),
    // BootBot = require('bootbot'),
     bodyParser = require('body-parser'),
    //immediate = require('setimmediate'),
    crypto = require('crypto'),
    //debug = require('debug'),
    request = require('request');
/*
const bot = new BootBot({
  accessToken: ACCESS_TOKEN,
  verifyToken: VERIFY_TOKEN,
  appSecret: APP_SECRET
});*/

function verifyRequestSignature(req, res, buf) {
	var signatureHash = req.headers['x-hub-signature'];
console.log('inside validate signatire');
	if (!signatureHash) {
		// For testing, let's log an error. In production, you should throw an error.
		console.error("Couldn't validate the signature.");
		console.log("Couldn't validate the signature");
	} else {
		//var elements = signature.split('=');
		//var signatureHash = elements[1];
		var expectedHash = crypto.createHmac('sha1', APP_SECRET)
			.update(buf)
			.digest('base64');
console.log("Signature hash is "+signatureHash);
console.log("expected hash is "+expectedHash);
		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
}

var app = express();

app.set('view engine', 'json');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
//app.use(bodyParser.json());
if (!(APP_SECRET && VERIFY_TOKEN && ACCESS_TOKEN)) {
	console.error('Missing environment values.');
	process.exit(1);
}


/*
bot.on('message', (payload, chat) => {
	var text = payload.message.text;
	console.log('The user said: gaurav');
});

bot.hear(['hello', 'hi', /hey( there)?/i], (payload, chat) => {
	console.log('The user said "hello", "hi", "hey", or "hey there"');
});
//bot.start();*/

http.createServer(app).listen(process.env.PORT || 8080);

//app.configure(function () {
    //app.use(express.logger('dev'));     
    //app.use(express.query());     
    //app.use(express.bodyParser());
    //app.use(express.static(__dirname + '/public')); NOT NEEDED-- IIS REWRITE DOES THIS     
    //app.use(app.router); //}); 
//app.configure('development', function () { app.use(express.errorHandler()); });
//app.use(express.errorHandler());

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});



//Post triggered when data is sent from the NORCAP database.
app.post('/mission', function (req, res) {
console.log(req.body);
var stringJson = JSON.stringify(req.body);
console.log('JSON stringigfy'+stringJson);
if (stringJson == '{}')
{
	console.log('No request body');
	res.status(204).send('No data provided');
	process.exit();
}
var body = JSON.parse(JSON.stringify(req.body));
	console.log('Extracted data is'+body.CurrentMission.MissionId);
    sendGenericMessage("100014740907799");
	//console.log('Other object array length'+body.OtherMissions.length);
    //sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
    //req.query("exec insertmission @mission")
   //     .param('mission', JSON.stringify(req.body), TYPES.NVarChar)
   //     .exec(res);
res.status(200).send(req.body);
  //res.send(200, req.body);
});

//app.listen(app.get('port'), function() {
//	console.log('Node app is running on port', app.get('port'));
//});

var graphapi = request.defaults({
	baseUrl: 'https://graph.facebook.com',
	json: true,
	auth: {
		'bearer' : ACCESS_TOKEN
	}
});


function sendGenericMessage(sender) {
   let messageData = {
	    "attachment": {
		    "type": "template",
		    "payload": {
				"template_type": "generic",
			    "elements": [{
					"title": "Deploy to Group",
                    "subtitle": "Do you want to add user Y to Group Y?",
				    "buttons": [{
					    "type": "postback",
					    "title": "No",
					    "payload": "Payload for NO element in a generic bubble",
				    }, {
					    "type": "postback",
					    "title": "Yes",
					    "payload": "Payload for Yes element in a generic bubble",
				    },{
					    "type": "postback",
					    "title": "Cancel",
					    "payload": "Payload for cancel element in a generic bubble",
				    }],
			    }]
		    }
	    }
    }
    request({
	    url: 'https://graph.facebook.com/v2.6/100014740907799/messages',
	    qs: {access_token:ACCESS_TOKEN},
	    method: 'POST',
	    json: {
		    recipient: {id:sender},
		    message: messageData,
	    }
    }, function(error, response, body) {
	    if (error) {
		    console.log('Error sending messages: ', error)
	    } else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}
/*
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}
*/
