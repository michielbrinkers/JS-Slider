var ns = ns || {};
ns.Slider = (function(){

	var transformSelector = Modernizr.prefixed('transform');

	var Slider = new Class({

		id: "",
		margin: 0.5,

		$container: null,
		$element: null,
		$children: [],

		input: null,
		prevTime: 0,
		prevTouch: null,
		velocityX: 0,
		offsetX: 0,
		offsetIndex: 0,
		targetX: 0,
		invalidated: true,
		easing: false,

		initialize: function(id, margin){
			this.id = id;
			this.margin = margin || this.margin;

			// Apply default bindings
			this.invalidate = this.invalidate.bind(this);
			this.update = this.update.bind(this);

			var container = this.$container = $(id);
			this.applyTranslation(container.style, 0, 0, 0);

			// Create scrolling element
			var element = this.$element = new Element('div', { styles: { position: "absolute", "background-color": "#f00", display: "inline-block" } });
			this.applyTranslation(element.style, 0, 0, 0);

			// Create input handler
			this.input = new ns.Input(container, this.gestureStart.bind(this), this.gestureUpdate.bind(this), this.gestureEnd.bind(this));

			// Setup css for element children
			var css = {position: "absolute"};
			this.applyTranslation(css, 0, 0, 0);

			// Apply css, reparent the children to the scroll element and fill $children
			container.getChildren().each(function(item, index, array){
				item.onload = this.invalidate;
				var $item = $(item);
				$item.setStyles(css);
				$item.inject(element);
				this.$children.push($item);
			}.bind(this));

			// Add the scroll element to the container
			element.inject(container);

			// Bind update and call it once to start the update cycle
			this.invalidated = true;
			this.update();
		},

		invalidate: function(){
			this.invalidated = true;
		},

		applyTranslation: function(style, x,y,z){
			style[transformSelector] = 'translate3d(' + x + 'px ,' + y + 'px ,' + z + 'px)';
		},

		updateLayout: function(){
			var containerWidth = this.$container.getSize().x;
			var center = containerWidth/2;
			var offset = containerWidth*this.margin;
			var length = this.$children.length;
			for (var i = 0; i < length; i++) {
				var idx = (i - this.offsetIndex - 1);

				var item;
				if ( idx < 0 && idx % length != 0 )
				{
					item = this.$children[length + (idx % length)];
				}
				else
				{
					item = this.$children[idx % length];
				}

				if ( item )
				{
					var ox = offset*idx;
					item.style.marginLeft = -item.width/2 + "px";
					item.style.left = (center + ox)+"px";
				}
			}
		},

		gestureStart: function(){
			this.prevTime = Date.now();
			this.velocityX = 0;
			this.easing = false;
		},

		gestureUpdate: function(touches){
			if ( touches.length )
			{
				var touch = touches[0];
				if ( this.prevTouch !== null )
				{
					var deltaTime = Date.now() - this.prevTime;
					this.prevTime = Date.now();

					if ( deltaTime > 0 )
					{
						var diffX = touch.pageX - this.prevTouch.pageX;
						this.offsetX += diffX;
						this.$element.setStyle("left", this.offsetX+"px");

						var vx = diffX / deltaTime;
						this.velocityX = (this.velocityX == 0) ? vx : this.velocityX * 0.8 + vx * 0.2;

						var w = this.$container.getSize().x*this.margin;
						var ox = this.offsetX + w/2;
						var idx = Math.round((ox - ox % w)/w);
						if ( this.offsetIndex != idx )
						{
							this.offsetIndex = idx;
							this.updateLayout();
						}
					}
				}
				this.prevTouch = touch;
			}
		},

		gestureEnd: function(){
			this.prevTouch = null;

			var w = this.$container.getSize().x*this.margin;
			var ox = (this.offsetX > 0) ? this.offsetX + w/2 : this.offsetX - w/2;
			var idx = Math.round((ox - ox % w)/w);
			var alpha = (ox % w)/w;
			if ( alpha < 0 ) alpha = 1 + alpha;

			// Apply extra offset so we can flick the slider
			if ( this.velocityX > .5 && alpha > 0.6 )
			{
				idx += 1;
			}
			else if ( this.velocityX < -0.5 && alpha < 0.4 )
			{
				idx -= 1;
			}

			this.targetX = idx * w;
			this.easing = true;
		},

		update: function(){
			if ( this.easing )
			{
				// Update offset towards targetX
				this.offsetX += (this.targetX - this.offsetX) / 10;
				this.$element.setStyle("left", this.offsetX+"px");

				// Stop easing if we're close enough
				if ( Math.abs(this.targetX - this.offsetX) < 0.1 ) {
					this.easing = false;
				}

				// Update offset index
				var w = this.$container.getSize().x*this.margin;
				var ox = this.offsetX + w/2;
				this.offsetIndex = Math.round((ox - ox % w)/w);

				this.invalidated = true;
			}

			if ( this.invalidated )
			{
				this.invalidated = false;
				this.updateLayout();
			}

			requestAnimationFrame(this.update);
		}
	});

	return Slider;
})();