$(function() { 
	var host = window.document.location.host.replace(/:.*/, '');
	var ws = new WebSocket('ws://' + host + ':5000');
	ws.onmessage = function (event) {
		console.log(JSON.parse(event.data));
	};
});
