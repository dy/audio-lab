/**
 * App singleton
 * @module  audio-lab/app
 */

var Emitter = require('events');
var hasDom = require('has-dom');
var JSON = require('json3');
var getUid = require('get-uid');
var Appender = require('./appender');
var selection = require('mucss/selection');
var q = require('queried');
var on = require('emmy/on');
var defineState = require('define-state');
var domify = require('domify');
var extend = require('xtend/mutable');
var inherits = require('inherits');


var doc = document;

/**
 * Application instance
 * @constructor
 */
function App (element, options) {
	if (!(this instanceof App)) {
		return new App(element, options);
	}

	var self = this;

	extend(App, options);

	//current visual state
	defineState(self, 'state', proto.state);

	//create element
	if (!self.element) {
		self.element = element || domify(`
			<div></div>
		`);
	}

	self.element.classList.add(self.name);

	self.state = 'loading';

	//block instances cache
	self.items = {};

	//obtain context
	if (!self.context) {
		self.context = require('audio-context');
	}

	//autosave
	if (self.autosave !== false) {
		setInterval(function () {
			self.save();
		}, self.autosave);
	}

	//if impossible to load - create default project
	if (!self.load()) {
		self.createDefaultProject();
	}

	//create items appender
	self.appender = new Appender(self);

	//create items deleter
	self.element.appendChild(domify(`
	<div class="deleter" data-delete-area></div>
	`));

	selection.disable(self.element);


	//bind global kbd
	on(doc, 'keydown', function (e) {
		//do play/stop on pressing space
		if (e.which === 32) {
			if (self.isActive) {
				self.stop();
			} else {
				self.start();
			}
		}
	});

	//autostart
	//FIXME: why delay?
	setTimeout(function () {
		self.state = 'ready';
		self.start();
	});
}

inherits(App, Emitter);


/** Export singleton */
var proto = App.prototype;


/** App audio context */
proto.context;


/** App params (some) */
proto.name = require('../package').name;
proto.version = require('../package').version;


/** Default is stereo */
proto.channels = 2;


/** Whether is playing */
proto.isActive = false;


/** Generate item id */
proto.getId = function () {
	return getUid();
};


/** Start everyone */
proto.start = function () {
	if (this.isActive) return this;

	this.isActive = true;

	this.emit('start');
	return this;
};


/** Start everyone */
proto.stop = function () {
	if (!this.isActive) return this;

	this.isActive = false;

	this.emit('stop');
	return this;
};


/** Application states */
proto.state = {
	loading: {
		before: function () {
			var self = this;

			self.element.classList.add('loading');
		},
		after: function () {
			var self = this;

			self.element.classList.remove('loading');
		}
	},

	ready: {
		before: function () {
			var self = this;
		},
		after: function () {
			var self = this;
		}
	},

	connecting: {
		before: function () {
			var self = this;

			self.element.classList.add('connecting');
		},
		after: function () {
			var self = this;

			self.element.classList.remove('connecting');
		}
	},

	dragging: {
		before: function () {
			var self = this;

			self.element.classList.add('dragging');
		},
		after: function () {
			var self = this;

			self.element.classList.remove('dragging');
		}
	}
};


/**
 * Block instances cache
 */
proto.items;

proto.storage = hasDom ? localStorage : null;


/** Save instances etc */
proto.save = function () {
	var self = this;

	//just save instances to localStorage
	var str = JSON.stringify(self.items);
	self.storage.setItem(self.name, str);

	return self;
};


/** Load last settings */
proto.load = function () {
	var self = this;

	//get list of item ids to load first
	var src = self.storage.getItem(self.name);

	//if app has no saved project - create default project
	if (!src) {
		return false;
	}

	var itemsData = JSON.parse(src);

	//mapped ids
	var idAlias = {};

	//for each item - load it.
	var ids = Object.keys(itemsData);

	if (ids.length < 1) return false;

	//load instances first
	ids.filter(function (id) {
		var data = itemsData[id];

		if (data.class === 'Connection') {
			return data.from && data.to;
		}

		//create new instance
		var item = new (App.block[data.class])(self);
		item.fromJSON(data);

		idAlias[id] = item.id;
	})

	//then connect them
	.forEach(function (id) {
		var data = itemsData[id];
		self.items[idAlias[data.from]].connect(self.items[idAlias[data.to]]);
	});

	return true;
};


/** Save period */
proto.autosave = 1200;


/**
 * Register class to deserialize
 */
App.block = {};

[
require('./radio'),
require('./oscillator'),
require('./output'),
require('./generator'),
require('./analyser'),
require('./microphone'),
require('./gain'),
]
.forEach(function (fn) {
	App.block[fn.name] = fn;
});



/**
 * Default project setup
 */
proto.createDefaultProject = function () {
	var self = this;

	var generator = new (require('./generator'))(self);
	var analyser = new (require('./analyser'))(self);
	var output =  new (require('./output'))(self);

	generator.connect(analyser);
	analyser.connect(output);

	self.save();

	return self;
};


module.exports = App;