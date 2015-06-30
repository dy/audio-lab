/**
 * Cord between two blocks
 */

var Emitter = require('events');
var hasDom = require('has-dom');
var css = require('mucss/css');
var offset = require('mucss/offset');
var app = require('./application');
var on = require('emmy/on');
var off = require('emmy/off');
var win = require('global/window');
var domify = require('domify');
var inherits = require('inherits');
var defineState = require('define-state');
var q = require('queried');


/**
 * Constructor
 *
 * @constructor
 */
function Connection (a, b) {
	var self = this;

	//generate unique connection id
	self.id = app.getId();

	//save item by id
	app.items[self.id] = self;

	//create DOM representation
	self.createElement();

	//define state
	defineState(self, 'state', self.state);

	//save references
	self.from = a;
	self.to = b;

	//if no b - treat connection as temporary hangling connection
	if (!a) {
		self.state = 'hangling-end';
	} else if (!b) {
		self.state = 'hangling';
	} else if (a && b) {
		self.state = 'connected';
	}
}

inherits(Connection, Emitter);

var proto = Connection.prototype;


/**
 * Create DOM-representation
 */
proto.createElement = function () {
	var self = this;

	if (!hasDom) return self;

	self.element = domify(`
		<div class="connection">
			<div class="connection-start"></div>
			<div class="connection-end"></div>
		</div>
	`);
	app.container.appendChild(self.element);

	on(win, 'resize.' + self.id, function () {
		self.update();
	});

	self.endElement = q('.connection-end', self.element);
	self.startElement = q('.connection-start', self.element);

	return self;
};


/**
 * Type of connection:
 * Control
 * Audio
 */
proto.type = 'audio';


/**
 * Number of channels
 */
proto.channels = 2;


/**
 * Connection state
 */
proto.state = {
	//nonexisent state
	_: {

	},

	hangling: {
		before: function () {
			var self = this;

			app.container.classList.add('connecting');

			self.update(offset(self.from.element), offset(self.from.element));

			//display connection
			var lastDroppable;

			on(document, 'mousemove.' + self.id, function (e) {
				var coord = offset(self.from.element);
				var mouseCoord = {
					left: e.pageX - coord.width / 2,
					top: e.pageY - coord.height / 2,
					width: 0,
					height: 0
				};

				self.update(coord, mouseCoord);

				//rotate target inputs to look at connection end
				q.all('.block-in:not([hidden])', app.container).forEach(function (el) {
					var blockEl = el.closest('.block');
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


				var closestBlockEl = e.target.closest('.block');

				//reset last droppable connectability
				if (lastDroppable && lastDroppable != closestBlockEl) {
					lastDroppable.classList.remove('block-connection-target');
					self.element.classList.remove('connection-available');
					lastDroppable = null;
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
				if (closestBlockEl !== lastDroppable) {
					closestBlockEl.classList.add('block-connection-target');
					self.element.classList.add('connection-available');
					lastDroppable = closestBlockEl;
				}
			});

			//end of finishing move
			on(document, 'mouseup.' + self.id, function (e) {
				off(document, 'mousemove.' + self.id);
				off(document, 'mouseup.' + self.id);

				//remove classes
				app.container.classList.remove('connecting');
				self.element.classList.remove('connection-available');

				//clear occasinal hover
				if (lastDroppable) {
					lastDroppable.classList.remove('block-connection-target');

					self.to = lastDroppable.block;
					lastDroppable = null;

					self.state = 'connected';


				} else {
					self.destroy();
				}
			});
		},

		after: function () {
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
			self.from.restart();
			self.to.restart();

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
				self.to.inputs.delete(self);
				self.to.stop().update();

				self.state = 'hangling';
			});
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


/**
 * Remove connection
 */
proto.destroy = function () {
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
		off(self.from, '')
		self.from.restart();
	}
	if (self.to) {
		self.to.restart();
	}

	self.draggable.destroy();
	self.draggable = null;

	off(win, 'resize.' + self.id);

	self.from = null;
	self.to = null;

	app.container.removeChild(self.element);
	delete app.items[self.id];

	app.save();
};


/**
 * Update connection position
 * @param {Rect}? fromCoord Coords of start point
 * @param {Rect}? toCoord Coords of end point
 * @param {Element}? outEl Output arrow element
 * @param {Element}? inEl Input arrow element
 */
proto.update = function (fromCoord, toCoord) {
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
		'top': fromCoord.top + fromCoord.height/2 - h/2,
		'left': fromCoord.left + fromCoord.width/2
	});

	//find angle
	var angle = Math.atan2(dy, dx);

	css(self.element, 'transform', `rotate(${ angle }rad)`);

	return self;
};



/**
 * Save position & params to storage
 */
proto.toJSON = function () {
	var self = this;

	if (!self.from || !self.to) return;

	var data = {
		from: self.from.id,
		to: self.to.id,

		class: self.constructor.name
	};

	return data;
};


/**
 * Load position & params from storage
 */
proto.fromJSON = function (data) {
	var self = this;

	self.connect(app.items[data.from], app.items[data.to]);

	return self;
};



module.exports = Connection;