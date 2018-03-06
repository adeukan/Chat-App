var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// static files location (CSS, JS, images)
app.use(express.static(__dirname + '/public'));

// route '/' to index.html
app.get('/', function(req, res, next) {
	res.sendFile(__dirname + '/public/index.html');
});

// each message is an object inside this array
var allMessages = [];
// each client is an object inside this object
var clients = {};
// login names of all clients (including clients who left the page)
var clientNamesArchive = [];

// when clients request a connection,
// the server provides communication channels to each client over a single TCP connection
// each client's channel has unique ID (channel.id)
io.on('connection', function(channel) {

	console.log('client connected');

	// get new client login and color -----------------------------------------------------
	channel.on('login', function(data) {

		// if this login name has not been used before
		if(clientNamesArchive.indexOf(data.login) == -1) {

			// confirm the creation of new user
			channel.emit("loginValidation", true);

			// add new client object to "clients"
			clients[channel.id] = {
				login: data.login,
				color: data.color
			};

			// add client login to "archive"
			clientNamesArchive.push(data.login);
			// send the updated object with all clients to all clients
			io.emit('clients', clients);
			// send all messages to all clients
			io.emit('allMessages', allMessages);
		}
		else
			channel.emit("loginValidation", false);
	});

	// when the server get a message from a client -----------------------------------------
	channel.on('message', function(message) {

		// create an object from the client message with "login", "message" and "color" fields
		var currentMessage = {};
		currentMessage.login = clients[channel.id].login;
		currentMessage.message = message;
		currentMessage.color = clients[channel.id].color;
		// push this object to the array which contains all messages objects
		allMessages.push(currentMessage);
		// send the array back to all clients
		io.emit('allMessages', allMessages);
	});

	// when a client exits (or reload the page) ---------------------------------------------
	channel.on('disconnect', function(){
		// remove the client from the object with all active client names
		delete clients[channel.id];
		// send the updated object of all active clients to all clients
		io.emit('clients', clients);
	});
});

// start web server and socket.io server listening port 3000
server.listen(3000, function() {
	console.log('listening on *:3000');
});
