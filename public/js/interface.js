
var mainScreen = angular.module('mainScreen', []);

function mainCtrl($scope) {	
var socket = io.connect(window.location.hostname);
socket.on('heartbeat', function (data) {
  console.log(data.clients);	  
  $scope.userData = data;
});	
	
}

$(function() { 
	
});
