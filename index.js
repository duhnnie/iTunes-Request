var express = require('express');
var mustacheExpress = require('mustache-express');
var app = express();
var iTunesControl = require('itunescontrol');
var bodyParser = require('body-parser');
var amqp = require('amqplib/callback_api');
var amqpConn;

var sendRequest = function (message) {
	amqpConn.createChannel(function(err, ch) {
		var queueName = 'song_request';

		ch.assertQueue(queueName, {durable: false});
		ch.sendToQueue(queueName, new Buffer(message));
		console.log(" [x] Request sent: '" + message + "'");
	});
	setTimeout(function () {
		amqpConn.close();
	}, 500);
};

//configure
app.engine('html', mustacheExpress()); // register file extension mustache
app.set('view engine', 'html'); // register file exntension for partials
app.set('views', __dirname + '/html');
app.use(express.static(__dirname + '/public')); //set static folder

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
  res.render('index', {

  });
});

app.get('/search', function (req, res) {
	var query = req.query.q;
	console.log("searching for: ", query);
	iTunesControl.search(query, function(results) {
		res.send(results);
	});
});

app.post('/request', function (req, res) {
	var id = req.body.id,
		artist = req.body.artist,
		song = req.body.song;
	
	//if (!amqpConn) {
		console.log("CONNECTING AMQP...");
		amqp.connect('amqp://localhost', function (err, conn) {
			amqpConn = conn;
			sendRequest(JSON.stringify({
				id: id,
				artist: artist,
				song: song
			}));
		});
	//}
	console.log("preparing request => ", id, ": ", artist + " - \"" + song + "\"");
	res.send({
		text: artist + " - \"" + song + "\""
	});
});

app.post('/play', function (req, res) {
	var id = req.body.id,
		text = req.body.text;
	console.log("playing: ", id, text);
	iTunesControl.play(id);
	res.send({
		text: text
	});
});

app.listen(process.env.PORT || 3000);