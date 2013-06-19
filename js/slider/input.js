var ns = ns || {};
ns.Input = (function(){

	var hasTouch = 'ontouchstart' in window || window.navigator.msPointerEnabled;

	var Input = new Class({
		touching: 0,
		touches: {},
		strictEnding: true, // Call end callback on the first end event or not
		supportsMultiTouch: true,

		initialize: function(startCallback, moveCallback, endCallback){
			this.startCallback = startCallback || function(){};
			this.moveCallback = moveCallback || function(){};
			this.endCallback = endCallback || function(){};
		},

		inputStart: function(points){
			// Mark touches by identifier
			for (var i = 0; i < points.length; i++) {
				this.touches[points[i].identifier] = points[i];
			}

			if (!this.touching)
			{
				// Call start callback
				this.startCallback();
				this.touching = true;
			}

			this.inputMove(points);
		},

		inputMove: function(points){
			if (this.touching)
			{
				// Update touches
				for (var i = 0; i < points.length; i++) {
					this.touches[points[i].identifier] = points[i];
				}

				var touches = [];
				for ( var id in this.touches )
				{
					if ( touches.length < 2 && this.touches.hasOwnProperty(id) ) // Detect two touches max
					{
						touches.push(this.touches[id]);
					}
				}

				// Call move callback
				this.moveCallback(touches);
			}
		},

		inputEnd: function(points, remove){
			if ( this.strictEnding )
			{
				// Call end callback
				this.endCallback();
				this.touches = {};
				this.touching = false;
			}
			else
			{
				var i, id;
				remove = remove || false;
				if ( remove )
				{
					for (i = 0; i < points.length; i++)
					{
						id = points[i].identifier;
						if ( this.touches.hasOwnProperty(id) )
						{
							delete this.touches[id];
							break;
						}
					}
				}
				else
				{
					for ( id in this.touches )
					{
						if ( this.touches.hasOwnProperty(id) )
						{
							var inPoints = false;
							for (i = 0; i < points.length; i++)
							{
								if ( points[i].identifier == id )
									inPoints = true;
							}
							if ( !inPoints )
							{
								delete this.touches[id];
							}
						}
					}
				}

				if ( Object.keys(this.touches).length == 0 )
				{
					// Call end callback
					this.endCallback();
					this.touching = false;
				}
			}
		},

		cancelEvent: function(event){
			event.cancel=true;
			event.returnValue=false;
			event.cancelBubble=true;
			if (event.stopPropagation) event.stopPropagation();
			if (event.preventDefault) event.preventDefault();
		}
	});

	var Implementation;
	if ( !hasTouch )
	{
		Implementation = new Class({
			Extends: Input,

			down: false,
			count: 0,
			supportsMultiTouch: false,

			initialize: function(container, startCallback, moveCallback, endCallback){
				this.parent(startCallback, moveCallback, endCallback);

				container.onmousedown = function(event){
					this.down = true;
					this.inputStart([{pageX: event.x, pageY: event.y, identifier: ++this.count}]);
				}.bind(this);

				container.onmousemove = function(event){
					if ( this.down === true )
						this.inputMove([{pageX: event.x, pageY: event.y, identifier: this.count}]);
				}.bind(this);

				container.onmouseup = function(){
					this.down = false;
					this.inputEnd([]);
				}.bind(this);

				// Make sure we don't get a select cursor when dragging over the canvas
				window.addEventListener("dragstart", this.cancelEvent );
				window.addEventListener("selectstart", this.cancelEvent );
			}
		});
	}
	else if ( window.navigator.msPointerEnabled )
	{
		// Mobile IE implementation
		Implementation = new Class({
			Extends: Input,

			initialize: function(container, startCallback, moveCallback, endCallback){
				this.parent(startCallback, moveCallback, endCallback);

				document.body.style["-ms-touch-action"] = "none";

				container.addEventListener("MSPointerDown", this.handleStart.bind(this), false);
				container.addEventListener("MSPointerMove", this.handleMove.bind(this), false);
				container.addEventListener("MSPointerUp", this.handleEnd.bind(this), false);
			},
			handleStart: function(event){
				this.cancelEvent(event);
				event.identifier = event.pointerId;
				this.inputStart([event]);
			},

			handleMove: function(event){
				this.cancelEvent(event);
				event.identifier = event.pointerId;
				this.inputMove([event]);
			},

			handleEnd: function(event){
				this.cancelEvent(event);
				event.identifier = event.pointerId;
				this.inputEnd([event], true);
			}
		});
	}
	else
	{
		// HTML5 implementation
		Implementation = new Class({
			Extends: Input,
			initialize: function(container, startCallback, moveCallback, endCallback){
				this.parent(startCallback, moveCallback, endCallback);

				container.addEventListener("touchstart", this.handleStart.bind(this), false);
				container.addEventListener("touchmove", this.handleMove.bind(this), false);
				container.addEventListener("touchend", this.handleEnd.bind(this), false);
			},
			handleStart: function(event){
				this.cancelEvent(event);
				this.inputStart(event.touches);
			},

			handleMove: function(event){
				this.cancelEvent(event);
				this.inputMove(event.touches);
			},

			handleEnd: function(event){
				this.cancelEvent(event);
				this.inputEnd(event.touches);
			}
		});
	}

	return Implementation;
})();