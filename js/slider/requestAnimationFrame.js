// Polyfill for requestAnimationFrame
(function(){
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	// NOTE: For iOS we always use the override because we're not getting native requestAnimationFrame events when touch moving in iOS 6 on the iPad 2
	if (!window.requestAnimationFrame || !window.cancelAnimationFrame || navigator.userAgent.match(/iPhone|iPad|iPod/i)){
		var requests = {};

		window.requestAnimationFrame = function(callback, element) {
			var now = Date.now();
			var request = requests[callback];
			if (!request) requests[callback] = request = {id: 0, last: now};
			var next = Math.max(0, Math.min(16 - (now - request.last), 16));
			request.id = window.setTimeout(function(){
				request.last = Date.now();
				callback(request.last);
			}, next);
			return request.id;
		};

		window.cancelAnimationFrame = function(id) {
			for ( var callback in requests )
			{
				if ( requests.hasOwnProperty(callback) && requests[callback].id == id )
				{
					delete requests[callback];
					break;
				}
			}
			clearTimeout(id);
		};

		// Once a second clean up dangling callbacks to prevent leaks
		window.setInterval(function(){
			var now = Date.now();
			for ( var callback in requests )
			{
				if ( requests.hasOwnProperty(callback) && now - requests[callback].last > 1000 )
				{
					delete requests[callback];
				}
			}
		}, 1000);
	}
}());