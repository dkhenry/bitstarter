/**
 * Module dependencies.
 */

var port = process.env.PORT || 3000;
var express = require('express')
, http = require('http')
, https = require('https')
, async = require('async')
, path = require('path');

var app = express();

app.set('port', port);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);
// Include the WebSockets
var io = require('socket.io').listen(server);

var Mongoose = require('mongoose');
var uristring = process.env.MONGOHQ_URL || 'mongodb://localhost/mainscreen';
var db = Mongoose.connect(uristring, function (err, res) {
  if (err) { 
  console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
  console.log ('Succeeded connected to: ' + uristring);
  }
});

var orderSchema = new Mongoose.Schema(
	{ 
		coinbase_id: { 
			type: String,
			required: true,
			unique: true
		},
		amount: {
			type: Number,
			required: true,
			validate : [
				function(v) { return v > 0.0; },
				"Invalid amount, amount must be positive"
			]
		},
		time : {
			type: Date,
			default: Date.now,
			required: true
		}
	});

var Orders = Mongoose.model("Orders",orderSchema);

var emailSchema = new Mongoose.Schema(
		{
			address: {
				type: String,
				required: true,
				unique: true
			}
		}
);

var Email = Mongoose.model("Email",emailSchema);


app.post("/email", function(request,response) {
	console.log("A user has requested we keep them updated");
	var email = new Email({
		address: request.body.email
	});
	email.save();
	response.json({"success":true, "message": "Added " + request.body.email + "to contacts list"});
});


app.get('/refresh_orders', function(request, response) {
	console.log(process.env.COINBASE_API_KEY);
	https.get("https://coinbase.com/api/v1/orders?api_key=" + process.env.COINBASE_API_KEY, function(res) {
		var body = '';
		res.on('data', function(chunk) {body += chunk;});
		res.on('end', function() {
			try {
				console.log("--- Got Back Orders");
				var orders_json = JSON.parse(body);
				if (orders_json.error) {
					response.send(orders_json.error);
					return;
				}
				// add each order asynchronously
				async.forEach(orders_json.orders, addOrder, function(err) {
					if (err) {
						console.log(err);
						response.send("error adding orders");
					} else {
						console.log("--- Listing all Orders");
						// orders added successfully
						response.json(listOrders);
					}
				});
			} catch (error) {
				console.log(error);
				response.json( {"success": false, "message" : "error parsing json" + error} );
			}
		});

		res.on('error', function(e) {
			console.log(e);
			response.send("error syncing orders");
		});
	});

});

app.get('/orders',function(request, response) {
	response.json(listOrders);
});

var listOrders = function() { 
	order = [];
	Orders.find({},function(err,results) { 
		records.forEach(function (o, i) {
			order.push(o);
		});
    });
	return order;
};

var addOrder = function(order_obj, callback) {
	console.log("--- Adding Order");
	var order = order_obj.order; // order json from coinbase
	if (order.status != "completed") {
		// only add completed orders
		callback();
	} else {
		var order = new Order({
			coinbase_id: order.id,
			amount: order.total_btc.cents / 100000000,
			time: order.created_at
		});
		order.save();  
	}  
};
//assuming io is the Socket.IO server object
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

var clients = 0;
io.sockets.on('connection', function (socket) {
	clients++;
	var id = setInterval(function() {
		socket.emit('heartbeat', {clients: clients});
	}, 10000);	  
	socket.on('my other event', function (data) {
	    console.log(data);
	});
	console.log("Started New client Session");
});
io.sockets.on('disconnect', function () { clients= clients -1;});

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
