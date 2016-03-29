#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(err, conn) {
	conn.createChannel(function(err, ch) {
		var q = 'song_request';

		ch.assertQueue(q, {durable: false});
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
		ch.consume(q, function(msg) {
			var thedata = JSON.parse(msg.content.toString());
			console.log(" [x] Received %s", msg.content.toString());
			// access token shouldn't be refreshed for every call
			refreshAccessToken(function () {
				console.log("xxxx");
				pmRequest('cases', 'POST', {
					pro_uid: "59582629856f3fc8935d519044485052",
				    tas_uid: "26138170256f3fcdb1ab349052207752",
				    variables: [{
				        artist: thedata.artist,
				        song: thedata.song,
				        song_id: thedata.id
				    }]
				}, function (data) {
					var data = JSON.parse(data);
					pmRequest('cases/' + data.app_uid  + '/route-case', 'PUT', {}, function (data) {
						console.log("routed!");
					});
				});
			});
		}, {noAck: true});
	});
});

var http = require('http');
var querystring = require('querystring');
var PM_conf = {
	host: 'localhost',
	port: '8081',
	workspace: 'workflow',
	username: 'test',
	password: 'testtest',
	client_id: 'OJMKFKRNKQKGCDKJNSXLDMKPOXFSLDLZ',
	client_secret: '50376786656f45a0031d093076306219'
};

var accessToken;

var pmRequest = function (uri, method, data, callback) {
	var request = http.request({
		protocol: 'http:',
		host: PM_conf.host,
		port: PM_conf.port,
		method: method,
		path: '/api/1.0/' + PM_conf.workspace + '/' + uri,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}		
	}, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (data) {
			if (typeof callback === 'function') {
				callback(data);
			}
		});
	});

	request.write(JSON.stringify(data));
	request.end();
};

var refreshAccessToken = function (callback) {
	var postData = {
		grant_type: "password",
		scope: "*",
		username: PM_conf.username,
		password: PM_conf.password,
		client_id: PM_conf.client_id,
		client_secret: PM_conf.client_secret
	}, requestConf = {
		protocol: 'http:',
		host: PM_conf.host,
		port: PM_conf.port,
		method: 'POST',
		path: '/workflow/oauth2/token',
		headers: {
			'Content-Type': 'application/json',
			'Autorization': 'Basic eC1wbS1sb2NhbC1jbGllbnQ6MTc5YWQ0NWM2Y2UyY2I5N2NmMTAyOWUyMTIwNDZlODE='
		}
	};

	var request = http.request(requestConf, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (data) {
			//console.log(data);
			accessToken = JSON.parse(data).access_token;
			if (typeof callback === 'function') {
				callback(accessToken);
			}
		})
	});

	request.write(JSON.stringify(postData));
	request.end();
};