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

	//show dialog with items to append
	on(self.app.container, 'mouseup', function (e) {
		if (e.target !== self.app.container) return;

		self.show();
	});

	//create item instance
	delegate(self.element, 'click', '.appender-item', function (e) {
		var target = e.delegateTarget;

		new (self.itemsMap.get(target))();

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
	self.itemsMap = new WeakMap();

	//for each class - create appender item
	Object.keys(self.app.block).forEach(function (className) {
		var block = self.app.block[className];
		var thumbnail = block.prototype.thumbnailTpl;
		var itemEl = domify(`
			<div class="appender-item"
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
<div class="appender">
</div>
`;


module.exports = Appender;