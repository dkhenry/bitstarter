
var mainScreen = angular.module('mainScreen', []);


mainScreen.controller("MainCtrl",function($scope) {
	$scope.userData = {
			backers: 0,
			total: 0,
			days: 40
			
	}; 
	
	var socket = io.connect(window.location.hostname);
	socket.on('heartbeat', function (data) {
		console.log(data.clients);	  
		$scope.userData.clients = data.clients;
	});	
});
