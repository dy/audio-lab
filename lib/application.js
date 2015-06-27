/**
 * App singleton
 * @module  audio-lab/app
 */

var Emitter = require('events');
var ctx = require('audio-context');
var hasDom = require('has-dom');
var JSON = require('json3');
var getUid = require('get-uid');


/** Export singleton */
var App = Object.create(Emitter.prototype);


/** App audio context */
App.context = ctx;


/** Container to place elements */
if (hasDom) {
	App.container = document.body;
	App.container.classList.add('audio-lab-container');
}


/** App params (some) */
App.name = require('../package').name;
App.version = require('../package').version;


/** Default is stereo */
App.channels = 2;


/** Time offset */
App.time = 0;


/** Duration of sound, in ms */
App.duration = 10 * 1000;


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
		return self.createDefaultProject();
	}

	var itemsData = JSON.parse(src);

	//mapped ids
	var idAlias = {};

	//for each item - load it.
	Object.keys(itemsData)
	//load instances first
	.filter(function (id) {
		var data = itemsData[id];

		if (data.class === 'Connection') {
			return true;
		}

		//create new instance
		var item = new self[data.class]();
		item.fromJSON(data);

		idAlias[id] = item.id;
	})

	//then connect them
	.forEach(function (id) {
		var data = itemsData[id];

		self.items[idAlias[data.from]].connect(self.items[idAlias[data.to]]);
	});
};


/**
 * Default project setup
 */
App.createDefaultProject = function () {
	var self = this;

	var generator = new lab.Generator();
	var analyser = new lab.Analyser('frequency');
	var output = new lab.Output();
	generator.connect(analyser);
	analyser.connect(output);

	self.save();

	return self;
};



module.exports = App;



/**
 * Register class to deserialize
 */
App.Connection = require('./connection');
App.Radio = require('./radio');
App.Output = require('./output');
App.Generator = require('./generator');
App.Analyser = require('./analyser');