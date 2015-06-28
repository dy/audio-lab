/**
 * App singleton
 * @module  audio-lab/app
 */

var Emitter = require('events');
var ctx = require('audio-context');
var hasDom = require('has-dom');
var JSON = require('json3');
var getUid = require('get-uid');
var Appender = require('./appender');
var selection = require('mucss/selection');
var q = require('queried');
var on = require('emmy/on');


/** Export singleton */
var App = Object.create(Emitter.prototype);


/** App audio context */
App.context = ctx;


/** Container to place elements */
if (hasDom) {
	App.container = document.body;
	App.container.classList.add('audio-lab-container');
	selection.disable(App.container);
}


/** App params (some) */
App.name = require('../package').name;
App.version = require('../package').version;


/** Default is stereo */
App.channels = 2;


/** Whether is playing */
App.isActive = false;


/** Generate item id */
App.getId = function () {
	return getUid();
};
var c = 1;


/** Start everyone */
App.start = function () {
	if (this.isActive) return this;

	this.isActive = true;

	this.emit('start');
	return this;
};


/** Start everyone */
App.stop = function () {
	if (!this.isActive) return this;

	this.isActive = false;

	this.emit('stop');
	return this;
};


/**
 * Block instances cache
 */
App.items = {};

App.storage = hasDom ? localStorage : null;


/** Save instances etc */
App.save = function () {
	var self = this;

	//just save instances to localStorage
	var str = JSON.stringify(self.items);
	self.storage.setItem(self.name, str);

	return self;
};


/** Load last settings */
App.load = function () {
	var self = this;

	//get list of item ids to load first
	var src = self.storage.getItem(self.name);

	//if app has no saved state - create default state
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
		var item = new self.block[data.class]();
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


/**
 * Default project setup
 */
App.createDefaultProject = function () {
	var self = this;

	var generator = new self.block.Generator();
	var analyser = new self.block.Analyser();
	var output = new self.block.Output();
	generator.connect(analyser);
	// analyser.connect(output);

	self.save();

	return self;
};


/** Save period */
App.autosave = 1500;


/**
 * App initialiser
 */
App.init = function () {
	var self = this;

	//autosave
	setInterval(function () {
		self.save();
	}, self.autosave);

	//if impossible to load - create default project
	if (!self.load()) {
		self.createDefaultProject()
	}

	//create items appender
	self.appender = new Appender(self);


	//bind global kbd
	on(document, 'keydown', function (e) {
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
		self.start();
	});
};


module.exports = App;


/**
 * Register class to deserialize
 */
App.block = {
	Radio: require('./radio'),
	Oscillator: require('./oscillator'),
	Output: require('./output'),
	Generator: require('./generator'),
	Analyser: require('./analyser'),
	Microphone: require('./microphone'),
	Gain: require('./gain'),
};