var express = require('express');
var fs = require('fs'); 

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
	fs.readFile("index.html", function(err,data) {
		response.send(data.toString('utf-8'));
	});
});

app.use('/static', express.static(__dirname + '/public'));

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
