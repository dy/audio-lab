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
	self.deleter = domify(`
	<div class="deleter" data-delete-area>
		<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 125"><path d="M83.26 16.737H65.65v-3.91C65.65 8.51 62.145 5 57.827 5H42.173c-4.313 0-7.824 3.51-7.824 7.827v3.91H16.74c-3.234 0-5.867 2.632-5.867 5.876v13.69h3.91v43.044c0 8.63 7.02 15.653 15.652 15.653h39.13c8.633 0 15.652-7.024 15.652-15.652V36.303h3.91v-13.69c0-3.244-2.635-5.876-5.867-5.876zm-41.087-3.91h15.653v3.91H42.173v-3.91zm35.22 66.52c0 4.317-3.51 7.825-7.827 7.825h-39.13c-4.315 0-7.827-3.507-7.827-7.824V36.303H77.39v43.045zm-58.696-50.87V24.56h62.605v3.914H18.697zm11.738 50.87V44.13c0-2.165 1.753-3.917 3.914-3.917 2.156 0 3.91 1.752 3.91 3.916v35.218c0 2.16-1.754 3.915-3.91 3.915-2.162 0-3.915-1.755-3.915-3.915zm15.653 0V44.13c0-2.165 1.753-3.917 3.912-3.917 2.165 0 3.912 1.752 3.912 3.916v35.218c0 2.16-1.747 3.915-3.912 3.915-2.16 0-3.912-1.755-3.912-3.915zm15.65 0V44.13c0-2.165 1.75-3.917 3.913-3.917 2.164 0 3.915 1.752 3.915 3.916v35.218c0 2.16-1.75 3.915-3.914 3.915-2.16 0-3.91-1.755-3.91-3.915z"/></svg>
	</div>
	`);
	self.element.appendChild(self.deleter);

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

			if (self.activeBlock.deletable) {
				self.element.classList.add('deletable');
			}

			self.element.classList.add('dragging');
		},
		after: function () {
			var self = this;

			self.element.classList.remove('deletable');
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


/** Register a new block */
proto.use = function (block) {
	var self = this;

	self.block[block.displayName || block.name] = block;

	return self;
};



/**
 * Default project setup
 */
proto.createDefaultProject = function () {
	var self = this;

	var generator = new self.block.Generator(self);
	var analyser = new self.block.Analyser(self);
	var output =  new self.block.Output(self);

	generator.connect(analyser);
	analyser.connect(output);

	self.save();

	return self;
};


module.exports = App;