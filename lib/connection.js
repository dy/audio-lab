/**
 * Cord between two blocks
 */

var Emitter = require('events');
var hasDom = require('has-dom');
var css = require('mucss/css');
var offset = require('mucss/offset');
var on = require('emmy/on');
var once = require('emmy/once');
var off = require('emmy/off');
var win = require('global/window');
var domify = require('domify');
var inherits = require('inherits');
var defineState = require('define-state');
var q = require('queried');
var getUid = require('get-uid');
var selection = require('mucss/selection');
var Popup = require('popoff');


/**
 * Constructor
 *
 * @constructor
 */
class Connection extends Emitter {
	constructor (a, b) {
		super();

		var self = this;

		//define state
		defineState(self, 'state', self.state);

		//save references
		self.from = a;
		self.to = b;

		//generate unique connection id
		self.id = getUid();

		//create DOM representation
		self.createElement();

		//if no b - treat connection as temporary hangling connection
		if (!b) {
			self.update(offset(self.from.element), offset(self.from.element));
			self.state = 'hangling';
		} else if (a && b) {
			self.state = 'connected';
		}
	}


	/**
	 * Create DOM-representation
	 */
	createElement () {
		var self = this;

		if (!hasDom) return self;

		//get parent element
		self.container = (self.from || self.to).element.parentNode;

		self.element = domify(`
			<div class="connection" data-connection tabindex="1">
				<div class="connection-start" data-connection-start></div>
				<div class="connection-end" data-connection-end></div>
			</div>
		`);

		//insert to block
		self.container.appendChild(self.element);

		on(win, 'resize.' + self.id, function () {
			self.update();
		});

		self.endElement = q('.connection-end', self.element);
		self.startElement = q('.connection-start', self.element);

		//save self to the element
		self.element.connection = self;

		return self;
	}


	/** Update end of connection */
	updateEnd (e) {
		var self = this;

		var coord = offset(self.from.element);
		var mouseCoord = {
			left: e.pageX - coord.width / 2,
			top: e.pageY - coord.height / 2,
			width: 0,
			height: 0
		};

		self.update(coord, mouseCoord);

		//rotate target inputs to look at connection end
		q.all('[data-block-input]:not([hidden])', self.container).forEach(function (el) {
			var blockEl = el.closest('[data-block]');
			if (blockEl === self.from.element) return;

			var targetCoord = offset(blockEl);

			var angle;
			var dx = -mouseCoord.left + targetCoord.left;
			var dy = -mouseCoord.top + targetCoord.top;
			var d = Math.sqrt(dx*dx + dy*dy);

			//for short distance - set angle towards source node
			if (d < 80) {
				dx = -coord.left + targetCoord.left;
				dy = -coord.top + targetCoord.top;
			}
			angle = Math.atan2(dy, dx);

			css(el, 'transform', `rotate(${ angle + Math.PI }rad)`);
		});


		var closestBlockEl = e.target.closest('[data-block]');

		//reset last droppable connectability
		if (self.lastDroppable && self.lastDroppable != closestBlockEl) {
			self.lastDroppable.classList.remove('block-target');
			self.element.classList.remove('connection-available');
			self.lastDroppable = null;
		}

		//ignore bad new block
		if (!closestBlockEl || closestBlockEl === self.element) {
			return;
		}

		var closestBlock = closestBlockEl.block;

		//check if target has available input slots
		if (closestBlock.inputs.size >= closestBlock.numberOfInputs) {
			return;
		}

		//display connectability
		if (closestBlockEl !== self.lastDroppable && closestBlockEl !== self.from.element) {
			closestBlockEl.classList.add('block-target');
			self.element.classList.add('connection-available');
			self.lastDroppable = closestBlockEl;
		}
	}


	/**
	 * Remove connection
	 */
	destroy () {
		var self = this;

		self.state = null;

		//remove from from and to
		if (self.from && self.from.outputs.has(self)) {
			self.from.outputs.delete(self);
			self.from.update();
		}
		if (self.to && self.to.inputs.has(self)) {
			self.to.inputs.delete(self);
			self.to.update();
		}
		if (self.from) {
			off(self.from, '.' + self.id);
		}
		if (self.to) {
			off(self.to, '.' + self.id);
		}

		off(win, 'resize.' + self.id);
		off(self, 'connected');
		off(self, 'hangling');

		self.from = null;
		self.to = null;

		self.element.connection = null;

		self.container.removeChild(self.element);

		self.container = null;

		self.emit('destroy');
		off(self, 'destroy');
	}


	/**
	 * Update connection position
	 * @param {Rect}? fromCoord Coords of start point
	 * @param {Rect}? toCoord Coords of end point
	 * @param {Element}? outEl Output arrow element
	 * @param {Element}? inEl Input arrow element
	 */
	update (fromCoord, toCoord) {
		var self = this;

		//update rotation to match source/destination nodes
		if (!fromCoord) {
			fromCoord = offset(self.from.element);
		}
		if (!toCoord) {
			toCoord = offset(self.to.element);
		}

		//find distance
		var dx = (toCoord.left - fromCoord.left);
		var dy = (toCoord.top - fromCoord.top);

		var w = Math.sqrt(dx*dx + dy*dy);

		//set width
		css(self.element, 'width', w);

		//set coords
		var h = self.element.clientHeight;
		css(self.element, {
			'top': fromCoord.top + fromCoord.height/2 - h,
			'left': fromCoord.left + fromCoord.width/2
		});

		//find angle
		var angle = Math.atan2(dy, dx);

		css(self.element, 'transform', `rotate(${ angle }rad)`);

		return self;
	}
}

var proto = Connection.prototype;


/**
 * Number of channels
 */
proto.channels = 2;


/**
 * Connection state
 */
proto.state = {
	hangling: {
		before: function () {
			var self = this;

			self.element.classList.add('connection-hangling');

			self.from.state = 'connecting';
			self.from.element.classList.add('block-connection-source');

			//display connection
			self.lastDroppable = null;

			//off every focus
			q.all('[data-block-label]').forEach(function (label) {
				css(label, 'pointer-events', 'none');
			});

			on(document, 'mousemove.' + self.id, function (e) {
				self.updateEnd(e);
			});

			//end of finishing move
			on(document, 'mouseup.' + self.id, function (e) {
				off(document, '.' + self.id);

				//remove classes
				self.from.state = 'ready';
				self.element.classList.remove('connection-available');
				self.from.element.classList.remove('block-connection-source');

				//clear occasinal hover
				if (self.lastDroppable) {
					self.lastDroppable.classList.remove('block-target');

					self.to = self.lastDroppable.block;
					self.lastDroppable = null;

					self.state = 'connected';
				} else {
					self.destroy();
				}
			});

			self.emit('hangling');
		},

		after: function () {
			var self = this;
			self.element.classList.remove('connection-hangling');

			//on every focus
			q.all('[data-block-label]').forEach(function (label) {
				css(label, 'pointer-events', null);
			});
		}
	},

	connected: {
		before: function () {
			var self = this;

			//update blocks model
			self.from.outputs.add(self);
			self.to.inputs.add(self);

			self.from.update();
			self.to.update();

			self.update();

			self.element.classList.add('connection-connected');
			self.element.setAttribute('data-to', self.to.id);
			self.element.setAttribute('data-from', self.from.id);

			//add events
			on(self.from, 'update.' + self.id, function () {
				self.update();
			});
			on(self.to, 'update.' + self.id, function () {
				self.update();
			});

			//on clicking on end - start moving
			on(self.endElement, 'mousedown.' + self.id, function (e) {
				e.stopPropagation();

				self.to.inputs.delete(self);
				self.to.update();

				self.updateEnd(e);

				self.state = 'hangling';
			});

			self.emit('connected');
		},

		after: function () {
			var self = this;

			off(self.from, 'update.' + self.id);
			off(self.to, 'update.' + self.id);
			off(self.endElement, 'mousedown.' + self.id);
			off(self.startElement, 'mousedown.' + self.id);

			self.element.classList.remove('connection-connected');
		}
	}
};



module.exports = Connection;