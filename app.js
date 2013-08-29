/**
 * Module dependencies.
 */

var express = require('express')
, http = require('http')
, https = require('https')
, async = require('async')
, path = require('path')
, WebSocketServer = require('ws').Server;

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);
// Include the WebSockets

var wss = new WebSocketServer({ server: server });

var Mongoose = require('mongoose');
var db = Mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://localhost/mainscreen', function (err, res) {
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
				function(v) { return v > 0.0 },
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

app.get('/refresh_orders', function(request, response) {
	console.log(process.env.COINBASE_API_KEY);
	https.get("https://coinbase.com/api/v1/orders?api_key=" + process.env.COINBASE_API_KEY, function(res) {
		var body = '';
		res.on('data', function(chunk) {body += chunk;});
		res.on('end', function() {
			try {
				console.log("--- Got Back Orders")
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
}

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

wss.on('connection', function(ws) {
  var id = setInterval(function() {
    ws.send(JSON.stringify(process.memoryUsage()), function() { /* ignore errors */ });
  }, 10000);
  console.log('started client interval');
  ws.on('close', function() {
    console.log('stopping client interval');
    clearInterval(id);
  });
});

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
