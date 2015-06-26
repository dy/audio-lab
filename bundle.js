require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"audio-context":[function(require,module,exports){
var window = require('global/window');

var Context = window.AudioContext || window.webkitAudioContext;
if (Context) module.exports = new Context;

},{"global/window":6}],"audio-lab":[function(require,module,exports){
var lab = module.exports = require('./lib/application');

/** Expose classes */
lab.Block = require('./lib/block');
lab.Generator = require('./lib/generator');
lab.Script = require('./lib/script');
},{"./lib/application":2,"./lib/block":3,"./lib/generator":4,"./lib/script":5}],1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/**
 * App singleton
 * @module  audio-lab/app
 */

var Emitter = require('events');
var ctx = require('audio-context');
var extend = require('xtend/mutable');
var hasDom = require('has-dom');


/** Export singleton */
var App = Object.create(Emitter.prototype);


/** Provide static classes */
extend(App, {
	context: ctx
});

/** Container to place elements */
App.container = hasDom ? document.body : null;

/** Default is stereo */
App.channels = 2;


/** Time offset */
App.time = 0;


/** Duration of sound, in ms */
App.duration = 10 * 1000;


/** Whether is playing */
App.isActive = false;


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


module.exports = App;
},{"audio-context":"audio-context","events":1,"has-dom":43,"xtend/mutable":66}],3:[function(require,module,exports){
/**
 * Generic audio block.
 * Provides inputs/outputs and connection interface.
 */


var Emitter = require('events');
var app = require('./application');
var extend = require('xtend/mutable');
var domify = require('domify');
var hasDom = require('has-dom');
var Draggable = require('draggy');


module.exports = Block;


/**
 * Create an empty block
 *
 * @constructor
 */
function Block (options) {
	var self = this;

	if (!(self instanceof Block)) {
		return new Block(options);
	}

	if (options && typeof options === 'object') {
		extend(this, options);
	}

	//bind global events
	app.on('start', function () {
		self.start();
	});

	app.on('stop', function () {
		self.stop();
	});

	if (hasDom) {
		self.element = domify(self.template);
		self.show();

		// self.draggable = new Draggable(self.element, {
		// 	within: app.container,
		// 	handle: self.element
		// });
	}
}


var proto = Block.prototype = Object.create(Emitter.prototype);


/** An element */
proto.template = '<div class="block"></div>';


/**
 * Create DOM-representation
 */
proto.show = function () {
	var self = this;

	if (!hasDom) return self;

	self.isVisible = true;

	app.container.appendChild(self.element);

	self.emit('show');
	return self;
};



/**
 * Remove from DOM, go underground
 */
proto.hide = function () {
	var self = this;

	if (!hasDom) return self;

	self.isVisible = false;

	app.container.removeChild(self.element);

	self.emit('hide');
	return self;
};


/**
 * Draw node step in raf
 *
 * @return {Block} Return self
 */
proto.draw = function () {
	var self = this;

	self.emit('draw');
	return self;
};

/**
 * Update node size and position
 *
 * @return {Block} Return self
 */
proto.update = function () {
	var self = this;

	self.emit('update');
	return self;
};



/**
 * Connect block to another block
 *
 * @return {Block} Return self
 */
proto.connect = function (block) {
	var self = this;

	self.destination = block;

	self.emit('connect');
	return self;
};


/**
 * Disconnect node from other block
 *
 * @return {Block} Return self
 */
proto.disconnect = function () {
	var self = this;

	self.destination = null;

	self.emit('disconnect');
	return self;
};


/**
 * Default processing callback
 *
 * @return {Block} Return self
 */
proto.process = function () {
	var self = this;

	self.emit('process');
	return self;
};


/**
 * Start generating sound
 *
 * @return {Block} Return self
 */
proto.start = function () {
	var self = this;

	self.isActive = true;
	self.emit('start');

	return self;
};


/**
 * Stop generating sound
 *
 * @return {Block} Return self
 */
proto.stop = function () {
	var self = this;

	self.isActive = false;
	self.emit('stop');

	return self;
};
},{"./application":2,"domify":8,"draggy":9,"events":1,"has-dom":43,"xtend/mutable":66}],4:[function(require,module,exports){
/**
 * Generator block processor.
 * Takes a function to generate buffer.
 */

var Block = require('./block');
var app = require('./application');
var isFn = require('is-function');
var on = require('emmy/on');
var q = require('queried');
var autosize = require('autosize');
var ctx = app.context;


module.exports = GeneratorBlock;


/**
 * @constructor
 */
function GeneratorBlock (options) {
	var self = this;

	Block.apply(this, arguments);

	//set generator function
	if (isFn(options)) {
		self.generate = options;
	}

	//show code in textarea
	self.textarea = q('.block-generator-code', self.element);
	self.textarea.value = self.generate.toString().slice(14,-2).trim();
	autosize(self.textarea);

	on(self.textarea, 'change', function () {
		var src = self.textarea.value;

		//allow strange syntax
		src = src.replace(/\n/, ' ');
		self.generate = new Function ('t', src);

		if (self.isActive) {
			self.stop();
			self.start();
		}
	});


	self.on('start', function () {
		//generate initial chunk
		self.createSource(app.time);
		if (self.node) {
			self.node.start();
		}
	});

	self.on('stop', function () {
		if (self.node) {
			self.node.stop();
		}
	});

	//connect source node on external connect call
	self.on('connect', function () {
		if (self.node) {
			self.node.connect(self.destination);
		}
	});

	return self;
}

var proto = GeneratorBlock.prototype = Object.create(Block.prototype);


/**
 * Create generator layout
 */
proto.template =
'<div class="block block-generator">' +
'function (t) {' +
'<textarea class="block-generator-code" rows="10"></textarea>' +
'}';
'</div>';


/**
 * Generate -1..1 noise by default
 */
proto.generate = function (t) {
	return Math.random() * 2 - 1;
};


/** Default is stereo */
proto.channels = app.channels;


/**
 * Create a new buffer from the time offset
 */
proto.createSource = function () {
	var self = this;

	var frameCount = (app.duration - app.time) * ctx.sampleRate / 1000;

	var buffer = ctx.createBuffer(self.channels, frameCount, ctx.sampleRate);

	// Fill the buffer with white noise;
	//just random values between -1.0 and 1.0
	for (var channel = 0; channel < self.channels; channel++) {
		var nowBuffering = buffer.getChannelData(channel);

		for (var i = 0; i < frameCount; i++) {
			nowBuffering[i] = self.generate(i / ctx.sampleRate);
		}
	}

	// Get an AudioBufferSourceNode.
	// This is the AudioNode to use when we want to play an AudioBuffer
	var source = ctx.createBufferSource();

	// set the buffer in the AudioBufferSourceNode
	source.buffer = buffer;

	//save node
	self.node = source;

	//recreate source on playing has finished
	self.node.onended = function () {
		// console.log('generator ended');
		// self.createSource();
		self.node.disconnect();
	};

	//connect the AudioBufferSourceNode to the
	//destination so we can hear the sound
	if (self.destination) {
		self.node.connect(self.destination);
	}

	return self;
};
},{"./application":2,"./block":3,"autosize":7,"emmy/on":"emmy/on","is-function":44,"queried":"queried"}],5:[function(require,module,exports){
/**
 * Script block processor.
 * Takes a function to convert buffer.
 */

var Block = require('./block');


function ScriptBlock () {

}

ScriptBlock.prototype = Object.create(Block);
},{"./block":3}],6:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
/*!
	Autosize 3.0.5
	license: MIT
	http://www.jacklmoore.com/autosize
*/
(function (global, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['exports', 'module'], factory);
	} else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
		factory(exports, module);
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports, mod);
		global.autosize = mod.exports;
	}
})(this, function (exports, module) {
	'use strict';

	function assign(ta) {
		var _ref = arguments[1] === undefined ? {} : arguments[1];

		var _ref$setOverflowX = _ref.setOverflowX;
		var setOverflowX = _ref$setOverflowX === undefined ? true : _ref$setOverflowX;
		var _ref$setOverflowY = _ref.setOverflowY;
		var setOverflowY = _ref$setOverflowY === undefined ? true : _ref$setOverflowY;

		if (!ta || !ta.nodeName || ta.nodeName !== 'TEXTAREA' || ta.hasAttribute('data-autosize-on')) return;

		var heightOffset = null;
		var overflowY = 'hidden';

		function init() {
			var style = window.getComputedStyle(ta, null);

			if (style.resize === 'vertical') {
				ta.style.resize = 'none';
			} else if (style.resize === 'both') {
				ta.style.resize = 'horizontal';
			}

			if (style.boxSizing === 'content-box') {
				heightOffset = -(parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
			} else {
				heightOffset = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
			}

			update();
		}

		function changeOverflow(value) {
			{
				// Chrome/Safari-specific fix:
				// When the textarea y-overflow is hidden, Chrome/Safari do not reflow the text to account for the space
				// made available by removing the scrollbar. The following forces the necessary text reflow.
				var width = ta.style.width;
				ta.style.width = '0px';
				// Force reflow:
				/* jshint ignore:start */
				ta.offsetWidth;
				/* jshint ignore:end */
				ta.style.width = width;
			}

			overflowY = value;

			if (setOverflowY) {
				ta.style.overflowY = value;
			}

			update();
		}

		function update() {
			var startHeight = ta.style.height;
			var htmlTop = document.documentElement.scrollTop;
			var bodyTop = document.body.scrollTop;
			var originalHeight = ta.style.height;

			ta.style.height = 'auto';

			var endHeight = ta.scrollHeight + heightOffset;

			if (ta.scrollHeight === 0) {
				// If the scrollHeight is 0, then the element probably has display:none or is detached from the DOM.
				ta.style.height = originalHeight;
				return;
			}

			ta.style.height = endHeight + 'px';

			// prevents scroll-position jumping
			document.documentElement.scrollTop = htmlTop;
			document.body.scrollTop = bodyTop;

			var style = window.getComputedStyle(ta, null);

			if (style.height !== ta.style.height) {
				if (overflowY !== 'visible') {
					changeOverflow('visible');
					return;
				}
			} else {
				if (overflowY !== 'hidden') {
					changeOverflow('hidden');
					return;
				}
			}

			if (startHeight !== ta.style.height) {
				var evt = document.createEvent('Event');
				evt.initEvent('autosize:resized', true, false);
				ta.dispatchEvent(evt);
			}
		}

		var destroy = (function (style) {
			window.removeEventListener('resize', update);
			ta.removeEventListener('input', update);
			ta.removeEventListener('keyup', update);
			ta.removeAttribute('data-autosize-on');
			ta.removeEventListener('autosize:destroy', destroy);

			Object.keys(style).forEach(function (key) {
				ta.style[key] = style[key];
			});
		}).bind(ta, {
			height: ta.style.height,
			resize: ta.style.resize,
			overflowY: ta.style.overflowY,
			overflowX: ta.style.overflowX,
			wordWrap: ta.style.wordWrap });

		ta.addEventListener('autosize:destroy', destroy);

		// IE9 does not fire onpropertychange or oninput for deletions,
		// so binding to onkeyup to catch most of those events.
		// There is no way that I know of to detect something like 'cut' in IE9.
		if ('onpropertychange' in ta && 'oninput' in ta) {
			ta.addEventListener('keyup', update);
		}

		window.addEventListener('resize', update);
		ta.addEventListener('input', update);
		ta.addEventListener('autosize:update', update);
		ta.setAttribute('data-autosize-on', true);

		if (setOverflowY) {
			ta.style.overflowY = 'hidden';
		}
		if (setOverflowX) {
			ta.style.overflowX = 'hidden';
			ta.style.wordWrap = 'break-word';
		}

		init();
	}

	function destroy(ta) {
		if (!(ta && ta.nodeName && ta.nodeName === 'TEXTAREA')) return;
		var evt = document.createEvent('Event');
		evt.initEvent('autosize:destroy', true, false);
		ta.dispatchEvent(evt);
	}

	function update(ta) {
		if (!(ta && ta.nodeName && ta.nodeName === 'TEXTAREA')) return;
		var evt = document.createEvent('Event');
		evt.initEvent('autosize:update', true, false);
		ta.dispatchEvent(evt);
	}

	var autosize = null;

	// Do nothing in Node.js environment and IE8 (or lower)
	if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
		autosize = function (el) {
			return el;
		};
		autosize.destroy = function (el) {
			return el;
		};
		autosize.update = function (el) {
			return el;
		};
	} else {
		autosize = function (el, options) {
			if (el) {
				Array.prototype.forEach.call(el.length ? el : [el], function (x) {
					return assign(x, options);
				});
			}
			return el;
		};
		autosize.destroy = function (el) {
			if (el) {
				Array.prototype.forEach.call(el.length ? el : [el], destroy);
			}
			return el;
		};
		autosize.update = function (el) {
			if (el) {
				Array.prototype.forEach.call(el.length ? el : [el], update);
			}
			return el;
		};
	}

	module.exports = autosize;
});
},{}],8:[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var div = document.createElement('div');
// Setup
div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
// Make sure that link elements get serialized correctly by innerHTML
// This requires a wrapper element in IE
var innerHTMLBug = !div.getElementsByTagName('link').length;
div = undefined;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.polyline =
map.ellipse =
map.polygon =
map.circle =
map.text =
map.line =
map.path =
map.rect =
map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(html, doc) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // default to the global `document` object
  if (!doc) doc = document;

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return doc.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = doc.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = doc.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = doc.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}],9:[function(require,module,exports){
/**
 * Simple draggable component
 *
 * @module draggy
 */


//work with css
var css = require('mucss/css');
var parseCSSValue = require('mucss/parse-value');
var selection = require('mucss/selection');
var offsets = require('mucss/offset');
var getTranslate = require('mucss/translate');

//events
var on = require('emmy/on');
var off = require('emmy/off');
var emit = require('emmy/emit');
var Emitter = require('events');
var getClientX = require('get-client-xy').x;
var getClientY = require('get-client-xy').y;

//utils
var isArray = require('is-array');
var isNumber = require('mutype/is-number');
var isFn = require('is-function');
var defineState = require('define-state');
var extend = require('xtend/mutable');
var round = require('mumath/round');
var between = require('mumath/between');
var loop = require('mumath/loop');
var getUid = require('get-uid');


var win = window, doc = document, root = doc.documentElement;


/**
 * Draggable controllers associated with elements.
 *
 * Storing them on elements is
 * - leak-prone,
 * - pollutes element’s namespace,
 * - requires some artificial key to store,
 * - unable to retrieve controller easily.
 *
 * That is why weakmap.
 */
var draggableCache = Draggable.cache = new WeakMap;



/**
 * Make an element draggable.
 *
 * @constructor
 *
 * @param {HTMLElement} target An element whether in/out of DOM
 * @param {Object} options An draggable options
 *
 * @return {HTMLElement} Target element
 */
function Draggable(target, options) {
	if (!(this instanceof Draggable)) return new Draggable(target, options);

	var self = this;

	//get unique id for instance
	//needed to track event binders
	self._id = getUid();
	self._ns = '.draggy_' + self._id;

	//save element passed
	self.element = target;
	draggableCache.set(target, self);

	//define mode of drag
	defineState(self, 'css3', self.css3);
	self.css3 = true;

	//define state behaviour
	defineState(self, 'state', self.state);
	self.state = 'idle';

	//define axis behaviour
	defineState(self, 'axis', self.axis);
	self.axis = null;

	//define anim mode
	defineState(self, 'isAnimated', self.isAnimated);

	//take over options
	extend(self, options);

	//try to calc out basic limits
	self.update();
}


/** Inherit draggable from Emitter */
var proto = Draggable.prototype = Object.create(Emitter.prototype);


/**
 * Draggable behaviour
 * @enum {string}
 * @default is 'idle'
 */
proto.state = {
	//idle
	_: {
		before: function () {
			var self = this;

			//emit drag evts on element
			emit(self.element, 'idle', null, true);
			self.emit('idle');

			//bind start drag
			on(self.element, 'mousedown' + self._ns + ' touchstart' + self._ns, function (e) {
				e.preventDefault();

				//multitouch has multiple starts
				self.setTouch(e);

				//update movement params
				self.update(e);

				//go to threshold state
				self.state = 'threshold';
			});
		},
		after: function () {
			var self = this;

			off(self.element, 'touchstart' + self._ns + ' mousedown' + self._ns);

			//set up tracking
			if (self.release) {
				self._trackingInterval = setInterval(function (e) {
					var now = Date.now();
					var elapsed = now - self.timestamp;

					//get delta movement since the last track
					var dX = self.prevX - self.frame[0];
					var dY = self.prevY - self.frame[1];
					self.frame[0] = self.prevX;
					self.frame[1] = self.prevY;

					var delta = Math.sqrt(dX * dX + dY * dY);

					//get speed as average of prev and current (prevent div by zero)
					var v = Math.min(self.velocity * delta / (1 + elapsed), self.maxSpeed);
					self.speed = 0.8 * v + 0.2 * self.speed;

					//get new angle as a last diff
					//NOTE: vector average isn’t the same as speed scalar average
					self.angle = Math.atan2(dY, dX);

					self.emit('track');

					return self;
				}, self.framerate);
			}
		}
	},

	threshold: {
		before: function () {
			var self = this;

			//ignore threshold state, if threshold is none
			if (isZeroArray(self.threshold)) {
				self.state = 'drag';
				return;
			}

			//emit drag evts on element
			self.emit('threshold');

			//listen to doc movement
			on(doc, 'touchmove' + self._ns + ' mousemove' + self._ns, function (e) {
				e.preventDefault();

				//compare movement to the threshold
				var clientX = getClientX(e, self.touchIdx);
				var clientY = getClientY(e, self.touchIdx);
				var difX = self.prevMouseX - clientX;
				var difY = self.prevMouseY - clientY;

				if (difX < self.threshold[0] || difX > self.threshold[2] || difY < self.threshold[1] || difY > self.threshold[3]) {
					self.update(e);

					self.state = 'drag';
				}
			});
			on(doc, 'mouseup' + self._ns + ' touchend' + self._ns + '', function (e) {
				e.preventDefault();

				//forget touches
				self.resetTouch();

				self.state = 'idle';
			});
		},

		after: function () {
			var self = this;
			off(doc, 'touchmove' + self._ns + ' mousemove' + self._ns + ' mouseup' + self._ns + ' touchend' + self._ns);
		}
	},

	drag: {
		before: function () {
			var self = this;

			//reduce dragging clutter
			selection.disable(root);

			//emit drag evts on element
			self.emit('dragstart');
			emit(self.element, 'dragstart', null, true);

			//emit drag events on self
			self.emit('drag');
			emit(self.element, 'drag', null, true);

			//stop drag on leave
			on(doc, 'touchend' + self._ns + ' mouseup' + self._ns + ' mouseleave' + self._ns, function (e) {
				e.preventDefault();

				//forget touches - dragend is called once
				self.resetTouch();

				//manage release movement
				if (self.speed > 1) {
					self.state = 'release';
				}

				else {
					self.state = 'idle';
				}
			});

			//move via transform
			on(doc, 'touchmove' + self._ns + ' mousemove' + self._ns, function (e) {
				self.drag(e);
			});
		},

		after: function () {
			var self = this;

			//enable document interactivity
			selection.enable(root);

			//emit dragend on element, this
			self.emit('dragend');
			emit(self.element, 'dragend', null, true);

			//unbind drag events
			off(doc, 'touchend' + self._ns + ' mouseup' + self._ns + ' mouseleave' + self._ns);
			off(doc, 'touchmove' + self._ns + ' mousemove' + self._ns);
			clearInterval(self._trackingInterval);
		}
	},

	release: {
		before: function () {
			var self = this;

			//enter animation mode
			self.isAnimated = true;

			//calc target point & animate to it
			self.move(
				self.prevX + self.speed * Math.cos(self.angle),
				self.prevY + self.speed * Math.sin(self.angle)
			);

			self.speed = 0;
			self.emit('track');

			self.state = 'idle';
		}
	}
};


/** Drag handler. Needed to provide drag movement emulation via API */
proto.drag = function (e) {
	var self = this;

	e.preventDefault();

	var mouseX = getClientX(e, self.touchIdx),
		mouseY = getClientY(e, self.touchIdx);

	//calc mouse movement diff
	var diffMouseX = mouseX - self.prevMouseX,
		diffMouseY = mouseY - self.prevMouseY;

	//absolute mouse coordinate
	var mouseAbsX = mouseX + win.pageXOffset,
		mouseAbsY = mouseY + win.pageYOffset;

	//calc sniper offset, if any
	if (e.ctrlKey || e.metaKey) {
		self.sniperOffsetX += diffMouseX * self.sniperSlowdown;
		self.sniperOffsetY += diffMouseY * self.sniperSlowdown;
	}

	//calc movement x and y
	//take absolute placing as it is the only reliable way (2x proved)
	var x = (mouseAbsX - self.initOffsetX) - self.innerOffsetX - self.sniperOffsetX,
		y = (mouseAbsY - self.initOffsetY) - self.innerOffsetY - self.sniperOffsetY;

	//move element
	self.move(x, y);

	//save prevClientXY for calculating diff
	self.prevMouseX = mouseX;
	self.prevMouseY = mouseY;

	//emit drag
	self.emit('drag');
	emit(self.element, 'drag', null, true);
};


/** Current number of draggable touches */
var touches = 0;


/** Manage touches */
proto.setTouch = function (e) {
	if (!e.touches || this.isTouched()) return this;

	this.touchIdx = touches;
	touches++;

	return this;
};
proto.resetTouch = function () {
	touches = 0;
	this.touchIdx = null;

	return this;
};
proto.isTouched = function () {
	return this.touchIdx !== null;
};


/** Animation mode, automatically offed once onned */
proto.isAnimated = {
	true: {
		before: function () {
			var self = this;


			clearTimeout(self._animateTimeout);

			//set proper transition
			css(self.element, {
				'transition': (self.releaseDuration) + 'ms ease-out ' + (self.css3 ? 'transform' : 'position')
			});

			//plan leaving anim mode
			self._animateTimeout = setTimeout(function () {
				self.isAnimated = false;
			}, self.releaseDuration);
		},
		after: function () {
			css(this.element, {
				'transition': null
			});
		}
	}
};


/** Index to fetch touch number from event */
proto.touchIdx = null;


/**
 * Update movement limits.
 * Refresh self.withinOffsets and self.limits.
 */
proto.update = function (e) {
	var self = this;

	//initial translation offsets
	var initXY = self.getCoords();

	//calc initial coords
	self.prevX = initXY[0];
	self.prevY = initXY[1];

	//container rect might be outside the vp, so calc absolute offsets
	//zero-position offsets, with translation(0,0)
	var selfOffsets = offsets(self.element);
	self.initOffsetX = selfOffsets.left - self.prevX;
	self.initOffsetY = selfOffsets.top - self.prevY;
	self.offsets = selfOffsets;

	//handle parent case
	if (self.within === 'parent') self.within = self.element.parentNode || doc;
	//absolute offsets of a container
	var withinOffsets = offsets(self.within);
	self.withinOffsets = withinOffsets;

	//calculate movement limits - pin width might be wider than constraints
	self.overflowX = self.pin.width - withinOffsets.width;
	self.overflowY = self.pin.height - withinOffsets.height;
	self.limits = {
		left: withinOffsets.left - self.initOffsetX - self.pin[0] - (self.overflowX < 0 ? 0 : self.overflowX),
		top: withinOffsets.top - self.initOffsetY - self.pin[1] - (self.overflowY < 0 ? 0 : self.overflowY),
		right: self.overflowX > 0 ? 0 : withinOffsets.right - self.initOffsetX - self.pin[2],
		bottom: self.overflowY > 0 ? 0 : withinOffsets.bottom - self.initOffsetY - self.pin[3]
	};

	//preset inner offsets
	self.innerOffsetX = self.pin[0];
	self.innerOffsetY = self.pin[1];

	var selfClientRect = self.element.getBoundingClientRect();

	//if event passed - update acc to event
	if (e) {
		//take last mouse position from the event
		self.prevMouseX = getClientX(e, self.touchIdx);
		self.prevMouseY = getClientY(e, self.touchIdx);

		//if mouse is within the element - take offset normally as rel displacement
		self.innerOffsetX = -selfClientRect.left + getClientX(e, self.touchIdx);
		self.innerOffsetY = -selfClientRect.top + getClientY(e, self.touchIdx);
	}
	//if no event - suppose pin-centered event
	else {
		//take mouse position & inner offset as center of pin
		var pinX = (self.pin[0] + self.pin[2] ) * 0.5;
		var pinY = (self.pin[1] + self.pin[3] ) * 0.5;
		self.prevMouseX = selfClientRect.left + pinX;
		self.prevMouseY = selfClientRect.top + pinY;
		self.innerOffsetX = pinX;
		self.innerOffsetY = pinY;
	}

	//set initial kinetic props
	self.speed = 0;
	self.amplitude = 0;
	self.angle = 0;
	self.timestamp = +new Date();
	self.frame = [self.prevX, self.prevY];

	//set sniper offset
	self.sniperOffsetX = 0;
	self.sniperOffsetY = 0;
};


/**
 * Way of placement:
 * - position === false (slower but more precise and cross-browser)
 * - translate3d === true (faster but may cause blurs on linux systems)
 */
proto.css3 = {
	_: function () {
		this.getCoords = function () {
			// return [this.element.offsetLeft, this.element.offsetTop];
			return [parseCSSValue(css(this.element,'left')), parseCSSValue(css(this.element, 'top'))];
		};

		this.setCoords = function (x, y) {
			css(this.element, {
				left: x,
				top: y
			});

			//save prev coords to use as a start point next time
			this.prevX = x;
			this.prevY = y;
		};
	},

	//undefined placing is treated as translate3d
	true: function () {
		this.getCoords  = function () {
			return getTranslate(this.element) || [0,0];
		};

		this.setCoords = function (x, y) {
			x = round(x, this.precition);
			y = round(y, this.precition);

			css(this.element, 'transform', ['translate3d(', x, 'px,', y, 'px, 0)'].join(''));

			//save prev coords to use as a start point next time
			this.prevX = x;
			this.prevY = y;
		};
	}
};


/**
 * Restricting container
 * @type {Element|object}
 * @default doc.documentElement
 */
proto.within = doc;



Object.defineProperties(proto, {
	/**
	 * Which area of draggable should not be outside the restriction area.
	 * @type {(Array|number)}
	 * @default [0,0,this.element.offsetWidth, this.element.offsetHeight]
	 */
	pin: {
		set: function (value) {
			if (isArray(value)) {
				if (value.length === 2) {
					this._pin = [value[0], value[1], value[0], value[1]];
				} else if (value.length === 4) {
					this._pin = value;
				}
			}

			else if (isNumber(value)) {
				this._pin = [value, value, value, value];
			}

			else {
				this._pin = value;
			}

			//calc pin params
			this._pin.width = this._pin[2] - this._pin[0];
			this._pin.height = this._pin[3] - this._pin[1];
		},

		get: function () {
			if (this._pin) return this._pin;

			//returning autocalculated pin, if private pin is none
			var pin = [0,0, this.offsets.width, this.offsets.height];
			pin.width = this.offsets.width;
			pin.height = this.offsets.height;
			return pin;
		}
	},

	/** Avoid initial mousemove */
	threshold: {
		set: function (val) {
			if (isNumber(val)) {
				this._threshold = [-val*0.5, -val*0.5, val*0.5, val*0.5];
			} else if (val.length === 2) {
				//Array(w,h)
				this._threshold = [-val[0]*0.5, -val[1]*0.5, val[0]*0.5, val[1]*0.5];
			} else if (val.length === 4) {
				//Array(x1,y1,x2,y2)
				this._threshold = val;
			} else if (isFn(val)) {
				//custom val funciton
				this._threshold = val();
			} else {
				this._threshold = [0,0,0,0];
			}
		},

		get: function () {
			return this._threshold || [0,0,0,0];
		}
	}
});



/**
 * For how long to release movement
 *
 * @type {(number|false)}
 * @default false
 * @todo
 */
proto.release = false;
proto.releaseDuration = 500;
proto.velocity = 1000;
proto.maxSpeed = 250;
proto.framerate = 50;


/** To what extent round position */
proto.precision = 1;


/** Slow down movement by pressing ctrl/cmd */
proto.sniper = true;


/** How much to slow sniper drag */
proto.sniperSlowdown = .85;


/**
 * Restrict movement by axis
 *
 * @default undefined
 * @enum {string}
 */
proto.axis = {
	_: function () {
		this.move = function (x, y) {
			var limits = this.limits;

			if (this.repeat) {
				var w = (limits.right - limits.left);
				var h = (limits.bottom - limits.top);
				var oX = - this.initOffsetX + this.withinOffsets.left - this.pin[0] - Math.max(0, this.overflowX);
				var oY = - this.initOffsetY + this.withinOffsets.top - this.pin[1] - Math.max(0, this.overflowY);
				if (this.repeat === 'x') {
					x = loop(x - oX, w) + oX;
				}
				else if (this.repeat === 'y') {
					y = loop(y - oY, h) + oY;
				}
				else {
					x = loop(x - oX, w) + oX;
					y = loop(y - oY, h) + oY;
				}
			}

			x = between(x, limits.left, limits.right);
			y = between(y, limits.top, limits.bottom);

			this.setCoords(x, y);
		};
	},
	x: function () {
		this.move = function (x, y) {
			var limits = this.limits;

			if (this.repeat) {
				var w = (limits.right - limits.left);
				var oX = - this.initOffsetX + this.withinOffsets.left - this.pin[0] - Math.max(0, this.overflowX);
				x = loop(x - oX, w) + oX;
			} else {
				x = between(x, limits.left, limits.right);
			}

			this.setCoords(x, this.prevY);
		};
	},
	y: function () {
		this.move = function (x, y) {
			var limits = this.limits;

			if (this.repeat) {
				var h = (limits.bottom - limits.top);
				var oY = - this.initOffsetY + this.withinOffsets.top - this.pin[1] - Math.max(0, this.overflowY);
				y = loop(y - oY, h) + oY;
			} else {
				y = between(y, limits.top, limits.bottom);
			}

			this.setCoords(this.prevX, y);
		};
	}
};


/** Repeat movement by one of axises */
proto.repeat = false;


/** Check whether arr is filled with zeros */
function isZeroArray(arr) {
	if (!arr[0] && !arr[1] && !arr[2] && !arr[3]) return true;
}


module.exports = Draggable;
},{"define-state":10,"emmy/emit":34,"emmy/off":42,"emmy/on":"emmy/on","events":1,"get-client-xy":14,"get-uid":15,"is-array":16,"is-function":44,"mucss/css":18,"mucss/offset":22,"mucss/parse-value":23,"mucss/selection":26,"mucss/translate":27,"mumath/between":28,"mumath/loop":29,"mumath/round":31,"mutype/is-number":33,"xtend/mutable":66}],10:[function(require,module,exports){
/**
 * Define stateful property on an object
 */
module.exports = defineState;

var State = require('st8');


/**
 * Define stateful property on a target
 *
 * @param {object} target Any object
 * @param {string} property Property name
 * @param {object} descriptor State descriptor
 *
 * @return {object} target
 */
function defineState (target, property, descriptor, isFn) {
	//define accessor on a target
	if (isFn) {
		target[property] = function () {
			if (arguments.length) {
				return state.set(arguments[0]);
			}
			else {
				return state.get();
			}
		};
	}

	//define setter/getter on a target
	else {
		Object.defineProperty(target, property, {
			set: function (value) {
				return state.set(value);
			},
			get: function () {
				return state.get();
			}
		});
	}

	//define state controller
	var state = new State(descriptor, target);

	return target;
}
},{"st8":11}],11:[function(require,module,exports){
/**
 * @module  st8
 *
 * Micro state machine.
 */


var Emitter = require('events');
var isFn = require('is-function');
var isObject = require('is-plain-object');


/** Defaults */

State.options = {
	leaveCallback: 'after',
	enterCallback: 'before',
	changeCallback: 'change',
	remainderState: '_'
};


/**
 * Create a new state controller based on states passed
 *
 * @constructor
 *
 * @param {object} settings Initial states
 */

function State(states, context){
	//ignore existing state
	if (states instanceof State) return states;

	//ensure new state instance is created
	if (!(this instanceof State)) return new State(states);

	//save states object
	this.states = states || {};

	//save context
	this.context = context || this;

	//initedFlag
	this.isInit = false;
}


/** Inherit State from Emitter */

var proto = State.prototype = Object.create(Emitter.prototype);


/**
 * Go to a state
 *
 * @param {*} value Any new state to enter
 */

proto.set = function (value) {
	var oldValue = this.state, states = this.states;
	// console.group('set', value, oldValue);

	//leave old state
	var oldStateName = states[oldValue] !== undefined ? oldValue : State.options.remainderState;
	var oldState = states[oldStateName];

	var leaveResult, leaveFlag = State.options.leaveCallback + oldStateName;

	if (this.isInit) {
		if (isObject(oldState)) {
			if (!this[leaveFlag]) {
				this[leaveFlag] = true;

				//if oldstate has after method - call it
				leaveResult = getValue(oldState, State.options.leaveCallback, this.context);

				//ignore changing if leave result is falsy
				if (leaveResult === false) {
					this[leaveFlag] = false;
					// console.groupEnd();
					return false;
				}

				//redirect, if returned anything
				else if (leaveResult !== undefined && leaveResult !== value) {
					this.set(leaveResult);
					this[leaveFlag] = false;
					// console.groupEnd();
					return false;
				}

				this[leaveFlag] = false;

				//ignore redirect
				if (this.state !== oldValue) {
					return;
				}
			}

		}

		//ignore not changed value
		if (value === oldValue) return false;
	}
	else {
		this.isInit = true;
	}


	//set current value
	this.state = value;


	//try to enter new state
	var newStateName = states[value] !== undefined ? value : State.options.remainderState;
	var newState = states[newStateName];
	var enterFlag = State.options.enterCallback + newStateName;
	var enterResult;

	if (!this[enterFlag]) {
		this[enterFlag] = true;

		if (isObject(newState)) {
			enterResult = getValue(newState, State.options.enterCallback, this.context);
		} else {
			enterResult = getValue(states, newStateName, this.context);
		}

		//ignore entering falsy state
		if (enterResult === false) {
			this.set(oldValue);
			this[enterFlag] = false;
			// console.groupEnd();
			return false;
		}

		//redirect if returned anything but current state
		else if (enterResult !== undefined && enterResult !== value) {
			this.set(enterResult);
			this[enterFlag] = false;
			// console.groupEnd();
			return false;
		}

		this[enterFlag] = false;
	}



	//notify change
	if (value !== oldValue)	{
		this.emit(State.options.changeCallback, value, oldValue);
	}


	// console.groupEnd();

	//return context to chain calls
	return this.context;
};


/** Get current state */

proto.get = function(){
	return this.state;
};


/** Return value or fn result */
function getValue(holder, meth, ctx){
	if (isFn(holder[meth])) {
		return holder[meth].call(ctx);
	}

	return holder[meth];
}


module.exports = State;
},{"events":1,"is-function":44,"is-plain-object":12}],12:[function(require,module,exports){
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var isObject = require('isobject');

function isObjectObject(o) {
  return isObject(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

module.exports = function isPlainObject(o) {
  var ctor,prot;
  
  if (isObjectObject(o) === false) return false;
  
  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;
  
  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;
  
  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }
  
  // Most likely a plain Object
  return true;
};

},{"isobject":13}],13:[function(require,module,exports){
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

module.exports = function isObject(o) {
  return o != null && typeof o === 'object'
    && !Array.isArray(o);
};
},{}],14:[function(require,module,exports){
/**
 * Get clientY/clientY from an event.
 * If index is passed, treat it as index of global touches, not the targetTouches.
 * It is because global touches are more generic.
 *
 * @module get-client-xy
 *
 * @param {Event} e Event raised, like mousemove
 *
 * @return {number} Coordinate relative to the screen
 */
function getClientY (e, idx) {
	// touch event
	if (e.touches) {
		if (arguments.length > 1) {
			return e.touches[idx].clientY;
		}
		else {
			return e.targetTouches[0].clientY;
		}
	}

	// mouse event
	return e.clientY;
}
function getClientX (e, idx) {
	// touch event
	if (e.touches) {
		if (arguments.length > 1) {
			return e.touches[idx].clientX;
		}
		else {
			return e.targetTouches[0].clientX;
		}
	}

	// mouse event
	return e.clientX;
}

function getClientXY (e, idx) {
	return [getClientX(e, idx), getClientY(e, idx)];
}

getClientXY.x = getClientX;
getClientXY.y = getClientY;

module.exports = getClientXY;
},{}],15:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],16:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],17:[function(require,module,exports){
/**
 * Simple rect constructor.
 * It is just faster and smaller than constructing an object.
 *
 * @module mucss/Rect
 *
 * @param {number} l left
 * @param {number} t top
 * @param {number} r right
 * @param {number} b bottom
 * @param {number}? w width
 * @param {number}? h height
 *
 * @return {Rect} A rectangle object
 */
module.exports = function Rect (l,t,r,b,w,h) {
	this.top=t||0;
	this.bottom=b||0;
	this.left=l||0;
	this.right=r||0;
	if (w!==undefined) this.width=w||this.right-this.left;
	if (h!==undefined) this.height=h||this.bottom-this.top;
};
},{}],18:[function(require,module,exports){
/**
 * Get or set element’s style, prefix-agnostic.
 *
 * @module  mucss/css
 */
var fakeStyle = require('./fake-element').style;
var prefix = require('./prefix').lowercase;


/**
 * Apply styles to an element.
 *
 * @param    {Element}   el   An element to apply styles.
 * @param    {Object|string}   obj   Set of style rules or string to get style rule.
 */
module.exports = function(el, obj){
	if (!el || !obj) return;

	var name, value;

	//return value, if string passed
	if (typeof obj === 'string') {
		name = obj;

		//return value, if no value passed
		if (arguments.length < 3) {
			return el.style[prefixize(name)];
		}

		//set style, if value passed
		value = arguments[2] || '';
		obj = {};
		obj[name] = value;
	}

	for (name in obj){
		//convert numbers to px
		if (typeof obj[name] === 'number' && /left|right|bottom|top|width|height/i.test(name)) obj[name] += 'px';

		value = obj[name] || '';

		el.style[prefixize(name)] = value;
	}
};


/**
 * Return prefixized prop name, if needed.
 *
 * @param    {string}   name   A property name.
 * @return   {string}   Prefixed property name.
 */
function prefixize(name){
	var uName = name[0].toUpperCase() + name.slice(1);
	if (fakeStyle[name] !== undefined) return name;
	if (fakeStyle[prefix + uName] !== undefined) return prefix + uName;
	return '';
}

},{"./fake-element":19,"./prefix":24}],19:[function(require,module,exports){
/** Just a fake element to test styles
 * @module mucss/fake-element
 */

module.exports = document.createElement('div');
},{}],20:[function(require,module,exports){
/**
 * Window scrollbar detector.
 *
 * @module mucss/has-scroll
 */
exports.x = function () {
	return window.innerHeight > document.documentElement.clientHeight;
};
exports.y = function () {
	return window.innerWidth > document.documentElement.clientWidth;
};
},{}],21:[function(require,module,exports){
/**
 * Detect whether element is placed to fixed container or is fixed itself.
 *
 * @module mucss/is-fixed
 *
 * @param {(Element|Object)} el Element to detect fixedness.
 *
 * @return {boolean} Whether element is nested.
 */
module.exports = function (el) {
	var parentEl = el;

	//window is fixed, btw
	if (el === window) return true;

	//unlike the doc
	if (el === document) return false;

	while (parentEl) {
		if (getComputedStyle(parentEl).position === 'fixed') return true;
		parentEl = parentEl.offsetParent;
	}
	return false;
};
},{}],22:[function(require,module,exports){
/**
 * Calculate absolute offsets of an element, relative to the document.
 *
 * @module mucss/offsets
 *
 */
var win = window;
var doc = document;
var Rect = require('./Rect');
var hasScroll = require('./has-scroll');
var scrollbar = require('./scrollbar');
var isFixedEl = require('./is-fixed');

/**
 * Return absolute offsets of any target passed
 *
 * @param    {Element|window}   el   A target. Pass window to calculate viewport offsets
 * @return   {Object}   Offsets object with trbl.
 */
module.exports = offsets;

function offsets (el) {
	if (!el) throw Error('Bad argument');

	//calc client rect
	var cRect, result;

	//return vp offsets
	if (el === win) {
		result = new Rect(
			win.pageXOffset,
			win.pageYOffset
		);

		result.width = win.innerWidth - (hasScroll.y() ? scrollbar : 0),
		result.height = win.innerHeight - (hasScroll.x() ? scrollbar : 0)
		result.right = result.left + result.width;
		result.bottom = result.top + result.height;

		return result;
	}

	//return absolute offsets if document requested
	else if (el === doc) {
		var res = offsets(doc.documentElement);
		res.bottom = Math.max(window.innerHeight, res.bottom);
		res.right = Math.max(window.innerWidth, res.right);
		if (hasScroll.y(doc.documentElement)) res.right -= scrollbar;
		if (hasScroll.x(doc.documentElement)) res.bottom -= scrollbar;
		return res;
	}

	//FIXME: why not every element has getBoundingClientRect method?
	try {
		cRect = el.getBoundingClientRect();
	} catch (e) {
		cRect = new Rect(
			el.clientLeft,
			el.clientTop
		);
	}

	//whether element is or is in fixed
	var isFixed = isFixedEl(el);
	var xOffset = isFixed ? 0 : win.pageXOffset;
	var yOffset = isFixed ? 0 : win.pageYOffset;

	result = new Rect(
		cRect.left + xOffset,
		cRect.top + yOffset,
		cRect.left + xOffset + el.offsetWidth,
		cRect.top + yOffset + el.offsetHeight,
		el.offsetWidth,
		el.offsetHeight
	);

	return result;
};
},{"./Rect":17,"./has-scroll":20,"./is-fixed":21,"./scrollbar":25}],23:[function(require,module,exports){
/**
 * Returns parsed css value.
 *
 * @module mucss/parse-value
 *
 * @param {string} str A string containing css units value
 *
 * @return {number} Parsed number value
 */
module.exports = function (str){
	str += '';
	return parseFloat(str.slice(0,-2)) || 0;
};

//FIXME: add parsing units
},{}],24:[function(require,module,exports){
/**
 * Vendor prefixes
 * Method of http://davidwalsh.name/vendor-prefix
 * @module mucss/prefix
 */

var styles = getComputedStyle(document.documentElement, '');

var pre = (Array.prototype.slice.call(styles)
	.join('')
	.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
)[1];

dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

module.exports = {
	dom: dom,
	lowercase: pre,
	css: '-' + pre + '-',
	js: pre[0].toUpperCase() + pre.substr(1)
};
},{}],25:[function(require,module,exports){
/**
 * Calculate scrollbar width.
 *
 * @module mucss/scrollbar
 */

// Create the measurement node
var scrollDiv = document.createElement("div");

var style = scrollDiv.style;

style.width = '100px';
style.height = '100px';
style.overflow = 'scroll';
style.position = 'absolute';
style.top = '-9999px';

document.documentElement.appendChild(scrollDiv);

// the scrollbar width
module.exports = scrollDiv.offsetWidth - scrollDiv.clientWidth;

// Delete fake DIV
document.documentElement.removeChild(scrollDiv);
},{}],26:[function(require,module,exports){
/**
 * Enable/disable selectability of an element
 * @module mucss/selection
 */
var css = require('./css');


/**
 * Disable or Enable any selection possibilities for an element.
 *
 * @param    {Element}   el   Target to make unselectable.
 */
exports.disable = function(el){
	css(el, {
		'user-select': 'none',
		'user-drag': 'none',
		'touch-callout': 'none'
	});
	el.setAttribute('unselectable', 'on');
	el.addEventListener('selectstart', pd);
};
exports.enable = function(el){
	css(el, {
		'user-select': null,
		'user-drag': null,
		'touch-callout': null
	});
	el.removeAttribute('unselectable');
	el.removeEventListener('selectstart', pd);
};


/** Prevent you know what. */
function pd(e){
	e.preventDefault();
}
},{"./css":18}],27:[function(require,module,exports){
/**
 * Parse translate3d
 *
 * @module mucss/translate
 */

var css = require('./css');
var parseValue = require('./parse-value');

module.exports = function (el) {
	var translateStr = css(el, 'transform');

	//find translate token, retrieve comma-enclosed values
	//translate3d(1px, 2px, 2) → 1px, 2px, 2
	//FIXME: handle nested calcs
	var match = /translate(?:3d)?\s*\(([^\)]*)\)/.exec(translateStr);

	if (!match) return null;
	var values = match[1].split(/\s*,\s*/);

	//parse values
	//FIXME: nested values are not necessarily pixels
	return values.map(function (value) {
		return parseValue(value);
	});
};
},{"./css":18,"./parse-value":23}],28:[function(require,module,exports){
/**
 * Clamper.
 * Detects proper clamp min/max.
 *
 * @param {number} a Current value to cut off
 * @param {number} min One side limit
 * @param {number} max Other side limit
 *
 * @return {number} Clamped value
 */

module.exports = require('./wrap')(function(a, min, max){
	return max > min ? Math.max(Math.min(a,max),min) : Math.max(Math.min(a,min),max);
});
},{"./wrap":32}],29:[function(require,module,exports){
/**
 * @module  mumath/loop
 *
 * Looping function for any framesize
 */

module.exports = require('./wrap')(function (value, left, right) {
	//detect single-arg case, like mod-loop
	if (right === undefined) {
		right = left;
		left = 0;
	}

	//swap frame order
	if (left > right) {
		var tmp = right;
		right = left;
		left = tmp;
	}

	var frame = right - left;

	value = ((value + left) % frame) - left;
	if (value < left) value += frame;
	if (value > right) value -= frame;

	return value;
});
},{"./wrap":32}],30:[function(require,module,exports){
/**
 * @module  mumath/precision
 *
 * Get precision from float:
 *
 * @example
 * 1.1 → 1, 1234 → 0, .1234 → 4
 *
 * @param {number} n
 *
 * @return {number} decimap places
 */

module.exports = require('./wrap')(function(n){
	var s = n + '',
		d = s.indexOf('.') + 1;

	return !d ? 0 : s.length - d;
});
},{"./wrap":32}],31:[function(require,module,exports){
/**
 * Precision round
 *
 * @param {number} value
 * @param {number} step Minimal discrete to round
 *
 * @return {number}
 *
 * @example
 * toPrecision(213.34, 1) == 213
 * toPrecision(213.34, .1) == 213.3
 * toPrecision(213.34, 10) == 210
 */
var precision = require('./precision');

module.exports = require('./wrap')(function(value, step) {
	if (step === 0) return value;
	if (!step) return Math.round(value);
	step = parseFloat(step);
	value = Math.round(value / step) * step;
	return parseFloat(value.toFixed(precision(step)));
});
},{"./precision":30,"./wrap":32}],32:[function(require,module,exports){
/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
module.exports = function(fn){
	return function(a){
		var args = arguments;
		if (a instanceof Array) {
			var result = new Array(a.length), slice;
			for (var i = 0; i < a.length; i++){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = args[j] instanceof Array ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else if (typeof a === 'object') {
			var result = {}, slice;
			for (var i in a){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = typeof args[j] === 'object' ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else {
			return fn.apply(this, args);
		}
	};
};
},{}],33:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'number' || a instanceof Number;
}
},{}],34:[function(require,module,exports){
/**
 * @module emmy/emit
 */
var icicle = require('icicle');
var slice = require('sliced');
var isString = require('mutype/is-string');
var isNode = require('mutype/is-node');
var isEvent = require('mutype/is-event');
var listeners = require('./listeners');


/**
 * A simple wrapper to handle stringy/plain events
 */
module.exports = function(target, evt){
	if (!target) return;

	var args = arguments;
	if (isString(evt)) {
		args = slice(arguments, 2);
		evt.split(/\s+/).forEach(function(evt){
			evt = evt.split('.')[0];

			emit.apply(this, [target, evt].concat(args));
		});
	} else {
		return emit.apply(this, args);
	}
};


/** detect env */
var $ = typeof jQuery === 'undefined' ? undefined : jQuery;
var doc = typeof document === 'undefined' ? undefined : document;
var win = typeof window === 'undefined' ? undefined : window;


/**
 * Emit an event, optionally with data or bubbling
 * Accept only single elements/events
 *
 * @param {string} eventName An event name, e. g. 'click'
 * @param {*} data Any data to pass to event.details (DOM) or event.data (elsewhere)
 * @param {bool} bubbles Whether to trigger bubbling event (DOM)
 *
 *
 * @return {target} a target
 */
function emit(target, eventName, data, bubbles){
	var emitMethod, evt = eventName;

	//Create proper event for DOM objects
	if (isNode(target) || target === win) {
		//NOTE: this doesnot bubble on off-DOM elements

		if (isEvent(eventName)) {
			evt = eventName;
		} else {
			//IE9-compliant constructor
			evt = doc.createEvent('CustomEvent');
			evt.initCustomEvent(eventName, bubbles, true, data);

			//a modern constructor would be:
			// var evt = new CustomEvent(eventName, { detail: data, bubbles: bubbles })
		}

		emitMethod = target.dispatchEvent;
	}

	//create event for jQuery object
	else if ($ && target instanceof $) {
		//TODO: decide how to pass data
		evt = $.Event( eventName, data );
		evt.detail = data;

		//FIXME: reference case where triggerHandler needed (something with multiple calls)
		emitMethod = bubbles ? targte.trigger : target.triggerHandler;
	}

	//detect target events
	else {
		//emit - default
		//trigger - jquery
		//dispatchEvent - DOM
		//raise - node-state
		//fire - ???
		emitMethod = target['dispatchEvent'] || target['emit'] || target['trigger'] || target['fire'] || target['raise'];
	}


	var args = slice(arguments, 2);


	//use locks to avoid self-recursion on objects wrapping this method
	if (emitMethod) {
		if (icicle.freeze(target, 'emit' + eventName)) {
			//use target event system, if possible
			emitMethod.apply(target, [evt].concat(args));
			icicle.unfreeze(target, 'emit' + eventName);

			return target;
		}

		//if event was frozen - probably it is emitter instance
		//so perform normal callback
	}


	//fall back to default event system
	var evtCallbacks = listeners(target, evt);

	//copy callbacks to fire because list can be changed by some callback (like `off`)
	var fireList = slice(evtCallbacks);
	for (var i = 0; i < fireList.length; i++ ) {
		fireList[i] && fireList[i].apply(target, args);
	}

	return target;
}
},{"./listeners":35,"icicle":36,"mutype/is-event":37,"mutype/is-node":38,"mutype/is-string":39,"sliced":40}],35:[function(require,module,exports){
/**
 * A storage of per-target callbacks.
 * WeakMap is the most safe solution.
 *
 * @module emmy/listeners
 */


/**
 * Property name to provide on targets.
 *
 * Can’t use global WeakMap -
 * it is impossible to provide singleton global cache of callbacks for targets
 * not polluting global scope. So it is better to pollute target scope than the global.
 *
 * Otherwise, each emmy instance will create it’s own cache, which leads to mess.
 *
 * Also can’t use `._events` property on targets, as it is done in `events` module,
 * because it is incompatible. Emmy targets universal events wrapper, not the native implementation.
 */
var cbPropName = '_callbacks';


/**
 * Get listeners for the target/evt (optionally).
 *
 * @param {object} target a target object
 * @param {string}? evt an evt name, if undefined - return object with events
 *
 * @return {(object|array)} List/set of listeners
 */
function listeners(target, evt, tags){
	var cbs = target[cbPropName];

	if (!evt) return cbs || {};
	if (!cbs || !cbs[evt]) return [];

	var result = cbs[evt];

	//if there are evt namespaces specified - filter callbacks
	if (tags && tags.length) {
		result = result.filter(function(cb){
			return hasTags(cb, tags);
		});
	}

	return result;
}


/**
 * Remove listener, if any
 */
listeners.remove = function(target, evt, cb, tags){
	//get callbacks for the evt
	var evtCallbacks = target[cbPropName];
	if (!evtCallbacks || !evtCallbacks[evt]) return false;

	var callbacks = evtCallbacks[evt];

	//if tags are passed - make sure callback has some tags before removing
	if (tags && tags.length && !hasTags(cb, tags)) return false;

	//remove specific handler
	for (var i = 0; i < callbacks.length; i++) {
		//once method has original callback in .cb
		if (callbacks[i] === cb || callbacks[i].fn === cb) {
			callbacks.splice(i, 1);
			break;
		}
	}
};


/**
 * Add a new listener
 */
listeners.add = function(target, evt, cb, tags){
	if (!cb) return;

	var targetCallbacks = target[cbPropName];

	//ensure set of callbacks for the target exists
	if (!targetCallbacks) {
		targetCallbacks = {};
		Object.defineProperty(target, cbPropName, {
			value: targetCallbacks
		});
	}

	//save a new callback
	(targetCallbacks[evt] = targetCallbacks[evt] || []).push(cb);

	//save ns for a callback, if any
	if (tags && tags.length) {
		cb._ns = tags;
	}
};


/** Detect whether an cb has at least one tag from the list */
function hasTags(cb, tags){
	if (cb._ns) {
		//if cb is tagged with a ns and includes one of the ns passed - keep it
		for (var i = tags.length; i--;){
			if (cb._ns.indexOf(tags[i]) >= 0) return true;
		}
	}
}


module.exports = listeners;
},{}],36:[function(require,module,exports){
/**
 * @module Icicle
 */
module.exports = {
	freeze: lock,
	unfreeze: unlock,
	isFrozen: isLocked
};


/** Set of targets  */
var lockCache = new WeakMap;


/**
 * Set flag on target with the name passed
 *
 * @return {bool} Whether lock succeeded
 */
function lock(target, name){
	var locks = lockCache.get(target);
	if (locks && locks[name]) return false;

	//create lock set for a target, if none
	if (!locks) {
		locks = {};
		lockCache.set(target, locks);
	}

	//set a new lock
	locks[name] = true;

	//return success
	return true;
}


/**
 * Unset flag on the target with the name passed.
 *
 * Note that if to return new value from the lock/unlock,
 * then unlock will always return false and lock will always return true,
 * which is useless for the user, though maybe intuitive.
 *
 * @param {*} target Any object
 * @param {string} name A flag name
 *
 * @return {bool} Whether unlock failed.
 */
function unlock(target, name){
	var locks = lockCache.get(target);
	if (!locks || !locks[name]) return false;

	locks[name] = null;

	return true;
}


/**
 * Return whether flag is set
 *
 * @param {*} target Any object to associate lock with
 * @param {string} name A flag name
 *
 * @return {Boolean} Whether locked or not
 */
function isLocked(target, name){
	var locks = lockCache.get(target);
	return (locks && locks[name]);
}
},{}],37:[function(require,module,exports){
module.exports = function(target){
	return typeof Event !== 'undefined' && target instanceof Event;
};
},{}],38:[function(require,module,exports){
module.exports = function(target){
	return typeof document !== 'undefined' && target instanceof Node;
};
},{}],39:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],40:[function(require,module,exports){
module.exports = exports = require('./lib/sliced');

},{"./lib/sliced":41}],41:[function(require,module,exports){

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}


},{}],42:[function(require,module,exports){
/**
 * @module emmy/off
 */
module.exports = off;

var icicle = require('icicle');
var slice = require('sliced');
var listeners = require('./listeners');


/**
 * Remove listener[s] from the target
 *
 * @param {[type]} evt [description]
 * @param {Function} fn [description]
 *
 * @return {[type]} [description]
 */
function off(target, evt, fn) {
	if (!target) return target;

	var callbacks, i;

	//unbind all listeners if no fn specified
	if (fn === undefined) {
		var args = slice(arguments, 1);

		//try to use target removeAll method, if any
		var allOff = target['removeAll'] || target['removeAllListeners'];

		//call target removeAll
		if (allOff) {
			allOff.apply(target, args);
		}


		//then forget own callbacks, if any

		//unbind all evts
		if (!evt) {
			callbacks = listeners(target);
			for (evt in callbacks) {
				off(target, evt);
			}
		}
		//unbind all callbacks for an evt
		else {
			//invoke method for each space-separated event from a list
			evt.split(/\s+/).forEach(function (evt) {
				var evtParts = evt.split('.');
				evt = evtParts.shift();
				callbacks = listeners(target, evt, evtParts);
				for (var i = callbacks.length; i--;) {
					off(target, evt, callbacks[i]);
				}
			});
		}

		return target;
	}


	//target events (string notation to advanced_optimizations)
	var offMethod = target['removeEventListener'] || target['removeListener'] || target['detachEvent'] || target['off'];

	//invoke method for each space-separated event from a list
	evt.split(/\s+/).forEach(function (evt) {
		var evtParts = evt.split('.');
		evt = evtParts.shift();

		//use target `off`, if possible
		if (offMethod) {
			//avoid self-recursion from the outside
			if (icicle.freeze(target, 'off' + evt)) {
				offMethod.call(target, evt, fn);
				icicle.unfreeze(target, 'off' + evt);
			}

			//if it’s frozen - ignore call
			else {
				return target;
			}
		}

		if (fn.closedCall) fn.closedCall = false;

		//forget callback
		listeners.remove(target, evt, fn, evtParts);
	});


	return target;
}
},{"./listeners":35,"icicle":36,"sliced":40}],43:[function(require,module,exports){
'use strict';
module.exports = function () {
	return typeof window !== 'undefined'
		&& typeof document !== 'undefined'
		&& typeof document.createElement === 'function';
};

},{}],44:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],45:[function(require,module,exports){
/**
 * A query engine (with no pseudo classes yet).
 *
 * @module queried/lib/index
 */

//TODO: jquery selectors
//TODO: test order of query result (should be compliant with querySelectorAll)
//TODO: third query param - include self
//TODO: .closest, .all, .next, .prev, .parent, .filter, .mathes etc methods - all with the same API: query(selector, [el], [incSelf], [within]).
//TODO: .all('.x', '.selector');
//TODO: use universal pseudo mapper/filter instead of separate ones.


var slice = require('sliced');
var unique = require('array-unique');
var getUid = require('get-uid');
var paren = require('parenthesis');
var isString = require('mutype/is-string');
var isArray = require('mutype/is-array');
var isArrayLike = require('mutype/is-array-like');
var arrayify = require('arrayify-compact');
var doc = require('get-doc');


/** Registered pseudos */
var pseudos = {};
var filters = {};
var mappers = {};


/** Regexp to grab pseudos with params */
var pseudoRE;


/**
 * Append a new filtering (classic) pseudo
 *
 * @param {string} name Pseudo name
 * @param {Function} filter A filtering function
 */
function registerFilter(name, filter, incSelf){
	if (pseudos[name]) return;

	//save pseudo filter
	pseudos[name] = filter;
	pseudos[name].includeSelf = incSelf;
	filters[name] = true;

	regenerateRegExp();
}


/**
 * Append a new mapping (relative-like) pseudo
 *
 * @param {string} name pseudo name
 * @param {Function} mapper map function
 */
function registerMapper(name, mapper, incSelf){
	if (pseudos[name]) return;

	pseudos[name] = mapper;
	pseudos[name].includeSelf = incSelf;
	mappers[name] = true;

	regenerateRegExp();
}


/** Update regexp catching pseudos */
function regenerateRegExp(){
	pseudoRE = new RegExp('::?(' + Object.keys(pseudos).join('|') + ')(\\\\[0-9]+)?');
}


/**
 * Query wrapper - main method to query elements.
 */
function queryMultiple(selector, el) {
	//ignore bad selector
	if (!selector) return [];

	//return elements passed as a selector unchanged (cover params case)
	if (!isString(selector)) return isArray(selector) ? selector : [selector];

	//catch polyfillable first `:scope` selector - just erase it, works just fine
	if (pseudos.scope) selector = selector.replace(/^\s*:scope/, '');

	//ignore non-queryable containers
	if (!el) el = [querySingle.document];

	//treat passed list
	else if (isArrayLike(el)) {
		el = arrayify(el);
	}

	//if element isn’t a node - make it q.document
	else if (!el.querySelector) {
		el = [querySingle.document];
	}

	//make any ok element a list
	else el = [el];

	return qPseudos(el, selector);
}


/** Query single element - no way better than return first of multiple selector */
function querySingle(selector, el){
	return queryMultiple(selector, el)[0];
}


/**
 * Return query result based off target list.
 * Parse and apply polyfilled pseudos
 */
function qPseudos(list, selector) {
	//ignore empty selector
	selector = selector.trim();
	if (!selector) return list;

	// console.group(selector);

	//scopify immediate children selector
	if (selector[0] === '>') {
		if (!pseudos.scope) {
			//scope as the first element in selector scopifies current element just ok
			selector = ':scope' + selector;
		}
		else {
			var id = getUid();
			list.forEach(function(el){el.setAttribute('__scoped', id);});
			selector = '[__scoped="' + id + '"]' + selector;
		}
	}

	var pseudo, pseudoFn, pseudoParam, pseudoParamId;

	//catch pseudo
	var parts = paren.parse(selector);
	var match = parts[0].match(pseudoRE);

	//if pseudo found
	if (match) {
		//grab pseudo details
		pseudo = match[1];
		pseudoParamId = match[2];

		if (pseudoParamId) {
			pseudoParam = paren.stringify(parts[pseudoParamId.slice(1)], parts);
		}

		//pre-select elements before pseudo
		var preSelector = paren.stringify(parts[0].slice(0, match.index), parts);

		//fix for query-relative
		if (!preSelector && !mappers[pseudo]) preSelector = '*';
		if (preSelector) list = qList(list, preSelector);


		//apply pseudo filter/mapper on the list
		pseudoFn = function(el) {return pseudos[pseudo](el, pseudoParam); };
		if (filters[pseudo]) {
			list = list.filter(pseudoFn);
		}
		else if (mappers[pseudo]) {
			list = unique(arrayify(list.map(pseudoFn)));
		}

		//shorten selector
		selector = parts[0].slice(match.index + match[0].length);

		// console.groupEnd();

		//query once again
		return qPseudos(list, paren.stringify(selector, parts));
	}

	//just query list
	else {
		// console.groupEnd();
		return qList(list, selector);
	}
}


/** Apply selector on a list of elements, no polyfilled pseudos */
function qList(list, selector){
	return unique(arrayify(list.map(function(el){
		return slice(el.querySelectorAll(selector));
	})));
}


/** Exports */
querySingle.all = queryMultiple;
querySingle.registerFilter = registerFilter;
querySingle.registerMapper = registerMapper;

/** Default document representative to use for DOM */
querySingle.document = doc;

module.exports = querySingle;
},{"array-unique":51,"arrayify-compact":52,"get-doc":54,"get-uid":56,"mutype/is-array":58,"mutype/is-array-like":57,"mutype/is-string":60,"parenthesis":61,"sliced":64}],46:[function(require,module,exports){
var q = require('..');

function has(el, subSelector){
	return !!q(subSelector, el);
}

module.exports = has;
},{"..":45}],47:[function(require,module,exports){
var q = require('..');

/** CSS4 matches */
function matches(el, selector){
	if (!el.parentNode) {
		var fragment = q.document.createDocumentFragment();
		fragment.appendChild(el);
	}

	return q.all(selector, el.parentNode).indexOf(el) > -1;
}

module.exports = matches;
},{"..":45}],48:[function(require,module,exports){
var matches = require('./matches');

function not(el, selector){
	return !matches(el, selector);
}

module.exports = not;
},{"./matches":47}],49:[function(require,module,exports){
var q = require('..');

module.exports = function root(el){
	return el === q.document.documentElement;
};
},{"..":45}],50:[function(require,module,exports){
/**
 * :scope pseudo
 * Return element if it has `scoped` attribute.
 *
 * @link http://dev.w3.org/csswg/selectors-4/#the-scope-pseudo
 */

module.exports = function scope(el){
	return el.hasAttribute('scoped');
};
},{}],51:[function(require,module,exports){
/*!
 * array-unique <https://github.com/jonschlinkert/array-unique>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array.');
  }

  var len = arr.length;
  var i = -1;

  while (i++ < len) {
    var j = i + 1;

    for (; j < arr.length; ++j) {
      if (arr[i] === arr[j]) {
        arr.splice(j--, 1);
      }
    }
  }
  return arr;
};

},{}],52:[function(require,module,exports){
/*!
 * arrayify-compact <https://github.com/jonschlinkert/arrayify-compact>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var flatten = require('array-flatten');

module.exports = function(arr) {
  return flatten(!Array.isArray(arr) ? [arr] : arr)
    .filter(Boolean);
};

},{"array-flatten":53}],53:[function(require,module,exports){
/**
 * Recursive flatten function with depth.
 *
 * @param  {Array}  array
 * @param  {Array}  result
 * @param  {Number} depth
 * @return {Array}
 */
function flattenDepth (array, result, depth) {
  for (var i = 0; i < array.length; i++) {
    var value = array[i]

    if (depth > 0 && Array.isArray(value)) {
      flattenDepth(value, result, depth - 1)
    } else {
      result.push(value)
    }
  }

  return result
}

/**
 * Recursive flatten function. Omitting depth is slightly faster.
 *
 * @param  {Array} array
 * @param  {Array} result
 * @return {Array}
 */
function flattenForever (array, result) {
  for (var i = 0; i < array.length; i++) {
    var value = array[i]

    if (Array.isArray(value)) {
      flattenForever(value, result)
    } else {
      result.push(value)
    }
  }

  return result
}

/**
 * Flatten an array, with the ability to define a depth.
 *
 * @param  {Array}  array
 * @param  {Number} depth
 * @return {Array}
 */
module.exports = function (array, depth) {
  if (depth == null) {
    return flattenForever(array, [])
  }

  return flattenDepth(array, [], depth)
}

},{}],54:[function(require,module,exports){
/**
 * @module  get-doc
 */

var hasDom = require('has-dom');

module.exports = hasDom() ? document : null;
},{"has-dom":55}],55:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],56:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15}],57:[function(require,module,exports){
var isString = require('./is-string');
var isArray = require('./is-array');
var isFn = require('./is-fn');

//FIXME: add tests from http://jsfiddle.net/ku9LS/1/
module.exports = function (a){
	return isArray(a) || (a && !isString(a) && !a.nodeType && (typeof window != 'undefined' ? a != window : true) && !isFn(a) && typeof a.length === 'number');
}
},{"./is-array":58,"./is-fn":59,"./is-string":60}],58:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],59:[function(require,module,exports){
module.exports = function(a){
	return !!(a && a.apply);
}
},{}],60:[function(require,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"dup":39}],61:[function(require,module,exports){
/**
 * @module parenthesis
 */
module.exports = {
	parse: require('./parse'),
	stringify: require('./stringify')
};
},{"./parse":62,"./stringify":63}],62:[function(require,module,exports){
/**
 * @module  parenthesis/parse
 *
 * Parse a string with parenthesis.
 *
 * @param {string} str A string with parenthesis
 *
 * @return {Array} A list with parsed parens, where 0 is initial string.
 */

//TODO: implement sequential parser of this algorithm, compare performance.
module.exports = function(str, bracket){
	//pretend non-string parsed per-se
	if (typeof str !== 'string') return [str];

	var res = [], prevStr;

	bracket = bracket || '()';

	//create parenthesis regex
	var pRE = new RegExp(['\\', bracket[0], '[^\\', bracket[0], '\\', bracket[1], ']*\\', bracket[1]].join(''));

	function replaceToken(token, idx, str){
		//save token to res
		var refId = res.push(token.slice(1,-1));

		return '\\' + refId;
	}

	//replace paren tokens till there’s none
	while (str != prevStr) {
		prevStr = str;
		str = str.replace(pRE, replaceToken);
	}

	//save resulting str
	res.unshift(str);

	return res;
};
},{}],63:[function(require,module,exports){
/**
 * @module parenthesis/stringify
 *
 * Stringify an array/object with parenthesis references
 *
 * @param {Array|Object} arr An array or object where 0 is initial string
 *                           and every other key/value is reference id/value to replace
 *
 * @return {string} A string with inserted regex references
 */

//FIXME: circular references causes recursions here
//TODO: there’s possible a recursive version of this algorithm, so test it & compare
module.exports = function (str, refs, bracket){
	var prevStr;

	//pretend bad string stringified with no parentheses
	if (!str) return '';

	if (typeof str !== 'string') {
		bracket = refs;
		refs = str;
		str = refs[0];
	}

	bracket = bracket || '()';

	function replaceRef(token, idx, str){
		return bracket[0] + refs[token.slice(1)] + bracket[1];
	}

	while (str != prevStr) {
		prevStr = str;
		str = str.replace(/\\[0-9]+/, replaceRef);
	}

	return str;
};
},{}],64:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"./lib/sliced":65,"dup":40}],65:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],66:[function(require,module,exports){
module.exports = extend

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],"emmy/on":[function(require,module,exports){
/**
 * @module emmy/on
 */


var icicle = require('icicle');
var listeners = require('./listeners');


module.exports = on;


/**
 * Bind fn to a target.
 *
 * @param {*} targte A single target to bind evt
 * @param {string} evt An event name
 * @param {Function} fn A callback
 * @param {Function}? condition An optional filtering fn for a callback
 *                              which accepts an event and returns callback
 *
 * @return {object} A target
 */
function on(target, evt, fn){
	if (!target) return target;

	//get target `on` method, if any
	//prefer native-like method name
	//user may occasionally expose `on` to the global, in case of browserify
	//but it is unlikely one would replace native `addEventListener`
	var onMethod =  target['addEventListener'] || target['addListener'] || target['attachEvent'] || target['on'];

	var cb = fn;

	//invoke method for each space-separated event from a list
	evt.split(/\s+/).forEach(function(evt){
		var evtParts = evt.split('.');
		evt = evtParts.shift();

		//use target event system, if possible
		if (onMethod) {
			//avoid self-recursions
			//if it’s frozen - ignore call
			if (icicle.freeze(target, 'on' + evt)){
				onMethod.call(target, evt, cb);
				icicle.unfreeze(target, 'on' + evt);
			}
			else {
				return target;
			}
		}

		//save the callback anyway
		listeners.add(target, evt, cb, evtParts);
	});

	return target;
}


/**
 * Wrap an fn with condition passing
 */
on.wrap = function(target, evt, fn, condition){
	var cb = function() {
		if (condition.apply(target, arguments)) {
			return fn.apply(target, arguments);
		}
	};

	cb.fn = fn;

	return cb;
};
},{"./listeners":35,"icicle":36}],"queried":[function(require,module,exports){
/**
 * @module  queried/css4
 *
 * CSS4 query selector.
 */


var doc = require('get-doc');
var q = require('./lib/');


/**
 * Detect unsupported css4 features, polyfill them
 */

//detect `:scope`
try {
	doc.querySelector(':scope');
}
catch (e) {
	q.registerFilter('scope', require('./lib/pseudos/scope'));
}


//detect `:has`
try {
	doc.querySelector(':has');
}
catch (e) {
	q.registerFilter('has', require('./lib/pseudos/has'));

	//polyfilled :has requires artificial :not to make `:not(:has(...))`.
	q.registerFilter('not', require('./lib/pseudos/not'));
}


//detect `:root`
try {
	doc.querySelector(':root');
}
catch (e) {
	q.registerFilter('root', require('./lib/pseudos/root'));
}


//detect `:matches`
try {
	doc.querySelector(':matches');
}
catch (e) {
	q.registerFilter('matches', require('./lib/pseudos/matches'));
}


module.exports = q;
},{"./lib/":45,"./lib/pseudos/has":46,"./lib/pseudos/matches":47,"./lib/pseudos/not":48,"./lib/pseudos/root":49,"./lib/pseudos/scope":50,"get-doc":54}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhdWRpby1jb250ZXh0IiwiaW5kZXgiLCIuLi8uLi8uLi9BcHBEYXRhL1JvYW1pbmcvbnBtL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsImxpYi9hcHBsaWNhdGlvbi5qcyIsImxpYi9ibG9jay5qcyIsImxpYi9nZW5lcmF0b3IuanMiLCJsaWIvc2NyaXB0LmpzIiwibm9kZV9tb2R1bGVzL2F1ZGlvLWNvbnRleHQvbm9kZV9tb2R1bGVzL2dsb2JhbC93aW5kb3cuanMiLCJub2RlX21vZHVsZXMvYXV0b3NpemUvZGlzdC9hdXRvc2l6ZS5qcyIsIm5vZGVfbW9kdWxlcy9kb21pZnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZHJhZ2d5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvZGVmaW5lLXN0YXRlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvZGVmaW5lLXN0YXRlL25vZGVfbW9kdWxlcy9zdDgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZHJhZ2d5L25vZGVfbW9kdWxlcy9kZWZpbmUtc3RhdGUvbm9kZV9tb2R1bGVzL3N0OC9ub2RlX21vZHVsZXMvaXMtcGxhaW4tb2JqZWN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvZGVmaW5lLXN0YXRlL25vZGVfbW9kdWxlcy9zdDgvbm9kZV9tb2R1bGVzL2lzLXBsYWluLW9iamVjdC9ub2RlX21vZHVsZXMvaXNvYmplY3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZHJhZ2d5L25vZGVfbW9kdWxlcy9nZXQtY2xpZW50LXh5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvZ2V0LXVpZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kcmFnZ3kvbm9kZV9tb2R1bGVzL2lzLWFycmF5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvbXVjc3MvUmVjdC5qcyIsIm5vZGVfbW9kdWxlcy9kcmFnZ3kvbm9kZV9tb2R1bGVzL211Y3NzL2Nzcy5qcyIsIm5vZGVfbW9kdWxlcy9kcmFnZ3kvbm9kZV9tb2R1bGVzL211Y3NzL2Zha2UtZWxlbWVudC5qcyIsIm5vZGVfbW9kdWxlcy9kcmFnZ3kvbm9kZV9tb2R1bGVzL211Y3NzL2hhcy1zY3JvbGwuanMiLCJub2RlX21vZHVsZXMvZHJhZ2d5L25vZGVfbW9kdWxlcy9tdWNzcy9pcy1maXhlZC5qcyIsIm5vZGVfbW9kdWxlcy9kcmFnZ3kvbm9kZV9tb2R1bGVzL211Y3NzL29mZnNldC5qcyIsIm5vZGVfbW9kdWxlcy9kcmFnZ3kvbm9kZV9tb2R1bGVzL211Y3NzL3BhcnNlLXZhbHVlLmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvbXVjc3MvcHJlZml4LmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvbXVjc3Mvc2Nyb2xsYmFyLmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvbXVjc3Mvc2VsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvbXVjc3MvdHJhbnNsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2RyYWdneS9ub2RlX21vZHVsZXMvbXVtYXRoL2JldHdlZW4uanMiLCJub2RlX21vZHVsZXMvZHJhZ2d5L25vZGVfbW9kdWxlcy9tdW1hdGgvbG9vcC5qcyIsIm5vZGVfbW9kdWxlcy9kcmFnZ3kvbm9kZV9tb2R1bGVzL211bWF0aC9wcmVjaXNpb24uanMiLCJub2RlX21vZHVsZXMvZHJhZ2d5L25vZGVfbW9kdWxlcy9tdW1hdGgvcm91bmQuanMiLCJub2RlX21vZHVsZXMvZHJhZ2d5L25vZGVfbW9kdWxlcy9tdW1hdGgvd3JhcC5qcyIsIm5vZGVfbW9kdWxlcy9kcmFnZ3kvbm9kZV9tb2R1bGVzL211dHlwZS9pcy1udW1iZXIuanMiLCJub2RlX21vZHVsZXMvZW1teS9lbWl0LmpzIiwibm9kZV9tb2R1bGVzL2VtbXkvbGlzdGVuZXJzLmpzIiwibm9kZV9tb2R1bGVzL2VtbXkvbm9kZV9tb2R1bGVzL2ljaWNsZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lbW15L25vZGVfbW9kdWxlcy9tdXR5cGUvaXMtZXZlbnQuanMiLCJub2RlX21vZHVsZXMvZW1teS9ub2RlX21vZHVsZXMvbXV0eXBlL2lzLW5vZGUuanMiLCJub2RlX21vZHVsZXMvZW1teS9ub2RlX21vZHVsZXMvbXV0eXBlL2lzLXN0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9lbW15L25vZGVfbW9kdWxlcy9zbGljZWQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZW1teS9ub2RlX21vZHVsZXMvc2xpY2VkL2xpYi9zbGljZWQuanMiLCJub2RlX21vZHVsZXMvZW1teS9vZmYuanMiLCJub2RlX21vZHVsZXMvaGFzLWRvbS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1mdW5jdGlvbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyaWVkL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyaWVkL2xpYi9wc2V1ZG9zL2hhcy5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyaWVkL2xpYi9wc2V1ZG9zL21hdGNoZXMuanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9saWIvcHNldWRvcy9ub3QuanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9saWIvcHNldWRvcy9yb290LmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJpZWQvbGliL3BzZXVkb3Mvc2NvcGUuanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9ub2RlX21vZHVsZXMvYXJyYXktdW5pcXVlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJpZWQvbm9kZV9tb2R1bGVzL2FycmF5aWZ5LWNvbXBhY3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9ub2RlX21vZHVsZXMvYXJyYXlpZnktY29tcGFjdC9ub2RlX21vZHVsZXMvYXJyYXktZmxhdHRlbi9hcnJheS1mbGF0dGVuLmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJpZWQvbm9kZV9tb2R1bGVzL2dldC1kb2MvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9ub2RlX21vZHVsZXMvbXV0eXBlL2lzLWFycmF5LWxpa2UuanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9ub2RlX21vZHVsZXMvbXV0eXBlL2lzLWFycmF5LmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJpZWQvbm9kZV9tb2R1bGVzL211dHlwZS9pcy1mbi5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyaWVkL25vZGVfbW9kdWxlcy9wYXJlbnRoZXNpcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyaWVkL25vZGVfbW9kdWxlcy9wYXJlbnRoZXNpcy9wYXJzZS5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyaWVkL25vZGVfbW9kdWxlcy9wYXJlbnRoZXNpcy9zdHJpbmdpZnkuanMiLCJub2RlX21vZHVsZXMveHRlbmQvbXV0YWJsZS5qcyIsImVtbXkvb24iLCJxdWVyaWVkIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5cUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBOzs7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgd2luZG93ID0gcmVxdWlyZSgnZ2xvYmFsL3dpbmRvdycpO1xuXG52YXIgQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcbmlmIChDb250ZXh0KSBtb2R1bGUuZXhwb3J0cyA9IG5ldyBDb250ZXh0O1xuIiwidmFyIGxhYiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvYXBwbGljYXRpb24nKTtcclxuXHJcbi8qKiBFeHBvc2UgY2xhc3NlcyAqL1xyXG5sYWIuQmxvY2sgPSByZXF1aXJlKCcuL2xpYi9ibG9jaycpO1xyXG5sYWIuR2VuZXJhdG9yID0gcmVxdWlyZSgnLi9saWIvZ2VuZXJhdG9yJyk7XHJcbmxhYi5TY3JpcHQgPSByZXF1aXJlKCcuL2xpYi9zY3JpcHQnKTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKipcclxuICogQXBwIHNpbmdsZXRvblxyXG4gKiBAbW9kdWxlICBhdWRpby1sYWIvYXBwXHJcbiAqL1xyXG5cclxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKTtcclxudmFyIGN0eCA9IHJlcXVpcmUoJ2F1ZGlvLWNvbnRleHQnKTtcclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kL211dGFibGUnKTtcclxudmFyIGhhc0RvbSA9IHJlcXVpcmUoJ2hhcy1kb20nKTtcclxuXHJcblxyXG4vKiogRXhwb3J0IHNpbmdsZXRvbiAqL1xyXG52YXIgQXBwID0gT2JqZWN0LmNyZWF0ZShFbWl0dGVyLnByb3RvdHlwZSk7XHJcblxyXG5cclxuLyoqIFByb3ZpZGUgc3RhdGljIGNsYXNzZXMgKi9cclxuZXh0ZW5kKEFwcCwge1xyXG5cdGNvbnRleHQ6IGN0eFxyXG59KTtcclxuXHJcbi8qKiBDb250YWluZXIgdG8gcGxhY2UgZWxlbWVudHMgKi9cclxuQXBwLmNvbnRhaW5lciA9IGhhc0RvbSA/IGRvY3VtZW50LmJvZHkgOiBudWxsO1xyXG5cclxuLyoqIERlZmF1bHQgaXMgc3RlcmVvICovXHJcbkFwcC5jaGFubmVscyA9IDI7XHJcblxyXG5cclxuLyoqIFRpbWUgb2Zmc2V0ICovXHJcbkFwcC50aW1lID0gMDtcclxuXHJcblxyXG4vKiogRHVyYXRpb24gb2Ygc291bmQsIGluIG1zICovXHJcbkFwcC5kdXJhdGlvbiA9IDEwICogMTAwMDtcclxuXHJcblxyXG4vKiogV2hldGhlciBpcyBwbGF5aW5nICovXHJcbkFwcC5pc0FjdGl2ZSA9IGZhbHNlO1xyXG5cclxuXHJcbi8qKiBTdGFydCBldmVyeW9uZSAqL1xyXG5BcHAuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XHJcblx0aWYgKHRoaXMuaXNBY3RpdmUpIHJldHVybiB0aGlzO1xyXG5cclxuXHR0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcclxuXHJcblx0dGhpcy5lbWl0KCdzdGFydCcpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuXHJcbi8qKiBTdGFydCBldmVyeW9uZSAqL1xyXG5BcHAuc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuXHRpZiAoIXRoaXMuaXNBY3RpdmUpIHJldHVybiB0aGlzO1xyXG5cclxuXHR0aGlzLmlzQWN0aXZlID0gZmFsc2U7XHJcblxyXG5cdHRoaXMuZW1pdCgnc3RvcCcpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwOyIsIi8qKlxyXG4gKiBHZW5lcmljIGF1ZGlvIGJsb2NrLlxyXG4gKiBQcm92aWRlcyBpbnB1dHMvb3V0cHV0cyBhbmQgY29ubmVjdGlvbiBpbnRlcmZhY2UuXHJcbiAqL1xyXG5cclxuXHJcbnZhciBFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XHJcbnZhciBhcHAgPSByZXF1aXJlKCcuL2FwcGxpY2F0aW9uJyk7XHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCd4dGVuZC9tdXRhYmxlJyk7XHJcbnZhciBkb21pZnkgPSByZXF1aXJlKCdkb21pZnknKTtcclxudmFyIGhhc0RvbSA9IHJlcXVpcmUoJ2hhcy1kb20nKTtcclxudmFyIERyYWdnYWJsZSA9IHJlcXVpcmUoJ2RyYWdneScpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQmxvY2s7XHJcblxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbiBlbXB0eSBibG9ja1xyXG4gKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEJsb2NrIChvcHRpb25zKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRpZiAoIShzZWxmIGluc3RhbmNlb2YgQmxvY2spKSB7XHJcblx0XHRyZXR1cm4gbmV3IEJsb2NrKG9wdGlvbnMpO1xyXG5cdH1cclxuXHJcblx0aWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnKSB7XHJcblx0XHRleHRlbmQodGhpcywgb3B0aW9ucyk7XHJcblx0fVxyXG5cclxuXHQvL2JpbmQgZ2xvYmFsIGV2ZW50c1xyXG5cdGFwcC5vbignc3RhcnQnLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRzZWxmLnN0YXJ0KCk7XHJcblx0fSk7XHJcblxyXG5cdGFwcC5vbignc3RvcCcsIGZ1bmN0aW9uICgpIHtcclxuXHRcdHNlbGYuc3RvcCgpO1xyXG5cdH0pO1xyXG5cclxuXHRpZiAoaGFzRG9tKSB7XHJcblx0XHRzZWxmLmVsZW1lbnQgPSBkb21pZnkoc2VsZi50ZW1wbGF0ZSk7XHJcblx0XHRzZWxmLnNob3coKTtcclxuXHJcblx0XHQvLyBzZWxmLmRyYWdnYWJsZSA9IG5ldyBEcmFnZ2FibGUoc2VsZi5lbGVtZW50LCB7XHJcblx0XHQvLyBcdHdpdGhpbjogYXBwLmNvbnRhaW5lcixcclxuXHRcdC8vIFx0aGFuZGxlOiBzZWxmLmVsZW1lbnRcclxuXHRcdC8vIH0pO1xyXG5cdH1cclxufVxyXG5cclxuXHJcbnZhciBwcm90byA9IEJsb2NrLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRW1pdHRlci5wcm90b3R5cGUpO1xyXG5cclxuXHJcbi8qKiBBbiBlbGVtZW50ICovXHJcbnByb3RvLnRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCJibG9ja1wiPjwvZGl2Pic7XHJcblxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBET00tcmVwcmVzZW50YXRpb25cclxuICovXHJcbnByb3RvLnNob3cgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRpZiAoIWhhc0RvbSkgcmV0dXJuIHNlbGY7XHJcblxyXG5cdHNlbGYuaXNWaXNpYmxlID0gdHJ1ZTtcclxuXHJcblx0YXBwLmNvbnRhaW5lci5hcHBlbmRDaGlsZChzZWxmLmVsZW1lbnQpO1xyXG5cclxuXHRzZWxmLmVtaXQoJ3Nob3cnKTtcclxuXHRyZXR1cm4gc2VsZjtcclxufTtcclxuXHJcblxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZSBmcm9tIERPTSwgZ28gdW5kZXJncm91bmRcclxuICovXHJcbnByb3RvLmhpZGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRpZiAoIWhhc0RvbSkgcmV0dXJuIHNlbGY7XHJcblxyXG5cdHNlbGYuaXNWaXNpYmxlID0gZmFsc2U7XHJcblxyXG5cdGFwcC5jb250YWluZXIucmVtb3ZlQ2hpbGQoc2VsZi5lbGVtZW50KTtcclxuXHJcblx0c2VsZi5lbWl0KCdoaWRlJyk7XHJcblx0cmV0dXJuIHNlbGY7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIERyYXcgbm9kZSBzdGVwIGluIHJhZlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtCbG9ja30gUmV0dXJuIHNlbGZcclxuICovXHJcbnByb3RvLmRyYXcgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRzZWxmLmVtaXQoJ2RyYXcnKTtcclxuXHRyZXR1cm4gc2VsZjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgbm9kZSBzaXplIGFuZCBwb3NpdGlvblxyXG4gKlxyXG4gKiBAcmV0dXJuIHtCbG9ja30gUmV0dXJuIHNlbGZcclxuICovXHJcbnByb3RvLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdHNlbGYuZW1pdCgndXBkYXRlJyk7XHJcblx0cmV0dXJuIHNlbGY7XHJcbn07XHJcblxyXG5cclxuXHJcbi8qKlxyXG4gKiBDb25uZWN0IGJsb2NrIHRvIGFub3RoZXIgYmxvY2tcclxuICpcclxuICogQHJldHVybiB7QmxvY2t9IFJldHVybiBzZWxmXHJcbiAqL1xyXG5wcm90by5jb25uZWN0ID0gZnVuY3Rpb24gKGJsb2NrKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRzZWxmLmRlc3RpbmF0aW9uID0gYmxvY2s7XHJcblxyXG5cdHNlbGYuZW1pdCgnY29ubmVjdCcpO1xyXG5cdHJldHVybiBzZWxmO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEaXNjb25uZWN0IG5vZGUgZnJvbSBvdGhlciBibG9ja1xyXG4gKlxyXG4gKiBAcmV0dXJuIHtCbG9ja30gUmV0dXJuIHNlbGZcclxuICovXHJcbnByb3RvLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRzZWxmLmRlc3RpbmF0aW9uID0gbnVsbDtcclxuXHJcblx0c2VsZi5lbWl0KCdkaXNjb25uZWN0Jyk7XHJcblx0cmV0dXJuIHNlbGY7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIERlZmF1bHQgcHJvY2Vzc2luZyBjYWxsYmFja1xyXG4gKlxyXG4gKiBAcmV0dXJuIHtCbG9ja30gUmV0dXJuIHNlbGZcclxuICovXHJcbnByb3RvLnByb2Nlc3MgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRzZWxmLmVtaXQoJ3Byb2Nlc3MnKTtcclxuXHRyZXR1cm4gc2VsZjtcclxufTtcclxuXHJcblxyXG4vKipcclxuICogU3RhcnQgZ2VuZXJhdGluZyBzb3VuZFxyXG4gKlxyXG4gKiBAcmV0dXJuIHtCbG9ja30gUmV0dXJuIHNlbGZcclxuICovXHJcbnByb3RvLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0c2VsZi5pc0FjdGl2ZSA9IHRydWU7XHJcblx0c2VsZi5lbWl0KCdzdGFydCcpO1xyXG5cclxuXHRyZXR1cm4gc2VsZjtcclxufTtcclxuXHJcblxyXG4vKipcclxuICogU3RvcCBnZW5lcmF0aW5nIHNvdW5kXHJcbiAqXHJcbiAqIEByZXR1cm4ge0Jsb2NrfSBSZXR1cm4gc2VsZlxyXG4gKi9cclxucHJvdG8uc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdHNlbGYuaXNBY3RpdmUgPSBmYWxzZTtcclxuXHRzZWxmLmVtaXQoJ3N0b3AnKTtcclxuXHJcblx0cmV0dXJuIHNlbGY7XHJcbn07IiwiLyoqXHJcbiAqIEdlbmVyYXRvciBibG9jayBwcm9jZXNzb3IuXHJcbiAqIFRha2VzIGEgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgYnVmZmVyLlxyXG4gKi9cclxuXHJcbnZhciBCbG9jayA9IHJlcXVpcmUoJy4vYmxvY2snKTtcclxudmFyIGFwcCA9IHJlcXVpcmUoJy4vYXBwbGljYXRpb24nKTtcclxudmFyIGlzRm4gPSByZXF1aXJlKCdpcy1mdW5jdGlvbicpO1xyXG52YXIgb24gPSByZXF1aXJlKCdlbW15L29uJyk7XHJcbnZhciBxID0gcmVxdWlyZSgncXVlcmllZCcpO1xyXG52YXIgYXV0b3NpemUgPSByZXF1aXJlKCdhdXRvc2l6ZScpO1xyXG52YXIgY3R4ID0gYXBwLmNvbnRleHQ7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHZW5lcmF0b3JCbG9jaztcclxuXHJcblxyXG4vKipcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBHZW5lcmF0b3JCbG9jayAob3B0aW9ucykge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0QmxvY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcblx0Ly9zZXQgZ2VuZXJhdG9yIGZ1bmN0aW9uXHJcblx0aWYgKGlzRm4ob3B0aW9ucykpIHtcclxuXHRcdHNlbGYuZ2VuZXJhdGUgPSBvcHRpb25zO1xyXG5cdH1cclxuXHJcblx0Ly9zaG93IGNvZGUgaW4gdGV4dGFyZWFcclxuXHRzZWxmLnRleHRhcmVhID0gcSgnLmJsb2NrLWdlbmVyYXRvci1jb2RlJywgc2VsZi5lbGVtZW50KTtcclxuXHRzZWxmLnRleHRhcmVhLnZhbHVlID0gc2VsZi5nZW5lcmF0ZS50b1N0cmluZygpLnNsaWNlKDE0LC0yKS50cmltKCk7XHJcblx0YXV0b3NpemUoc2VsZi50ZXh0YXJlYSk7XHJcblxyXG5cdG9uKHNlbGYudGV4dGFyZWEsICdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgc3JjID0gc2VsZi50ZXh0YXJlYS52YWx1ZTtcclxuXHJcblx0XHQvL2FsbG93IHN0cmFuZ2Ugc3ludGF4XHJcblx0XHRzcmMgPSBzcmMucmVwbGFjZSgvXFxuLywgJyAnKTtcclxuXHRcdHNlbGYuZ2VuZXJhdGUgPSBuZXcgRnVuY3Rpb24gKCd0Jywgc3JjKTtcclxuXHJcblx0XHRpZiAoc2VsZi5pc0FjdGl2ZSkge1xyXG5cdFx0XHRzZWxmLnN0b3AoKTtcclxuXHRcdFx0c2VsZi5zdGFydCgpO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHJcblx0c2VsZi5vbignc3RhcnQnLCBmdW5jdGlvbiAoKSB7XHJcblx0XHQvL2dlbmVyYXRlIGluaXRpYWwgY2h1bmtcclxuXHRcdHNlbGYuY3JlYXRlU291cmNlKGFwcC50aW1lKTtcclxuXHRcdGlmIChzZWxmLm5vZGUpIHtcclxuXHRcdFx0c2VsZi5ub2RlLnN0YXJ0KCk7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdHNlbGYub24oJ3N0b3AnLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoc2VsZi5ub2RlKSB7XHJcblx0XHRcdHNlbGYubm9kZS5zdG9wKCk7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdC8vY29ubmVjdCBzb3VyY2Ugbm9kZSBvbiBleHRlcm5hbCBjb25uZWN0IGNhbGxcclxuXHRzZWxmLm9uKCdjb25uZWN0JywgZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKHNlbGYubm9kZSkge1xyXG5cdFx0XHRzZWxmLm5vZGUuY29ubmVjdChzZWxmLmRlc3RpbmF0aW9uKTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIHNlbGY7XHJcbn1cclxuXHJcbnZhciBwcm90byA9IEdlbmVyYXRvckJsb2NrLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmxvY2sucHJvdG90eXBlKTtcclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlIGdlbmVyYXRvciBsYXlvdXRcclxuICovXHJcbnByb3RvLnRlbXBsYXRlID1cclxuJzxkaXYgY2xhc3M9XCJibG9jayBibG9jay1nZW5lcmF0b3JcIj4nICtcclxuJ2Z1bmN0aW9uICh0KSB7JyArXHJcbic8dGV4dGFyZWEgY2xhc3M9XCJibG9jay1nZW5lcmF0b3ItY29kZVwiIHJvd3M9XCIxMFwiPjwvdGV4dGFyZWE+JyArXHJcbid9JztcclxuJzwvZGl2Pic7XHJcblxyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlIC0xLi4xIG5vaXNlIGJ5IGRlZmF1bHRcclxuICovXHJcbnByb3RvLmdlbmVyYXRlID0gZnVuY3Rpb24gKHQpIHtcclxuXHRyZXR1cm4gTWF0aC5yYW5kb20oKSAqIDIgLSAxO1xyXG59O1xyXG5cclxuXHJcbi8qKiBEZWZhdWx0IGlzIHN0ZXJlbyAqL1xyXG5wcm90by5jaGFubmVscyA9IGFwcC5jaGFubmVscztcclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgbmV3IGJ1ZmZlciBmcm9tIHRoZSB0aW1lIG9mZnNldFxyXG4gKi9cclxucHJvdG8uY3JlYXRlU291cmNlID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0dmFyIGZyYW1lQ291bnQgPSAoYXBwLmR1cmF0aW9uIC0gYXBwLnRpbWUpICogY3R4LnNhbXBsZVJhdGUgLyAxMDAwO1xyXG5cclxuXHR2YXIgYnVmZmVyID0gY3R4LmNyZWF0ZUJ1ZmZlcihzZWxmLmNoYW5uZWxzLCBmcmFtZUNvdW50LCBjdHguc2FtcGxlUmF0ZSk7XHJcblxyXG5cdC8vIEZpbGwgdGhlIGJ1ZmZlciB3aXRoIHdoaXRlIG5vaXNlO1xyXG5cdC8vanVzdCByYW5kb20gdmFsdWVzIGJldHdlZW4gLTEuMCBhbmQgMS4wXHJcblx0Zm9yICh2YXIgY2hhbm5lbCA9IDA7IGNoYW5uZWwgPCBzZWxmLmNoYW5uZWxzOyBjaGFubmVsKyspIHtcclxuXHRcdHZhciBub3dCdWZmZXJpbmcgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoY2hhbm5lbCk7XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBmcmFtZUNvdW50OyBpKyspIHtcclxuXHRcdFx0bm93QnVmZmVyaW5nW2ldID0gc2VsZi5nZW5lcmF0ZShpIC8gY3R4LnNhbXBsZVJhdGUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gR2V0IGFuIEF1ZGlvQnVmZmVyU291cmNlTm9kZS5cclxuXHQvLyBUaGlzIGlzIHRoZSBBdWRpb05vZGUgdG8gdXNlIHdoZW4gd2Ugd2FudCB0byBwbGF5IGFuIEF1ZGlvQnVmZmVyXHJcblx0dmFyIHNvdXJjZSA9IGN0eC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuXHJcblx0Ly8gc2V0IHRoZSBidWZmZXIgaW4gdGhlIEF1ZGlvQnVmZmVyU291cmNlTm9kZVxyXG5cdHNvdXJjZS5idWZmZXIgPSBidWZmZXI7XHJcblxyXG5cdC8vc2F2ZSBub2RlXHJcblx0c2VsZi5ub2RlID0gc291cmNlO1xyXG5cclxuXHQvL3JlY3JlYXRlIHNvdXJjZSBvbiBwbGF5aW5nIGhhcyBmaW5pc2hlZFxyXG5cdHNlbGYubm9kZS5vbmVuZGVkID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0Ly8gY29uc29sZS5sb2coJ2dlbmVyYXRvciBlbmRlZCcpO1xyXG5cdFx0Ly8gc2VsZi5jcmVhdGVTb3VyY2UoKTtcclxuXHRcdHNlbGYubm9kZS5kaXNjb25uZWN0KCk7XHJcblx0fTtcclxuXHJcblx0Ly9jb25uZWN0IHRoZSBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgdG8gdGhlXHJcblx0Ly9kZXN0aW5hdGlvbiBzbyB3ZSBjYW4gaGVhciB0aGUgc291bmRcclxuXHRpZiAoc2VsZi5kZXN0aW5hdGlvbikge1xyXG5cdFx0c2VsZi5ub2RlLmNvbm5lY3Qoc2VsZi5kZXN0aW5hdGlvbik7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gc2VsZjtcclxufTsiLCIvKipcclxuICogU2NyaXB0IGJsb2NrIHByb2Nlc3Nvci5cclxuICogVGFrZXMgYSBmdW5jdGlvbiB0byBjb252ZXJ0IGJ1ZmZlci5cclxuICovXHJcblxyXG52YXIgQmxvY2sgPSByZXF1aXJlKCcuL2Jsb2NrJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gU2NyaXB0QmxvY2sgKCkge1xyXG5cclxufVxyXG5cclxuU2NyaXB0QmxvY2sucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCbG9jayk7IiwiaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZ2xvYmFsO1xufSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHt9O1xufVxuIiwiLyohXG5cdEF1dG9zaXplIDMuMC41XG5cdGxpY2Vuc2U6IE1JVFxuXHRodHRwOi8vd3d3LmphY2tsbW9vcmUuY29tL2F1dG9zaXplXG4qL1xuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShbJ2V4cG9ydHMnLCAnbW9kdWxlJ10sIGZhY3RvcnkpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuXHRcdGZhY3RvcnkoZXhwb3J0cywgbW9kdWxlKTtcblx0fSBlbHNlIHtcblx0XHR2YXIgbW9kID0ge1xuXHRcdFx0ZXhwb3J0czoge31cblx0XHR9O1xuXHRcdGZhY3RvcnkobW9kLmV4cG9ydHMsIG1vZCk7XG5cdFx0Z2xvYmFsLmF1dG9zaXplID0gbW9kLmV4cG9ydHM7XG5cdH1cbn0pKHRoaXMsIGZ1bmN0aW9uIChleHBvcnRzLCBtb2R1bGUpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGZ1bmN0aW9uIGFzc2lnbih0YSkge1xuXHRcdHZhciBfcmVmID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1sxXTtcblxuXHRcdHZhciBfcmVmJHNldE92ZXJmbG93WCA9IF9yZWYuc2V0T3ZlcmZsb3dYO1xuXHRcdHZhciBzZXRPdmVyZmxvd1ggPSBfcmVmJHNldE92ZXJmbG93WCA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IF9yZWYkc2V0T3ZlcmZsb3dYO1xuXHRcdHZhciBfcmVmJHNldE92ZXJmbG93WSA9IF9yZWYuc2V0T3ZlcmZsb3dZO1xuXHRcdHZhciBzZXRPdmVyZmxvd1kgPSBfcmVmJHNldE92ZXJmbG93WSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IF9yZWYkc2V0T3ZlcmZsb3dZO1xuXG5cdFx0aWYgKCF0YSB8fCAhdGEubm9kZU5hbWUgfHwgdGEubm9kZU5hbWUgIT09ICdURVhUQVJFQScgfHwgdGEuaGFzQXR0cmlidXRlKCdkYXRhLWF1dG9zaXplLW9uJykpIHJldHVybjtcblxuXHRcdHZhciBoZWlnaHRPZmZzZXQgPSBudWxsO1xuXHRcdHZhciBvdmVyZmxvd1kgPSAnaGlkZGVuJztcblxuXHRcdGZ1bmN0aW9uIGluaXQoKSB7XG5cdFx0XHR2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0YSwgbnVsbCk7XG5cblx0XHRcdGlmIChzdHlsZS5yZXNpemUgPT09ICd2ZXJ0aWNhbCcpIHtcblx0XHRcdFx0dGEuc3R5bGUucmVzaXplID0gJ25vbmUnO1xuXHRcdFx0fSBlbHNlIGlmIChzdHlsZS5yZXNpemUgPT09ICdib3RoJykge1xuXHRcdFx0XHR0YS5zdHlsZS5yZXNpemUgPSAnaG9yaXpvbnRhbCc7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzdHlsZS5ib3hTaXppbmcgPT09ICdjb250ZW50LWJveCcpIHtcblx0XHRcdFx0aGVpZ2h0T2Zmc2V0ID0gLShwYXJzZUZsb2F0KHN0eWxlLnBhZGRpbmdUb3ApICsgcGFyc2VGbG9hdChzdHlsZS5wYWRkaW5nQm90dG9tKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRoZWlnaHRPZmZzZXQgPSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclRvcFdpZHRoKSArIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyQm90dG9tV2lkdGgpO1xuXHRcdFx0fVxuXG5cdFx0XHR1cGRhdGUoKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBjaGFuZ2VPdmVyZmxvdyh2YWx1ZSkge1xuXHRcdFx0e1xuXHRcdFx0XHQvLyBDaHJvbWUvU2FmYXJpLXNwZWNpZmljIGZpeDpcblx0XHRcdFx0Ly8gV2hlbiB0aGUgdGV4dGFyZWEgeS1vdmVyZmxvdyBpcyBoaWRkZW4sIENocm9tZS9TYWZhcmkgZG8gbm90IHJlZmxvdyB0aGUgdGV4dCB0byBhY2NvdW50IGZvciB0aGUgc3BhY2Vcblx0XHRcdFx0Ly8gbWFkZSBhdmFpbGFibGUgYnkgcmVtb3ZpbmcgdGhlIHNjcm9sbGJhci4gVGhlIGZvbGxvd2luZyBmb3JjZXMgdGhlIG5lY2Vzc2FyeSB0ZXh0IHJlZmxvdy5cblx0XHRcdFx0dmFyIHdpZHRoID0gdGEuc3R5bGUud2lkdGg7XG5cdFx0XHRcdHRhLnN0eWxlLndpZHRoID0gJzBweCc7XG5cdFx0XHRcdC8vIEZvcmNlIHJlZmxvdzpcblx0XHRcdFx0LyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuXHRcdFx0XHR0YS5vZmZzZXRXaWR0aDtcblx0XHRcdFx0LyoganNoaW50IGlnbm9yZTplbmQgKi9cblx0XHRcdFx0dGEuc3R5bGUud2lkdGggPSB3aWR0aDtcblx0XHRcdH1cblxuXHRcdFx0b3ZlcmZsb3dZID0gdmFsdWU7XG5cblx0XHRcdGlmIChzZXRPdmVyZmxvd1kpIHtcblx0XHRcdFx0dGEuc3R5bGUub3ZlcmZsb3dZID0gdmFsdWU7XG5cdFx0XHR9XG5cblx0XHRcdHVwZGF0ZSgpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHVwZGF0ZSgpIHtcblx0XHRcdHZhciBzdGFydEhlaWdodCA9IHRhLnN0eWxlLmhlaWdodDtcblx0XHRcdHZhciBodG1sVG9wID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcblx0XHRcdHZhciBib2R5VG9wID0gZG9jdW1lbnQuYm9keS5zY3JvbGxUb3A7XG5cdFx0XHR2YXIgb3JpZ2luYWxIZWlnaHQgPSB0YS5zdHlsZS5oZWlnaHQ7XG5cblx0XHRcdHRhLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcblxuXHRcdFx0dmFyIGVuZEhlaWdodCA9IHRhLnNjcm9sbEhlaWdodCArIGhlaWdodE9mZnNldDtcblxuXHRcdFx0aWYgKHRhLnNjcm9sbEhlaWdodCA9PT0gMCkge1xuXHRcdFx0XHQvLyBJZiB0aGUgc2Nyb2xsSGVpZ2h0IGlzIDAsIHRoZW4gdGhlIGVsZW1lbnQgcHJvYmFibHkgaGFzIGRpc3BsYXk6bm9uZSBvciBpcyBkZXRhY2hlZCBmcm9tIHRoZSBET00uXG5cdFx0XHRcdHRhLnN0eWxlLmhlaWdodCA9IG9yaWdpbmFsSGVpZ2h0O1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHRhLnN0eWxlLmhlaWdodCA9IGVuZEhlaWdodCArICdweCc7XG5cblx0XHRcdC8vIHByZXZlbnRzIHNjcm9sbC1wb3NpdGlvbiBqdW1waW5nXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wID0gaHRtbFRvcDtcblx0XHRcdGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wID0gYm9keVRvcDtcblxuXHRcdFx0dmFyIHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGEsIG51bGwpO1xuXG5cdFx0XHRpZiAoc3R5bGUuaGVpZ2h0ICE9PSB0YS5zdHlsZS5oZWlnaHQpIHtcblx0XHRcdFx0aWYgKG92ZXJmbG93WSAhPT0gJ3Zpc2libGUnKSB7XG5cdFx0XHRcdFx0Y2hhbmdlT3ZlcmZsb3coJ3Zpc2libGUnKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmIChvdmVyZmxvd1kgIT09ICdoaWRkZW4nKSB7XG5cdFx0XHRcdFx0Y2hhbmdlT3ZlcmZsb3coJ2hpZGRlbicpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc3RhcnRIZWlnaHQgIT09IHRhLnN0eWxlLmhlaWdodCkge1xuXHRcdFx0XHR2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG5cdFx0XHRcdGV2dC5pbml0RXZlbnQoJ2F1dG9zaXplOnJlc2l6ZWQnLCB0cnVlLCBmYWxzZSk7XG5cdFx0XHRcdHRhLmRpc3BhdGNoRXZlbnQoZXZ0KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR2YXIgZGVzdHJveSA9IChmdW5jdGlvbiAoc3R5bGUpIHtcblx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB1cGRhdGUpO1xuXHRcdFx0dGEucmVtb3ZlRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB1cGRhdGUpO1xuXHRcdFx0dGEucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB1cGRhdGUpO1xuXHRcdFx0dGEucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWF1dG9zaXplLW9uJyk7XG5cdFx0XHR0YS5yZW1vdmVFdmVudExpc3RlbmVyKCdhdXRvc2l6ZTpkZXN0cm95JywgZGVzdHJveSk7XG5cblx0XHRcdE9iamVjdC5rZXlzKHN0eWxlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdFx0dGEuc3R5bGVba2V5XSA9IHN0eWxlW2tleV07XG5cdFx0XHR9KTtcblx0XHR9KS5iaW5kKHRhLCB7XG5cdFx0XHRoZWlnaHQ6IHRhLnN0eWxlLmhlaWdodCxcblx0XHRcdHJlc2l6ZTogdGEuc3R5bGUucmVzaXplLFxuXHRcdFx0b3ZlcmZsb3dZOiB0YS5zdHlsZS5vdmVyZmxvd1ksXG5cdFx0XHRvdmVyZmxvd1g6IHRhLnN0eWxlLm92ZXJmbG93WCxcblx0XHRcdHdvcmRXcmFwOiB0YS5zdHlsZS53b3JkV3JhcCB9KTtcblxuXHRcdHRhLmFkZEV2ZW50TGlzdGVuZXIoJ2F1dG9zaXplOmRlc3Ryb3knLCBkZXN0cm95KTtcblxuXHRcdC8vIElFOSBkb2VzIG5vdCBmaXJlIG9ucHJvcGVydHljaGFuZ2Ugb3Igb25pbnB1dCBmb3IgZGVsZXRpb25zLFxuXHRcdC8vIHNvIGJpbmRpbmcgdG8gb25rZXl1cCB0byBjYXRjaCBtb3N0IG9mIHRob3NlIGV2ZW50cy5cblx0XHQvLyBUaGVyZSBpcyBubyB3YXkgdGhhdCBJIGtub3cgb2YgdG8gZGV0ZWN0IHNvbWV0aGluZyBsaWtlICdjdXQnIGluIElFOS5cblx0XHRpZiAoJ29ucHJvcGVydHljaGFuZ2UnIGluIHRhICYmICdvbmlucHV0JyBpbiB0YSkge1xuXHRcdFx0dGEuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB1cGRhdGUpO1xuXHRcdH1cblxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB1cGRhdGUpO1xuXHRcdHRhLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgdXBkYXRlKTtcblx0XHR0YS5hZGRFdmVudExpc3RlbmVyKCdhdXRvc2l6ZTp1cGRhdGUnLCB1cGRhdGUpO1xuXHRcdHRhLnNldEF0dHJpYnV0ZSgnZGF0YS1hdXRvc2l6ZS1vbicsIHRydWUpO1xuXG5cdFx0aWYgKHNldE92ZXJmbG93WSkge1xuXHRcdFx0dGEuc3R5bGUub3ZlcmZsb3dZID0gJ2hpZGRlbic7XG5cdFx0fVxuXHRcdGlmIChzZXRPdmVyZmxvd1gpIHtcblx0XHRcdHRhLnN0eWxlLm92ZXJmbG93WCA9ICdoaWRkZW4nO1xuXHRcdFx0dGEuc3R5bGUud29yZFdyYXAgPSAnYnJlYWstd29yZCc7XG5cdFx0fVxuXG5cdFx0aW5pdCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVzdHJveSh0YSkge1xuXHRcdGlmICghKHRhICYmIHRhLm5vZGVOYW1lICYmIHRhLm5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSkgcmV0dXJuO1xuXHRcdHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcblx0XHRldnQuaW5pdEV2ZW50KCdhdXRvc2l6ZTpkZXN0cm95JywgdHJ1ZSwgZmFsc2UpO1xuXHRcdHRhLmRpc3BhdGNoRXZlbnQoZXZ0KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZSh0YSkge1xuXHRcdGlmICghKHRhICYmIHRhLm5vZGVOYW1lICYmIHRhLm5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSkgcmV0dXJuO1xuXHRcdHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcblx0XHRldnQuaW5pdEV2ZW50KCdhdXRvc2l6ZTp1cGRhdGUnLCB0cnVlLCBmYWxzZSk7XG5cdFx0dGEuZGlzcGF0Y2hFdmVudChldnQpO1xuXHR9XG5cblx0dmFyIGF1dG9zaXplID0gbnVsbDtcblxuXHQvLyBEbyBub3RoaW5nIGluIE5vZGUuanMgZW52aXJvbm1lbnQgYW5kIElFOCAob3IgbG93ZXIpXG5cdGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2Ygd2luZG93LmdldENvbXB1dGVkU3R5bGUgIT09ICdmdW5jdGlvbicpIHtcblx0XHRhdXRvc2l6ZSA9IGZ1bmN0aW9uIChlbCkge1xuXHRcdFx0cmV0dXJuIGVsO1xuXHRcdH07XG5cdFx0YXV0b3NpemUuZGVzdHJveSA9IGZ1bmN0aW9uIChlbCkge1xuXHRcdFx0cmV0dXJuIGVsO1xuXHRcdH07XG5cdFx0YXV0b3NpemUudXBkYXRlID0gZnVuY3Rpb24gKGVsKSB7XG5cdFx0XHRyZXR1cm4gZWw7XG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRhdXRvc2l6ZSA9IGZ1bmN0aW9uIChlbCwgb3B0aW9ucykge1xuXHRcdFx0aWYgKGVsKSB7XG5cdFx0XHRcdEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWwubGVuZ3RoID8gZWwgOiBbZWxdLCBmdW5jdGlvbiAoeCkge1xuXHRcdFx0XHRcdHJldHVybiBhc3NpZ24oeCwgb3B0aW9ucyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGVsO1xuXHRcdH07XG5cdFx0YXV0b3NpemUuZGVzdHJveSA9IGZ1bmN0aW9uIChlbCkge1xuXHRcdFx0aWYgKGVsKSB7XG5cdFx0XHRcdEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWwubGVuZ3RoID8gZWwgOiBbZWxdLCBkZXN0cm95KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBlbDtcblx0XHR9O1xuXHRcdGF1dG9zaXplLnVwZGF0ZSA9IGZ1bmN0aW9uIChlbCkge1xuXHRcdFx0aWYgKGVsKSB7XG5cdFx0XHRcdEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWwubGVuZ3RoID8gZWwgOiBbZWxdLCB1cGRhdGUpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGVsO1xuXHRcdH07XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cyA9IGF1dG9zaXplO1xufSk7IiwiXG4vKipcbiAqIEV4cG9zZSBgcGFyc2VgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2U7XG5cbi8qKlxuICogVGVzdHMgZm9yIGJyb3dzZXIgc3VwcG9ydC5cbiAqL1xuXG52YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4vLyBTZXR1cFxuZGl2LmlubmVySFRNTCA9ICcgIDxsaW5rLz48dGFibGU+PC90YWJsZT48YSBocmVmPVwiL2FcIj5hPC9hPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIi8+Jztcbi8vIE1ha2Ugc3VyZSB0aGF0IGxpbmsgZWxlbWVudHMgZ2V0IHNlcmlhbGl6ZWQgY29ycmVjdGx5IGJ5IGlubmVySFRNTFxuLy8gVGhpcyByZXF1aXJlcyBhIHdyYXBwZXIgZWxlbWVudCBpbiBJRVxudmFyIGlubmVySFRNTEJ1ZyA9ICFkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2xpbmsnKS5sZW5ndGg7XG5kaXYgPSB1bmRlZmluZWQ7XG5cbi8qKlxuICogV3JhcCBtYXAgZnJvbSBqcXVlcnkuXG4gKi9cblxudmFyIG1hcCA9IHtcbiAgbGVnZW5kOiBbMSwgJzxmaWVsZHNldD4nLCAnPC9maWVsZHNldD4nXSxcbiAgdHI6IFsyLCAnPHRhYmxlPjx0Ym9keT4nLCAnPC90Ym9keT48L3RhYmxlPiddLFxuICBjb2w6IFsyLCAnPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD4nLCAnPC9jb2xncm91cD48L3RhYmxlPiddLFxuICAvLyBmb3Igc2NyaXB0L2xpbmsvc3R5bGUgdGFncyB0byB3b3JrIGluIElFNi04LCB5b3UgaGF2ZSB0byB3cmFwXG4gIC8vIGluIGEgZGl2IHdpdGggYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIgaW4gZnJvbnQsIGhhIVxuICBfZGVmYXVsdDogaW5uZXJIVE1MQnVnID8gWzEsICdYPGRpdj4nLCAnPC9kaXY+J10gOiBbMCwgJycsICcnXVxufTtcblxubWFwLnRkID1cbm1hcC50aCA9IFszLCAnPHRhYmxlPjx0Ym9keT48dHI+JywgJzwvdHI+PC90Ym9keT48L3RhYmxlPiddO1xuXG5tYXAub3B0aW9uID1cbm1hcC5vcHRncm91cCA9IFsxLCAnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JywgJzwvc2VsZWN0PiddO1xuXG5tYXAudGhlYWQgPVxubWFwLnRib2R5ID1cbm1hcC5jb2xncm91cCA9XG5tYXAuY2FwdGlvbiA9XG5tYXAudGZvb3QgPSBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXTtcblxubWFwLnBvbHlsaW5lID1cbm1hcC5lbGxpcHNlID1cbm1hcC5wb2x5Z29uID1cbm1hcC5jaXJjbGUgPVxubWFwLnRleHQgPVxubWFwLmxpbmUgPVxubWFwLnBhdGggPVxubWFwLnJlY3QgPVxubWFwLmcgPSBbMSwgJzxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZlcnNpb249XCIxLjFcIj4nLCc8L3N2Zz4nXTtcblxuLyoqXG4gKiBQYXJzZSBgaHRtbGAgYW5kIHJldHVybiBhIERPTSBOb2RlIGluc3RhbmNlLCB3aGljaCBjb3VsZCBiZSBhIFRleHROb2RlLFxuICogSFRNTCBET00gTm9kZSBvZiBzb21lIGtpbmQgKDxkaXY+IGZvciBleGFtcGxlKSwgb3IgYSBEb2N1bWVudEZyYWdtZW50XG4gKiBpbnN0YW5jZSwgZGVwZW5kaW5nIG9uIHRoZSBjb250ZW50cyBvZiB0aGUgYGh0bWxgIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbCAtIEhUTUwgc3RyaW5nIHRvIFwiZG9taWZ5XCJcbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyAtIFRoZSBgZG9jdW1lbnRgIGluc3RhbmNlIHRvIGNyZWF0ZSB0aGUgTm9kZSBmb3JcbiAqIEByZXR1cm4ge0RPTU5vZGV9IHRoZSBUZXh0Tm9kZSwgRE9NIE5vZGUsIG9yIERvY3VtZW50RnJhZ21lbnQgaW5zdGFuY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKGh0bWwsIGRvYykge1xuICBpZiAoJ3N0cmluZycgIT0gdHlwZW9mIGh0bWwpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0cmluZyBleHBlY3RlZCcpO1xuXG4gIC8vIGRlZmF1bHQgdG8gdGhlIGdsb2JhbCBgZG9jdW1lbnRgIG9iamVjdFxuICBpZiAoIWRvYykgZG9jID0gZG9jdW1lbnQ7XG5cbiAgLy8gdGFnIG5hbWVcbiAgdmFyIG0gPSAvPChbXFx3Ol0rKS8uZXhlYyhodG1sKTtcbiAgaWYgKCFtKSByZXR1cm4gZG9jLmNyZWF0ZVRleHROb2RlKGh0bWwpO1xuXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTsgLy8gUmVtb3ZlIGxlYWRpbmcvdHJhaWxpbmcgd2hpdGVzcGFjZVxuXG4gIHZhciB0YWcgPSBtWzFdO1xuXG4gIC8vIGJvZHkgc3VwcG9ydFxuICBpZiAodGFnID09ICdib2R5Jykge1xuICAgIHZhciBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdodG1sJyk7XG4gICAgZWwuaW5uZXJIVE1MID0gaHRtbDtcbiAgICByZXR1cm4gZWwucmVtb3ZlQ2hpbGQoZWwubGFzdENoaWxkKTtcbiAgfVxuXG4gIC8vIHdyYXAgbWFwXG4gIHZhciB3cmFwID0gbWFwW3RhZ10gfHwgbWFwLl9kZWZhdWx0O1xuICB2YXIgZGVwdGggPSB3cmFwWzBdO1xuICB2YXIgcHJlZml4ID0gd3JhcFsxXTtcbiAgdmFyIHN1ZmZpeCA9IHdyYXBbMl07XG4gIHZhciBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZWwuaW5uZXJIVE1MID0gcHJlZml4ICsgaHRtbCArIHN1ZmZpeDtcbiAgd2hpbGUgKGRlcHRoLS0pIGVsID0gZWwubGFzdENoaWxkO1xuXG4gIC8vIG9uZSBlbGVtZW50XG4gIGlmIChlbC5maXJzdENoaWxkID09IGVsLmxhc3RDaGlsZCkge1xuICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbiAgfVxuXG4gIC8vIHNldmVyYWwgZWxlbWVudHNcbiAgdmFyIGZyYWdtZW50ID0gZG9jLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgd2hpbGUgKGVsLmZpcnN0Q2hpbGQpIHtcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKSk7XG4gIH1cblxuICByZXR1cm4gZnJhZ21lbnQ7XG59XG4iLCIvKipcbiAqIFNpbXBsZSBkcmFnZ2FibGUgY29tcG9uZW50XG4gKlxuICogQG1vZHVsZSBkcmFnZ3lcbiAqL1xuXG5cbi8vd29yayB3aXRoIGNzc1xudmFyIGNzcyA9IHJlcXVpcmUoJ211Y3NzL2NzcycpO1xudmFyIHBhcnNlQ1NTVmFsdWUgPSByZXF1aXJlKCdtdWNzcy9wYXJzZS12YWx1ZScpO1xudmFyIHNlbGVjdGlvbiA9IHJlcXVpcmUoJ211Y3NzL3NlbGVjdGlvbicpO1xudmFyIG9mZnNldHMgPSByZXF1aXJlKCdtdWNzcy9vZmZzZXQnKTtcbnZhciBnZXRUcmFuc2xhdGUgPSByZXF1aXJlKCdtdWNzcy90cmFuc2xhdGUnKTtcblxuLy9ldmVudHNcbnZhciBvbiA9IHJlcXVpcmUoJ2VtbXkvb24nKTtcbnZhciBvZmYgPSByZXF1aXJlKCdlbW15L29mZicpO1xudmFyIGVtaXQgPSByZXF1aXJlKCdlbW15L2VtaXQnKTtcbnZhciBFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgZ2V0Q2xpZW50WCA9IHJlcXVpcmUoJ2dldC1jbGllbnQteHknKS54O1xudmFyIGdldENsaWVudFkgPSByZXF1aXJlKCdnZXQtY2xpZW50LXh5JykueTtcblxuLy91dGlsc1xudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpcy1hcnJheScpO1xudmFyIGlzTnVtYmVyID0gcmVxdWlyZSgnbXV0eXBlL2lzLW51bWJlcicpO1xudmFyIGlzRm4gPSByZXF1aXJlKCdpcy1mdW5jdGlvbicpO1xudmFyIGRlZmluZVN0YXRlID0gcmVxdWlyZSgnZGVmaW5lLXN0YXRlJyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgneHRlbmQvbXV0YWJsZScpO1xudmFyIHJvdW5kID0gcmVxdWlyZSgnbXVtYXRoL3JvdW5kJyk7XG52YXIgYmV0d2VlbiA9IHJlcXVpcmUoJ211bWF0aC9iZXR3ZWVuJyk7XG52YXIgbG9vcCA9IHJlcXVpcmUoJ211bWF0aC9sb29wJyk7XG52YXIgZ2V0VWlkID0gcmVxdWlyZSgnZ2V0LXVpZCcpO1xuXG5cbnZhciB3aW4gPSB3aW5kb3csIGRvYyA9IGRvY3VtZW50LCByb290ID0gZG9jLmRvY3VtZW50RWxlbWVudDtcblxuXG4vKipcbiAqIERyYWdnYWJsZSBjb250cm9sbGVycyBhc3NvY2lhdGVkIHdpdGggZWxlbWVudHMuXG4gKlxuICogU3RvcmluZyB0aGVtIG9uIGVsZW1lbnRzIGlzXG4gKiAtIGxlYWstcHJvbmUsXG4gKiAtIHBvbGx1dGVzIGVsZW1lbnTigJlzIG5hbWVzcGFjZSxcbiAqIC0gcmVxdWlyZXMgc29tZSBhcnRpZmljaWFsIGtleSB0byBzdG9yZSxcbiAqIC0gdW5hYmxlIHRvIHJldHJpZXZlIGNvbnRyb2xsZXIgZWFzaWx5LlxuICpcbiAqIFRoYXQgaXMgd2h5IHdlYWttYXAuXG4gKi9cbnZhciBkcmFnZ2FibGVDYWNoZSA9IERyYWdnYWJsZS5jYWNoZSA9IG5ldyBXZWFrTWFwO1xuXG5cblxuLyoqXG4gKiBNYWtlIGFuIGVsZW1lbnQgZHJhZ2dhYmxlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCBBbiBlbGVtZW50IHdoZXRoZXIgaW4vb3V0IG9mIERPTVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgQW4gZHJhZ2dhYmxlIG9wdGlvbnNcbiAqXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gVGFyZ2V0IGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gRHJhZ2dhYmxlKHRhcmdldCwgb3B0aW9ucykge1xuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgRHJhZ2dhYmxlKSkgcmV0dXJuIG5ldyBEcmFnZ2FibGUodGFyZ2V0LCBvcHRpb25zKTtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly9nZXQgdW5pcXVlIGlkIGZvciBpbnN0YW5jZVxuXHQvL25lZWRlZCB0byB0cmFjayBldmVudCBiaW5kZXJzXG5cdHNlbGYuX2lkID0gZ2V0VWlkKCk7XG5cdHNlbGYuX25zID0gJy5kcmFnZ3lfJyArIHNlbGYuX2lkO1xuXG5cdC8vc2F2ZSBlbGVtZW50IHBhc3NlZFxuXHRzZWxmLmVsZW1lbnQgPSB0YXJnZXQ7XG5cdGRyYWdnYWJsZUNhY2hlLnNldCh0YXJnZXQsIHNlbGYpO1xuXG5cdC8vZGVmaW5lIG1vZGUgb2YgZHJhZ1xuXHRkZWZpbmVTdGF0ZShzZWxmLCAnY3NzMycsIHNlbGYuY3NzMyk7XG5cdHNlbGYuY3NzMyA9IHRydWU7XG5cblx0Ly9kZWZpbmUgc3RhdGUgYmVoYXZpb3VyXG5cdGRlZmluZVN0YXRlKHNlbGYsICdzdGF0ZScsIHNlbGYuc3RhdGUpO1xuXHRzZWxmLnN0YXRlID0gJ2lkbGUnO1xuXG5cdC8vZGVmaW5lIGF4aXMgYmVoYXZpb3VyXG5cdGRlZmluZVN0YXRlKHNlbGYsICdheGlzJywgc2VsZi5heGlzKTtcblx0c2VsZi5heGlzID0gbnVsbDtcblxuXHQvL2RlZmluZSBhbmltIG1vZGVcblx0ZGVmaW5lU3RhdGUoc2VsZiwgJ2lzQW5pbWF0ZWQnLCBzZWxmLmlzQW5pbWF0ZWQpO1xuXG5cdC8vdGFrZSBvdmVyIG9wdGlvbnNcblx0ZXh0ZW5kKHNlbGYsIG9wdGlvbnMpO1xuXG5cdC8vdHJ5IHRvIGNhbGMgb3V0IGJhc2ljIGxpbWl0c1xuXHRzZWxmLnVwZGF0ZSgpO1xufVxuXG5cbi8qKiBJbmhlcml0IGRyYWdnYWJsZSBmcm9tIEVtaXR0ZXIgKi9cbnZhciBwcm90byA9IERyYWdnYWJsZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVtaXR0ZXIucHJvdG90eXBlKTtcblxuXG4vKipcbiAqIERyYWdnYWJsZSBiZWhhdmlvdXJcbiAqIEBlbnVtIHtzdHJpbmd9XG4gKiBAZGVmYXVsdCBpcyAnaWRsZSdcbiAqL1xucHJvdG8uc3RhdGUgPSB7XG5cdC8vaWRsZVxuXHRfOiB7XG5cdFx0YmVmb3JlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRcdC8vZW1pdCBkcmFnIGV2dHMgb24gZWxlbWVudFxuXHRcdFx0ZW1pdChzZWxmLmVsZW1lbnQsICdpZGxlJywgbnVsbCwgdHJ1ZSk7XG5cdFx0XHRzZWxmLmVtaXQoJ2lkbGUnKTtcblxuXHRcdFx0Ly9iaW5kIHN0YXJ0IGRyYWdcblx0XHRcdG9uKHNlbGYuZWxlbWVudCwgJ21vdXNlZG93bicgKyBzZWxmLl9ucyArICcgdG91Y2hzdGFydCcgKyBzZWxmLl9ucywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRcdC8vbXVsdGl0b3VjaCBoYXMgbXVsdGlwbGUgc3RhcnRzXG5cdFx0XHRcdHNlbGYuc2V0VG91Y2goZSk7XG5cblx0XHRcdFx0Ly91cGRhdGUgbW92ZW1lbnQgcGFyYW1zXG5cdFx0XHRcdHNlbGYudXBkYXRlKGUpO1xuXG5cdFx0XHRcdC8vZ28gdG8gdGhyZXNob2xkIHN0YXRlXG5cdFx0XHRcdHNlbGYuc3RhdGUgPSAndGhyZXNob2xkJztcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0YWZ0ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0b2ZmKHNlbGYuZWxlbWVudCwgJ3RvdWNoc3RhcnQnICsgc2VsZi5fbnMgKyAnIG1vdXNlZG93bicgKyBzZWxmLl9ucyk7XG5cblx0XHRcdC8vc2V0IHVwIHRyYWNraW5nXG5cdFx0XHRpZiAoc2VsZi5yZWxlYXNlKSB7XG5cdFx0XHRcdHNlbGYuX3RyYWNraW5nSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdHZhciBub3cgPSBEYXRlLm5vdygpO1xuXHRcdFx0XHRcdHZhciBlbGFwc2VkID0gbm93IC0gc2VsZi50aW1lc3RhbXA7XG5cblx0XHRcdFx0XHQvL2dldCBkZWx0YSBtb3ZlbWVudCBzaW5jZSB0aGUgbGFzdCB0cmFja1xuXHRcdFx0XHRcdHZhciBkWCA9IHNlbGYucHJldlggLSBzZWxmLmZyYW1lWzBdO1xuXHRcdFx0XHRcdHZhciBkWSA9IHNlbGYucHJldlkgLSBzZWxmLmZyYW1lWzFdO1xuXHRcdFx0XHRcdHNlbGYuZnJhbWVbMF0gPSBzZWxmLnByZXZYO1xuXHRcdFx0XHRcdHNlbGYuZnJhbWVbMV0gPSBzZWxmLnByZXZZO1xuXG5cdFx0XHRcdFx0dmFyIGRlbHRhID0gTWF0aC5zcXJ0KGRYICogZFggKyBkWSAqIGRZKTtcblxuXHRcdFx0XHRcdC8vZ2V0IHNwZWVkIGFzIGF2ZXJhZ2Ugb2YgcHJldiBhbmQgY3VycmVudCAocHJldmVudCBkaXYgYnkgemVybylcblx0XHRcdFx0XHR2YXIgdiA9IE1hdGgubWluKHNlbGYudmVsb2NpdHkgKiBkZWx0YSAvICgxICsgZWxhcHNlZCksIHNlbGYubWF4U3BlZWQpO1xuXHRcdFx0XHRcdHNlbGYuc3BlZWQgPSAwLjggKiB2ICsgMC4yICogc2VsZi5zcGVlZDtcblxuXHRcdFx0XHRcdC8vZ2V0IG5ldyBhbmdsZSBhcyBhIGxhc3QgZGlmZlxuXHRcdFx0XHRcdC8vTk9URTogdmVjdG9yIGF2ZXJhZ2UgaXNu4oCZdCB0aGUgc2FtZSBhcyBzcGVlZCBzY2FsYXIgYXZlcmFnZVxuXHRcdFx0XHRcdHNlbGYuYW5nbGUgPSBNYXRoLmF0YW4yKGRZLCBkWCk7XG5cblx0XHRcdFx0XHRzZWxmLmVtaXQoJ3RyYWNrJyk7XG5cblx0XHRcdFx0XHRyZXR1cm4gc2VsZjtcblx0XHRcdFx0fSwgc2VsZi5mcmFtZXJhdGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHR0aHJlc2hvbGQ6IHtcblx0XHRiZWZvcmU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0Ly9pZ25vcmUgdGhyZXNob2xkIHN0YXRlLCBpZiB0aHJlc2hvbGQgaXMgbm9uZVxuXHRcdFx0aWYgKGlzWmVyb0FycmF5KHNlbGYudGhyZXNob2xkKSkge1xuXHRcdFx0XHRzZWxmLnN0YXRlID0gJ2RyYWcnO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vZW1pdCBkcmFnIGV2dHMgb24gZWxlbWVudFxuXHRcdFx0c2VsZi5lbWl0KCd0aHJlc2hvbGQnKTtcblxuXHRcdFx0Ly9saXN0ZW4gdG8gZG9jIG1vdmVtZW50XG5cdFx0XHRvbihkb2MsICd0b3VjaG1vdmUnICsgc2VsZi5fbnMgKyAnIG1vdXNlbW92ZScgKyBzZWxmLl9ucywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRcdC8vY29tcGFyZSBtb3ZlbWVudCB0byB0aGUgdGhyZXNob2xkXG5cdFx0XHRcdHZhciBjbGllbnRYID0gZ2V0Q2xpZW50WChlLCBzZWxmLnRvdWNoSWR4KTtcblx0XHRcdFx0dmFyIGNsaWVudFkgPSBnZXRDbGllbnRZKGUsIHNlbGYudG91Y2hJZHgpO1xuXHRcdFx0XHR2YXIgZGlmWCA9IHNlbGYucHJldk1vdXNlWCAtIGNsaWVudFg7XG5cdFx0XHRcdHZhciBkaWZZID0gc2VsZi5wcmV2TW91c2VZIC0gY2xpZW50WTtcblxuXHRcdFx0XHRpZiAoZGlmWCA8IHNlbGYudGhyZXNob2xkWzBdIHx8IGRpZlggPiBzZWxmLnRocmVzaG9sZFsyXSB8fCBkaWZZIDwgc2VsZi50aHJlc2hvbGRbMV0gfHwgZGlmWSA+IHNlbGYudGhyZXNob2xkWzNdKSB7XG5cdFx0XHRcdFx0c2VsZi51cGRhdGUoZSk7XG5cblx0XHRcdFx0XHRzZWxmLnN0YXRlID0gJ2RyYWcnO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdG9uKGRvYywgJ21vdXNldXAnICsgc2VsZi5fbnMgKyAnIHRvdWNoZW5kJyArIHNlbGYuX25zICsgJycsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0XHQvL2ZvcmdldCB0b3VjaGVzXG5cdFx0XHRcdHNlbGYucmVzZXRUb3VjaCgpO1xuXG5cdFx0XHRcdHNlbGYuc3RhdGUgPSAnaWRsZSc7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0YWZ0ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdG9mZihkb2MsICd0b3VjaG1vdmUnICsgc2VsZi5fbnMgKyAnIG1vdXNlbW92ZScgKyBzZWxmLl9ucyArICcgbW91c2V1cCcgKyBzZWxmLl9ucyArICcgdG91Y2hlbmQnICsgc2VsZi5fbnMpO1xuXHRcdH1cblx0fSxcblxuXHRkcmFnOiB7XG5cdFx0YmVmb3JlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRcdC8vcmVkdWNlIGRyYWdnaW5nIGNsdXR0ZXJcblx0XHRcdHNlbGVjdGlvbi5kaXNhYmxlKHJvb3QpO1xuXG5cdFx0XHQvL2VtaXQgZHJhZyBldnRzIG9uIGVsZW1lbnRcblx0XHRcdHNlbGYuZW1pdCgnZHJhZ3N0YXJ0Jyk7XG5cdFx0XHRlbWl0KHNlbGYuZWxlbWVudCwgJ2RyYWdzdGFydCcsIG51bGwsIHRydWUpO1xuXG5cdFx0XHQvL2VtaXQgZHJhZyBldmVudHMgb24gc2VsZlxuXHRcdFx0c2VsZi5lbWl0KCdkcmFnJyk7XG5cdFx0XHRlbWl0KHNlbGYuZWxlbWVudCwgJ2RyYWcnLCBudWxsLCB0cnVlKTtcblxuXHRcdFx0Ly9zdG9wIGRyYWcgb24gbGVhdmVcblx0XHRcdG9uKGRvYywgJ3RvdWNoZW5kJyArIHNlbGYuX25zICsgJyBtb3VzZXVwJyArIHNlbGYuX25zICsgJyBtb3VzZWxlYXZlJyArIHNlbGYuX25zLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdFx0Ly9mb3JnZXQgdG91Y2hlcyAtIGRyYWdlbmQgaXMgY2FsbGVkIG9uY2Vcblx0XHRcdFx0c2VsZi5yZXNldFRvdWNoKCk7XG5cblx0XHRcdFx0Ly9tYW5hZ2UgcmVsZWFzZSBtb3ZlbWVudFxuXHRcdFx0XHRpZiAoc2VsZi5zcGVlZCA+IDEpIHtcblx0XHRcdFx0XHRzZWxmLnN0YXRlID0gJ3JlbGVhc2UnO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0c2VsZi5zdGF0ZSA9ICdpZGxlJztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vbW92ZSB2aWEgdHJhbnNmb3JtXG5cdFx0XHRvbihkb2MsICd0b3VjaG1vdmUnICsgc2VsZi5fbnMgKyAnIG1vdXNlbW92ZScgKyBzZWxmLl9ucywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0c2VsZi5kcmFnKGUpO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGFmdGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRcdC8vZW5hYmxlIGRvY3VtZW50IGludGVyYWN0aXZpdHlcblx0XHRcdHNlbGVjdGlvbi5lbmFibGUocm9vdCk7XG5cblx0XHRcdC8vZW1pdCBkcmFnZW5kIG9uIGVsZW1lbnQsIHRoaXNcblx0XHRcdHNlbGYuZW1pdCgnZHJhZ2VuZCcpO1xuXHRcdFx0ZW1pdChzZWxmLmVsZW1lbnQsICdkcmFnZW5kJywgbnVsbCwgdHJ1ZSk7XG5cblx0XHRcdC8vdW5iaW5kIGRyYWcgZXZlbnRzXG5cdFx0XHRvZmYoZG9jLCAndG91Y2hlbmQnICsgc2VsZi5fbnMgKyAnIG1vdXNldXAnICsgc2VsZi5fbnMgKyAnIG1vdXNlbGVhdmUnICsgc2VsZi5fbnMpO1xuXHRcdFx0b2ZmKGRvYywgJ3RvdWNobW92ZScgKyBzZWxmLl9ucyArICcgbW91c2Vtb3ZlJyArIHNlbGYuX25zKTtcblx0XHRcdGNsZWFySW50ZXJ2YWwoc2VsZi5fdHJhY2tpbmdJbnRlcnZhbCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbGVhc2U6IHtcblx0XHRiZWZvcmU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0Ly9lbnRlciBhbmltYXRpb24gbW9kZVxuXHRcdFx0c2VsZi5pc0FuaW1hdGVkID0gdHJ1ZTtcblxuXHRcdFx0Ly9jYWxjIHRhcmdldCBwb2ludCAmIGFuaW1hdGUgdG8gaXRcblx0XHRcdHNlbGYubW92ZShcblx0XHRcdFx0c2VsZi5wcmV2WCArIHNlbGYuc3BlZWQgKiBNYXRoLmNvcyhzZWxmLmFuZ2xlKSxcblx0XHRcdFx0c2VsZi5wcmV2WSArIHNlbGYuc3BlZWQgKiBNYXRoLnNpbihzZWxmLmFuZ2xlKVxuXHRcdFx0KTtcblxuXHRcdFx0c2VsZi5zcGVlZCA9IDA7XG5cdFx0XHRzZWxmLmVtaXQoJ3RyYWNrJyk7XG5cblx0XHRcdHNlbGYuc3RhdGUgPSAnaWRsZSc7XG5cdFx0fVxuXHR9XG59O1xuXG5cbi8qKiBEcmFnIGhhbmRsZXIuIE5lZWRlZCB0byBwcm92aWRlIGRyYWcgbW92ZW1lbnQgZW11bGF0aW9uIHZpYSBBUEkgKi9cbnByb3RvLmRyYWcgPSBmdW5jdGlvbiAoZSkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdHZhciBtb3VzZVggPSBnZXRDbGllbnRYKGUsIHNlbGYudG91Y2hJZHgpLFxuXHRcdG1vdXNlWSA9IGdldENsaWVudFkoZSwgc2VsZi50b3VjaElkeCk7XG5cblx0Ly9jYWxjIG1vdXNlIG1vdmVtZW50IGRpZmZcblx0dmFyIGRpZmZNb3VzZVggPSBtb3VzZVggLSBzZWxmLnByZXZNb3VzZVgsXG5cdFx0ZGlmZk1vdXNlWSA9IG1vdXNlWSAtIHNlbGYucHJldk1vdXNlWTtcblxuXHQvL2Fic29sdXRlIG1vdXNlIGNvb3JkaW5hdGVcblx0dmFyIG1vdXNlQWJzWCA9IG1vdXNlWCArIHdpbi5wYWdlWE9mZnNldCxcblx0XHRtb3VzZUFic1kgPSBtb3VzZVkgKyB3aW4ucGFnZVlPZmZzZXQ7XG5cblx0Ly9jYWxjIHNuaXBlciBvZmZzZXQsIGlmIGFueVxuXHRpZiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkge1xuXHRcdHNlbGYuc25pcGVyT2Zmc2V0WCArPSBkaWZmTW91c2VYICogc2VsZi5zbmlwZXJTbG93ZG93bjtcblx0XHRzZWxmLnNuaXBlck9mZnNldFkgKz0gZGlmZk1vdXNlWSAqIHNlbGYuc25pcGVyU2xvd2Rvd247XG5cdH1cblxuXHQvL2NhbGMgbW92ZW1lbnQgeCBhbmQgeVxuXHQvL3Rha2UgYWJzb2x1dGUgcGxhY2luZyBhcyBpdCBpcyB0aGUgb25seSByZWxpYWJsZSB3YXkgKDJ4IHByb3ZlZClcblx0dmFyIHggPSAobW91c2VBYnNYIC0gc2VsZi5pbml0T2Zmc2V0WCkgLSBzZWxmLmlubmVyT2Zmc2V0WCAtIHNlbGYuc25pcGVyT2Zmc2V0WCxcblx0XHR5ID0gKG1vdXNlQWJzWSAtIHNlbGYuaW5pdE9mZnNldFkpIC0gc2VsZi5pbm5lck9mZnNldFkgLSBzZWxmLnNuaXBlck9mZnNldFk7XG5cblx0Ly9tb3ZlIGVsZW1lbnRcblx0c2VsZi5tb3ZlKHgsIHkpO1xuXG5cdC8vc2F2ZSBwcmV2Q2xpZW50WFkgZm9yIGNhbGN1bGF0aW5nIGRpZmZcblx0c2VsZi5wcmV2TW91c2VYID0gbW91c2VYO1xuXHRzZWxmLnByZXZNb3VzZVkgPSBtb3VzZVk7XG5cblx0Ly9lbWl0IGRyYWdcblx0c2VsZi5lbWl0KCdkcmFnJyk7XG5cdGVtaXQoc2VsZi5lbGVtZW50LCAnZHJhZycsIG51bGwsIHRydWUpO1xufTtcblxuXG4vKiogQ3VycmVudCBudW1iZXIgb2YgZHJhZ2dhYmxlIHRvdWNoZXMgKi9cbnZhciB0b3VjaGVzID0gMDtcblxuXG4vKiogTWFuYWdlIHRvdWNoZXMgKi9cbnByb3RvLnNldFRvdWNoID0gZnVuY3Rpb24gKGUpIHtcblx0aWYgKCFlLnRvdWNoZXMgfHwgdGhpcy5pc1RvdWNoZWQoKSkgcmV0dXJuIHRoaXM7XG5cblx0dGhpcy50b3VjaElkeCA9IHRvdWNoZXM7XG5cdHRvdWNoZXMrKztcblxuXHRyZXR1cm4gdGhpcztcbn07XG5wcm90by5yZXNldFRvdWNoID0gZnVuY3Rpb24gKCkge1xuXHR0b3VjaGVzID0gMDtcblx0dGhpcy50b3VjaElkeCA9IG51bGw7XG5cblx0cmV0dXJuIHRoaXM7XG59O1xucHJvdG8uaXNUb3VjaGVkID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy50b3VjaElkeCAhPT0gbnVsbDtcbn07XG5cblxuLyoqIEFuaW1hdGlvbiBtb2RlLCBhdXRvbWF0aWNhbGx5IG9mZmVkIG9uY2Ugb25uZWQgKi9cbnByb3RvLmlzQW5pbWF0ZWQgPSB7XG5cdHRydWU6IHtcblx0XHRiZWZvcmU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXG5cdFx0XHRjbGVhclRpbWVvdXQoc2VsZi5fYW5pbWF0ZVRpbWVvdXQpO1xuXG5cdFx0XHQvL3NldCBwcm9wZXIgdHJhbnNpdGlvblxuXHRcdFx0Y3NzKHNlbGYuZWxlbWVudCwge1xuXHRcdFx0XHQndHJhbnNpdGlvbic6IChzZWxmLnJlbGVhc2VEdXJhdGlvbikgKyAnbXMgZWFzZS1vdXQgJyArIChzZWxmLmNzczMgPyAndHJhbnNmb3JtJyA6ICdwb3NpdGlvbicpXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly9wbGFuIGxlYXZpbmcgYW5pbSBtb2RlXG5cdFx0XHRzZWxmLl9hbmltYXRlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRzZWxmLmlzQW5pbWF0ZWQgPSBmYWxzZTtcblx0XHRcdH0sIHNlbGYucmVsZWFzZUR1cmF0aW9uKTtcblx0XHR9LFxuXHRcdGFmdGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRjc3ModGhpcy5lbGVtZW50LCB7XG5cdFx0XHRcdCd0cmFuc2l0aW9uJzogbnVsbFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59O1xuXG5cbi8qKiBJbmRleCB0byBmZXRjaCB0b3VjaCBudW1iZXIgZnJvbSBldmVudCAqL1xucHJvdG8udG91Y2hJZHggPSBudWxsO1xuXG5cbi8qKlxuICogVXBkYXRlIG1vdmVtZW50IGxpbWl0cy5cbiAqIFJlZnJlc2ggc2VsZi53aXRoaW5PZmZzZXRzIGFuZCBzZWxmLmxpbWl0cy5cbiAqL1xucHJvdG8udXBkYXRlID0gZnVuY3Rpb24gKGUpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdC8vaW5pdGlhbCB0cmFuc2xhdGlvbiBvZmZzZXRzXG5cdHZhciBpbml0WFkgPSBzZWxmLmdldENvb3JkcygpO1xuXG5cdC8vY2FsYyBpbml0aWFsIGNvb3Jkc1xuXHRzZWxmLnByZXZYID0gaW5pdFhZWzBdO1xuXHRzZWxmLnByZXZZID0gaW5pdFhZWzFdO1xuXG5cdC8vY29udGFpbmVyIHJlY3QgbWlnaHQgYmUgb3V0c2lkZSB0aGUgdnAsIHNvIGNhbGMgYWJzb2x1dGUgb2Zmc2V0c1xuXHQvL3plcm8tcG9zaXRpb24gb2Zmc2V0cywgd2l0aCB0cmFuc2xhdGlvbigwLDApXG5cdHZhciBzZWxmT2Zmc2V0cyA9IG9mZnNldHMoc2VsZi5lbGVtZW50KTtcblx0c2VsZi5pbml0T2Zmc2V0WCA9IHNlbGZPZmZzZXRzLmxlZnQgLSBzZWxmLnByZXZYO1xuXHRzZWxmLmluaXRPZmZzZXRZID0gc2VsZk9mZnNldHMudG9wIC0gc2VsZi5wcmV2WTtcblx0c2VsZi5vZmZzZXRzID0gc2VsZk9mZnNldHM7XG5cblx0Ly9oYW5kbGUgcGFyZW50IGNhc2Vcblx0aWYgKHNlbGYud2l0aGluID09PSAncGFyZW50Jykgc2VsZi53aXRoaW4gPSBzZWxmLmVsZW1lbnQucGFyZW50Tm9kZSB8fCBkb2M7XG5cdC8vYWJzb2x1dGUgb2Zmc2V0cyBvZiBhIGNvbnRhaW5lclxuXHR2YXIgd2l0aGluT2Zmc2V0cyA9IG9mZnNldHMoc2VsZi53aXRoaW4pO1xuXHRzZWxmLndpdGhpbk9mZnNldHMgPSB3aXRoaW5PZmZzZXRzO1xuXG5cdC8vY2FsY3VsYXRlIG1vdmVtZW50IGxpbWl0cyAtIHBpbiB3aWR0aCBtaWdodCBiZSB3aWRlciB0aGFuIGNvbnN0cmFpbnRzXG5cdHNlbGYub3ZlcmZsb3dYID0gc2VsZi5waW4ud2lkdGggLSB3aXRoaW5PZmZzZXRzLndpZHRoO1xuXHRzZWxmLm92ZXJmbG93WSA9IHNlbGYucGluLmhlaWdodCAtIHdpdGhpbk9mZnNldHMuaGVpZ2h0O1xuXHRzZWxmLmxpbWl0cyA9IHtcblx0XHRsZWZ0OiB3aXRoaW5PZmZzZXRzLmxlZnQgLSBzZWxmLmluaXRPZmZzZXRYIC0gc2VsZi5waW5bMF0gLSAoc2VsZi5vdmVyZmxvd1ggPCAwID8gMCA6IHNlbGYub3ZlcmZsb3dYKSxcblx0XHR0b3A6IHdpdGhpbk9mZnNldHMudG9wIC0gc2VsZi5pbml0T2Zmc2V0WSAtIHNlbGYucGluWzFdIC0gKHNlbGYub3ZlcmZsb3dZIDwgMCA/IDAgOiBzZWxmLm92ZXJmbG93WSksXG5cdFx0cmlnaHQ6IHNlbGYub3ZlcmZsb3dYID4gMCA/IDAgOiB3aXRoaW5PZmZzZXRzLnJpZ2h0IC0gc2VsZi5pbml0T2Zmc2V0WCAtIHNlbGYucGluWzJdLFxuXHRcdGJvdHRvbTogc2VsZi5vdmVyZmxvd1kgPiAwID8gMCA6IHdpdGhpbk9mZnNldHMuYm90dG9tIC0gc2VsZi5pbml0T2Zmc2V0WSAtIHNlbGYucGluWzNdXG5cdH07XG5cblx0Ly9wcmVzZXQgaW5uZXIgb2Zmc2V0c1xuXHRzZWxmLmlubmVyT2Zmc2V0WCA9IHNlbGYucGluWzBdO1xuXHRzZWxmLmlubmVyT2Zmc2V0WSA9IHNlbGYucGluWzFdO1xuXG5cdHZhciBzZWxmQ2xpZW50UmVjdCA9IHNlbGYuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHQvL2lmIGV2ZW50IHBhc3NlZCAtIHVwZGF0ZSBhY2MgdG8gZXZlbnRcblx0aWYgKGUpIHtcblx0XHQvL3Rha2UgbGFzdCBtb3VzZSBwb3NpdGlvbiBmcm9tIHRoZSBldmVudFxuXHRcdHNlbGYucHJldk1vdXNlWCA9IGdldENsaWVudFgoZSwgc2VsZi50b3VjaElkeCk7XG5cdFx0c2VsZi5wcmV2TW91c2VZID0gZ2V0Q2xpZW50WShlLCBzZWxmLnRvdWNoSWR4KTtcblxuXHRcdC8vaWYgbW91c2UgaXMgd2l0aGluIHRoZSBlbGVtZW50IC0gdGFrZSBvZmZzZXQgbm9ybWFsbHkgYXMgcmVsIGRpc3BsYWNlbWVudFxuXHRcdHNlbGYuaW5uZXJPZmZzZXRYID0gLXNlbGZDbGllbnRSZWN0LmxlZnQgKyBnZXRDbGllbnRYKGUsIHNlbGYudG91Y2hJZHgpO1xuXHRcdHNlbGYuaW5uZXJPZmZzZXRZID0gLXNlbGZDbGllbnRSZWN0LnRvcCArIGdldENsaWVudFkoZSwgc2VsZi50b3VjaElkeCk7XG5cdH1cblx0Ly9pZiBubyBldmVudCAtIHN1cHBvc2UgcGluLWNlbnRlcmVkIGV2ZW50XG5cdGVsc2Uge1xuXHRcdC8vdGFrZSBtb3VzZSBwb3NpdGlvbiAmIGlubmVyIG9mZnNldCBhcyBjZW50ZXIgb2YgcGluXG5cdFx0dmFyIHBpblggPSAoc2VsZi5waW5bMF0gKyBzZWxmLnBpblsyXSApICogMC41O1xuXHRcdHZhciBwaW5ZID0gKHNlbGYucGluWzFdICsgc2VsZi5waW5bM10gKSAqIDAuNTtcblx0XHRzZWxmLnByZXZNb3VzZVggPSBzZWxmQ2xpZW50UmVjdC5sZWZ0ICsgcGluWDtcblx0XHRzZWxmLnByZXZNb3VzZVkgPSBzZWxmQ2xpZW50UmVjdC50b3AgKyBwaW5ZO1xuXHRcdHNlbGYuaW5uZXJPZmZzZXRYID0gcGluWDtcblx0XHRzZWxmLmlubmVyT2Zmc2V0WSA9IHBpblk7XG5cdH1cblxuXHQvL3NldCBpbml0aWFsIGtpbmV0aWMgcHJvcHNcblx0c2VsZi5zcGVlZCA9IDA7XG5cdHNlbGYuYW1wbGl0dWRlID0gMDtcblx0c2VsZi5hbmdsZSA9IDA7XG5cdHNlbGYudGltZXN0YW1wID0gK25ldyBEYXRlKCk7XG5cdHNlbGYuZnJhbWUgPSBbc2VsZi5wcmV2WCwgc2VsZi5wcmV2WV07XG5cblx0Ly9zZXQgc25pcGVyIG9mZnNldFxuXHRzZWxmLnNuaXBlck9mZnNldFggPSAwO1xuXHRzZWxmLnNuaXBlck9mZnNldFkgPSAwO1xufTtcblxuXG4vKipcbiAqIFdheSBvZiBwbGFjZW1lbnQ6XG4gKiAtIHBvc2l0aW9uID09PSBmYWxzZSAoc2xvd2VyIGJ1dCBtb3JlIHByZWNpc2UgYW5kIGNyb3NzLWJyb3dzZXIpXG4gKiAtIHRyYW5zbGF0ZTNkID09PSB0cnVlIChmYXN0ZXIgYnV0IG1heSBjYXVzZSBibHVycyBvbiBsaW51eCBzeXN0ZW1zKVxuICovXG5wcm90by5jc3MzID0ge1xuXHRfOiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5nZXRDb29yZHMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQvLyByZXR1cm4gW3RoaXMuZWxlbWVudC5vZmZzZXRMZWZ0LCB0aGlzLmVsZW1lbnQub2Zmc2V0VG9wXTtcblx0XHRcdHJldHVybiBbcGFyc2VDU1NWYWx1ZShjc3ModGhpcy5lbGVtZW50LCdsZWZ0JykpLCBwYXJzZUNTU1ZhbHVlKGNzcyh0aGlzLmVsZW1lbnQsICd0b3AnKSldO1xuXHRcdH07XG5cblx0XHR0aGlzLnNldENvb3JkcyA9IGZ1bmN0aW9uICh4LCB5KSB7XG5cdFx0XHRjc3ModGhpcy5lbGVtZW50LCB7XG5cdFx0XHRcdGxlZnQ6IHgsXG5cdFx0XHRcdHRvcDogeVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vc2F2ZSBwcmV2IGNvb3JkcyB0byB1c2UgYXMgYSBzdGFydCBwb2ludCBuZXh0IHRpbWVcblx0XHRcdHRoaXMucHJldlggPSB4O1xuXHRcdFx0dGhpcy5wcmV2WSA9IHk7XG5cdFx0fTtcblx0fSxcblxuXHQvL3VuZGVmaW5lZCBwbGFjaW5nIGlzIHRyZWF0ZWQgYXMgdHJhbnNsYXRlM2Rcblx0dHJ1ZTogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuZ2V0Q29vcmRzICA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBnZXRUcmFuc2xhdGUodGhpcy5lbGVtZW50KSB8fCBbMCwwXTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zZXRDb29yZHMgPSBmdW5jdGlvbiAoeCwgeSkge1xuXHRcdFx0eCA9IHJvdW5kKHgsIHRoaXMucHJlY2l0aW9uKTtcblx0XHRcdHkgPSByb3VuZCh5LCB0aGlzLnByZWNpdGlvbik7XG5cblx0XHRcdGNzcyh0aGlzLmVsZW1lbnQsICd0cmFuc2Zvcm0nLCBbJ3RyYW5zbGF0ZTNkKCcsIHgsICdweCwnLCB5LCAncHgsIDApJ10uam9pbignJykpO1xuXG5cdFx0XHQvL3NhdmUgcHJldiBjb29yZHMgdG8gdXNlIGFzIGEgc3RhcnQgcG9pbnQgbmV4dCB0aW1lXG5cdFx0XHR0aGlzLnByZXZYID0geDtcblx0XHRcdHRoaXMucHJldlkgPSB5O1xuXHRcdH07XG5cdH1cbn07XG5cblxuLyoqXG4gKiBSZXN0cmljdGluZyBjb250YWluZXJcbiAqIEB0eXBlIHtFbGVtZW50fG9iamVjdH1cbiAqIEBkZWZhdWx0IGRvYy5kb2N1bWVudEVsZW1lbnRcbiAqL1xucHJvdG8ud2l0aGluID0gZG9jO1xuXG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMocHJvdG8sIHtcblx0LyoqXG5cdCAqIFdoaWNoIGFyZWEgb2YgZHJhZ2dhYmxlIHNob3VsZCBub3QgYmUgb3V0c2lkZSB0aGUgcmVzdHJpY3Rpb24gYXJlYS5cblx0ICogQHR5cGUgeyhBcnJheXxudW1iZXIpfVxuXHQgKiBAZGVmYXVsdCBbMCwwLHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aCwgdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodF1cblx0ICovXG5cdHBpbjoge1xuXHRcdHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0XHRpZiAoaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdFx0aWYgKHZhbHVlLmxlbmd0aCA9PT0gMikge1xuXHRcdFx0XHRcdHRoaXMuX3BpbiA9IFt2YWx1ZVswXSwgdmFsdWVbMV0sIHZhbHVlWzBdLCB2YWx1ZVsxXV07XG5cdFx0XHRcdH0gZWxzZSBpZiAodmFsdWUubGVuZ3RoID09PSA0KSB7XG5cdFx0XHRcdFx0dGhpcy5fcGluID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0ZWxzZSBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XG5cdFx0XHRcdHRoaXMuX3BpbiA9IFt2YWx1ZSwgdmFsdWUsIHZhbHVlLCB2YWx1ZV07XG5cdFx0XHR9XG5cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0aGlzLl9waW4gPSB2YWx1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly9jYWxjIHBpbiBwYXJhbXNcblx0XHRcdHRoaXMuX3Bpbi53aWR0aCA9IHRoaXMuX3BpblsyXSAtIHRoaXMuX3BpblswXTtcblx0XHRcdHRoaXMuX3Bpbi5oZWlnaHQgPSB0aGlzLl9waW5bM10gLSB0aGlzLl9waW5bMV07XG5cdFx0fSxcblxuXHRcdGdldDogZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKHRoaXMuX3BpbikgcmV0dXJuIHRoaXMuX3BpbjtcblxuXHRcdFx0Ly9yZXR1cm5pbmcgYXV0b2NhbGN1bGF0ZWQgcGluLCBpZiBwcml2YXRlIHBpbiBpcyBub25lXG5cdFx0XHR2YXIgcGluID0gWzAsMCwgdGhpcy5vZmZzZXRzLndpZHRoLCB0aGlzLm9mZnNldHMuaGVpZ2h0XTtcblx0XHRcdHBpbi53aWR0aCA9IHRoaXMub2Zmc2V0cy53aWR0aDtcblx0XHRcdHBpbi5oZWlnaHQgPSB0aGlzLm9mZnNldHMuaGVpZ2h0O1xuXHRcdFx0cmV0dXJuIHBpbjtcblx0XHR9XG5cdH0sXG5cblx0LyoqIEF2b2lkIGluaXRpYWwgbW91c2Vtb3ZlICovXG5cdHRocmVzaG9sZDoge1xuXHRcdHNldDogZnVuY3Rpb24gKHZhbCkge1xuXHRcdFx0aWYgKGlzTnVtYmVyKHZhbCkpIHtcblx0XHRcdFx0dGhpcy5fdGhyZXNob2xkID0gWy12YWwqMC41LCAtdmFsKjAuNSwgdmFsKjAuNSwgdmFsKjAuNV07XG5cdFx0XHR9IGVsc2UgaWYgKHZhbC5sZW5ndGggPT09IDIpIHtcblx0XHRcdFx0Ly9BcnJheSh3LGgpXG5cdFx0XHRcdHRoaXMuX3RocmVzaG9sZCA9IFstdmFsWzBdKjAuNSwgLXZhbFsxXSowLjUsIHZhbFswXSowLjUsIHZhbFsxXSowLjVdO1xuXHRcdFx0fSBlbHNlIGlmICh2YWwubGVuZ3RoID09PSA0KSB7XG5cdFx0XHRcdC8vQXJyYXkoeDEseTEseDIseTIpXG5cdFx0XHRcdHRoaXMuX3RocmVzaG9sZCA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoaXNGbih2YWwpKSB7XG5cdFx0XHRcdC8vY3VzdG9tIHZhbCBmdW5jaXRvblxuXHRcdFx0XHR0aGlzLl90aHJlc2hvbGQgPSB2YWwoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX3RocmVzaG9sZCA9IFswLDAsMCwwXTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Z2V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fdGhyZXNob2xkIHx8IFswLDAsMCwwXTtcblx0XHR9XG5cdH1cbn0pO1xuXG5cblxuLyoqXG4gKiBGb3IgaG93IGxvbmcgdG8gcmVsZWFzZSBtb3ZlbWVudFxuICpcbiAqIEB0eXBlIHsobnVtYmVyfGZhbHNlKX1cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKiBAdG9kb1xuICovXG5wcm90by5yZWxlYXNlID0gZmFsc2U7XG5wcm90by5yZWxlYXNlRHVyYXRpb24gPSA1MDA7XG5wcm90by52ZWxvY2l0eSA9IDEwMDA7XG5wcm90by5tYXhTcGVlZCA9IDI1MDtcbnByb3RvLmZyYW1lcmF0ZSA9IDUwO1xuXG5cbi8qKiBUbyB3aGF0IGV4dGVudCByb3VuZCBwb3NpdGlvbiAqL1xucHJvdG8ucHJlY2lzaW9uID0gMTtcblxuXG4vKiogU2xvdyBkb3duIG1vdmVtZW50IGJ5IHByZXNzaW5nIGN0cmwvY21kICovXG5wcm90by5zbmlwZXIgPSB0cnVlO1xuXG5cbi8qKiBIb3cgbXVjaCB0byBzbG93IHNuaXBlciBkcmFnICovXG5wcm90by5zbmlwZXJTbG93ZG93biA9IC44NTtcblxuXG4vKipcbiAqIFJlc3RyaWN0IG1vdmVtZW50IGJ5IGF4aXNcbiAqXG4gKiBAZGVmYXVsdCB1bmRlZmluZWRcbiAqIEBlbnVtIHtzdHJpbmd9XG4gKi9cbnByb3RvLmF4aXMgPSB7XG5cdF86IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLm1vdmUgPSBmdW5jdGlvbiAoeCwgeSkge1xuXHRcdFx0dmFyIGxpbWl0cyA9IHRoaXMubGltaXRzO1xuXG5cdFx0XHRpZiAodGhpcy5yZXBlYXQpIHtcblx0XHRcdFx0dmFyIHcgPSAobGltaXRzLnJpZ2h0IC0gbGltaXRzLmxlZnQpO1xuXHRcdFx0XHR2YXIgaCA9IChsaW1pdHMuYm90dG9tIC0gbGltaXRzLnRvcCk7XG5cdFx0XHRcdHZhciBvWCA9IC0gdGhpcy5pbml0T2Zmc2V0WCArIHRoaXMud2l0aGluT2Zmc2V0cy5sZWZ0IC0gdGhpcy5waW5bMF0gLSBNYXRoLm1heCgwLCB0aGlzLm92ZXJmbG93WCk7XG5cdFx0XHRcdHZhciBvWSA9IC0gdGhpcy5pbml0T2Zmc2V0WSArIHRoaXMud2l0aGluT2Zmc2V0cy50b3AgLSB0aGlzLnBpblsxXSAtIE1hdGgubWF4KDAsIHRoaXMub3ZlcmZsb3dZKTtcblx0XHRcdFx0aWYgKHRoaXMucmVwZWF0ID09PSAneCcpIHtcblx0XHRcdFx0XHR4ID0gbG9vcCh4IC0gb1gsIHcpICsgb1g7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAodGhpcy5yZXBlYXQgPT09ICd5Jykge1xuXHRcdFx0XHRcdHkgPSBsb29wKHkgLSBvWSwgaCkgKyBvWTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHR4ID0gbG9vcCh4IC0gb1gsIHcpICsgb1g7XG5cdFx0XHRcdFx0eSA9IGxvb3AoeSAtIG9ZLCBoKSArIG9ZO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHggPSBiZXR3ZWVuKHgsIGxpbWl0cy5sZWZ0LCBsaW1pdHMucmlnaHQpO1xuXHRcdFx0eSA9IGJldHdlZW4oeSwgbGltaXRzLnRvcCwgbGltaXRzLmJvdHRvbSk7XG5cblx0XHRcdHRoaXMuc2V0Q29vcmRzKHgsIHkpO1xuXHRcdH07XG5cdH0sXG5cdHg6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLm1vdmUgPSBmdW5jdGlvbiAoeCwgeSkge1xuXHRcdFx0dmFyIGxpbWl0cyA9IHRoaXMubGltaXRzO1xuXG5cdFx0XHRpZiAodGhpcy5yZXBlYXQpIHtcblx0XHRcdFx0dmFyIHcgPSAobGltaXRzLnJpZ2h0IC0gbGltaXRzLmxlZnQpO1xuXHRcdFx0XHR2YXIgb1ggPSAtIHRoaXMuaW5pdE9mZnNldFggKyB0aGlzLndpdGhpbk9mZnNldHMubGVmdCAtIHRoaXMucGluWzBdIC0gTWF0aC5tYXgoMCwgdGhpcy5vdmVyZmxvd1gpO1xuXHRcdFx0XHR4ID0gbG9vcCh4IC0gb1gsIHcpICsgb1g7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR4ID0gYmV0d2Vlbih4LCBsaW1pdHMubGVmdCwgbGltaXRzLnJpZ2h0KTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zZXRDb29yZHMoeCwgdGhpcy5wcmV2WSk7XG5cdFx0fTtcblx0fSxcblx0eTogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMubW92ZSA9IGZ1bmN0aW9uICh4LCB5KSB7XG5cdFx0XHR2YXIgbGltaXRzID0gdGhpcy5saW1pdHM7XG5cblx0XHRcdGlmICh0aGlzLnJlcGVhdCkge1xuXHRcdFx0XHR2YXIgaCA9IChsaW1pdHMuYm90dG9tIC0gbGltaXRzLnRvcCk7XG5cdFx0XHRcdHZhciBvWSA9IC0gdGhpcy5pbml0T2Zmc2V0WSArIHRoaXMud2l0aGluT2Zmc2V0cy50b3AgLSB0aGlzLnBpblsxXSAtIE1hdGgubWF4KDAsIHRoaXMub3ZlcmZsb3dZKTtcblx0XHRcdFx0eSA9IGxvb3AoeSAtIG9ZLCBoKSArIG9ZO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0eSA9IGJldHdlZW4oeSwgbGltaXRzLnRvcCwgbGltaXRzLmJvdHRvbSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2V0Q29vcmRzKHRoaXMucHJldlgsIHkpO1xuXHRcdH07XG5cdH1cbn07XG5cblxuLyoqIFJlcGVhdCBtb3ZlbWVudCBieSBvbmUgb2YgYXhpc2VzICovXG5wcm90by5yZXBlYXQgPSBmYWxzZTtcblxuXG4vKiogQ2hlY2sgd2hldGhlciBhcnIgaXMgZmlsbGVkIHdpdGggemVyb3MgKi9cbmZ1bmN0aW9uIGlzWmVyb0FycmF5KGFycikge1xuXHRpZiAoIWFyclswXSAmJiAhYXJyWzFdICYmICFhcnJbMl0gJiYgIWFyclszXSkgcmV0dXJuIHRydWU7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnZ2FibGU7IiwiLyoqXHJcbiAqIERlZmluZSBzdGF0ZWZ1bCBwcm9wZXJ0eSBvbiBhbiBvYmplY3RcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZGVmaW5lU3RhdGU7XHJcblxyXG52YXIgU3RhdGUgPSByZXF1aXJlKCdzdDgnKTtcclxuXHJcblxyXG4vKipcclxuICogRGVmaW5lIHN0YXRlZnVsIHByb3BlcnR5IG9uIGEgdGFyZ2V0XHJcbiAqXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgQW55IG9iamVjdFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgUHJvcGVydHkgbmFtZVxyXG4gKiBAcGFyYW0ge29iamVjdH0gZGVzY3JpcHRvciBTdGF0ZSBkZXNjcmlwdG9yXHJcbiAqXHJcbiAqIEByZXR1cm4ge29iamVjdH0gdGFyZ2V0XHJcbiAqL1xyXG5mdW5jdGlvbiBkZWZpbmVTdGF0ZSAodGFyZ2V0LCBwcm9wZXJ0eSwgZGVzY3JpcHRvciwgaXNGbikge1xyXG5cdC8vZGVmaW5lIGFjY2Vzc29yIG9uIGEgdGFyZ2V0XHJcblx0aWYgKGlzRm4pIHtcclxuXHRcdHRhcmdldFtwcm9wZXJ0eV0gPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XHJcblx0XHRcdFx0cmV0dXJuIHN0YXRlLnNldChhcmd1bWVudHNbMF0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBzdGF0ZS5nZXQoKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHR9XHJcblxyXG5cdC8vZGVmaW5lIHNldHRlci9nZXR0ZXIgb24gYSB0YXJnZXRcclxuXHRlbHNlIHtcclxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5LCB7XHJcblx0XHRcdHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdFx0cmV0dXJuIHN0YXRlLnNldCh2YWx1ZSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGdldDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHJldHVybiBzdGF0ZS5nZXQoKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHQvL2RlZmluZSBzdGF0ZSBjb250cm9sbGVyXHJcblx0dmFyIHN0YXRlID0gbmV3IFN0YXRlKGRlc2NyaXB0b3IsIHRhcmdldCk7XHJcblxyXG5cdHJldHVybiB0YXJnZXQ7XHJcbn0iLCIvKipcclxuICogQG1vZHVsZSAgc3Q4XHJcbiAqXHJcbiAqIE1pY3JvIHN0YXRlIG1hY2hpbmUuXHJcbiAqL1xyXG5cclxuXHJcbnZhciBFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XHJcbnZhciBpc0ZuID0gcmVxdWlyZSgnaXMtZnVuY3Rpb24nKTtcclxudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnaXMtcGxhaW4tb2JqZWN0Jyk7XHJcblxyXG5cclxuLyoqIERlZmF1bHRzICovXHJcblxyXG5TdGF0ZS5vcHRpb25zID0ge1xyXG5cdGxlYXZlQ2FsbGJhY2s6ICdhZnRlcicsXHJcblx0ZW50ZXJDYWxsYmFjazogJ2JlZm9yZScsXHJcblx0Y2hhbmdlQ2FsbGJhY2s6ICdjaGFuZ2UnLFxyXG5cdHJlbWFpbmRlclN0YXRlOiAnXydcclxufTtcclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgbmV3IHN0YXRlIGNvbnRyb2xsZXIgYmFzZWQgb24gc3RhdGVzIHBhc3NlZFxyXG4gKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICpcclxuICogQHBhcmFtIHtvYmplY3R9IHNldHRpbmdzIEluaXRpYWwgc3RhdGVzXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gU3RhdGUoc3RhdGVzLCBjb250ZXh0KXtcclxuXHQvL2lnbm9yZSBleGlzdGluZyBzdGF0ZVxyXG5cdGlmIChzdGF0ZXMgaW5zdGFuY2VvZiBTdGF0ZSkgcmV0dXJuIHN0YXRlcztcclxuXHJcblx0Ly9lbnN1cmUgbmV3IHN0YXRlIGluc3RhbmNlIGlzIGNyZWF0ZWRcclxuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgU3RhdGUpKSByZXR1cm4gbmV3IFN0YXRlKHN0YXRlcyk7XHJcblxyXG5cdC8vc2F2ZSBzdGF0ZXMgb2JqZWN0XHJcblx0dGhpcy5zdGF0ZXMgPSBzdGF0ZXMgfHwge307XHJcblxyXG5cdC8vc2F2ZSBjb250ZXh0XHJcblx0dGhpcy5jb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xyXG5cclxuXHQvL2luaXRlZEZsYWdcclxuXHR0aGlzLmlzSW5pdCA9IGZhbHNlO1xyXG59XHJcblxyXG5cclxuLyoqIEluaGVyaXQgU3RhdGUgZnJvbSBFbWl0dGVyICovXHJcblxyXG52YXIgcHJvdG8gPSBTdGF0ZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVtaXR0ZXIucHJvdG90eXBlKTtcclxuXHJcblxyXG4vKipcclxuICogR28gdG8gYSBzdGF0ZVxyXG4gKlxyXG4gKiBAcGFyYW0geyp9IHZhbHVlIEFueSBuZXcgc3RhdGUgdG8gZW50ZXJcclxuICovXHJcblxyXG5wcm90by5zZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHR2YXIgb2xkVmFsdWUgPSB0aGlzLnN0YXRlLCBzdGF0ZXMgPSB0aGlzLnN0YXRlcztcclxuXHQvLyBjb25zb2xlLmdyb3VwKCdzZXQnLCB2YWx1ZSwgb2xkVmFsdWUpO1xyXG5cclxuXHQvL2xlYXZlIG9sZCBzdGF0ZVxyXG5cdHZhciBvbGRTdGF0ZU5hbWUgPSBzdGF0ZXNbb2xkVmFsdWVdICE9PSB1bmRlZmluZWQgPyBvbGRWYWx1ZSA6IFN0YXRlLm9wdGlvbnMucmVtYWluZGVyU3RhdGU7XHJcblx0dmFyIG9sZFN0YXRlID0gc3RhdGVzW29sZFN0YXRlTmFtZV07XHJcblxyXG5cdHZhciBsZWF2ZVJlc3VsdCwgbGVhdmVGbGFnID0gU3RhdGUub3B0aW9ucy5sZWF2ZUNhbGxiYWNrICsgb2xkU3RhdGVOYW1lO1xyXG5cclxuXHRpZiAodGhpcy5pc0luaXQpIHtcclxuXHRcdGlmIChpc09iamVjdChvbGRTdGF0ZSkpIHtcclxuXHRcdFx0aWYgKCF0aGlzW2xlYXZlRmxhZ10pIHtcclxuXHRcdFx0XHR0aGlzW2xlYXZlRmxhZ10gPSB0cnVlO1xyXG5cclxuXHRcdFx0XHQvL2lmIG9sZHN0YXRlIGhhcyBhZnRlciBtZXRob2QgLSBjYWxsIGl0XHJcblx0XHRcdFx0bGVhdmVSZXN1bHQgPSBnZXRWYWx1ZShvbGRTdGF0ZSwgU3RhdGUub3B0aW9ucy5sZWF2ZUNhbGxiYWNrLCB0aGlzLmNvbnRleHQpO1xyXG5cclxuXHRcdFx0XHQvL2lnbm9yZSBjaGFuZ2luZyBpZiBsZWF2ZSByZXN1bHQgaXMgZmFsc3lcclxuXHRcdFx0XHRpZiAobGVhdmVSZXN1bHQgPT09IGZhbHNlKSB7XHJcblx0XHRcdFx0XHR0aGlzW2xlYXZlRmxhZ10gPSBmYWxzZTtcclxuXHRcdFx0XHRcdC8vIGNvbnNvbGUuZ3JvdXBFbmQoKTtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vcmVkaXJlY3QsIGlmIHJldHVybmVkIGFueXRoaW5nXHJcblx0XHRcdFx0ZWxzZSBpZiAobGVhdmVSZXN1bHQgIT09IHVuZGVmaW5lZCAmJiBsZWF2ZVJlc3VsdCAhPT0gdmFsdWUpIHtcclxuXHRcdFx0XHRcdHRoaXMuc2V0KGxlYXZlUmVzdWx0KTtcclxuXHRcdFx0XHRcdHRoaXNbbGVhdmVGbGFnXSA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0Ly8gY29uc29sZS5ncm91cEVuZCgpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dGhpc1tsZWF2ZUZsYWddID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdC8vaWdub3JlIHJlZGlyZWN0XHJcblx0XHRcdFx0aWYgKHRoaXMuc3RhdGUgIT09IG9sZFZhbHVlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdC8vaWdub3JlIG5vdCBjaGFuZ2VkIHZhbHVlXHJcblx0XHRpZiAodmFsdWUgPT09IG9sZFZhbHVlKSByZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0dGhpcy5pc0luaXQgPSB0cnVlO1xyXG5cdH1cclxuXHJcblxyXG5cdC8vc2V0IGN1cnJlbnQgdmFsdWVcclxuXHR0aGlzLnN0YXRlID0gdmFsdWU7XHJcblxyXG5cclxuXHQvL3RyeSB0byBlbnRlciBuZXcgc3RhdGVcclxuXHR2YXIgbmV3U3RhdGVOYW1lID0gc3RhdGVzW3ZhbHVlXSAhPT0gdW5kZWZpbmVkID8gdmFsdWUgOiBTdGF0ZS5vcHRpb25zLnJlbWFpbmRlclN0YXRlO1xyXG5cdHZhciBuZXdTdGF0ZSA9IHN0YXRlc1tuZXdTdGF0ZU5hbWVdO1xyXG5cdHZhciBlbnRlckZsYWcgPSBTdGF0ZS5vcHRpb25zLmVudGVyQ2FsbGJhY2sgKyBuZXdTdGF0ZU5hbWU7XHJcblx0dmFyIGVudGVyUmVzdWx0O1xyXG5cclxuXHRpZiAoIXRoaXNbZW50ZXJGbGFnXSkge1xyXG5cdFx0dGhpc1tlbnRlckZsYWddID0gdHJ1ZTtcclxuXHJcblx0XHRpZiAoaXNPYmplY3QobmV3U3RhdGUpKSB7XHJcblx0XHRcdGVudGVyUmVzdWx0ID0gZ2V0VmFsdWUobmV3U3RhdGUsIFN0YXRlLm9wdGlvbnMuZW50ZXJDYWxsYmFjaywgdGhpcy5jb250ZXh0KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGVudGVyUmVzdWx0ID0gZ2V0VmFsdWUoc3RhdGVzLCBuZXdTdGF0ZU5hbWUsIHRoaXMuY29udGV4dCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9pZ25vcmUgZW50ZXJpbmcgZmFsc3kgc3RhdGVcclxuXHRcdGlmIChlbnRlclJlc3VsdCA9PT0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5zZXQob2xkVmFsdWUpO1xyXG5cdFx0XHR0aGlzW2VudGVyRmxhZ10gPSBmYWxzZTtcclxuXHRcdFx0Ly8gY29uc29sZS5ncm91cEVuZCgpO1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9yZWRpcmVjdCBpZiByZXR1cm5lZCBhbnl0aGluZyBidXQgY3VycmVudCBzdGF0ZVxyXG5cdFx0ZWxzZSBpZiAoZW50ZXJSZXN1bHQgIT09IHVuZGVmaW5lZCAmJiBlbnRlclJlc3VsdCAhPT0gdmFsdWUpIHtcclxuXHRcdFx0dGhpcy5zZXQoZW50ZXJSZXN1bHQpO1xyXG5cdFx0XHR0aGlzW2VudGVyRmxhZ10gPSBmYWxzZTtcclxuXHRcdFx0Ly8gY29uc29sZS5ncm91cEVuZCgpO1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpc1tlbnRlckZsYWddID0gZmFsc2U7XHJcblx0fVxyXG5cclxuXHJcblxyXG5cdC8vbm90aWZ5IGNoYW5nZVxyXG5cdGlmICh2YWx1ZSAhPT0gb2xkVmFsdWUpXHR7XHJcblx0XHR0aGlzLmVtaXQoU3RhdGUub3B0aW9ucy5jaGFuZ2VDYWxsYmFjaywgdmFsdWUsIG9sZFZhbHVlKTtcclxuXHR9XHJcblxyXG5cclxuXHQvLyBjb25zb2xlLmdyb3VwRW5kKCk7XHJcblxyXG5cdC8vcmV0dXJuIGNvbnRleHQgdG8gY2hhaW4gY2FsbHNcclxuXHRyZXR1cm4gdGhpcy5jb250ZXh0O1xyXG59O1xyXG5cclxuXHJcbi8qKiBHZXQgY3VycmVudCBzdGF0ZSAqL1xyXG5cclxucHJvdG8uZ2V0ID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdGhpcy5zdGF0ZTtcclxufTtcclxuXHJcblxyXG4vKiogUmV0dXJuIHZhbHVlIG9yIGZuIHJlc3VsdCAqL1xyXG5mdW5jdGlvbiBnZXRWYWx1ZShob2xkZXIsIG1ldGgsIGN0eCl7XHJcblx0aWYgKGlzRm4oaG9sZGVyW21ldGhdKSkge1xyXG5cdFx0cmV0dXJuIGhvbGRlclttZXRoXS5jYWxsKGN0eCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gaG9sZGVyW21ldGhdO1xyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZTsiLCIvKiFcbiAqIGlzLXBsYWluLW9iamVjdCA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvaXMtcGxhaW4tb2JqZWN0PlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBKb24gU2NobGlua2VydC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc09iamVjdCA9IHJlcXVpcmUoJ2lzb2JqZWN0Jyk7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0T2JqZWN0KG8pIHtcbiAgcmV0dXJuIGlzT2JqZWN0KG8pID09PSB0cnVlXG4gICAgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pID09PSAnW29iamVjdCBPYmplY3RdJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KG8pIHtcbiAgdmFyIGN0b3IscHJvdDtcbiAgXG4gIGlmIChpc09iamVjdE9iamVjdChvKSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTtcbiAgXG4gIC8vIElmIGhhcyBtb2RpZmllZCBjb25zdHJ1Y3RvclxuICBjdG9yID0gby5jb25zdHJ1Y3RvcjtcbiAgaWYgKHR5cGVvZiBjdG9yICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG4gIFxuICAvLyBJZiBoYXMgbW9kaWZpZWQgcHJvdG90eXBlXG4gIHByb3QgPSBjdG9yLnByb3RvdHlwZTtcbiAgaWYgKGlzT2JqZWN0T2JqZWN0KHByb3QpID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xuICBcbiAgLy8gSWYgY29uc3RydWN0b3IgZG9lcyBub3QgaGF2ZSBhbiBPYmplY3Qtc3BlY2lmaWMgbWV0aG9kXG4gIGlmIChwcm90Lmhhc093blByb3BlcnR5KCdpc1Byb3RvdHlwZU9mJykgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvLyBNb3N0IGxpa2VseSBhIHBsYWluIE9iamVjdFxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvKiFcbiAqIGlzb2JqZWN0IDxodHRwczovL2dpdGh1Yi5jb20vam9uc2NobGlua2VydC9pc29iamVjdD5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgSm9uIFNjaGxpbmtlcnQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzT2JqZWN0KG8pIHtcbiAgcmV0dXJuIG8gIT0gbnVsbCAmJiB0eXBlb2YgbyA9PT0gJ29iamVjdCdcbiAgICAmJiAhQXJyYXkuaXNBcnJheShvKTtcbn07IiwiLyoqXHJcbiAqIEdldCBjbGllbnRZL2NsaWVudFkgZnJvbSBhbiBldmVudC5cclxuICogSWYgaW5kZXggaXMgcGFzc2VkLCB0cmVhdCBpdCBhcyBpbmRleCBvZiBnbG9iYWwgdG91Y2hlcywgbm90IHRoZSB0YXJnZXRUb3VjaGVzLlxyXG4gKiBJdCBpcyBiZWNhdXNlIGdsb2JhbCB0b3VjaGVzIGFyZSBtb3JlIGdlbmVyaWMuXHJcbiAqXHJcbiAqIEBtb2R1bGUgZ2V0LWNsaWVudC14eVxyXG4gKlxyXG4gKiBAcGFyYW0ge0V2ZW50fSBlIEV2ZW50IHJhaXNlZCwgbGlrZSBtb3VzZW1vdmVcclxuICpcclxuICogQHJldHVybiB7bnVtYmVyfSBDb29yZGluYXRlIHJlbGF0aXZlIHRvIHRoZSBzY3JlZW5cclxuICovXHJcbmZ1bmN0aW9uIGdldENsaWVudFkgKGUsIGlkeCkge1xyXG5cdC8vIHRvdWNoIGV2ZW50XHJcblx0aWYgKGUudG91Y2hlcykge1xyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcblx0XHRcdHJldHVybiBlLnRvdWNoZXNbaWR4XS5jbGllbnRZO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJldHVybiBlLnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIG1vdXNlIGV2ZW50XHJcblx0cmV0dXJuIGUuY2xpZW50WTtcclxufVxyXG5mdW5jdGlvbiBnZXRDbGllbnRYIChlLCBpZHgpIHtcclxuXHQvLyB0b3VjaCBldmVudFxyXG5cdGlmIChlLnRvdWNoZXMpIHtcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xyXG5cdFx0XHRyZXR1cm4gZS50b3VjaGVzW2lkeF0uY2xpZW50WDtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gZS50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFg7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBtb3VzZSBldmVudFxyXG5cdHJldHVybiBlLmNsaWVudFg7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldENsaWVudFhZIChlLCBpZHgpIHtcclxuXHRyZXR1cm4gW2dldENsaWVudFgoZSwgaWR4KSwgZ2V0Q2xpZW50WShlLCBpZHgpXTtcclxufVxyXG5cclxuZ2V0Q2xpZW50WFkueCA9IGdldENsaWVudFg7XHJcbmdldENsaWVudFhZLnkgPSBnZXRDbGllbnRZO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnZXRDbGllbnRYWTsiLCIvKiogZ2VuZXJhdGUgdW5pcXVlIGlkIGZvciBzZWxlY3RvciAqL1xyXG52YXIgY291bnRlciA9IERhdGUubm93KCkgJSAxZTk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFVpZCgpe1xyXG5cdHJldHVybiAoTWF0aC5yYW5kb20oKSAqIDFlOSA+Pj4gMCkgKyAoY291bnRlcisrKTtcclxufTsiLCJcbi8qKlxuICogaXNBcnJheVxuICovXG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiB0b1N0cmluZ1xuICovXG5cbnZhciBzdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBgdmFsYFxuICogaXMgYW4gYXJyYXkuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgaXNBcnJheShbXSk7XG4gKiAgICAgICAgLy8gPiB0cnVlXG4gKiAgICAgICAgaXNBcnJheShhcmd1bWVudHMpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqICAgICAgICBpc0FycmF5KCcnKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKlxuICogQHBhcmFtIHttaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtib29sfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiAhISB2YWwgJiYgJ1tvYmplY3QgQXJyYXldJyA9PSBzdHIuY2FsbCh2YWwpO1xufTtcbiIsIi8qKlxyXG4gKiBTaW1wbGUgcmVjdCBjb25zdHJ1Y3Rvci5cclxuICogSXQgaXMganVzdCBmYXN0ZXIgYW5kIHNtYWxsZXIgdGhhbiBjb25zdHJ1Y3RpbmcgYW4gb2JqZWN0LlxyXG4gKlxyXG4gKiBAbW9kdWxlIG11Y3NzL1JlY3RcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ9IGwgbGVmdFxyXG4gKiBAcGFyYW0ge251bWJlcn0gdCB0b3BcclxuICogQHBhcmFtIHtudW1iZXJ9IHIgcmlnaHRcclxuICogQHBhcmFtIHtudW1iZXJ9IGIgYm90dG9tXHJcbiAqIEBwYXJhbSB7bnVtYmVyfT8gdyB3aWR0aFxyXG4gKiBAcGFyYW0ge251bWJlcn0/IGggaGVpZ2h0XHJcbiAqXHJcbiAqIEByZXR1cm4ge1JlY3R9IEEgcmVjdGFuZ2xlIG9iamVjdFxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBSZWN0IChsLHQscixiLHcsaCkge1xyXG5cdHRoaXMudG9wPXR8fDA7XHJcblx0dGhpcy5ib3R0b209Ynx8MDtcclxuXHR0aGlzLmxlZnQ9bHx8MDtcclxuXHR0aGlzLnJpZ2h0PXJ8fDA7XHJcblx0aWYgKHchPT11bmRlZmluZWQpIHRoaXMud2lkdGg9d3x8dGhpcy5yaWdodC10aGlzLmxlZnQ7XHJcblx0aWYgKGghPT11bmRlZmluZWQpIHRoaXMuaGVpZ2h0PWh8fHRoaXMuYm90dG9tLXRoaXMudG9wO1xyXG59OyIsIi8qKlxyXG4gKiBHZXQgb3Igc2V0IGVsZW1lbnTigJlzIHN0eWxlLCBwcmVmaXgtYWdub3N0aWMuXHJcbiAqXHJcbiAqIEBtb2R1bGUgIG11Y3NzL2Nzc1xyXG4gKi9cclxudmFyIGZha2VTdHlsZSA9IHJlcXVpcmUoJy4vZmFrZS1lbGVtZW50Jykuc3R5bGU7XHJcbnZhciBwcmVmaXggPSByZXF1aXJlKCcuL3ByZWZpeCcpLmxvd2VyY2FzZTtcclxuXHJcblxyXG4vKipcclxuICogQXBwbHkgc3R5bGVzIHRvIGFuIGVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSAgICB7RWxlbWVudH0gICBlbCAgIEFuIGVsZW1lbnQgdG8gYXBwbHkgc3R5bGVzLlxyXG4gKiBAcGFyYW0gICAge09iamVjdHxzdHJpbmd9ICAgb2JqICAgU2V0IG9mIHN0eWxlIHJ1bGVzIG9yIHN0cmluZyB0byBnZXQgc3R5bGUgcnVsZS5cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWwsIG9iail7XHJcblx0aWYgKCFlbCB8fCAhb2JqKSByZXR1cm47XHJcblxyXG5cdHZhciBuYW1lLCB2YWx1ZTtcclxuXHJcblx0Ly9yZXR1cm4gdmFsdWUsIGlmIHN0cmluZyBwYXNzZWRcclxuXHRpZiAodHlwZW9mIG9iaiA9PT0gJ3N0cmluZycpIHtcclxuXHRcdG5hbWUgPSBvYmo7XHJcblxyXG5cdFx0Ly9yZXR1cm4gdmFsdWUsIGlmIG5vIHZhbHVlIHBhc3NlZFxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XHJcblx0XHRcdHJldHVybiBlbC5zdHlsZVtwcmVmaXhpemUobmFtZSldO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vc2V0IHN0eWxlLCBpZiB2YWx1ZSBwYXNzZWRcclxuXHRcdHZhbHVlID0gYXJndW1lbnRzWzJdIHx8ICcnO1xyXG5cdFx0b2JqID0ge307XHJcblx0XHRvYmpbbmFtZV0gPSB2YWx1ZTtcclxuXHR9XHJcblxyXG5cdGZvciAobmFtZSBpbiBvYmope1xyXG5cdFx0Ly9jb252ZXJ0IG51bWJlcnMgdG8gcHhcclxuXHRcdGlmICh0eXBlb2Ygb2JqW25hbWVdID09PSAnbnVtYmVyJyAmJiAvbGVmdHxyaWdodHxib3R0b218dG9wfHdpZHRofGhlaWdodC9pLnRlc3QobmFtZSkpIG9ialtuYW1lXSArPSAncHgnO1xyXG5cclxuXHRcdHZhbHVlID0gb2JqW25hbWVdIHx8ICcnO1xyXG5cclxuXHRcdGVsLnN0eWxlW3ByZWZpeGl6ZShuYW1lKV0gPSB2YWx1ZTtcclxuXHR9XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJldHVybiBwcmVmaXhpemVkIHByb3AgbmFtZSwgaWYgbmVlZGVkLlxyXG4gKlxyXG4gKiBAcGFyYW0gICAge3N0cmluZ30gICBuYW1lICAgQSBwcm9wZXJ0eSBuYW1lLlxyXG4gKiBAcmV0dXJuICAge3N0cmluZ30gICBQcmVmaXhlZCBwcm9wZXJ0eSBuYW1lLlxyXG4gKi9cclxuZnVuY3Rpb24gcHJlZml4aXplKG5hbWUpe1xyXG5cdHZhciB1TmFtZSA9IG5hbWVbMF0udG9VcHBlckNhc2UoKSArIG5hbWUuc2xpY2UoMSk7XHJcblx0aWYgKGZha2VTdHlsZVtuYW1lXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gbmFtZTtcclxuXHRpZiAoZmFrZVN0eWxlW3ByZWZpeCArIHVOYW1lXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJlZml4ICsgdU5hbWU7XHJcblx0cmV0dXJuICcnO1xyXG59XHJcbiIsIi8qKiBKdXN0IGEgZmFrZSBlbGVtZW50IHRvIHRlc3Qgc3R5bGVzXHJcbiAqIEBtb2R1bGUgbXVjc3MvZmFrZS1lbGVtZW50XHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsiLCIvKipcclxuICogV2luZG93IHNjcm9sbGJhciBkZXRlY3Rvci5cclxuICpcclxuICogQG1vZHVsZSBtdWNzcy9oYXMtc2Nyb2xsXHJcbiAqL1xyXG5leHBvcnRzLnggPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodCA+IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbn07XHJcbmV4cG9ydHMueSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gd2luZG93LmlubmVyV2lkdGggPiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbn07IiwiLyoqXHJcbiAqIERldGVjdCB3aGV0aGVyIGVsZW1lbnQgaXMgcGxhY2VkIHRvIGZpeGVkIGNvbnRhaW5lciBvciBpcyBmaXhlZCBpdHNlbGYuXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3MvaXMtZml4ZWRcclxuICpcclxuICogQHBhcmFtIHsoRWxlbWVudHxPYmplY3QpfSBlbCBFbGVtZW50IHRvIGRldGVjdCBmaXhlZG5lc3MuXHJcbiAqXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgZWxlbWVudCBpcyBuZXN0ZWQuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbCkge1xyXG5cdHZhciBwYXJlbnRFbCA9IGVsO1xyXG5cclxuXHQvL3dpbmRvdyBpcyBmaXhlZCwgYnR3XHJcblx0aWYgKGVsID09PSB3aW5kb3cpIHJldHVybiB0cnVlO1xyXG5cclxuXHQvL3VubGlrZSB0aGUgZG9jXHJcblx0aWYgKGVsID09PSBkb2N1bWVudCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHR3aGlsZSAocGFyZW50RWwpIHtcclxuXHRcdGlmIChnZXRDb21wdXRlZFN0eWxlKHBhcmVudEVsKS5wb3NpdGlvbiA9PT0gJ2ZpeGVkJykgcmV0dXJuIHRydWU7XHJcblx0XHRwYXJlbnRFbCA9IHBhcmVudEVsLm9mZnNldFBhcmVudDtcclxuXHR9XHJcblx0cmV0dXJuIGZhbHNlO1xyXG59OyIsIi8qKlxyXG4gKiBDYWxjdWxhdGUgYWJzb2x1dGUgb2Zmc2V0cyBvZiBhbiBlbGVtZW50LCByZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQuXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3Mvb2Zmc2V0c1xyXG4gKlxyXG4gKi9cclxudmFyIHdpbiA9IHdpbmRvdztcclxudmFyIGRvYyA9IGRvY3VtZW50O1xyXG52YXIgUmVjdCA9IHJlcXVpcmUoJy4vUmVjdCcpO1xyXG52YXIgaGFzU2Nyb2xsID0gcmVxdWlyZSgnLi9oYXMtc2Nyb2xsJyk7XHJcbnZhciBzY3JvbGxiYXIgPSByZXF1aXJlKCcuL3Njcm9sbGJhcicpO1xyXG52YXIgaXNGaXhlZEVsID0gcmVxdWlyZSgnLi9pcy1maXhlZCcpO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiBhYnNvbHV0ZSBvZmZzZXRzIG9mIGFueSB0YXJnZXQgcGFzc2VkXHJcbiAqXHJcbiAqIEBwYXJhbSAgICB7RWxlbWVudHx3aW5kb3d9ICAgZWwgICBBIHRhcmdldC4gUGFzcyB3aW5kb3cgdG8gY2FsY3VsYXRlIHZpZXdwb3J0IG9mZnNldHNcclxuICogQHJldHVybiAgIHtPYmplY3R9ICAgT2Zmc2V0cyBvYmplY3Qgd2l0aCB0cmJsLlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBvZmZzZXRzO1xyXG5cclxuZnVuY3Rpb24gb2Zmc2V0cyAoZWwpIHtcclxuXHRpZiAoIWVsKSB0aHJvdyBFcnJvcignQmFkIGFyZ3VtZW50Jyk7XHJcblxyXG5cdC8vY2FsYyBjbGllbnQgcmVjdFxyXG5cdHZhciBjUmVjdCwgcmVzdWx0O1xyXG5cclxuXHQvL3JldHVybiB2cCBvZmZzZXRzXHJcblx0aWYgKGVsID09PSB3aW4pIHtcclxuXHRcdHJlc3VsdCA9IG5ldyBSZWN0KFxyXG5cdFx0XHR3aW4ucGFnZVhPZmZzZXQsXHJcblx0XHRcdHdpbi5wYWdlWU9mZnNldFxyXG5cdFx0KTtcclxuXHJcblx0XHRyZXN1bHQud2lkdGggPSB3aW4uaW5uZXJXaWR0aCAtIChoYXNTY3JvbGwueSgpID8gc2Nyb2xsYmFyIDogMCksXHJcblx0XHRyZXN1bHQuaGVpZ2h0ID0gd2luLmlubmVySGVpZ2h0IC0gKGhhc1Njcm9sbC54KCkgPyBzY3JvbGxiYXIgOiAwKVxyXG5cdFx0cmVzdWx0LnJpZ2h0ID0gcmVzdWx0LmxlZnQgKyByZXN1bHQud2lkdGg7XHJcblx0XHRyZXN1bHQuYm90dG9tID0gcmVzdWx0LnRvcCArIHJlc3VsdC5oZWlnaHQ7XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblxyXG5cdC8vcmV0dXJuIGFic29sdXRlIG9mZnNldHMgaWYgZG9jdW1lbnQgcmVxdWVzdGVkXHJcblx0ZWxzZSBpZiAoZWwgPT09IGRvYykge1xyXG5cdFx0dmFyIHJlcyA9IG9mZnNldHMoZG9jLmRvY3VtZW50RWxlbWVudCk7XHJcblx0XHRyZXMuYm90dG9tID0gTWF0aC5tYXgod2luZG93LmlubmVySGVpZ2h0LCByZXMuYm90dG9tKTtcclxuXHRcdHJlcy5yaWdodCA9IE1hdGgubWF4KHdpbmRvdy5pbm5lcldpZHRoLCByZXMucmlnaHQpO1xyXG5cdFx0aWYgKGhhc1Njcm9sbC55KGRvYy5kb2N1bWVudEVsZW1lbnQpKSByZXMucmlnaHQgLT0gc2Nyb2xsYmFyO1xyXG5cdFx0aWYgKGhhc1Njcm9sbC54KGRvYy5kb2N1bWVudEVsZW1lbnQpKSByZXMuYm90dG9tIC09IHNjcm9sbGJhcjtcclxuXHRcdHJldHVybiByZXM7XHJcblx0fVxyXG5cclxuXHQvL0ZJWE1FOiB3aHkgbm90IGV2ZXJ5IGVsZW1lbnQgaGFzIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBtZXRob2Q/XHJcblx0dHJ5IHtcclxuXHRcdGNSZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0fSBjYXRjaCAoZSkge1xyXG5cdFx0Y1JlY3QgPSBuZXcgUmVjdChcclxuXHRcdFx0ZWwuY2xpZW50TGVmdCxcclxuXHRcdFx0ZWwuY2xpZW50VG9wXHJcblx0XHQpO1xyXG5cdH1cclxuXHJcblx0Ly93aGV0aGVyIGVsZW1lbnQgaXMgb3IgaXMgaW4gZml4ZWRcclxuXHR2YXIgaXNGaXhlZCA9IGlzRml4ZWRFbChlbCk7XHJcblx0dmFyIHhPZmZzZXQgPSBpc0ZpeGVkID8gMCA6IHdpbi5wYWdlWE9mZnNldDtcclxuXHR2YXIgeU9mZnNldCA9IGlzRml4ZWQgPyAwIDogd2luLnBhZ2VZT2Zmc2V0O1xyXG5cclxuXHRyZXN1bHQgPSBuZXcgUmVjdChcclxuXHRcdGNSZWN0LmxlZnQgKyB4T2Zmc2V0LFxyXG5cdFx0Y1JlY3QudG9wICsgeU9mZnNldCxcclxuXHRcdGNSZWN0LmxlZnQgKyB4T2Zmc2V0ICsgZWwub2Zmc2V0V2lkdGgsXHJcblx0XHRjUmVjdC50b3AgKyB5T2Zmc2V0ICsgZWwub2Zmc2V0SGVpZ2h0LFxyXG5cdFx0ZWwub2Zmc2V0V2lkdGgsXHJcblx0XHRlbC5vZmZzZXRIZWlnaHRcclxuXHQpO1xyXG5cclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59OyIsIi8qKlxyXG4gKiBSZXR1cm5zIHBhcnNlZCBjc3MgdmFsdWUuXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3MvcGFyc2UtdmFsdWVcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciBBIHN0cmluZyBjb250YWluaW5nIGNzcyB1bml0cyB2YWx1ZVxyXG4gKlxyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFBhcnNlZCBudW1iZXIgdmFsdWVcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0cil7XHJcblx0c3RyICs9ICcnO1xyXG5cdHJldHVybiBwYXJzZUZsb2F0KHN0ci5zbGljZSgwLC0yKSkgfHwgMDtcclxufTtcclxuXHJcbi8vRklYTUU6IGFkZCBwYXJzaW5nIHVuaXRzIiwiLyoqXHJcbiAqIFZlbmRvciBwcmVmaXhlc1xyXG4gKiBNZXRob2Qgb2YgaHR0cDovL2Rhdmlkd2Fsc2gubmFtZS92ZW5kb3ItcHJlZml4XHJcbiAqIEBtb2R1bGUgbXVjc3MvcHJlZml4XHJcbiAqL1xyXG5cclxudmFyIHN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnJyk7XHJcblxyXG52YXIgcHJlID0gKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHN0eWxlcylcclxuXHQuam9pbignJylcclxuXHQubWF0Y2goLy0obW96fHdlYmtpdHxtcyktLykgfHwgKHN0eWxlcy5PTGluayA9PT0gJycgJiYgWycnLCAnbyddKVxyXG4pWzFdO1xyXG5cclxuZG9tID0gKCdXZWJLaXR8TW96fE1TfE8nKS5tYXRjaChuZXcgUmVnRXhwKCcoJyArIHByZSArICcpJywgJ2knKSlbMV07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHRkb206IGRvbSxcclxuXHRsb3dlcmNhc2U6IHByZSxcclxuXHRjc3M6ICctJyArIHByZSArICctJyxcclxuXHRqczogcHJlWzBdLnRvVXBwZXJDYXNlKCkgKyBwcmUuc3Vic3RyKDEpXHJcbn07IiwiLyoqXHJcbiAqIENhbGN1bGF0ZSBzY3JvbGxiYXIgd2lkdGguXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3Mvc2Nyb2xsYmFyXHJcbiAqL1xyXG5cclxuLy8gQ3JlYXRlIHRoZSBtZWFzdXJlbWVudCBub2RlXHJcbnZhciBzY3JvbGxEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG5cclxudmFyIHN0eWxlID0gc2Nyb2xsRGl2LnN0eWxlO1xyXG5cclxuc3R5bGUud2lkdGggPSAnMTAwcHgnO1xyXG5zdHlsZS5oZWlnaHQgPSAnMTAwcHgnO1xyXG5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xyXG5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbnN0eWxlLnRvcCA9ICctOTk5OXB4JztcclxuXHJcbmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChzY3JvbGxEaXYpO1xyXG5cclxuLy8gdGhlIHNjcm9sbGJhciB3aWR0aFxyXG5tb2R1bGUuZXhwb3J0cyA9IHNjcm9sbERpdi5vZmZzZXRXaWR0aCAtIHNjcm9sbERpdi5jbGllbnRXaWR0aDtcclxuXHJcbi8vIERlbGV0ZSBmYWtlIERJVlxyXG5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoc2Nyb2xsRGl2KTsiLCIvKipcclxuICogRW5hYmxlL2Rpc2FibGUgc2VsZWN0YWJpbGl0eSBvZiBhbiBlbGVtZW50XHJcbiAqIEBtb2R1bGUgbXVjc3Mvc2VsZWN0aW9uXHJcbiAqL1xyXG52YXIgY3NzID0gcmVxdWlyZSgnLi9jc3MnKTtcclxuXHJcblxyXG4vKipcclxuICogRGlzYWJsZSBvciBFbmFibGUgYW55IHNlbGVjdGlvbiBwb3NzaWJpbGl0aWVzIGZvciBhbiBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0gICAge0VsZW1lbnR9ICAgZWwgICBUYXJnZXQgdG8gbWFrZSB1bnNlbGVjdGFibGUuXHJcbiAqL1xyXG5leHBvcnRzLmRpc2FibGUgPSBmdW5jdGlvbihlbCl7XHJcblx0Y3NzKGVsLCB7XHJcblx0XHQndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcblx0XHQndXNlci1kcmFnJzogJ25vbmUnLFxyXG5cdFx0J3RvdWNoLWNhbGxvdXQnOiAnbm9uZSdcclxuXHR9KTtcclxuXHRlbC5zZXRBdHRyaWJ1dGUoJ3Vuc2VsZWN0YWJsZScsICdvbicpO1xyXG5cdGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgcGQpO1xyXG59O1xyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uKGVsKXtcclxuXHRjc3MoZWwsIHtcclxuXHRcdCd1c2VyLXNlbGVjdCc6IG51bGwsXHJcblx0XHQndXNlci1kcmFnJzogbnVsbCxcclxuXHRcdCd0b3VjaC1jYWxsb3V0JzogbnVsbFxyXG5cdH0pO1xyXG5cdGVsLnJlbW92ZUF0dHJpYnV0ZSgndW5zZWxlY3RhYmxlJyk7XHJcblx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBwZCk7XHJcbn07XHJcblxyXG5cclxuLyoqIFByZXZlbnQgeW91IGtub3cgd2hhdC4gKi9cclxuZnVuY3Rpb24gcGQoZSl7XHJcblx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG59IiwiLyoqXHJcbiAqIFBhcnNlIHRyYW5zbGF0ZTNkXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3MvdHJhbnNsYXRlXHJcbiAqL1xyXG5cclxudmFyIGNzcyA9IHJlcXVpcmUoJy4vY3NzJyk7XHJcbnZhciBwYXJzZVZhbHVlID0gcmVxdWlyZSgnLi9wYXJzZS12YWx1ZScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWwpIHtcclxuXHR2YXIgdHJhbnNsYXRlU3RyID0gY3NzKGVsLCAndHJhbnNmb3JtJyk7XHJcblxyXG5cdC8vZmluZCB0cmFuc2xhdGUgdG9rZW4sIHJldHJpZXZlIGNvbW1hLWVuY2xvc2VkIHZhbHVlc1xyXG5cdC8vdHJhbnNsYXRlM2QoMXB4LCAycHgsIDIpIOKGkiAxcHgsIDJweCwgMlxyXG5cdC8vRklYTUU6IGhhbmRsZSBuZXN0ZWQgY2FsY3NcclxuXHR2YXIgbWF0Y2ggPSAvdHJhbnNsYXRlKD86M2QpP1xccypcXCgoW15cXCldKilcXCkvLmV4ZWModHJhbnNsYXRlU3RyKTtcclxuXHJcblx0aWYgKCFtYXRjaCkgcmV0dXJuIG51bGw7XHJcblx0dmFyIHZhbHVlcyA9IG1hdGNoWzFdLnNwbGl0KC9cXHMqLFxccyovKTtcclxuXHJcblx0Ly9wYXJzZSB2YWx1ZXNcclxuXHQvL0ZJWE1FOiBuZXN0ZWQgdmFsdWVzIGFyZSBub3QgbmVjZXNzYXJpbHkgcGl4ZWxzXHJcblx0cmV0dXJuIHZhbHVlcy5tYXAoZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRyZXR1cm4gcGFyc2VWYWx1ZSh2YWx1ZSk7XHJcblx0fSk7XHJcbn07IiwiLyoqXHJcbiAqIENsYW1wZXIuXHJcbiAqIERldGVjdHMgcHJvcGVyIGNsYW1wIG1pbi9tYXguXHJcbiAqXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBhIEN1cnJlbnQgdmFsdWUgdG8gY3V0IG9mZlxyXG4gKiBAcGFyYW0ge251bWJlcn0gbWluIE9uZSBzaWRlIGxpbWl0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXggT3RoZXIgc2lkZSBsaW1pdFxyXG4gKlxyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IENsYW1wZWQgdmFsdWVcclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd3JhcCcpKGZ1bmN0aW9uKGEsIG1pbiwgbWF4KXtcclxuXHRyZXR1cm4gbWF4ID4gbWluID8gTWF0aC5tYXgoTWF0aC5taW4oYSxtYXgpLG1pbikgOiBNYXRoLm1heChNYXRoLm1pbihhLG1pbiksbWF4KTtcclxufSk7IiwiLyoqXHJcbiAqIEBtb2R1bGUgIG11bWF0aC9sb29wXHJcbiAqXHJcbiAqIExvb3BpbmcgZnVuY3Rpb24gZm9yIGFueSBmcmFtZXNpemVcclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd3JhcCcpKGZ1bmN0aW9uICh2YWx1ZSwgbGVmdCwgcmlnaHQpIHtcclxuXHQvL2RldGVjdCBzaW5nbGUtYXJnIGNhc2UsIGxpa2UgbW9kLWxvb3BcclxuXHRpZiAocmlnaHQgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0cmlnaHQgPSBsZWZ0O1xyXG5cdFx0bGVmdCA9IDA7XHJcblx0fVxyXG5cclxuXHQvL3N3YXAgZnJhbWUgb3JkZXJcclxuXHRpZiAobGVmdCA+IHJpZ2h0KSB7XHJcblx0XHR2YXIgdG1wID0gcmlnaHQ7XHJcblx0XHRyaWdodCA9IGxlZnQ7XHJcblx0XHRsZWZ0ID0gdG1wO1xyXG5cdH1cclxuXHJcblx0dmFyIGZyYW1lID0gcmlnaHQgLSBsZWZ0O1xyXG5cclxuXHR2YWx1ZSA9ICgodmFsdWUgKyBsZWZ0KSAlIGZyYW1lKSAtIGxlZnQ7XHJcblx0aWYgKHZhbHVlIDwgbGVmdCkgdmFsdWUgKz0gZnJhbWU7XHJcblx0aWYgKHZhbHVlID4gcmlnaHQpIHZhbHVlIC09IGZyYW1lO1xyXG5cclxuXHRyZXR1cm4gdmFsdWU7XHJcbn0pOyIsIi8qKlxyXG4gKiBAbW9kdWxlICBtdW1hdGgvcHJlY2lzaW9uXHJcbiAqXHJcbiAqIEdldCBwcmVjaXNpb24gZnJvbSBmbG9hdDpcclxuICpcclxuICogQGV4YW1wbGVcclxuICogMS4xIOKGkiAxLCAxMjM0IOKGkiAwLCAuMTIzNCDihpIgNFxyXG4gKlxyXG4gKiBAcGFyYW0ge251bWJlcn0gblxyXG4gKlxyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IGRlY2ltYXAgcGxhY2VzXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbihuKXtcclxuXHR2YXIgcyA9IG4gKyAnJyxcclxuXHRcdGQgPSBzLmluZGV4T2YoJy4nKSArIDE7XHJcblxyXG5cdHJldHVybiAhZCA/IDAgOiBzLmxlbmd0aCAtIGQ7XHJcbn0pOyIsIi8qKlxyXG4gKiBQcmVjaXNpb24gcm91bmRcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGVwIE1pbmltYWwgZGlzY3JldGUgdG8gcm91bmRcclxuICpcclxuICogQHJldHVybiB7bnVtYmVyfVxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB0b1ByZWNpc2lvbigyMTMuMzQsIDEpID09IDIxM1xyXG4gKiB0b1ByZWNpc2lvbigyMTMuMzQsIC4xKSA9PSAyMTMuM1xyXG4gKiB0b1ByZWNpc2lvbigyMTMuMzQsIDEwKSA9PSAyMTBcclxuICovXHJcbnZhciBwcmVjaXNpb24gPSByZXF1aXJlKCcuL3ByZWNpc2lvbicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbih2YWx1ZSwgc3RlcCkge1xyXG5cdGlmIChzdGVwID09PSAwKSByZXR1cm4gdmFsdWU7XHJcblx0aWYgKCFzdGVwKSByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSk7XHJcblx0c3RlcCA9IHBhcnNlRmxvYXQoc3RlcCk7XHJcblx0dmFsdWUgPSBNYXRoLnJvdW5kKHZhbHVlIC8gc3RlcCkgKiBzdGVwO1xyXG5cdHJldHVybiBwYXJzZUZsb2F0KHZhbHVlLnRvRml4ZWQocHJlY2lzaW9uKHN0ZXApKSk7XHJcbn0pOyIsIi8qKlxyXG4gKiBHZXQgZm4gd3JhcHBlZCB3aXRoIGFycmF5L29iamVjdCBhdHRycyByZWNvZ25pdGlvblxyXG4gKlxyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGFyZ2V0IGZ1bmN0aW9uXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGZuKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24oYSl7XHJcblx0XHR2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuXHRcdGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuXHRcdFx0dmFyIHJlc3VsdCA9IG5ldyBBcnJheShhLmxlbmd0aCksIHNsaWNlO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspe1xyXG5cdFx0XHRcdHNsaWNlID0gW107XHJcblx0XHRcdFx0Zm9yICh2YXIgaiA9IDAsIGwgPSBhcmdzLmxlbmd0aCwgdmFsOyBqIDwgbDsgaisrKXtcclxuXHRcdFx0XHRcdHZhbCA9IGFyZ3Nbal0gaW5zdGFuY2VvZiBBcnJheSA/IGFyZ3Nbal1baV0gOiBhcmdzW2pdO1xyXG5cdFx0XHRcdFx0dmFsID0gdmFsO1xyXG5cdFx0XHRcdFx0c2xpY2UucHVzaCh2YWwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXN1bHRbaV0gPSBmbi5hcHBseSh0aGlzLCBzbGljZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHR5cGVvZiBhID09PSAnb2JqZWN0Jykge1xyXG5cdFx0XHR2YXIgcmVzdWx0ID0ge30sIHNsaWNlO1xyXG5cdFx0XHRmb3IgKHZhciBpIGluIGEpe1xyXG5cdFx0XHRcdHNsaWNlID0gW107XHJcblx0XHRcdFx0Zm9yICh2YXIgaiA9IDAsIGwgPSBhcmdzLmxlbmd0aCwgdmFsOyBqIDwgbDsgaisrKXtcclxuXHRcdFx0XHRcdHZhbCA9IHR5cGVvZiBhcmdzW2pdID09PSAnb2JqZWN0JyA/IGFyZ3Nbal1baV0gOiBhcmdzW2pdO1xyXG5cdFx0XHRcdFx0dmFsID0gdmFsO1xyXG5cdFx0XHRcdFx0c2xpY2UucHVzaCh2YWwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXN1bHRbaV0gPSBmbi5hcHBseSh0aGlzLCBzbGljZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncyk7XHJcblx0XHR9XHJcblx0fTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGEpe1xyXG5cdHJldHVybiB0eXBlb2YgYSA9PT0gJ251bWJlcicgfHwgYSBpbnN0YW5jZW9mIE51bWJlcjtcclxufSIsIi8qKlxyXG4gKiBAbW9kdWxlIGVtbXkvZW1pdFxyXG4gKi9cclxudmFyIGljaWNsZSA9IHJlcXVpcmUoJ2ljaWNsZScpO1xyXG52YXIgc2xpY2UgPSByZXF1aXJlKCdzbGljZWQnKTtcclxudmFyIGlzU3RyaW5nID0gcmVxdWlyZSgnbXV0eXBlL2lzLXN0cmluZycpO1xyXG52YXIgaXNOb2RlID0gcmVxdWlyZSgnbXV0eXBlL2lzLW5vZGUnKTtcclxudmFyIGlzRXZlbnQgPSByZXF1aXJlKCdtdXR5cGUvaXMtZXZlbnQnKTtcclxudmFyIGxpc3RlbmVycyA9IHJlcXVpcmUoJy4vbGlzdGVuZXJzJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgc2ltcGxlIHdyYXBwZXIgdG8gaGFuZGxlIHN0cmluZ3kvcGxhaW4gZXZlbnRzXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRhcmdldCwgZXZ0KXtcclxuXHRpZiAoIXRhcmdldCkgcmV0dXJuO1xyXG5cclxuXHR2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuXHRpZiAoaXNTdHJpbmcoZXZ0KSkge1xyXG5cdFx0YXJncyA9IHNsaWNlKGFyZ3VtZW50cywgMik7XHJcblx0XHRldnQuc3BsaXQoL1xccysvKS5mb3JFYWNoKGZ1bmN0aW9uKGV2dCl7XHJcblx0XHRcdGV2dCA9IGV2dC5zcGxpdCgnLicpWzBdO1xyXG5cclxuXHRcdFx0ZW1pdC5hcHBseSh0aGlzLCBbdGFyZ2V0LCBldnRdLmNvbmNhdChhcmdzKSk7XHJcblx0XHR9KTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmV0dXJuIGVtaXQuYXBwbHkodGhpcywgYXJncyk7XHJcblx0fVxyXG59O1xyXG5cclxuXHJcbi8qKiBkZXRlY3QgZW52ICovXHJcbnZhciAkID0gdHlwZW9mIGpRdWVyeSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBqUXVlcnk7XHJcbnZhciBkb2MgPSB0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogZG9jdW1lbnQ7XHJcbnZhciB3aW4gPSB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IHdpbmRvdztcclxuXHJcblxyXG4vKipcclxuICogRW1pdCBhbiBldmVudCwgb3B0aW9uYWxseSB3aXRoIGRhdGEgb3IgYnViYmxpbmdcclxuICogQWNjZXB0IG9ubHkgc2luZ2xlIGVsZW1lbnRzL2V2ZW50c1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEFuIGV2ZW50IG5hbWUsIGUuIGcuICdjbGljaydcclxuICogQHBhcmFtIHsqfSBkYXRhIEFueSBkYXRhIHRvIHBhc3MgdG8gZXZlbnQuZGV0YWlscyAoRE9NKSBvciBldmVudC5kYXRhIChlbHNld2hlcmUpXHJcbiAqIEBwYXJhbSB7Ym9vbH0gYnViYmxlcyBXaGV0aGVyIHRvIHRyaWdnZXIgYnViYmxpbmcgZXZlbnQgKERPTSlcclxuICpcclxuICpcclxuICogQHJldHVybiB7dGFyZ2V0fSBhIHRhcmdldFxyXG4gKi9cclxuZnVuY3Rpb24gZW1pdCh0YXJnZXQsIGV2ZW50TmFtZSwgZGF0YSwgYnViYmxlcyl7XHJcblx0dmFyIGVtaXRNZXRob2QsIGV2dCA9IGV2ZW50TmFtZTtcclxuXHJcblx0Ly9DcmVhdGUgcHJvcGVyIGV2ZW50IGZvciBET00gb2JqZWN0c1xyXG5cdGlmIChpc05vZGUodGFyZ2V0KSB8fCB0YXJnZXQgPT09IHdpbikge1xyXG5cdFx0Ly9OT1RFOiB0aGlzIGRvZXNub3QgYnViYmxlIG9uIG9mZi1ET00gZWxlbWVudHNcclxuXHJcblx0XHRpZiAoaXNFdmVudChldmVudE5hbWUpKSB7XHJcblx0XHRcdGV2dCA9IGV2ZW50TmFtZTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdC8vSUU5LWNvbXBsaWFudCBjb25zdHJ1Y3RvclxyXG5cdFx0XHRldnQgPSBkb2MuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XHJcblx0XHRcdGV2dC5pbml0Q3VzdG9tRXZlbnQoZXZlbnROYW1lLCBidWJibGVzLCB0cnVlLCBkYXRhKTtcclxuXHJcblx0XHRcdC8vYSBtb2Rlcm4gY29uc3RydWN0b3Igd291bGQgYmU6XHJcblx0XHRcdC8vIHZhciBldnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lLCB7IGRldGFpbDogZGF0YSwgYnViYmxlczogYnViYmxlcyB9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGVtaXRNZXRob2QgPSB0YXJnZXQuZGlzcGF0Y2hFdmVudDtcclxuXHR9XHJcblxyXG5cdC8vY3JlYXRlIGV2ZW50IGZvciBqUXVlcnkgb2JqZWN0XHJcblx0ZWxzZSBpZiAoJCAmJiB0YXJnZXQgaW5zdGFuY2VvZiAkKSB7XHJcblx0XHQvL1RPRE86IGRlY2lkZSBob3cgdG8gcGFzcyBkYXRhXHJcblx0XHRldnQgPSAkLkV2ZW50KCBldmVudE5hbWUsIGRhdGEgKTtcclxuXHRcdGV2dC5kZXRhaWwgPSBkYXRhO1xyXG5cclxuXHRcdC8vRklYTUU6IHJlZmVyZW5jZSBjYXNlIHdoZXJlIHRyaWdnZXJIYW5kbGVyIG5lZWRlZCAoc29tZXRoaW5nIHdpdGggbXVsdGlwbGUgY2FsbHMpXHJcblx0XHRlbWl0TWV0aG9kID0gYnViYmxlcyA/IHRhcmd0ZS50cmlnZ2VyIDogdGFyZ2V0LnRyaWdnZXJIYW5kbGVyO1xyXG5cdH1cclxuXHJcblx0Ly9kZXRlY3QgdGFyZ2V0IGV2ZW50c1xyXG5cdGVsc2Uge1xyXG5cdFx0Ly9lbWl0IC0gZGVmYXVsdFxyXG5cdFx0Ly90cmlnZ2VyIC0ganF1ZXJ5XHJcblx0XHQvL2Rpc3BhdGNoRXZlbnQgLSBET01cclxuXHRcdC8vcmFpc2UgLSBub2RlLXN0YXRlXHJcblx0XHQvL2ZpcmUgLSA/Pz9cclxuXHRcdGVtaXRNZXRob2QgPSB0YXJnZXRbJ2Rpc3BhdGNoRXZlbnQnXSB8fCB0YXJnZXRbJ2VtaXQnXSB8fCB0YXJnZXRbJ3RyaWdnZXInXSB8fCB0YXJnZXRbJ2ZpcmUnXSB8fCB0YXJnZXRbJ3JhaXNlJ107XHJcblx0fVxyXG5cclxuXHJcblx0dmFyIGFyZ3MgPSBzbGljZShhcmd1bWVudHMsIDIpO1xyXG5cclxuXHJcblx0Ly91c2UgbG9ja3MgdG8gYXZvaWQgc2VsZi1yZWN1cnNpb24gb24gb2JqZWN0cyB3cmFwcGluZyB0aGlzIG1ldGhvZFxyXG5cdGlmIChlbWl0TWV0aG9kKSB7XHJcblx0XHRpZiAoaWNpY2xlLmZyZWV6ZSh0YXJnZXQsICdlbWl0JyArIGV2ZW50TmFtZSkpIHtcclxuXHRcdFx0Ly91c2UgdGFyZ2V0IGV2ZW50IHN5c3RlbSwgaWYgcG9zc2libGVcclxuXHRcdFx0ZW1pdE1ldGhvZC5hcHBseSh0YXJnZXQsIFtldnRdLmNvbmNhdChhcmdzKSk7XHJcblx0XHRcdGljaWNsZS51bmZyZWV6ZSh0YXJnZXQsICdlbWl0JyArIGV2ZW50TmFtZSk7XHJcblxyXG5cdFx0XHRyZXR1cm4gdGFyZ2V0O1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vaWYgZXZlbnQgd2FzIGZyb3plbiAtIHByb2JhYmx5IGl0IGlzIGVtaXR0ZXIgaW5zdGFuY2VcclxuXHRcdC8vc28gcGVyZm9ybSBub3JtYWwgY2FsbGJhY2tcclxuXHR9XHJcblxyXG5cclxuXHQvL2ZhbGwgYmFjayB0byBkZWZhdWx0IGV2ZW50IHN5c3RlbVxyXG5cdHZhciBldnRDYWxsYmFja3MgPSBsaXN0ZW5lcnModGFyZ2V0LCBldnQpO1xyXG5cclxuXHQvL2NvcHkgY2FsbGJhY2tzIHRvIGZpcmUgYmVjYXVzZSBsaXN0IGNhbiBiZSBjaGFuZ2VkIGJ5IHNvbWUgY2FsbGJhY2sgKGxpa2UgYG9mZmApXHJcblx0dmFyIGZpcmVMaXN0ID0gc2xpY2UoZXZ0Q2FsbGJhY2tzKTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGZpcmVMaXN0Lmxlbmd0aDsgaSsrICkge1xyXG5cdFx0ZmlyZUxpc3RbaV0gJiYgZmlyZUxpc3RbaV0uYXBwbHkodGFyZ2V0LCBhcmdzKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB0YXJnZXQ7XHJcbn0iLCIvKipcclxuICogQSBzdG9yYWdlIG9mIHBlci10YXJnZXQgY2FsbGJhY2tzLlxyXG4gKiBXZWFrTWFwIGlzIHRoZSBtb3N0IHNhZmUgc29sdXRpb24uXHJcbiAqXHJcbiAqIEBtb2R1bGUgZW1teS9saXN0ZW5lcnNcclxuICovXHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3BlcnR5IG5hbWUgdG8gcHJvdmlkZSBvbiB0YXJnZXRzLlxyXG4gKlxyXG4gKiBDYW7igJl0IHVzZSBnbG9iYWwgV2Vha01hcCAtXHJcbiAqIGl0IGlzIGltcG9zc2libGUgdG8gcHJvdmlkZSBzaW5nbGV0b24gZ2xvYmFsIGNhY2hlIG9mIGNhbGxiYWNrcyBmb3IgdGFyZ2V0c1xyXG4gKiBub3QgcG9sbHV0aW5nIGdsb2JhbCBzY29wZS4gU28gaXQgaXMgYmV0dGVyIHRvIHBvbGx1dGUgdGFyZ2V0IHNjb3BlIHRoYW4gdGhlIGdsb2JhbC5cclxuICpcclxuICogT3RoZXJ3aXNlLCBlYWNoIGVtbXkgaW5zdGFuY2Ugd2lsbCBjcmVhdGUgaXTigJlzIG93biBjYWNoZSwgd2hpY2ggbGVhZHMgdG8gbWVzcy5cclxuICpcclxuICogQWxzbyBjYW7igJl0IHVzZSBgLl9ldmVudHNgIHByb3BlcnR5IG9uIHRhcmdldHMsIGFzIGl0IGlzIGRvbmUgaW4gYGV2ZW50c2AgbW9kdWxlLFxyXG4gKiBiZWNhdXNlIGl0IGlzIGluY29tcGF0aWJsZS4gRW1teSB0YXJnZXRzIHVuaXZlcnNhbCBldmVudHMgd3JhcHBlciwgbm90IHRoZSBuYXRpdmUgaW1wbGVtZW50YXRpb24uXHJcbiAqL1xyXG52YXIgY2JQcm9wTmFtZSA9ICdfY2FsbGJhY2tzJztcclxuXHJcblxyXG4vKipcclxuICogR2V0IGxpc3RlbmVycyBmb3IgdGhlIHRhcmdldC9ldnQgKG9wdGlvbmFsbHkpLlxyXG4gKlxyXG4gKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IGEgdGFyZ2V0IG9iamVjdFxyXG4gKiBAcGFyYW0ge3N0cmluZ30/IGV2dCBhbiBldnQgbmFtZSwgaWYgdW5kZWZpbmVkIC0gcmV0dXJuIG9iamVjdCB3aXRoIGV2ZW50c1xyXG4gKlxyXG4gKiBAcmV0dXJuIHsob2JqZWN0fGFycmF5KX0gTGlzdC9zZXQgb2YgbGlzdGVuZXJzXHJcbiAqL1xyXG5mdW5jdGlvbiBsaXN0ZW5lcnModGFyZ2V0LCBldnQsIHRhZ3Mpe1xyXG5cdHZhciBjYnMgPSB0YXJnZXRbY2JQcm9wTmFtZV07XHJcblxyXG5cdGlmICghZXZ0KSByZXR1cm4gY2JzIHx8IHt9O1xyXG5cdGlmICghY2JzIHx8ICFjYnNbZXZ0XSkgcmV0dXJuIFtdO1xyXG5cclxuXHR2YXIgcmVzdWx0ID0gY2JzW2V2dF07XHJcblxyXG5cdC8vaWYgdGhlcmUgYXJlIGV2dCBuYW1lc3BhY2VzIHNwZWNpZmllZCAtIGZpbHRlciBjYWxsYmFja3NcclxuXHRpZiAodGFncyAmJiB0YWdzLmxlbmd0aCkge1xyXG5cdFx0cmVzdWx0ID0gcmVzdWx0LmZpbHRlcihmdW5jdGlvbihjYil7XHJcblx0XHRcdHJldHVybiBoYXNUYWdzKGNiLCB0YWdzKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmUgbGlzdGVuZXIsIGlmIGFueVxyXG4gKi9cclxubGlzdGVuZXJzLnJlbW92ZSA9IGZ1bmN0aW9uKHRhcmdldCwgZXZ0LCBjYiwgdGFncyl7XHJcblx0Ly9nZXQgY2FsbGJhY2tzIGZvciB0aGUgZXZ0XHJcblx0dmFyIGV2dENhbGxiYWNrcyA9IHRhcmdldFtjYlByb3BOYW1lXTtcclxuXHRpZiAoIWV2dENhbGxiYWNrcyB8fCAhZXZ0Q2FsbGJhY2tzW2V2dF0pIHJldHVybiBmYWxzZTtcclxuXHJcblx0dmFyIGNhbGxiYWNrcyA9IGV2dENhbGxiYWNrc1tldnRdO1xyXG5cclxuXHQvL2lmIHRhZ3MgYXJlIHBhc3NlZCAtIG1ha2Ugc3VyZSBjYWxsYmFjayBoYXMgc29tZSB0YWdzIGJlZm9yZSByZW1vdmluZ1xyXG5cdGlmICh0YWdzICYmIHRhZ3MubGVuZ3RoICYmICFoYXNUYWdzKGNiLCB0YWdzKSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHQvL3JlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdC8vb25jZSBtZXRob2QgaGFzIG9yaWdpbmFsIGNhbGxiYWNrIGluIC5jYlxyXG5cdFx0aWYgKGNhbGxiYWNrc1tpXSA9PT0gY2IgfHwgY2FsbGJhY2tzW2ldLmZuID09PSBjYikge1xyXG5cdFx0XHRjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEFkZCBhIG5ldyBsaXN0ZW5lclxyXG4gKi9cclxubGlzdGVuZXJzLmFkZCA9IGZ1bmN0aW9uKHRhcmdldCwgZXZ0LCBjYiwgdGFncyl7XHJcblx0aWYgKCFjYikgcmV0dXJuO1xyXG5cclxuXHR2YXIgdGFyZ2V0Q2FsbGJhY2tzID0gdGFyZ2V0W2NiUHJvcE5hbWVdO1xyXG5cclxuXHQvL2Vuc3VyZSBzZXQgb2YgY2FsbGJhY2tzIGZvciB0aGUgdGFyZ2V0IGV4aXN0c1xyXG5cdGlmICghdGFyZ2V0Q2FsbGJhY2tzKSB7XHJcblx0XHR0YXJnZXRDYWxsYmFja3MgPSB7fTtcclxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGNiUHJvcE5hbWUsIHtcclxuXHRcdFx0dmFsdWU6IHRhcmdldENhbGxiYWNrc1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHQvL3NhdmUgYSBuZXcgY2FsbGJhY2tcclxuXHQodGFyZ2V0Q2FsbGJhY2tzW2V2dF0gPSB0YXJnZXRDYWxsYmFja3NbZXZ0XSB8fCBbXSkucHVzaChjYik7XHJcblxyXG5cdC8vc2F2ZSBucyBmb3IgYSBjYWxsYmFjaywgaWYgYW55XHJcblx0aWYgKHRhZ3MgJiYgdGFncy5sZW5ndGgpIHtcclxuXHRcdGNiLl9ucyA9IHRhZ3M7XHJcblx0fVxyXG59O1xyXG5cclxuXHJcbi8qKiBEZXRlY3Qgd2hldGhlciBhbiBjYiBoYXMgYXQgbGVhc3Qgb25lIHRhZyBmcm9tIHRoZSBsaXN0ICovXHJcbmZ1bmN0aW9uIGhhc1RhZ3MoY2IsIHRhZ3Mpe1xyXG5cdGlmIChjYi5fbnMpIHtcclxuXHRcdC8vaWYgY2IgaXMgdGFnZ2VkIHdpdGggYSBucyBhbmQgaW5jbHVkZXMgb25lIG9mIHRoZSBucyBwYXNzZWQgLSBrZWVwIGl0XHJcblx0XHRmb3IgKHZhciBpID0gdGFncy5sZW5ndGg7IGktLTspe1xyXG5cdFx0XHRpZiAoY2IuX25zLmluZGV4T2YodGFnc1tpXSkgPj0gMCkgcmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBsaXN0ZW5lcnM7IiwiLyoqXHJcbiAqIEBtb2R1bGUgSWNpY2xlXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHRmcmVlemU6IGxvY2ssXHJcblx0dW5mcmVlemU6IHVubG9jayxcclxuXHRpc0Zyb3plbjogaXNMb2NrZWRcclxufTtcclxuXHJcblxyXG4vKiogU2V0IG9mIHRhcmdldHMgICovXHJcbnZhciBsb2NrQ2FjaGUgPSBuZXcgV2Vha01hcDtcclxuXHJcblxyXG4vKipcclxuICogU2V0IGZsYWcgb24gdGFyZ2V0IHdpdGggdGhlIG5hbWUgcGFzc2VkXHJcbiAqXHJcbiAqIEByZXR1cm4ge2Jvb2x9IFdoZXRoZXIgbG9jayBzdWNjZWVkZWRcclxuICovXHJcbmZ1bmN0aW9uIGxvY2sodGFyZ2V0LCBuYW1lKXtcclxuXHR2YXIgbG9ja3MgPSBsb2NrQ2FjaGUuZ2V0KHRhcmdldCk7XHJcblx0aWYgKGxvY2tzICYmIGxvY2tzW25hbWVdKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdC8vY3JlYXRlIGxvY2sgc2V0IGZvciBhIHRhcmdldCwgaWYgbm9uZVxyXG5cdGlmICghbG9ja3MpIHtcclxuXHRcdGxvY2tzID0ge307XHJcblx0XHRsb2NrQ2FjaGUuc2V0KHRhcmdldCwgbG9ja3MpO1xyXG5cdH1cclxuXHJcblx0Ly9zZXQgYSBuZXcgbG9ja1xyXG5cdGxvY2tzW25hbWVdID0gdHJ1ZTtcclxuXHJcblx0Ly9yZXR1cm4gc3VjY2Vzc1xyXG5cdHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFVuc2V0IGZsYWcgb24gdGhlIHRhcmdldCB3aXRoIHRoZSBuYW1lIHBhc3NlZC5cclxuICpcclxuICogTm90ZSB0aGF0IGlmIHRvIHJldHVybiBuZXcgdmFsdWUgZnJvbSB0aGUgbG9jay91bmxvY2ssXHJcbiAqIHRoZW4gdW5sb2NrIHdpbGwgYWx3YXlzIHJldHVybiBmYWxzZSBhbmQgbG9jayB3aWxsIGFsd2F5cyByZXR1cm4gdHJ1ZSxcclxuICogd2hpY2ggaXMgdXNlbGVzcyBmb3IgdGhlIHVzZXIsIHRob3VnaCBtYXliZSBpbnR1aXRpdmUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Kn0gdGFyZ2V0IEFueSBvYmplY3RcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgQSBmbGFnIG5hbWVcclxuICpcclxuICogQHJldHVybiB7Ym9vbH0gV2hldGhlciB1bmxvY2sgZmFpbGVkLlxyXG4gKi9cclxuZnVuY3Rpb24gdW5sb2NrKHRhcmdldCwgbmFtZSl7XHJcblx0dmFyIGxvY2tzID0gbG9ja0NhY2hlLmdldCh0YXJnZXQpO1xyXG5cdGlmICghbG9ja3MgfHwgIWxvY2tzW25hbWVdKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdGxvY2tzW25hbWVdID0gbnVsbDtcclxuXHJcblx0cmV0dXJuIHRydWU7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmV0dXJuIHdoZXRoZXIgZmxhZyBpcyBzZXRcclxuICpcclxuICogQHBhcmFtIHsqfSB0YXJnZXQgQW55IG9iamVjdCB0byBhc3NvY2lhdGUgbG9jayB3aXRoXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEEgZmxhZyBuYW1lXHJcbiAqXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IFdoZXRoZXIgbG9ja2VkIG9yIG5vdFxyXG4gKi9cclxuZnVuY3Rpb24gaXNMb2NrZWQodGFyZ2V0LCBuYW1lKXtcclxuXHR2YXIgbG9ja3MgPSBsb2NrQ2FjaGUuZ2V0KHRhcmdldCk7XHJcblx0cmV0dXJuIChsb2NrcyAmJiBsb2Nrc1tuYW1lXSk7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRhcmdldCl7XHJcblx0cmV0dXJuIHR5cGVvZiBFdmVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGFyZ2V0IGluc3RhbmNlb2YgRXZlbnQ7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0YXJnZXQpe1xyXG5cdHJldHVybiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHRhcmdldCBpbnN0YW5jZW9mIE5vZGU7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhKXtcclxuXHRyZXR1cm4gdHlwZW9mIGEgPT09ICdzdHJpbmcnIHx8IGEgaW5zdGFuY2VvZiBTdHJpbmc7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9zbGljZWQnKTtcbiIsIlxuLyoqXG4gKiBBbiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpIGFsdGVybmF0aXZlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFyZ3Mgc29tZXRoaW5nIHdpdGggYSBsZW5ndGhcbiAqIEBwYXJhbSB7TnVtYmVyfSBzbGljZVxuICogQHBhcmFtIHtOdW1iZXJ9IHNsaWNlRW5kXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFyZ3MsIHNsaWNlLCBzbGljZUVuZCkge1xuICB2YXIgcmV0ID0gW107XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcblxuICBpZiAoMCA9PT0gbGVuKSByZXR1cm4gcmV0O1xuXG4gIHZhciBzdGFydCA9IHNsaWNlIDwgMFxuICAgID8gTWF0aC5tYXgoMCwgc2xpY2UgKyBsZW4pXG4gICAgOiBzbGljZSB8fCAwO1xuXG4gIGlmIChzbGljZUVuZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuID0gc2xpY2VFbmQgPCAwXG4gICAgICA/IHNsaWNlRW5kICsgbGVuXG4gICAgICA6IHNsaWNlRW5kXG4gIH1cblxuICB3aGlsZSAobGVuLS0gPiBzdGFydCkge1xuICAgIHJldFtsZW4gLSBzdGFydF0gPSBhcmdzW2xlbl07XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG4iLCIvKipcclxuICogQG1vZHVsZSBlbW15L29mZlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBvZmY7XHJcblxyXG52YXIgaWNpY2xlID0gcmVxdWlyZSgnaWNpY2xlJyk7XHJcbnZhciBzbGljZSA9IHJlcXVpcmUoJ3NsaWNlZCcpO1xyXG52YXIgbGlzdGVuZXJzID0gcmVxdWlyZSgnLi9saXN0ZW5lcnMnKTtcclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlIGxpc3RlbmVyW3NdIGZyb20gdGhlIHRhcmdldFxyXG4gKlxyXG4gKiBAcGFyYW0ge1t0eXBlXX0gZXZ0IFtkZXNjcmlwdGlvbl1cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gW2Rlc2NyaXB0aW9uXVxyXG4gKlxyXG4gKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cclxuICovXHJcbmZ1bmN0aW9uIG9mZih0YXJnZXQsIGV2dCwgZm4pIHtcclxuXHRpZiAoIXRhcmdldCkgcmV0dXJuIHRhcmdldDtcclxuXHJcblx0dmFyIGNhbGxiYWNrcywgaTtcclxuXHJcblx0Ly91bmJpbmQgYWxsIGxpc3RlbmVycyBpZiBubyBmbiBzcGVjaWZpZWRcclxuXHRpZiAoZm4gPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0dmFyIGFyZ3MgPSBzbGljZShhcmd1bWVudHMsIDEpO1xyXG5cclxuXHRcdC8vdHJ5IHRvIHVzZSB0YXJnZXQgcmVtb3ZlQWxsIG1ldGhvZCwgaWYgYW55XHJcblx0XHR2YXIgYWxsT2ZmID0gdGFyZ2V0WydyZW1vdmVBbGwnXSB8fCB0YXJnZXRbJ3JlbW92ZUFsbExpc3RlbmVycyddO1xyXG5cclxuXHRcdC8vY2FsbCB0YXJnZXQgcmVtb3ZlQWxsXHJcblx0XHRpZiAoYWxsT2ZmKSB7XHJcblx0XHRcdGFsbE9mZi5hcHBseSh0YXJnZXQsIGFyZ3MpO1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHQvL3RoZW4gZm9yZ2V0IG93biBjYWxsYmFja3MsIGlmIGFueVxyXG5cclxuXHRcdC8vdW5iaW5kIGFsbCBldnRzXHJcblx0XHRpZiAoIWV2dCkge1xyXG5cdFx0XHRjYWxsYmFja3MgPSBsaXN0ZW5lcnModGFyZ2V0KTtcclxuXHRcdFx0Zm9yIChldnQgaW4gY2FsbGJhY2tzKSB7XHJcblx0XHRcdFx0b2ZmKHRhcmdldCwgZXZ0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly91bmJpbmQgYWxsIGNhbGxiYWNrcyBmb3IgYW4gZXZ0XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Ly9pbnZva2UgbWV0aG9kIGZvciBlYWNoIHNwYWNlLXNlcGFyYXRlZCBldmVudCBmcm9tIGEgbGlzdFxyXG5cdFx0XHRldnQuc3BsaXQoL1xccysvKS5mb3JFYWNoKGZ1bmN0aW9uIChldnQpIHtcclxuXHRcdFx0XHR2YXIgZXZ0UGFydHMgPSBldnQuc3BsaXQoJy4nKTtcclxuXHRcdFx0XHRldnQgPSBldnRQYXJ0cy5zaGlmdCgpO1xyXG5cdFx0XHRcdGNhbGxiYWNrcyA9IGxpc3RlbmVycyh0YXJnZXQsIGV2dCwgZXZ0UGFydHMpO1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSBjYWxsYmFja3MubGVuZ3RoOyBpLS07KSB7XHJcblx0XHRcdFx0XHRvZmYodGFyZ2V0LCBldnQsIGNhbGxiYWNrc1tpXSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGFyZ2V0O1xyXG5cdH1cclxuXHJcblxyXG5cdC8vdGFyZ2V0IGV2ZW50cyAoc3RyaW5nIG5vdGF0aW9uIHRvIGFkdmFuY2VkX29wdGltaXphdGlvbnMpXHJcblx0dmFyIG9mZk1ldGhvZCA9IHRhcmdldFsncmVtb3ZlRXZlbnRMaXN0ZW5lciddIHx8IHRhcmdldFsncmVtb3ZlTGlzdGVuZXInXSB8fCB0YXJnZXRbJ2RldGFjaEV2ZW50J10gfHwgdGFyZ2V0WydvZmYnXTtcclxuXHJcblx0Ly9pbnZva2UgbWV0aG9kIGZvciBlYWNoIHNwYWNlLXNlcGFyYXRlZCBldmVudCBmcm9tIGEgbGlzdFxyXG5cdGV2dC5zcGxpdCgvXFxzKy8pLmZvckVhY2goZnVuY3Rpb24gKGV2dCkge1xyXG5cdFx0dmFyIGV2dFBhcnRzID0gZXZ0LnNwbGl0KCcuJyk7XHJcblx0XHRldnQgPSBldnRQYXJ0cy5zaGlmdCgpO1xyXG5cclxuXHRcdC8vdXNlIHRhcmdldCBgb2ZmYCwgaWYgcG9zc2libGVcclxuXHRcdGlmIChvZmZNZXRob2QpIHtcclxuXHRcdFx0Ly9hdm9pZCBzZWxmLXJlY3Vyc2lvbiBmcm9tIHRoZSBvdXRzaWRlXHJcblx0XHRcdGlmIChpY2ljbGUuZnJlZXplKHRhcmdldCwgJ29mZicgKyBldnQpKSB7XHJcblx0XHRcdFx0b2ZmTWV0aG9kLmNhbGwodGFyZ2V0LCBldnQsIGZuKTtcclxuXHRcdFx0XHRpY2ljbGUudW5mcmVlemUodGFyZ2V0LCAnb2ZmJyArIGV2dCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vaWYgaXTigJlzIGZyb3plbiAtIGlnbm9yZSBjYWxsXHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB0YXJnZXQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZm4uY2xvc2VkQ2FsbCkgZm4uY2xvc2VkQ2FsbCA9IGZhbHNlO1xyXG5cclxuXHRcdC8vZm9yZ2V0IGNhbGxiYWNrXHJcblx0XHRsaXN0ZW5lcnMucmVtb3ZlKHRhcmdldCwgZXZ0LCBmbiwgZXZ0UGFydHMpO1xyXG5cdH0pO1xyXG5cclxuXHJcblx0cmV0dXJuIHRhcmdldDtcclxufSIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcblx0XHQmJiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnXG5cdFx0JiYgdHlwZW9mIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPT09ICdmdW5jdGlvbic7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcblxuZnVuY3Rpb24gaXNGdW5jdGlvbiAoZm4pIHtcbiAgdmFyIHN0cmluZyA9IHRvU3RyaW5nLmNhbGwoZm4pXG4gIHJldHVybiBzdHJpbmcgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScgfHxcbiAgICAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nICYmIHN0cmluZyAhPT0gJ1tvYmplY3QgUmVnRXhwXScpIHx8XG4gICAgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgIC8vIElFOCBhbmQgYmVsb3dcbiAgICAgKGZuID09PSB3aW5kb3cuc2V0VGltZW91dCB8fFxuICAgICAgZm4gPT09IHdpbmRvdy5hbGVydCB8fFxuICAgICAgZm4gPT09IHdpbmRvdy5jb25maXJtIHx8XG4gICAgICBmbiA9PT0gd2luZG93LnByb21wdCkpXG59O1xuIiwiLyoqXHJcbiAqIEEgcXVlcnkgZW5naW5lICh3aXRoIG5vIHBzZXVkbyBjbGFzc2VzIHlldCkuXHJcbiAqXHJcbiAqIEBtb2R1bGUgcXVlcmllZC9saWIvaW5kZXhcclxuICovXHJcblxyXG4vL1RPRE86IGpxdWVyeSBzZWxlY3RvcnNcclxuLy9UT0RPOiB0ZXN0IG9yZGVyIG9mIHF1ZXJ5IHJlc3VsdCAoc2hvdWxkIGJlIGNvbXBsaWFudCB3aXRoIHF1ZXJ5U2VsZWN0b3JBbGwpXHJcbi8vVE9ETzogdGhpcmQgcXVlcnkgcGFyYW0gLSBpbmNsdWRlIHNlbGZcclxuLy9UT0RPOiAuY2xvc2VzdCwgLmFsbCwgLm5leHQsIC5wcmV2LCAucGFyZW50LCAuZmlsdGVyLCAubWF0aGVzIGV0YyBtZXRob2RzIC0gYWxsIHdpdGggdGhlIHNhbWUgQVBJOiBxdWVyeShzZWxlY3RvciwgW2VsXSwgW2luY1NlbGZdLCBbd2l0aGluXSkuXHJcbi8vVE9ETzogLmFsbCgnLngnLCAnLnNlbGVjdG9yJyk7XHJcbi8vVE9ETzogdXNlIHVuaXZlcnNhbCBwc2V1ZG8gbWFwcGVyL2ZpbHRlciBpbnN0ZWFkIG9mIHNlcGFyYXRlIG9uZXMuXHJcblxyXG5cclxudmFyIHNsaWNlID0gcmVxdWlyZSgnc2xpY2VkJyk7XHJcbnZhciB1bmlxdWUgPSByZXF1aXJlKCdhcnJheS11bmlxdWUnKTtcclxudmFyIGdldFVpZCA9IHJlcXVpcmUoJ2dldC11aWQnKTtcclxudmFyIHBhcmVuID0gcmVxdWlyZSgncGFyZW50aGVzaXMnKTtcclxudmFyIGlzU3RyaW5nID0gcmVxdWlyZSgnbXV0eXBlL2lzLXN0cmluZycpO1xyXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ211dHlwZS9pcy1hcnJheScpO1xyXG52YXIgaXNBcnJheUxpa2UgPSByZXF1aXJlKCdtdXR5cGUvaXMtYXJyYXktbGlrZScpO1xyXG52YXIgYXJyYXlpZnkgPSByZXF1aXJlKCdhcnJheWlmeS1jb21wYWN0Jyk7XHJcbnZhciBkb2MgPSByZXF1aXJlKCdnZXQtZG9jJyk7XHJcblxyXG5cclxuLyoqIFJlZ2lzdGVyZWQgcHNldWRvcyAqL1xyXG52YXIgcHNldWRvcyA9IHt9O1xyXG52YXIgZmlsdGVycyA9IHt9O1xyXG52YXIgbWFwcGVycyA9IHt9O1xyXG5cclxuXHJcbi8qKiBSZWdleHAgdG8gZ3JhYiBwc2V1ZG9zIHdpdGggcGFyYW1zICovXHJcbnZhciBwc2V1ZG9SRTtcclxuXHJcblxyXG4vKipcclxuICogQXBwZW5kIGEgbmV3IGZpbHRlcmluZyAoY2xhc3NpYykgcHNldWRvXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFBzZXVkbyBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZpbHRlciBBIGZpbHRlcmluZyBmdW5jdGlvblxyXG4gKi9cclxuZnVuY3Rpb24gcmVnaXN0ZXJGaWx0ZXIobmFtZSwgZmlsdGVyLCBpbmNTZWxmKXtcclxuXHRpZiAocHNldWRvc1tuYW1lXSkgcmV0dXJuO1xyXG5cclxuXHQvL3NhdmUgcHNldWRvIGZpbHRlclxyXG5cdHBzZXVkb3NbbmFtZV0gPSBmaWx0ZXI7XHJcblx0cHNldWRvc1tuYW1lXS5pbmNsdWRlU2VsZiA9IGluY1NlbGY7XHJcblx0ZmlsdGVyc1tuYW1lXSA9IHRydWU7XHJcblxyXG5cdHJlZ2VuZXJhdGVSZWdFeHAoKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBcHBlbmQgYSBuZXcgbWFwcGluZyAocmVsYXRpdmUtbGlrZSkgcHNldWRvXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHBzZXVkbyBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1hcHBlciBtYXAgZnVuY3Rpb25cclxuICovXHJcbmZ1bmN0aW9uIHJlZ2lzdGVyTWFwcGVyKG5hbWUsIG1hcHBlciwgaW5jU2VsZil7XHJcblx0aWYgKHBzZXVkb3NbbmFtZV0pIHJldHVybjtcclxuXHJcblx0cHNldWRvc1tuYW1lXSA9IG1hcHBlcjtcclxuXHRwc2V1ZG9zW25hbWVdLmluY2x1ZGVTZWxmID0gaW5jU2VsZjtcclxuXHRtYXBwZXJzW25hbWVdID0gdHJ1ZTtcclxuXHJcblx0cmVnZW5lcmF0ZVJlZ0V4cCgpO1xyXG59XHJcblxyXG5cclxuLyoqIFVwZGF0ZSByZWdleHAgY2F0Y2hpbmcgcHNldWRvcyAqL1xyXG5mdW5jdGlvbiByZWdlbmVyYXRlUmVnRXhwKCl7XHJcblx0cHNldWRvUkUgPSBuZXcgUmVnRXhwKCc6Oj8oJyArIE9iamVjdC5rZXlzKHBzZXVkb3MpLmpvaW4oJ3wnKSArICcpKFxcXFxcXFxcWzAtOV0rKT8nKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBRdWVyeSB3cmFwcGVyIC0gbWFpbiBtZXRob2QgdG8gcXVlcnkgZWxlbWVudHMuXHJcbiAqL1xyXG5mdW5jdGlvbiBxdWVyeU11bHRpcGxlKHNlbGVjdG9yLCBlbCkge1xyXG5cdC8vaWdub3JlIGJhZCBzZWxlY3RvclxyXG5cdGlmICghc2VsZWN0b3IpIHJldHVybiBbXTtcclxuXHJcblx0Ly9yZXR1cm4gZWxlbWVudHMgcGFzc2VkIGFzIGEgc2VsZWN0b3IgdW5jaGFuZ2VkIChjb3ZlciBwYXJhbXMgY2FzZSlcclxuXHRpZiAoIWlzU3RyaW5nKHNlbGVjdG9yKSkgcmV0dXJuIGlzQXJyYXkoc2VsZWN0b3IpID8gc2VsZWN0b3IgOiBbc2VsZWN0b3JdO1xyXG5cclxuXHQvL2NhdGNoIHBvbHlmaWxsYWJsZSBmaXJzdCBgOnNjb3BlYCBzZWxlY3RvciAtIGp1c3QgZXJhc2UgaXQsIHdvcmtzIGp1c3QgZmluZVxyXG5cdGlmIChwc2V1ZG9zLnNjb3BlKSBzZWxlY3RvciA9IHNlbGVjdG9yLnJlcGxhY2UoL15cXHMqOnNjb3BlLywgJycpO1xyXG5cclxuXHQvL2lnbm9yZSBub24tcXVlcnlhYmxlIGNvbnRhaW5lcnNcclxuXHRpZiAoIWVsKSBlbCA9IFtxdWVyeVNpbmdsZS5kb2N1bWVudF07XHJcblxyXG5cdC8vdHJlYXQgcGFzc2VkIGxpc3RcclxuXHRlbHNlIGlmIChpc0FycmF5TGlrZShlbCkpIHtcclxuXHRcdGVsID0gYXJyYXlpZnkoZWwpO1xyXG5cdH1cclxuXHJcblx0Ly9pZiBlbGVtZW50IGlzbuKAmXQgYSBub2RlIC0gbWFrZSBpdCBxLmRvY3VtZW50XHJcblx0ZWxzZSBpZiAoIWVsLnF1ZXJ5U2VsZWN0b3IpIHtcclxuXHRcdGVsID0gW3F1ZXJ5U2luZ2xlLmRvY3VtZW50XTtcclxuXHR9XHJcblxyXG5cdC8vbWFrZSBhbnkgb2sgZWxlbWVudCBhIGxpc3RcclxuXHRlbHNlIGVsID0gW2VsXTtcclxuXHJcblx0cmV0dXJuIHFQc2V1ZG9zKGVsLCBzZWxlY3Rvcik7XHJcbn1cclxuXHJcblxyXG4vKiogUXVlcnkgc2luZ2xlIGVsZW1lbnQgLSBubyB3YXkgYmV0dGVyIHRoYW4gcmV0dXJuIGZpcnN0IG9mIG11bHRpcGxlIHNlbGVjdG9yICovXHJcbmZ1bmN0aW9uIHF1ZXJ5U2luZ2xlKHNlbGVjdG9yLCBlbCl7XHJcblx0cmV0dXJuIHF1ZXJ5TXVsdGlwbGUoc2VsZWN0b3IsIGVsKVswXTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gcXVlcnkgcmVzdWx0IGJhc2VkIG9mZiB0YXJnZXQgbGlzdC5cclxuICogUGFyc2UgYW5kIGFwcGx5IHBvbHlmaWxsZWQgcHNldWRvc1xyXG4gKi9cclxuZnVuY3Rpb24gcVBzZXVkb3MobGlzdCwgc2VsZWN0b3IpIHtcclxuXHQvL2lnbm9yZSBlbXB0eSBzZWxlY3RvclxyXG5cdHNlbGVjdG9yID0gc2VsZWN0b3IudHJpbSgpO1xyXG5cdGlmICghc2VsZWN0b3IpIHJldHVybiBsaXN0O1xyXG5cclxuXHQvLyBjb25zb2xlLmdyb3VwKHNlbGVjdG9yKTtcclxuXHJcblx0Ly9zY29waWZ5IGltbWVkaWF0ZSBjaGlsZHJlbiBzZWxlY3RvclxyXG5cdGlmIChzZWxlY3RvclswXSA9PT0gJz4nKSB7XHJcblx0XHRpZiAoIXBzZXVkb3Muc2NvcGUpIHtcclxuXHRcdFx0Ly9zY29wZSBhcyB0aGUgZmlyc3QgZWxlbWVudCBpbiBzZWxlY3RvciBzY29waWZpZXMgY3VycmVudCBlbGVtZW50IGp1c3Qgb2tcclxuXHRcdFx0c2VsZWN0b3IgPSAnOnNjb3BlJyArIHNlbGVjdG9yO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHZhciBpZCA9IGdldFVpZCgpO1xyXG5cdFx0XHRsaXN0LmZvckVhY2goZnVuY3Rpb24oZWwpe2VsLnNldEF0dHJpYnV0ZSgnX19zY29wZWQnLCBpZCk7fSk7XHJcblx0XHRcdHNlbGVjdG9yID0gJ1tfX3Njb3BlZD1cIicgKyBpZCArICdcIl0nICsgc2VsZWN0b3I7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgcHNldWRvLCBwc2V1ZG9GbiwgcHNldWRvUGFyYW0sIHBzZXVkb1BhcmFtSWQ7XHJcblxyXG5cdC8vY2F0Y2ggcHNldWRvXHJcblx0dmFyIHBhcnRzID0gcGFyZW4ucGFyc2Uoc2VsZWN0b3IpO1xyXG5cdHZhciBtYXRjaCA9IHBhcnRzWzBdLm1hdGNoKHBzZXVkb1JFKTtcclxuXHJcblx0Ly9pZiBwc2V1ZG8gZm91bmRcclxuXHRpZiAobWF0Y2gpIHtcclxuXHRcdC8vZ3JhYiBwc2V1ZG8gZGV0YWlsc1xyXG5cdFx0cHNldWRvID0gbWF0Y2hbMV07XHJcblx0XHRwc2V1ZG9QYXJhbUlkID0gbWF0Y2hbMl07XHJcblxyXG5cdFx0aWYgKHBzZXVkb1BhcmFtSWQpIHtcclxuXHRcdFx0cHNldWRvUGFyYW0gPSBwYXJlbi5zdHJpbmdpZnkocGFydHNbcHNldWRvUGFyYW1JZC5zbGljZSgxKV0sIHBhcnRzKTtcclxuXHRcdH1cclxuXHJcblx0XHQvL3ByZS1zZWxlY3QgZWxlbWVudHMgYmVmb3JlIHBzZXVkb1xyXG5cdFx0dmFyIHByZVNlbGVjdG9yID0gcGFyZW4uc3RyaW5naWZ5KHBhcnRzWzBdLnNsaWNlKDAsIG1hdGNoLmluZGV4KSwgcGFydHMpO1xyXG5cclxuXHRcdC8vZml4IGZvciBxdWVyeS1yZWxhdGl2ZVxyXG5cdFx0aWYgKCFwcmVTZWxlY3RvciAmJiAhbWFwcGVyc1twc2V1ZG9dKSBwcmVTZWxlY3RvciA9ICcqJztcclxuXHRcdGlmIChwcmVTZWxlY3RvcikgbGlzdCA9IHFMaXN0KGxpc3QsIHByZVNlbGVjdG9yKTtcclxuXHJcblxyXG5cdFx0Ly9hcHBseSBwc2V1ZG8gZmlsdGVyL21hcHBlciBvbiB0aGUgbGlzdFxyXG5cdFx0cHNldWRvRm4gPSBmdW5jdGlvbihlbCkge3JldHVybiBwc2V1ZG9zW3BzZXVkb10oZWwsIHBzZXVkb1BhcmFtKTsgfTtcclxuXHRcdGlmIChmaWx0ZXJzW3BzZXVkb10pIHtcclxuXHRcdFx0bGlzdCA9IGxpc3QuZmlsdGVyKHBzZXVkb0ZuKTtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKG1hcHBlcnNbcHNldWRvXSkge1xyXG5cdFx0XHRsaXN0ID0gdW5pcXVlKGFycmF5aWZ5KGxpc3QubWFwKHBzZXVkb0ZuKSkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vc2hvcnRlbiBzZWxlY3RvclxyXG5cdFx0c2VsZWN0b3IgPSBwYXJ0c1swXS5zbGljZShtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCk7XHJcblxyXG5cdFx0Ly8gY29uc29sZS5ncm91cEVuZCgpO1xyXG5cclxuXHRcdC8vcXVlcnkgb25jZSBhZ2FpblxyXG5cdFx0cmV0dXJuIHFQc2V1ZG9zKGxpc3QsIHBhcmVuLnN0cmluZ2lmeShzZWxlY3RvciwgcGFydHMpKTtcclxuXHR9XHJcblxyXG5cdC8vanVzdCBxdWVyeSBsaXN0XHJcblx0ZWxzZSB7XHJcblx0XHQvLyBjb25zb2xlLmdyb3VwRW5kKCk7XHJcblx0XHRyZXR1cm4gcUxpc3QobGlzdCwgc2VsZWN0b3IpO1xyXG5cdH1cclxufVxyXG5cclxuXHJcbi8qKiBBcHBseSBzZWxlY3RvciBvbiBhIGxpc3Qgb2YgZWxlbWVudHMsIG5vIHBvbHlmaWxsZWQgcHNldWRvcyAqL1xyXG5mdW5jdGlvbiBxTGlzdChsaXN0LCBzZWxlY3Rvcil7XHJcblx0cmV0dXJuIHVuaXF1ZShhcnJheWlmeShsaXN0Lm1hcChmdW5jdGlvbihlbCl7XHJcblx0XHRyZXR1cm4gc2xpY2UoZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xyXG5cdH0pKSk7XHJcbn1cclxuXHJcblxyXG4vKiogRXhwb3J0cyAqL1xyXG5xdWVyeVNpbmdsZS5hbGwgPSBxdWVyeU11bHRpcGxlO1xyXG5xdWVyeVNpbmdsZS5yZWdpc3RlckZpbHRlciA9IHJlZ2lzdGVyRmlsdGVyO1xyXG5xdWVyeVNpbmdsZS5yZWdpc3Rlck1hcHBlciA9IHJlZ2lzdGVyTWFwcGVyO1xyXG5cclxuLyoqIERlZmF1bHQgZG9jdW1lbnQgcmVwcmVzZW50YXRpdmUgdG8gdXNlIGZvciBET00gKi9cclxucXVlcnlTaW5nbGUuZG9jdW1lbnQgPSBkb2M7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHF1ZXJ5U2luZ2xlOyIsInZhciBxID0gcmVxdWlyZSgnLi4nKTtcclxuXHJcbmZ1bmN0aW9uIGhhcyhlbCwgc3ViU2VsZWN0b3Ipe1xyXG5cdHJldHVybiAhIXEoc3ViU2VsZWN0b3IsIGVsKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBoYXM7IiwidmFyIHEgPSByZXF1aXJlKCcuLicpO1xyXG5cclxuLyoqIENTUzQgbWF0Y2hlcyAqL1xyXG5mdW5jdGlvbiBtYXRjaGVzKGVsLCBzZWxlY3Rvcil7XHJcblx0aWYgKCFlbC5wYXJlbnROb2RlKSB7XHJcblx0XHR2YXIgZnJhZ21lbnQgPSBxLmRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuXHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKGVsKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBxLmFsbChzZWxlY3RvciwgZWwucGFyZW50Tm9kZSkuaW5kZXhPZihlbCkgPiAtMTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtYXRjaGVzOyIsInZhciBtYXRjaGVzID0gcmVxdWlyZSgnLi9tYXRjaGVzJyk7XHJcblxyXG5mdW5jdGlvbiBub3QoZWwsIHNlbGVjdG9yKXtcclxuXHRyZXR1cm4gIW1hdGNoZXMoZWwsIHNlbGVjdG9yKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBub3Q7IiwidmFyIHEgPSByZXF1aXJlKCcuLicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByb290KGVsKXtcclxuXHRyZXR1cm4gZWwgPT09IHEuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG59OyIsIi8qKlxyXG4gKiA6c2NvcGUgcHNldWRvXHJcbiAqIFJldHVybiBlbGVtZW50IGlmIGl0IGhhcyBgc2NvcGVkYCBhdHRyaWJ1dGUuXHJcbiAqXHJcbiAqIEBsaW5rIGh0dHA6Ly9kZXYudzMub3JnL2Nzc3dnL3NlbGVjdG9ycy00LyN0aGUtc2NvcGUtcHNldWRvXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzY29wZShlbCl7XHJcblx0cmV0dXJuIGVsLmhhc0F0dHJpYnV0ZSgnc2NvcGVkJyk7XHJcbn07IiwiLyohXG4gKiBhcnJheS11bmlxdWUgPGh0dHBzOi8vZ2l0aHViLmNvbS9qb25zY2hsaW5rZXJ0L2FycmF5LXVuaXF1ZT5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgSm9uIFNjaGxpbmtlcnQsIGNvbnRyaWJ1dG9ycy5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdW5pcXVlKGFycikge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FycmF5LXVuaXF1ZSBleHBlY3RzIGFuIGFycmF5LicpO1xuICB9XG5cbiAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG4gIHZhciBpID0gLTE7XG5cbiAgd2hpbGUgKGkrKyA8IGxlbikge1xuICAgIHZhciBqID0gaSArIDE7XG5cbiAgICBmb3IgKDsgaiA8IGFyci5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKGFycltpXSA9PT0gYXJyW2pdKSB7XG4gICAgICAgIGFyci5zcGxpY2Uoai0tLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycjtcbn07XG4iLCIvKiFcbiAqIGFycmF5aWZ5LWNvbXBhY3QgPGh0dHBzOi8vZ2l0aHViLmNvbS9qb25zY2hsaW5rZXJ0L2FycmF5aWZ5LWNvbXBhY3Q+XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IEpvbiBTY2hsaW5rZXJ0LCBjb250cmlidXRvcnMuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2VcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBmbGF0dGVuID0gcmVxdWlyZSgnYXJyYXktZmxhdHRlbicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFycikge1xuICByZXR1cm4gZmxhdHRlbighQXJyYXkuaXNBcnJheShhcnIpID8gW2Fycl0gOiBhcnIpXG4gICAgLmZpbHRlcihCb29sZWFuKTtcbn07XG4iLCIvKipcbiAqIFJlY3Vyc2l2ZSBmbGF0dGVuIGZ1bmN0aW9uIHdpdGggZGVwdGguXG4gKlxuICogQHBhcmFtICB7QXJyYXl9ICBhcnJheVxuICogQHBhcmFtICB7QXJyYXl9ICByZXN1bHRcbiAqIEBwYXJhbSAge051bWJlcn0gZGVwdGhcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5mdW5jdGlvbiBmbGF0dGVuRGVwdGggKGFycmF5LCByZXN1bHQsIGRlcHRoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdmFsdWUgPSBhcnJheVtpXVxuXG4gICAgaWYgKGRlcHRoID4gMCAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgZmxhdHRlbkRlcHRoKHZhbHVlLCByZXN1bHQsIGRlcHRoIC0gMSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnB1c2godmFsdWUpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZSBmbGF0dGVuIGZ1bmN0aW9uLiBPbWl0dGluZyBkZXB0aCBpcyBzbGlnaHRseSBmYXN0ZXIuXG4gKlxuICogQHBhcmFtICB7QXJyYXl9IGFycmF5XG4gKiBAcGFyYW0gIHtBcnJheX0gcmVzdWx0XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZnVuY3Rpb24gZmxhdHRlbkZvcmV2ZXIgKGFycmF5LCByZXN1bHQpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgIHZhciB2YWx1ZSA9IGFycmF5W2ldXG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGZsYXR0ZW5Gb3JldmVyKHZhbHVlLCByZXN1bHQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBGbGF0dGVuIGFuIGFycmF5LCB3aXRoIHRoZSBhYmlsaXR5IHRvIGRlZmluZSBhIGRlcHRoLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgYXJyYXlcbiAqIEBwYXJhbSAge051bWJlcn0gZGVwdGhcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcnJheSwgZGVwdGgpIHtcbiAgaWYgKGRlcHRoID09IG51bGwpIHtcbiAgICByZXR1cm4gZmxhdHRlbkZvcmV2ZXIoYXJyYXksIFtdKVxuICB9XG5cbiAgcmV0dXJuIGZsYXR0ZW5EZXB0aChhcnJheSwgW10sIGRlcHRoKVxufVxuIiwiLyoqXHJcbiAqIEBtb2R1bGUgIGdldC1kb2NcclxuICovXHJcblxyXG52YXIgaGFzRG9tID0gcmVxdWlyZSgnaGFzLWRvbScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBoYXNEb20oKSA/IGRvY3VtZW50IDogbnVsbDsiLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCcuL2lzLXN0cmluZycpO1xyXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJy4vaXMtYXJyYXknKTtcclxudmFyIGlzRm4gPSByZXF1aXJlKCcuL2lzLWZuJyk7XHJcblxyXG4vL0ZJWE1FOiBhZGQgdGVzdHMgZnJvbSBodHRwOi8vanNmaWRkbGUubmV0L2t1OUxTLzEvXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGEpe1xyXG5cdHJldHVybiBpc0FycmF5KGEpIHx8IChhICYmICFpc1N0cmluZyhhKSAmJiAhYS5ub2RlVHlwZSAmJiAodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyA/IGEgIT0gd2luZG93IDogdHJ1ZSkgJiYgIWlzRm4oYSkgJiYgdHlwZW9mIGEubGVuZ3RoID09PSAnbnVtYmVyJyk7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGEpe1xyXG5cdHJldHVybiBhIGluc3RhbmNlb2YgQXJyYXk7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGEpe1xyXG5cdHJldHVybiAhIShhICYmIGEuYXBwbHkpO1xyXG59IiwiLyoqXHJcbiAqIEBtb2R1bGUgcGFyZW50aGVzaXNcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cdHBhcnNlOiByZXF1aXJlKCcuL3BhcnNlJyksXHJcblx0c3RyaW5naWZ5OiByZXF1aXJlKCcuL3N0cmluZ2lmeScpXHJcbn07IiwiLyoqXHJcbiAqIEBtb2R1bGUgIHBhcmVudGhlc2lzL3BhcnNlXHJcbiAqXHJcbiAqIFBhcnNlIGEgc3RyaW5nIHdpdGggcGFyZW50aGVzaXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgQSBzdHJpbmcgd2l0aCBwYXJlbnRoZXNpc1xyXG4gKlxyXG4gKiBAcmV0dXJuIHtBcnJheX0gQSBsaXN0IHdpdGggcGFyc2VkIHBhcmVucywgd2hlcmUgMCBpcyBpbml0aWFsIHN0cmluZy5cclxuICovXHJcblxyXG4vL1RPRE86IGltcGxlbWVudCBzZXF1ZW50aWFsIHBhcnNlciBvZiB0aGlzIGFsZ29yaXRobSwgY29tcGFyZSBwZXJmb3JtYW5jZS5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIsIGJyYWNrZXQpe1xyXG5cdC8vcHJldGVuZCBub24tc3RyaW5nIHBhcnNlZCBwZXItc2VcclxuXHRpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiBbc3RyXTtcclxuXHJcblx0dmFyIHJlcyA9IFtdLCBwcmV2U3RyO1xyXG5cclxuXHRicmFja2V0ID0gYnJhY2tldCB8fCAnKCknO1xyXG5cclxuXHQvL2NyZWF0ZSBwYXJlbnRoZXNpcyByZWdleFxyXG5cdHZhciBwUkUgPSBuZXcgUmVnRXhwKFsnXFxcXCcsIGJyYWNrZXRbMF0sICdbXlxcXFwnLCBicmFja2V0WzBdLCAnXFxcXCcsIGJyYWNrZXRbMV0sICddKlxcXFwnLCBicmFja2V0WzFdXS5qb2luKCcnKSk7XHJcblxyXG5cdGZ1bmN0aW9uIHJlcGxhY2VUb2tlbih0b2tlbiwgaWR4LCBzdHIpe1xyXG5cdFx0Ly9zYXZlIHRva2VuIHRvIHJlc1xyXG5cdFx0dmFyIHJlZklkID0gcmVzLnB1c2godG9rZW4uc2xpY2UoMSwtMSkpO1xyXG5cclxuXHRcdHJldHVybiAnXFxcXCcgKyByZWZJZDtcclxuXHR9XHJcblxyXG5cdC8vcmVwbGFjZSBwYXJlbiB0b2tlbnMgdGlsbCB0aGVyZeKAmXMgbm9uZVxyXG5cdHdoaWxlIChzdHIgIT0gcHJldlN0cikge1xyXG5cdFx0cHJldlN0ciA9IHN0cjtcclxuXHRcdHN0ciA9IHN0ci5yZXBsYWNlKHBSRSwgcmVwbGFjZVRva2VuKTtcclxuXHR9XHJcblxyXG5cdC8vc2F2ZSByZXN1bHRpbmcgc3RyXHJcblx0cmVzLnVuc2hpZnQoc3RyKTtcclxuXHJcblx0cmV0dXJuIHJlcztcclxufTsiLCIvKipcclxuICogQG1vZHVsZSBwYXJlbnRoZXNpcy9zdHJpbmdpZnlcclxuICpcclxuICogU3RyaW5naWZ5IGFuIGFycmF5L29iamVjdCB3aXRoIHBhcmVudGhlc2lzIHJlZmVyZW5jZXNcclxuICpcclxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IGFyciBBbiBhcnJheSBvciBvYmplY3Qgd2hlcmUgMCBpcyBpbml0aWFsIHN0cmluZ1xyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCBldmVyeSBvdGhlciBrZXkvdmFsdWUgaXMgcmVmZXJlbmNlIGlkL3ZhbHVlIHRvIHJlcGxhY2VcclxuICpcclxuICogQHJldHVybiB7c3RyaW5nfSBBIHN0cmluZyB3aXRoIGluc2VydGVkIHJlZ2V4IHJlZmVyZW5jZXNcclxuICovXHJcblxyXG4vL0ZJWE1FOiBjaXJjdWxhciByZWZlcmVuY2VzIGNhdXNlcyByZWN1cnNpb25zIGhlcmVcclxuLy9UT0RPOiB0aGVyZeKAmXMgcG9zc2libGUgYSByZWN1cnNpdmUgdmVyc2lvbiBvZiB0aGlzIGFsZ29yaXRobSwgc28gdGVzdCBpdCAmIGNvbXBhcmVcclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyLCByZWZzLCBicmFja2V0KXtcclxuXHR2YXIgcHJldlN0cjtcclxuXHJcblx0Ly9wcmV0ZW5kIGJhZCBzdHJpbmcgc3RyaW5naWZpZWQgd2l0aCBubyBwYXJlbnRoZXNlc1xyXG5cdGlmICghc3RyKSByZXR1cm4gJyc7XHJcblxyXG5cdGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xyXG5cdFx0YnJhY2tldCA9IHJlZnM7XHJcblx0XHRyZWZzID0gc3RyO1xyXG5cdFx0c3RyID0gcmVmc1swXTtcclxuXHR9XHJcblxyXG5cdGJyYWNrZXQgPSBicmFja2V0IHx8ICcoKSc7XHJcblxyXG5cdGZ1bmN0aW9uIHJlcGxhY2VSZWYodG9rZW4sIGlkeCwgc3RyKXtcclxuXHRcdHJldHVybiBicmFja2V0WzBdICsgcmVmc1t0b2tlbi5zbGljZSgxKV0gKyBicmFja2V0WzFdO1xyXG5cdH1cclxuXHJcblx0d2hpbGUgKHN0ciAhPSBwcmV2U3RyKSB7XHJcblx0XHRwcmV2U3RyID0gc3RyO1xyXG5cdFx0c3RyID0gc3RyLnJlcGxhY2UoL1xcXFxbMC05XSsvLCByZXBsYWNlUmVmKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBzdHI7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBleHRlbmRcblxuZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCkge1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG4iLCIvKipcbiAqIEBtb2R1bGUgZW1teS9vblxuICovXG5cblxudmFyIGljaWNsZSA9IHJlcXVpcmUoJ2ljaWNsZScpO1xudmFyIGxpc3RlbmVycyA9IHJlcXVpcmUoJy4vbGlzdGVuZXJzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBvbjtcblxuXG4vKipcbiAqIEJpbmQgZm4gdG8gYSB0YXJnZXQuXG4gKlxuICogQHBhcmFtIHsqfSB0YXJndGUgQSBzaW5nbGUgdGFyZ2V0IHRvIGJpbmQgZXZ0XG4gKiBAcGFyYW0ge3N0cmluZ30gZXZ0IEFuIGV2ZW50IG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEEgY2FsbGJhY2tcbiAqIEBwYXJhbSB7RnVuY3Rpb259PyBjb25kaXRpb24gQW4gb3B0aW9uYWwgZmlsdGVyaW5nIGZuIGZvciBhIGNhbGxiYWNrXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWNoIGFjY2VwdHMgYW4gZXZlbnQgYW5kIHJldHVybnMgY2FsbGJhY2tcbiAqXG4gKiBAcmV0dXJuIHtvYmplY3R9IEEgdGFyZ2V0XG4gKi9cbmZ1bmN0aW9uIG9uKHRhcmdldCwgZXZ0LCBmbil7XG5cdGlmICghdGFyZ2V0KSByZXR1cm4gdGFyZ2V0O1xuXG5cdC8vZ2V0IHRhcmdldCBgb25gIG1ldGhvZCwgaWYgYW55XG5cdC8vcHJlZmVyIG5hdGl2ZS1saWtlIG1ldGhvZCBuYW1lXG5cdC8vdXNlciBtYXkgb2NjYXNpb25hbGx5IGV4cG9zZSBgb25gIHRvIHRoZSBnbG9iYWwsIGluIGNhc2Ugb2YgYnJvd3NlcmlmeVxuXHQvL2J1dCBpdCBpcyB1bmxpa2VseSBvbmUgd291bGQgcmVwbGFjZSBuYXRpdmUgYGFkZEV2ZW50TGlzdGVuZXJgXG5cdHZhciBvbk1ldGhvZCA9ICB0YXJnZXRbJ2FkZEV2ZW50TGlzdGVuZXInXSB8fCB0YXJnZXRbJ2FkZExpc3RlbmVyJ10gfHwgdGFyZ2V0WydhdHRhY2hFdmVudCddIHx8IHRhcmdldFsnb24nXTtcblxuXHR2YXIgY2IgPSBmbjtcblxuXHQvL2ludm9rZSBtZXRob2QgZm9yIGVhY2ggc3BhY2Utc2VwYXJhdGVkIGV2ZW50IGZyb20gYSBsaXN0XG5cdGV2dC5zcGxpdCgvXFxzKy8pLmZvckVhY2goZnVuY3Rpb24oZXZ0KXtcblx0XHR2YXIgZXZ0UGFydHMgPSBldnQuc3BsaXQoJy4nKTtcblx0XHRldnQgPSBldnRQYXJ0cy5zaGlmdCgpO1xuXG5cdFx0Ly91c2UgdGFyZ2V0IGV2ZW50IHN5c3RlbSwgaWYgcG9zc2libGVcblx0XHRpZiAob25NZXRob2QpIHtcblx0XHRcdC8vYXZvaWQgc2VsZi1yZWN1cnNpb25zXG5cdFx0XHQvL2lmIGl04oCZcyBmcm96ZW4gLSBpZ25vcmUgY2FsbFxuXHRcdFx0aWYgKGljaWNsZS5mcmVlemUodGFyZ2V0LCAnb24nICsgZXZ0KSl7XG5cdFx0XHRcdG9uTWV0aG9kLmNhbGwodGFyZ2V0LCBldnQsIGNiKTtcblx0XHRcdFx0aWNpY2xlLnVuZnJlZXplKHRhcmdldCwgJ29uJyArIGV2dCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRhcmdldDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvL3NhdmUgdGhlIGNhbGxiYWNrIGFueXdheVxuXHRcdGxpc3RlbmVycy5hZGQodGFyZ2V0LCBldnQsIGNiLCBldnRQYXJ0cyk7XG5cdH0pO1xuXG5cdHJldHVybiB0YXJnZXQ7XG59XG5cblxuLyoqXG4gKiBXcmFwIGFuIGZuIHdpdGggY29uZGl0aW9uIHBhc3NpbmdcbiAqL1xub24ud3JhcCA9IGZ1bmN0aW9uKHRhcmdldCwgZXZ0LCBmbiwgY29uZGl0aW9uKXtcblx0dmFyIGNiID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKGNvbmRpdGlvbi5hcHBseSh0YXJnZXQsIGFyZ3VtZW50cykpIHtcblx0XHRcdHJldHVybiBmbi5hcHBseSh0YXJnZXQsIGFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9O1xuXG5cdGNiLmZuID0gZm47XG5cblx0cmV0dXJuIGNiO1xufTsiLCIvKipcclxuICogQG1vZHVsZSAgcXVlcmllZC9jc3M0XHJcbiAqXHJcbiAqIENTUzQgcXVlcnkgc2VsZWN0b3IuXHJcbiAqL1xyXG5cclxuXHJcbnZhciBkb2MgPSByZXF1aXJlKCdnZXQtZG9jJyk7XHJcbnZhciBxID0gcmVxdWlyZSgnLi9saWIvJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIERldGVjdCB1bnN1cHBvcnRlZCBjc3M0IGZlYXR1cmVzLCBwb2x5ZmlsbCB0aGVtXHJcbiAqL1xyXG5cclxuLy9kZXRlY3QgYDpzY29wZWBcclxudHJ5IHtcclxuXHRkb2MucXVlcnlTZWxlY3RvcignOnNjb3BlJyk7XHJcbn1cclxuY2F0Y2ggKGUpIHtcclxuXHRxLnJlZ2lzdGVyRmlsdGVyKCdzY29wZScsIHJlcXVpcmUoJy4vbGliL3BzZXVkb3Mvc2NvcGUnKSk7XHJcbn1cclxuXHJcblxyXG4vL2RldGVjdCBgOmhhc2BcclxudHJ5IHtcclxuXHRkb2MucXVlcnlTZWxlY3RvcignOmhhcycpO1xyXG59XHJcbmNhdGNoIChlKSB7XHJcblx0cS5yZWdpc3RlckZpbHRlcignaGFzJywgcmVxdWlyZSgnLi9saWIvcHNldWRvcy9oYXMnKSk7XHJcblxyXG5cdC8vcG9seWZpbGxlZCA6aGFzIHJlcXVpcmVzIGFydGlmaWNpYWwgOm5vdCB0byBtYWtlIGA6bm90KDpoYXMoLi4uKSlgLlxyXG5cdHEucmVnaXN0ZXJGaWx0ZXIoJ25vdCcsIHJlcXVpcmUoJy4vbGliL3BzZXVkb3Mvbm90JykpO1xyXG59XHJcblxyXG5cclxuLy9kZXRlY3QgYDpyb290YFxyXG50cnkge1xyXG5cdGRvYy5xdWVyeVNlbGVjdG9yKCc6cm9vdCcpO1xyXG59XHJcbmNhdGNoIChlKSB7XHJcblx0cS5yZWdpc3RlckZpbHRlcigncm9vdCcsIHJlcXVpcmUoJy4vbGliL3BzZXVkb3Mvcm9vdCcpKTtcclxufVxyXG5cclxuXHJcbi8vZGV0ZWN0IGA6bWF0Y2hlc2BcclxudHJ5IHtcclxuXHRkb2MucXVlcnlTZWxlY3RvcignOm1hdGNoZXMnKTtcclxufVxyXG5jYXRjaCAoZSkge1xyXG5cdHEucmVnaXN0ZXJGaWx0ZXIoJ21hdGNoZXMnLCByZXF1aXJlKCcuL2xpYi9wc2V1ZG9zL21hdGNoZXMnKSk7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHE7Il19
