/**
 * New item appender.
 */

var Emitter = require('events');
var inherits = require('inherits');
var domify = require('domify');
var on = require('emmy/on');
var hasDom = require('has-dom');
var Dialog = require('dialog-component');
var capfirst = require('mustring/capfirst');
var delegate = require('emmy/delegate');


/**
 * Create items appender for the app
 * @constructor
 */
function Appender (app) {
	var self = this;

	self.app = app;

	self.createElement();

	//create plus button


	//create item instance
delegate(self.element, 'click', '[data-append-block]', function (e) {
		var target = e.delegateTarget;

		new (self.itemsMap.get(target))({
			lab: self.app
		});

		self.hide();
	});
}


inherits(Appender, Emitter);


var proto = Appender.prototype;


/**
 * Create element based of app blocks
 */
proto.createElement = function () {
	var self = this;

	if (!hasDom) return self;

	self.element = domify(self.template);

	//create weakset per items
	//FIXME: this is really unnecessary
	self.itemsMap = new WeakMap();

	//for each class - create appender item
	var blocks = self.app.constructor.block;
	Object.keys(blocks).forEach(function (className) {
		var block = blocks[className];

		//ignore hidden elements
		if (!block.prototype.appendable) return;

		var thumbnail = block.prototype.thumbnailTpl;
		var itemEl = domify(`
			<div class="lab-appender-item"
				data-append-block
				title="${ capfirst(className.toLowerCase()) }">
			${ proto.itemTemplate }
			</div>
		`);
		itemEl.innerHTML = thumbnail;
		self.element.appendChild(itemEl);

		self.itemsMap.set(itemEl, block);
	});

	self.dialog = new Dialog(self.element);
	self.dialog.escapable().closable().effect('fade');

	return self;
};


/**
 * Show appender
 */
proto.show = function () {
	var self = this;
	self.dialog.show();
	return self;
};


/**
 * Hide appender
 */
proto.hide = function () {
	var self = this;
	self.dialog.hide();
	return self;
};


proto.template = `
<div class="lab-appender">
</div>
`;


module.exports = Appender;