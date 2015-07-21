/**
 * Audio-lab class.
 * Creates an audio-infrastructure within an element.
 *
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
var off = require('emmy/off');
var defineState = require('define-state');
var domify = require('domify');
var extend = require('xtend/mutable');
var inherits = require('inherits');
var Draggable = require('draggy');


var doc = document;


/**
 * Create lab instance
 *
 * @constructor
 */
class Lab extends Emitter {
	constructor (options) {
		super();

		if (!(this instanceof Lab)) {
			return new Lab(element, options);
		}

		var self = this;

		self.id = getUid();

		extend(self, options);

		//register default blocks
		self.block = {};
		self.use([
			require('../plugin/output'),
			require('../plugin/generator')
		]);


		//create element
		if (!self.element) {
			self.element = element || doc.createElement('div');
		}

		self.element.classList.add('lab');


		//create current visual state
		defineState(self, 'state', proto.state);

		self.state = 'init';


		//node/connection instances cache
		self.items = {};

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

		//CRUD buttons
		self.createAppender();
		self.createDeleter();

		//make self unselectable
		selection.disable(self.element);


		//autostart
		self.state = 'ready';
	}

	/** Register a new block to use within lab */
	use (block) {
		var self = this;

		if (block instanceof Array) {
			block.forEach(self.use, self);

			return self;
		}

		self.block[self.getBlockName(block.displayName || block.name)] = block;

		return self;
	}

	/** Normalize block name */
	getBlockName (str) {
		return str.replace(/-_/g, '').toUpperCase()
	}


	/** Create appender button */
	createAppender () {
		var self = this;

		self.appender = domify(`
		<div class="lab-appender">+</div>
		`);

		self.element.appendChild(self.appender);

		return self;
	}


	/** Create deleter button */
	createDeleter () {
		var self = this;

		self.deleter = domify(`
		<div class="lab-deleter" data-delete-area>
			<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 125"><path d="M83.26 16.737H65.65v-3.91C65.65 8.51 62.145 5 57.827 5H42.173c-4.313 0-7.824 3.51-7.824 7.827v3.91H16.74c-3.234 0-5.867 2.632-5.867 5.876v13.69h3.91v43.044c0 8.63 7.02 15.653 15.652 15.653h39.13c8.633 0 15.652-7.024 15.652-15.652V36.303h3.91v-13.69c0-3.244-2.635-5.876-5.867-5.876zm-41.087-3.91h15.653v3.91H42.173v-3.91zm35.22 66.52c0 4.317-3.51 7.825-7.827 7.825h-39.13c-4.315 0-7.827-3.507-7.827-7.824V36.303H77.39v43.045zm-58.696-50.87V24.56h62.605v3.914H18.697zm11.738 50.87V44.13c0-2.165 1.753-3.917 3.914-3.917 2.156 0 3.91 1.752 3.91 3.916v35.218c0 2.16-1.754 3.915-3.91 3.915-2.162 0-3.915-1.755-3.915-3.915zm15.653 0V44.13c0-2.165 1.753-3.917 3.912-3.917 2.165 0 3.912 1.752 3.912 3.916v35.218c0 2.16-1.747 3.915-3.912 3.915-2.16 0-3.912-1.755-3.912-3.915zm15.65 0V44.13c0-2.165 1.75-3.917 3.913-3.917 2.164 0 3.915 1.752 3.915 3.916v35.218c0 2.16-1.75 3.915-3.914 3.915-2.16 0-3.91-1.755-3.91-3.915z"/></svg>
		</div>
		`);
		self.element.appendChild(self.deleter);

		return self;
	}


	/** Save instances etc */
	save () {
		var self = this;

		//collect items
		var items = self.items;

		//just save instances to localStorage
		var str = JSON.stringify(items);
		self.storage.setItem(self.name, str);

		return self;
	}


	/** Load last settings */
	load () {
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

		//create blocks first
		ids.map(function (id) {
			var data = itemsData[id];

			//create new instance
			var item = self.createBlock(data.className, data);

			return item;
		})

		//then connect blocks
		.forEach(function (item) {
			var data = itemsData[item.id];

			data.outputs.forEach(function (id) {
				item.connect(self.items[id]);
			});
		});

		return true;
	}


	/** Default project setup */
	createDefaultProject () {
		var self = this;

		var generator = self.createBlock('Generator');
		var output = self.createBlock('Output');

		generator.connect(output);

		self.save();

		return self;
	}


	/** Block constructor */
	createBlock (name, options) {
		var self = this;

		//generate random coords, if none
		if (!options.top) {
			options.top = Math.random() * 300;
			options.left = Math.random() * 300;
		}

		var block = new (self.block[self.getBlockName(name)])(options);

		//save instance
		self.items[block.id] = block;

		//attach element
		self.element.appendChild(block.element);

		//make draggable
		block.draggable = new Draggable(block.element, {
			within: self.element,
			threshold: 10,
			css3: false,
			handle: [`[data-from="${ block.id }"]`, `[data-to="${ block.id }"]`, q(`[data-block-handle]`, block.element)],
			droppable: [`[data-delete-area]`],
			droppableClass: `droppable-active`
		});


		//display app dragging state
		on(block.draggable, 'dragstart.' + self.id, function () {
			if (block.deletable) {
				self.element.classList.add('lab-deletable');
			}
		});
		on(block.draggable, 'dragend.' + self.id, function () {
			if (block.deletable) {
				self.element.classList.remove('lab-deletable');
			}
		});
		on(block.draggable, 'drop.' + self.id, function (target) {
			if (target === self.deleter) {
				self.removeBlock(block);
			}
		});


		//correct cords on drag
		on(block.draggable, 'drag.' + self.id, function () {
			block.update();
		});


		return block;
	}

	/** Remove block from the lab */
	removeBlock (block) {
		var self = this;

		if (!block.deletable) {
			return;
		}

		self.element.removeChild(block.element);

		delete self.items[block.id];

		block.destroy();

		off(block.draggable, '.' + self.id);

		block.draggable.destroy();
		block.draggable = null;
	}
}


var proto = Lab.prototype;


/** Lab audio context */
proto.context = require('audio-context');


/** Lab params */
proto.name = require('../package').name;
proto.version = require('../package').version;


/** Default is stereo */
proto.channels = 2;


/** Lab states */
proto.state = {
	//initialising
	init: {
		before: function () {
			var self = this;

			self.element.classList.add('lab-init');
		},
		after: function () {
			var self = this;

			self.element.classList.remove('lab-init');
		}
	},

	//idle state
	ready: {
		before: function () {
			var self = this;
		},
		after: function () {
			var self = this;
		}
	}
};


/** Storage to save self */
proto.storage = hasDom ? localStorage : null;


/** Save period */
proto.autosave = 1200;


module.exports = Lab;