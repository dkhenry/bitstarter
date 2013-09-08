
var mainScreen = angular.module('mainScreen', []);


mainScreen.controller("MainCtrl",function($scope,$http) {
	$scope.userData = {
			backers: 0,
			total: 0,
			days: 40
			
	};
	
	$scope.submitEmail = function() {
		$http({
			url: '/email',
			method: "POST",
			data: JSON.stringify({email: $scope.email})	       
		}).success(function (data, status, headers, config) {
			console.log("Email update was successful"); 
			$('#emailModal').foundation('reveal', 'open');
		}).error(function (data, status, headers, config) {
			console.log("There was some kinf of error");
		});
	};  				

	var socket = io.connect(window.location.hostname);
	socket.on('heartbeat', function (data) {
		console.log(data.clients);	  
		$scope.userData.clients = data.clients;
	});	
});
