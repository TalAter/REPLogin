(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.REPLogin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
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
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
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
  } else if (listeners) {
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

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
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
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function (condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error('Invariant Violation: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;
}).call(this,require('_process'))

},{"_process":6}],3:[function(require,module,exports){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher');

},{"./lib/Dispatcher":4}],4:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * 
 * @preventMunge
 */

'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var invariant = require('fbjs/lib/invariant');

var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *   CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *         case 'city-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

var Dispatcher = (function () {
  function Dispatcher() {
    _classCallCheck(this, Dispatcher);

    this._callbacks = {};
    this._isDispatching = false;
    this._isHandled = {};
    this._isPending = {};
    this._lastID = 1;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   */

  Dispatcher.prototype.register = function register(callback) {
    var id = _prefix + this._lastID++;
    this._callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   */

  Dispatcher.prototype.unregister = function unregister(id) {
    !this._callbacks[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.unregister(...): `%s` does not map to a registered callback.', id) : invariant(false) : undefined;
    delete this._callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   */

  Dispatcher.prototype.waitFor = function waitFor(ids) {
    !this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Must be invoked while dispatching.') : invariant(false) : undefined;
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this._isPending[id]) {
        !this._isHandled[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Circular dependency detected while ' + 'waiting for `%s`.', id) : invariant(false) : undefined;
        continue;
      }
      !this._callbacks[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): `%s` does not map to a registered callback.', id) : invariant(false) : undefined;
      this._invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   */

  Dispatcher.prototype.dispatch = function dispatch(payload) {
    !!this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.') : invariant(false) : undefined;
    this._startDispatching(payload);
    try {
      for (var id in this._callbacks) {
        if (this._isPending[id]) {
          continue;
        }
        this._invokeCallback(id);
      }
    } finally {
      this._stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   */

  Dispatcher.prototype.isDispatching = function isDispatching() {
    return this._isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @internal
   */

  Dispatcher.prototype._invokeCallback = function _invokeCallback(id) {
    this._isPending[id] = true;
    this._callbacks[id](this._pendingPayload);
    this._isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @internal
   */

  Dispatcher.prototype._startDispatching = function _startDispatching(payload) {
    for (var id in this._callbacks) {
      this._isPending[id] = false;
      this._isHandled[id] = false;
    }
    this._pendingPayload = payload;
    this._isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */

  Dispatcher.prototype._stopDispatching = function _stopDispatching() {
    delete this._pendingPayload;
    this._isDispatching = false;
  };

  return Dispatcher;
})();

module.exports = Dispatcher;
}).call(this,require('_process'))

},{"_process":6,"fbjs/lib/invariant":2}],5:[function(require,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],6:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],7:[function(require,module,exports){
'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');

var REPLActions = {
  addToOutputBuffer: function addToOutputBuffer(output) {
    AppDispatcher.dispatch({
      actionType: 'add-to-output-buffer',
      output: output
    });
  },
  addToCommandHistory: function addToCommandHistory(input) {
    AppDispatcher.dispatch({
      actionType: 'add-to-command-history',
      input: input
    });
  },
  goBackInCommandHistory: function goBackInCommandHistory() {
    AppDispatcher.dispatch({
      actionType: 'move-command-history-offset',
      offsetChange: 1
    });
  },
  goForwardInCommandHistory: function goForwardInCommandHistory() {
    AppDispatcher.dispatch({
      actionType: 'move-command-history-offset',
      offsetChange: -1
    });
  },
  resetCommandHistoryOffset: function resetCommandHistoryOffset() {
    AppDispatcher.dispatch({
      actionType: 'reset-command-history-offset'
    });
  },
  setSudo: function setSudo(command, args) {
    AppDispatcher.dispatch({
      actionType: 'set-sudo',
      command: command,
      args: args,
      whoami: '[sudo] password for tal:'
    });
  },
  clearSudo: function clearSudo() {
    AppDispatcher.dispatch({
      actionType: 'clear-sudo'
    });
  }
};

module.exports = REPLActions;

},{"../dispatcher/AppDispatcher":9}],8:[function(require,module,exports){
'use strict';

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var REPLcommands = require('./repl.commands.react.js');
var OutputBufferStore = require('./stores/OutputBufferStore.js');
var AppStateStore = require('./stores/AppStateStore.js');
var CommandHistoryStore = require('./stores/CommandHistoryStore.js');
var REPLActions = require('./actions/REPLActions.js');

/*************************/
/* REPL's Little Helpers */
/*************************/

// Places cursor on the text input.
var focusOnInput = function focusOnInput() {
  document.getElementById('repl-text-input').focus();
};

var getREPLstate = function getREPLstate() {
  return {
    outputBuffer: OutputBufferStore.getAll(),
    whoami: AppStateStore.getWhoAmI(),
    sudo: AppStateStore.getSudo()
  };
};

/********************/
/* React components */
/********************/

var REPL = React.createClass({
  displayName: 'REPL',


  getInitialState: function getInitialState() {
    return getREPLstate();
  },

  // Reads a command that was just submitted and passes it to EVALUATE
  READ: function READ(event) {
    event.preventDefault();
    var input = document.getElementById('repl-text-input').value.toLowerCase();
    if (!this.state.sudo) {
      REPLActions.addToCommandHistory(input);
    }
    this.EVALUATE(input);
  },

  // Evaluate a command and passes it and its result to PRINT, then loops
  EVALUATE: function EVALUATE(input) {
    // Are we doing a password check right now?
    if (this.state.sudo) {
      if (input === '12345') {
        var PERMISSION_GRANTED = true;
        this.runCommand(this.state.sudo.command, this.state.sudo.args.concat(PERMISSION_GRANTED));
      } else {
        this.PRINT('sudo: incorrect password');
      }
      REPLActions.clearSudo();
      this.LOOP();
      return;
    }

    // Output the input as one does from time to time
    this.PRINT(this.state.whoami + ' ' + input);

    var command = void 0,
        args = void 0;
    // Destructuring and rest for the win!

    // Check if command exists
    var _input$split = input.split(' ');

    var _input$split2 = _toArray(_input$split);

    command = _input$split2[0];
    args = _input$split2.slice(1);
    this.runCommand(command, args);
    this.LOOP();
  },

  // Prints output from a command
  PRINT: function PRINT(output) {
    REPLActions.addToOutputBuffer(output);
  },

  // Clears and focuses input again
  LOOP: function LOOP() {
    REPLActions.resetCommandHistoryOffset();
    focusOnInput();
  },

  // Make sure a command exists, then run it with its arguments
  runCommand: function runCommand(command, args) {
    if (REPLcommands[command]) {
      this.PRINT(REPLcommands[command].apply(this, args));
    } else {
      this.PRINT('command not found: ' + command);
    }
  },

  componentDidMount: function componentDidMount() {
    focusOnInput();
    OutputBufferStore.addChangeListener(this._onChange);
    AppStateStore.addChangeListener(this._onChange);
    AppStateStore.addChangeListener(this.renderHistoricCommand);
  },

  componentWillUnmount: function componentWillUnmount() {
    OutputBufferStore.removeChangeListener(this._onChange);
    AppStateStore.removeChangeListener(this._onChange);
    AppStateStore.removeChangeListener(this.renderHistoricCommand);
  },

  handleKeyDown: function handleKeyDown(e) {
    // Up key pressed
    if (e.keyCode === 38) {
      REPLActions.goBackInCommandHistory();
    }
    // Down key pressed
    if (e.keyCode === 40) {
      REPLActions.goForwardInCommandHistory();
    }
  },

  renderHistoricCommand: function renderHistoricCommand() {
    var command = CommandHistoryStore.getCommand(AppStateStore.getCommandHistoryOffset());
    if (!command) {
      this.setInputValue('');
    } else {
      this.setInputValue(command.command);
    }
  },

  setInputValue: function setInputValue(val) {
    document.getElementById('repl-text-input').value = val;
  },

  render: function render() {
    var outputLines = this.state.outputBuffer.map(function (line) {
      return React.createElement(
        'div',
        { key: line.key },
        line.text
      );
    });
    return React.createElement(
      'div',
      { className: 'repl-container' },
      React.createElement(
        'div',
        { className: 'repl-output' },
        outputLines
      ),
      React.createElement(
        'div',
        { className: 'repl-input' },
        React.createElement(
          'span',
          { className: 'whoami' },
          this.state.whoami
        ),
        React.createElement(
          'form',
          { onSubmit: this.READ },
          React.createElement('input', { onBlur: focusOnInput, onKeyDown: this.handleKeyDown, id: 'repl-text-input' })
        )
      )
    );
  },

  _onChange: function _onChange() {
    this.setState(getREPLstate());
  }

});

/***************/
/* VROOM VROOM */
/***************/

ReactDOM.render(React.createElement(REPL, null), document.getElementById('repl'));

},{"./actions/REPLActions.js":7,"./repl.commands.react.js":10,"./stores/AppStateStore.js":11,"./stores/CommandHistoryStore.js":12,"./stores/OutputBufferStore.js":13}],9:[function(require,module,exports){
'use strict';

var Dispatcher = require('flux').Dispatcher;

module.exports = new Dispatcher();

},{"flux":3}],10:[function(require,module,exports){
"use strict";

var REPLActions = require('./actions/REPLActions.js');

var REPLcommands = {
  "help": function help() {
    return React.createElement(
      "div",
      null,
      React.createElement("br", null),
      React.createElement(
        "p",
        null,
        React.createElement(
          "strong",
          null,
          "Welcome to REPLogin."
        )
      ),
      React.createElement(
        "p",
        null,
        "Here are some commands you can try:"
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "ls"
        ),
        "     List directory contents"
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "cd"
        ),
        "     Change the current working directory."
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "pwd"
        ),
        "    Print name of current/working directory."
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "cat"
        ),
        "    Show the contents of a file."
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "sudo"
        ),
        "   Execute a command as another user."
      )
    );
  },
  "cd": function cd(destination) {
    if (destination === '.') {
      return React.createElement(
        "div",
        null,
        "There and back again."
      );
    } else {
      return React.createElement(
        "div",
        null,
        "None shall pass!"
      );
    }
  },
  "ls": function ls() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        null,
        "drwx------  7 tal  tal   4096 Sep 7  17:08 ."
      ),
      React.createElement(
        "div",
        null,
        "drwxr-xr-x  3 root root  4096 Sep 8  12:29 .."
      ),
      React.createElement(
        "div",
        null,
        "-rw-------  1 root root   304 Sep 8  13:22 ",
        React.createElement(
          "em",
          null,
          "passwords"
        )
      )
    );
  },
  "ll": function ll() {
    return REPLcommands["ls"]();
  },
  "pwd": function pwd() {
    return React.createElement(
      "div",
      null,
      "/Users/tal"
    );
  },
  "./passwords": function passwords() {
    return REPLcommands["passwords"]();
  },
  "passwords": function passwords() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        null,
        "command not found: passwords"
      ),
      React.createElement(
        "div",
        null,
        "Try using ",
        React.createElement(
          "strong",
          null,
          "cat"
        ),
        " to view the contents of this file."
      )
    );
  },
  "cat": function cat(filename, permission) {
    if (!filename) {
      return React.createElement(
        "div",
        null,
        "cat: Requires a filename as its first argument"
      );
    }
    if (filename !== 'passwords') {
      return React.createElement(
        "div",
        null,
        "cat: ",
        filename,
        ": No such file or directory"
      );
    }
    if (permission) {
      return React.createElement(
        "div",
        null,
        React.createElement("img", { src: "https://cdn.meme.am/instances/53376060.jpg" }),
        React.createElement(
          "div",
          null,
          React.createElement(
            "a",
            { href: "/requirements.html" },
            "How did we do?"
          )
        )
      );
    } else {
      return React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          null,
          "cat: ",
          filename,
          ": Permission denied"
        ),
        React.createElement(
          "div",
          null,
          "Have you tried ",
          React.createElement(
            "strong",
            null,
            "sudo cat ",
            filename
          ),
          "?"
        )
      );
    }
  },
  "sudo": function sudo(command) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    REPLActions.setSudo(command, args);
    return React.createElement(
      "div",
      null,
      "You need to be \"logged in\" as root."
    );
  }
};

module.exports = REPLcommands;

},{"./actions/REPLActions.js":7}],11:[function(require,module,exports){
'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var CommandHistoryStore = require('./CommandHistoryStore');

var CHANGE_EVENT = 'change';
var DEFAULT_WHOAMI = '[tal@ater ~] $';

var _appState = {
  sudo: undefined,
  whoami: DEFAULT_WHOAMI,
  commandHistoryOffset: -1
};

var AppStateStore = assign({}, EventEmitter.prototype, {
  getWhoAmI: function getWhoAmI() {
    return _appState.whoami;
  },
  getSudo: function getSudo() {
    return _appState.sudo;
  },
  getCommandHistoryOffset: function getCommandHistoryOffset() {
    return _appState.commandHistoryOffset;
  },
  emitChange: function emitChange() {
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

AppDispatcher.register(function (action) {
  switch (action.actionType) {
    case 'set-sudo':
      _appState.sudo = { command: action.command, args: action.args };
      _appState.whoami = action.whoami;
      AppStateStore.emitChange();
      break;
    case 'clear-sudo':
      _appState.sudo = undefined;
      _appState.whoami = DEFAULT_WHOAMI;
      AppStateStore.emitChange();
      break;
    case 'move-command-history-offset':
      var offset = _appState.commandHistoryOffset + action.offsetChange;
      var commandHistoryLength = CommandHistoryStore.getCommandHistoryLength();
      if (offset >= commandHistoryLength || offset < -1) {
        return;
      }
      _appState.commandHistoryOffset = offset;
      AppStateStore.emitChange();
      break;
    case 'reset-command-history-offset':
      _appState.commandHistoryOffset = -1;
      AppStateStore.emitChange();
      break;
  }
});

module.exports = AppStateStore;

},{"../dispatcher/AppDispatcher":9,"./CommandHistoryStore":12,"events":1,"object-assign":5}],12:[function(require,module,exports){
'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';

var _commandHistory = [];

var CommandHistoryStore = assign({}, EventEmitter.prototype, {
  getAll: function getAll() {
    return _commandHistory;
  },

  getCommandHistoryLength: function getCommandHistoryLength() {
    return _commandHistory.length;
  },

  /**
   * Returns a single command from the history
   * If offset is 0, it will return the last command.
   * If offset is 1, it will return the second to last command.
   * etc.
   *
   * @param {integer} offset  An offset from the last command in history
   * @return {object} Command A command object
   */
  getCommand: function getCommand(offset) {
    var len = _commandHistory.length;
    var command = _commandHistory.slice(len - offset - 1, len - offset)[0];
    return command;
  },

  emitChange: function emitChange() {
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

AppDispatcher.register(function (action) {
  switch (action.actionType) {
    case 'add-to-command-history':
      var timestamp = new Date().toString();
      var id = (timestamp + ' ' + Math.floor(Math.random() * 999999)).toString(36);
      _commandHistory.push({ id: id, command: action.input, timestamp: timestamp });
      CommandHistoryStore.emitChange();
      break;
  }
});

module.exports = CommandHistoryStore;

},{"../dispatcher/AppDispatcher":9,"events":1,"object-assign":5}],13:[function(require,module,exports){
'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';

var _outputBuffer = [{ key: 0, text: 'Welcome to REPLogin' }, { key: 1, text: 'Last login: Thu Sep 8 06:05:15 2016 from 46.120.5.205 (not really)' }, { key: 2, text: '-bash: warning: This is not bash' }, { key: 3, text: 'For a list of available commands, try typing help' }];

var OutputBufferStore = assign({}, EventEmitter.prototype, {
  getAll: function getAll() {
    return _outputBuffer;
  },
  emitChange: function emitChange() {
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

AppDispatcher.register(function (action) {
  switch (action.actionType) {
    case 'add-to-output-buffer':
      _outputBuffer.push({ key: _outputBuffer.length + 1, text: action.output });
      OutputBufferStore.emitChange();
      break;
  }
});

module.exports = OutputBufferStore;

},{"../dispatcher/AppDispatcher":9,"events":1,"object-assign":5}]},{},[8])(8)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9mYmpzL2xpYi9pbnZhcmlhbnQuanMiLCJub2RlX21vZHVsZXMvZmx1eC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mbHV4L2xpYi9EaXNwYXRjaGVyLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwic3JjL2FjdGlvbnMvUkVQTEFjdGlvbnMuanMiLCJzcmMvYXBwLnJlYWN0LmpzIiwic3JjL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlci5qcyIsInNyYy9yZXBsLmNvbW1hbmRzLnJlYWN0LmpzIiwic3JjL3N0b3Jlcy9BcHBTdGF0ZVN0b3JlLmpzIiwic3JjL3N0b3Jlcy9Db21tYW5kSGlzdG9yeVN0b3JlLmpzIiwic3JjL3N0b3Jlcy9PdXRwdXRCdWZmZXJTdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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TCxDQUFRLFlBQVIsRUFBc0IsUUFBdEI7QUFDRCxHQVR3RDtBQVV6RCx3QkFBc0IsOEJBQVMsUUFBVCxFQUFtQjtBQUN2QyxTQUFLLGNBQUwsQ0FBb0IsWUFBcEIsRUFBa0MsUUFBbEM7QUFDRDtBQVp3RCxDQUFuQyxDQUF4Qjs7QUFlQSxjQUFjLFFBQWQsQ0FBdUIsVUFBUyxNQUFULEVBQWlCO0FBQ3RDLFVBQU8sT0FBTyxVQUFkO0FBQ0UsU0FBSyxzQkFBTDtBQUNFLG9CQUFjLElBQWQsQ0FBbUIsRUFBQyxLQUFLLGNBQWMsTUFBZCxHQUFxQixDQUEzQixFQUE4QixNQUFNLE9BQU8sTUFBM0MsRUFBbkI7QUFDQSx3QkFBa0IsVUFBbEI7QUFDQTtBQUpKO0FBTUQsQ0FQRDs7QUFTQSxPQUFPLE9BQVAsR0FBaUIsaUJBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuICgnICsgZXIgKyAnKScpO1xuICAgICAgICBlcnIuY29udGV4dCA9IGVyO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgICBpZiAoaXNGdW5jdGlvbihldmxpc3RlbmVyKSlcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGV2bGlzdGVuZXIpXG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNSwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBpbnZhcmlhbnRcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBVc2UgaW52YXJpYW50KCkgdG8gYXNzZXJ0IHN0YXRlIHdoaWNoIHlvdXIgcHJvZ3JhbSBhc3N1bWVzIHRvIGJlIHRydWUuXG4gKlxuICogUHJvdmlkZSBzcHJpbnRmLXN0eWxlIGZvcm1hdCAob25seSAlcyBpcyBzdXBwb3J0ZWQpIGFuZCBhcmd1bWVudHNcbiAqIHRvIHByb3ZpZGUgaW5mb3JtYXRpb24gYWJvdXQgd2hhdCBicm9rZSBhbmQgd2hhdCB5b3Ugd2VyZVxuICogZXhwZWN0aW5nLlxuICpcbiAqIFRoZSBpbnZhcmlhbnQgbWVzc2FnZSB3aWxsIGJlIHN0cmlwcGVkIGluIHByb2R1Y3Rpb24sIGJ1dCB0aGUgaW52YXJpYW50XG4gKiB3aWxsIHJlbWFpbiB0byBlbnN1cmUgbG9naWMgZG9lcyBub3QgZGlmZmVyIGluIHByb2R1Y3Rpb24uXG4gKi9cblxudmFyIGludmFyaWFudCA9IGZ1bmN0aW9uIChjb25kaXRpb24sIGZvcm1hdCwgYSwgYiwgYywgZCwgZSwgZikge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQgcmVxdWlyZXMgYW4gZXJyb3IgbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29uZGl0aW9uKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ01pbmlmaWVkIGV4Y2VwdGlvbiBvY2N1cnJlZDsgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50ICcgKyAnZm9yIHRoZSBmdWxsIGVycm9yIG1lc3NhZ2UgYW5kIGFkZGl0aW9uYWwgaGVscGZ1bCB3YXJuaW5ncy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0ludmFyaWFudCBWaW9sYXRpb246ICcgKyBmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYXJnc1thcmdJbmRleCsrXTtcbiAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBlcnJvci5mcmFtZXNUb1BvcCA9IDE7IC8vIHdlIGRvbid0IGNhcmUgYWJvdXQgaW52YXJpYW50J3Mgb3duIGZyYW1lXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaW52YXJpYW50OyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cy5EaXNwYXRjaGVyID0gcmVxdWlyZSgnLi9saWIvRGlzcGF0Y2hlcicpO1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBEaXNwYXRjaGVyXG4gKiBcbiAqIEBwcmV2ZW50TXVuZ2VcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgaW52YXJpYW50ID0gcmVxdWlyZSgnZmJqcy9saWIvaW52YXJpYW50Jyk7XG5cbnZhciBfcHJlZml4ID0gJ0lEXyc7XG5cbi8qKlxuICogRGlzcGF0Y2hlciBpcyB1c2VkIHRvIGJyb2FkY2FzdCBwYXlsb2FkcyB0byByZWdpc3RlcmVkIGNhbGxiYWNrcy4gVGhpcyBpc1xuICogZGlmZmVyZW50IGZyb20gZ2VuZXJpYyBwdWItc3ViIHN5c3RlbXMgaW4gdHdvIHdheXM6XG4gKlxuICogICAxKSBDYWxsYmFja3MgYXJlIG5vdCBzdWJzY3JpYmVkIHRvIHBhcnRpY3VsYXIgZXZlbnRzLiBFdmVyeSBwYXlsb2FkIGlzXG4gKiAgICAgIGRpc3BhdGNoZWQgdG8gZXZlcnkgcmVnaXN0ZXJlZCBjYWxsYmFjay5cbiAqICAgMikgQ2FsbGJhY2tzIGNhbiBiZSBkZWZlcnJlZCBpbiB3aG9sZSBvciBwYXJ0IHVudGlsIG90aGVyIGNhbGxiYWNrcyBoYXZlXG4gKiAgICAgIGJlZW4gZXhlY3V0ZWQuXG4gKlxuICogRm9yIGV4YW1wbGUsIGNvbnNpZGVyIHRoaXMgaHlwb3RoZXRpY2FsIGZsaWdodCBkZXN0aW5hdGlvbiBmb3JtLCB3aGljaFxuICogc2VsZWN0cyBhIGRlZmF1bHQgY2l0eSB3aGVuIGEgY291bnRyeSBpcyBzZWxlY3RlZDpcbiAqXG4gKiAgIHZhciBmbGlnaHREaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcbiAqXG4gKiAgIC8vIEtlZXBzIHRyYWNrIG9mIHdoaWNoIGNvdW50cnkgaXMgc2VsZWN0ZWRcbiAqICAgdmFyIENvdW50cnlTdG9yZSA9IHtjb3VudHJ5OiBudWxsfTtcbiAqXG4gKiAgIC8vIEtlZXBzIHRyYWNrIG9mIHdoaWNoIGNpdHkgaXMgc2VsZWN0ZWRcbiAqICAgdmFyIENpdHlTdG9yZSA9IHtjaXR5OiBudWxsfTtcbiAqXG4gKiAgIC8vIEtlZXBzIHRyYWNrIG9mIHRoZSBiYXNlIGZsaWdodCBwcmljZSBvZiB0aGUgc2VsZWN0ZWQgY2l0eVxuICogICB2YXIgRmxpZ2h0UHJpY2VTdG9yZSA9IHtwcmljZTogbnVsbH1cbiAqXG4gKiBXaGVuIGEgdXNlciBjaGFuZ2VzIHRoZSBzZWxlY3RlZCBjaXR5LCB3ZSBkaXNwYXRjaCB0aGUgcGF5bG9hZDpcbiAqXG4gKiAgIGZsaWdodERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICogICAgIGFjdGlvblR5cGU6ICdjaXR5LXVwZGF0ZScsXG4gKiAgICAgc2VsZWN0ZWRDaXR5OiAncGFyaXMnXG4gKiAgIH0pO1xuICpcbiAqIFRoaXMgcGF5bG9hZCBpcyBkaWdlc3RlZCBieSBgQ2l0eVN0b3JlYDpcbiAqXG4gKiAgIGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgIGlmIChwYXlsb2FkLmFjdGlvblR5cGUgPT09ICdjaXR5LXVwZGF0ZScpIHtcbiAqICAgICAgIENpdHlTdG9yZS5jaXR5ID0gcGF5bG9hZC5zZWxlY3RlZENpdHk7XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBXaGVuIHRoZSB1c2VyIHNlbGVjdHMgYSBjb3VudHJ5LCB3ZSBkaXNwYXRjaCB0aGUgcGF5bG9hZDpcbiAqXG4gKiAgIGZsaWdodERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICogICAgIGFjdGlvblR5cGU6ICdjb3VudHJ5LXVwZGF0ZScsXG4gKiAgICAgc2VsZWN0ZWRDb3VudHJ5OiAnYXVzdHJhbGlhJ1xuICogICB9KTtcbiAqXG4gKiBUaGlzIHBheWxvYWQgaXMgZGlnZXN0ZWQgYnkgYm90aCBzdG9yZXM6XG4gKlxuICogICBDb3VudHJ5U3RvcmUuZGlzcGF0Y2hUb2tlbiA9IGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgIGlmIChwYXlsb2FkLmFjdGlvblR5cGUgPT09ICdjb3VudHJ5LXVwZGF0ZScpIHtcbiAqICAgICAgIENvdW50cnlTdG9yZS5jb3VudHJ5ID0gcGF5bG9hZC5zZWxlY3RlZENvdW50cnk7XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBXaGVuIHRoZSBjYWxsYmFjayB0byB1cGRhdGUgYENvdW50cnlTdG9yZWAgaXMgcmVnaXN0ZXJlZCwgd2Ugc2F2ZSBhIHJlZmVyZW5jZVxuICogdG8gdGhlIHJldHVybmVkIHRva2VuLiBVc2luZyB0aGlzIHRva2VuIHdpdGggYHdhaXRGb3IoKWAsIHdlIGNhbiBndWFyYW50ZWVcbiAqIHRoYXQgYENvdW50cnlTdG9yZWAgaXMgdXBkYXRlZCBiZWZvcmUgdGhlIGNhbGxiYWNrIHRoYXQgdXBkYXRlcyBgQ2l0eVN0b3JlYFxuICogbmVlZHMgdG8gcXVlcnkgaXRzIGRhdGEuXG4gKlxuICogICBDaXR5U3RvcmUuZGlzcGF0Y2hUb2tlbiA9IGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgIGlmIChwYXlsb2FkLmFjdGlvblR5cGUgPT09ICdjb3VudHJ5LXVwZGF0ZScpIHtcbiAqICAgICAgIC8vIGBDb3VudHJ5U3RvcmUuY291bnRyeWAgbWF5IG5vdCBiZSB1cGRhdGVkLlxuICogICAgICAgZmxpZ2h0RGlzcGF0Y2hlci53YWl0Rm9yKFtDb3VudHJ5U3RvcmUuZGlzcGF0Y2hUb2tlbl0pO1xuICogICAgICAgLy8gYENvdW50cnlTdG9yZS5jb3VudHJ5YCBpcyBub3cgZ3VhcmFudGVlZCB0byBiZSB1cGRhdGVkLlxuICpcbiAqICAgICAgIC8vIFNlbGVjdCB0aGUgZGVmYXVsdCBjaXR5IGZvciB0aGUgbmV3IGNvdW50cnlcbiAqICAgICAgIENpdHlTdG9yZS5jaXR5ID0gZ2V0RGVmYXVsdENpdHlGb3JDb3VudHJ5KENvdW50cnlTdG9yZS5jb3VudHJ5KTtcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFRoZSB1c2FnZSBvZiBgd2FpdEZvcigpYCBjYW4gYmUgY2hhaW5lZCwgZm9yIGV4YW1wbGU6XG4gKlxuICogICBGbGlnaHRQcmljZVN0b3JlLmRpc3BhdGNoVG9rZW4gPVxuICogICAgIGZsaWdodERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24ocGF5bG9hZCkge1xuICogICAgICAgc3dpdGNoIChwYXlsb2FkLmFjdGlvblR5cGUpIHtcbiAqICAgICAgICAgY2FzZSAnY291bnRyeS11cGRhdGUnOlxuICogICAgICAgICBjYXNlICdjaXR5LXVwZGF0ZSc6XG4gKiAgICAgICAgICAgZmxpZ2h0RGlzcGF0Y2hlci53YWl0Rm9yKFtDaXR5U3RvcmUuZGlzcGF0Y2hUb2tlbl0pO1xuICogICAgICAgICAgIEZsaWdodFByaWNlU3RvcmUucHJpY2UgPVxuICogICAgICAgICAgICAgZ2V0RmxpZ2h0UHJpY2VTdG9yZShDb3VudHJ5U3RvcmUuY291bnRyeSwgQ2l0eVN0b3JlLmNpdHkpO1xuICogICAgICAgICAgIGJyZWFrO1xuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogVGhlIGBjb3VudHJ5LXVwZGF0ZWAgcGF5bG9hZCB3aWxsIGJlIGd1YXJhbnRlZWQgdG8gaW52b2tlIHRoZSBzdG9yZXMnXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcyBpbiBvcmRlcjogYENvdW50cnlTdG9yZWAsIGBDaXR5U3RvcmVgLCB0aGVuXG4gKiBgRmxpZ2h0UHJpY2VTdG9yZWAuXG4gKi9cblxudmFyIERpc3BhdGNoZXIgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBEaXNwYXRjaGVyKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBEaXNwYXRjaGVyKTtcblxuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xuICAgIHRoaXMuX2lzRGlzcGF0Y2hpbmcgPSBmYWxzZTtcbiAgICB0aGlzLl9pc0hhbmRsZWQgPSB7fTtcbiAgICB0aGlzLl9pc1BlbmRpbmcgPSB7fTtcbiAgICB0aGlzLl9sYXN0SUQgPSAxO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2l0aCBldmVyeSBkaXNwYXRjaGVkIHBheWxvYWQuIFJldHVybnNcbiAgICogYSB0b2tlbiB0aGF0IGNhbiBiZSB1c2VkIHdpdGggYHdhaXRGb3IoKWAuXG4gICAqL1xuXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24gcmVnaXN0ZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgaWQgPSBfcHJlZml4ICsgdGhpcy5fbGFzdElEKys7XG4gICAgdGhpcy5fY2FsbGJhY2tzW2lkXSA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBpZDtcbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGNhbGxiYWNrIGJhc2VkIG9uIGl0cyB0b2tlbi5cbiAgICovXG5cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUudW5yZWdpc3RlciA9IGZ1bmN0aW9uIHVucmVnaXN0ZXIoaWQpIHtcbiAgICAhdGhpcy5fY2FsbGJhY2tzW2lkXSA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdEaXNwYXRjaGVyLnVucmVnaXN0ZXIoLi4uKTogYCVzYCBkb2VzIG5vdCBtYXAgdG8gYSByZWdpc3RlcmVkIGNhbGxiYWNrLicsIGlkKSA6IGludmFyaWFudChmYWxzZSkgOiB1bmRlZmluZWQ7XG4gICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1tpZF07XG4gIH07XG5cbiAgLyoqXG4gICAqIFdhaXRzIGZvciB0aGUgY2FsbGJhY2tzIHNwZWNpZmllZCB0byBiZSBpbnZva2VkIGJlZm9yZSBjb250aW51aW5nIGV4ZWN1dGlvblxuICAgKiBvZiB0aGUgY3VycmVudCBjYWxsYmFjay4gVGhpcyBtZXRob2Qgc2hvdWxkIG9ubHkgYmUgdXNlZCBieSBhIGNhbGxiYWNrIGluXG4gICAqIHJlc3BvbnNlIHRvIGEgZGlzcGF0Y2hlZCBwYXlsb2FkLlxuICAgKi9cblxuICBEaXNwYXRjaGVyLnByb3RvdHlwZS53YWl0Rm9yID0gZnVuY3Rpb24gd2FpdEZvcihpZHMpIHtcbiAgICAhdGhpcy5faXNEaXNwYXRjaGluZyA/IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBpbnZhcmlhbnQoZmFsc2UsICdEaXNwYXRjaGVyLndhaXRGb3IoLi4uKTogTXVzdCBiZSBpbnZva2VkIHdoaWxlIGRpc3BhdGNoaW5nLicpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgaWRzLmxlbmd0aDsgaWkrKykge1xuICAgICAgdmFyIGlkID0gaWRzW2lpXTtcbiAgICAgIGlmICh0aGlzLl9pc1BlbmRpbmdbaWRdKSB7XG4gICAgICAgICF0aGlzLl9pc0hhbmRsZWRbaWRdID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ0Rpc3BhdGNoZXIud2FpdEZvciguLi4pOiBDaXJjdWxhciBkZXBlbmRlbmN5IGRldGVjdGVkIHdoaWxlICcgKyAnd2FpdGluZyBmb3IgYCVzYC4nLCBpZCkgOiBpbnZhcmlhbnQoZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgICF0aGlzLl9jYWxsYmFja3NbaWRdID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ0Rpc3BhdGNoZXIud2FpdEZvciguLi4pOiBgJXNgIGRvZXMgbm90IG1hcCB0byBhIHJlZ2lzdGVyZWQgY2FsbGJhY2suJywgaWQpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX2ludm9rZUNhbGxiYWNrKGlkKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIERpc3BhdGNoZXMgYSBwYXlsb2FkIHRvIGFsbCByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAgICovXG5cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbiBkaXNwYXRjaChwYXlsb2FkKSB7XG4gICAgISF0aGlzLl9pc0Rpc3BhdGNoaW5nID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ0Rpc3BhdGNoLmRpc3BhdGNoKC4uLik6IENhbm5vdCBkaXNwYXRjaCBpbiB0aGUgbWlkZGxlIG9mIGEgZGlzcGF0Y2guJykgOiBpbnZhcmlhbnQoZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgIHRoaXMuX3N0YXJ0RGlzcGF0Y2hpbmcocGF5bG9hZCk7XG4gICAgdHJ5IHtcbiAgICAgIGZvciAodmFyIGlkIGluIHRoaXMuX2NhbGxiYWNrcykge1xuICAgICAgICBpZiAodGhpcy5faXNQZW5kaW5nW2lkXSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2ludm9rZUNhbGxiYWNrKGlkKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5fc3RvcERpc3BhdGNoaW5nKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBJcyB0aGlzIERpc3BhdGNoZXIgY3VycmVudGx5IGRpc3BhdGNoaW5nLlxuICAgKi9cblxuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5pc0Rpc3BhdGNoaW5nID0gZnVuY3Rpb24gaXNEaXNwYXRjaGluZygpIHtcbiAgICByZXR1cm4gdGhpcy5faXNEaXNwYXRjaGluZztcbiAgfTtcblxuICAvKipcbiAgICogQ2FsbCB0aGUgY2FsbGJhY2sgc3RvcmVkIHdpdGggdGhlIGdpdmVuIGlkLiBBbHNvIGRvIHNvbWUgaW50ZXJuYWxcbiAgICogYm9va2tlZXBpbmcuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cblxuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5faW52b2tlQ2FsbGJhY2sgPSBmdW5jdGlvbiBfaW52b2tlQ2FsbGJhY2soaWQpIHtcbiAgICB0aGlzLl9pc1BlbmRpbmdbaWRdID0gdHJ1ZTtcbiAgICB0aGlzLl9jYWxsYmFja3NbaWRdKHRoaXMuX3BlbmRpbmdQYXlsb2FkKTtcbiAgICB0aGlzLl9pc0hhbmRsZWRbaWRdID0gdHJ1ZTtcbiAgfTtcblxuICAvKipcbiAgICogU2V0IHVwIGJvb2trZWVwaW5nIG5lZWRlZCB3aGVuIGRpc3BhdGNoaW5nLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG5cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUuX3N0YXJ0RGlzcGF0Y2hpbmcgPSBmdW5jdGlvbiBfc3RhcnREaXNwYXRjaGluZyhwYXlsb2FkKSB7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5fY2FsbGJhY2tzKSB7XG4gICAgICB0aGlzLl9pc1BlbmRpbmdbaWRdID0gZmFsc2U7XG4gICAgICB0aGlzLl9pc0hhbmRsZWRbaWRdID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX3BlbmRpbmdQYXlsb2FkID0gcGF5bG9hZDtcbiAgICB0aGlzLl9pc0Rpc3BhdGNoaW5nID0gdHJ1ZTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xlYXIgYm9va2tlZXBpbmcgdXNlZCBmb3IgZGlzcGF0Y2hpbmcuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cblxuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5fc3RvcERpc3BhdGNoaW5nID0gZnVuY3Rpb24gX3N0b3BEaXNwYXRjaGluZygpIHtcbiAgICBkZWxldGUgdGhpcy5fcGVuZGluZ1BheWxvYWQ7XG4gICAgdGhpcy5faXNEaXNwYXRjaGluZyA9IGZhbHNlO1xuICB9O1xuXG4gIHJldHVybiBEaXNwYXRjaGVyO1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEaXNwYXRjaGVyOyIsIid1c2Ugc3RyaWN0Jztcbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cdFx0dGVzdDFbNV0gPSAnZGUnO1xuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MSlbMF0gPT09ICc1Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDIgPSB7fTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHtcblx0XHRcdHRlc3QyWydfJyArIFN0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaTtcblx0XHR9XG5cdFx0dmFyIG9yZGVyMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QyKS5tYXAoZnVuY3Rpb24gKG4pIHtcblx0XHRcdHJldHVybiB0ZXN0MltuXTtcblx0XHR9KTtcblx0XHRpZiAob3JkZXIyLmpvaW4oJycpICE9PSAnMDEyMzQ1Njc4OScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QzID0ge307XG5cdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jy5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAobGV0dGVyKSB7XG5cdFx0XHR0ZXN0M1tsZXR0ZXJdID0gbGV0dGVyO1xuXHRcdH0pO1xuXHRcdGlmIChPYmplY3Qua2V5cyhPYmplY3QuYXNzaWduKHt9LCB0ZXN0MykpLmpvaW4oJycpICE9PVxuXHRcdFx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG5cdFx0XHRzeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhmcm9tKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3ltYm9scy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAocHJvcElzRW51bWVyYWJsZS5jYWxsKGZyb20sIHN5bWJvbHNbaV0pKSB7XG5cdFx0XHRcdFx0dG9bc3ltYm9sc1tpXV0gPSBmcm9tW3N5bWJvbHNbaV1dO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRvO1xufTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpO1xuXG52YXIgUkVQTEFjdGlvbnMgPSB7XG4gIGFkZFRvT3V0cHV0QnVmZmVyOiBmdW5jdGlvbihvdXRwdXQpIHtcbiAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAgICAgIGFjdGlvblR5cGU6ICdhZGQtdG8tb3V0cHV0LWJ1ZmZlcicsXG4gICAgICBvdXRwdXQ6IG91dHB1dFxuICAgIH0pO1xuICB9LFxuICBhZGRUb0NvbW1hbmRIaXN0b3J5OiBmdW5jdGlvbihpbnB1dCkge1xuICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgYWN0aW9uVHlwZTogJ2FkZC10by1jb21tYW5kLWhpc3RvcnknLFxuICAgICAgaW5wdXQ6IGlucHV0XG4gICAgfSk7XG4gIH0sXG4gIGdvQmFja0luQ29tbWFuZEhpc3Rvcnk6IGZ1bmN0aW9uKCkge1xuICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgYWN0aW9uVHlwZTogJ21vdmUtY29tbWFuZC1oaXN0b3J5LW9mZnNldCcsXG4gICAgICBvZmZzZXRDaGFuZ2U6IDFcbiAgICB9KTtcbiAgfSxcbiAgZ29Gb3J3YXJkSW5Db21tYW5kSGlzdG9yeTogZnVuY3Rpb24oKSB7XG4gICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gICAgICBhY3Rpb25UeXBlOiAnbW92ZS1jb21tYW5kLWhpc3Rvcnktb2Zmc2V0JyxcbiAgICAgIG9mZnNldENoYW5nZTogLTFcbiAgICB9KTtcbiAgfSxcbiAgcmVzZXRDb21tYW5kSGlzdG9yeU9mZnNldDogZnVuY3Rpb24oKSB7XG4gICAgQXBwRGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gICAgICBhY3Rpb25UeXBlOiAncmVzZXQtY29tbWFuZC1oaXN0b3J5LW9mZnNldCdcbiAgICB9KTtcbiAgfSxcbiAgc2V0U3VkbzogZnVuY3Rpb24oY29tbWFuZCwgYXJncykge1xuICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgYWN0aW9uVHlwZTogJ3NldC1zdWRvJyxcbiAgICAgIGNvbW1hbmQ6IGNvbW1hbmQsXG4gICAgICBhcmdzOiBhcmdzLFxuICAgICAgd2hvYW1pOiAnW3N1ZG9dIHBhc3N3b3JkIGZvciB0YWw6J1xuICAgIH0pO1xuICB9LFxuICBjbGVhclN1ZG86IGZ1bmN0aW9uKCkge1xuICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgYWN0aW9uVHlwZTogJ2NsZWFyLXN1ZG8nXG4gICAgfSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUkVQTEFjdGlvbnM7XG4iLCJ2YXIgUkVQTGNvbW1hbmRzID0gcmVxdWlyZSgnLi9yZXBsLmNvbW1hbmRzLnJlYWN0LmpzJyk7XG52YXIgT3V0cHV0QnVmZmVyU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy9PdXRwdXRCdWZmZXJTdG9yZS5qcycpO1xudmFyIEFwcFN0YXRlU3RvcmUgPSByZXF1aXJlKCcuL3N0b3Jlcy9BcHBTdGF0ZVN0b3JlLmpzJyk7XG52YXIgQ29tbWFuZEhpc3RvcnlTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmVzL0NvbW1hbmRIaXN0b3J5U3RvcmUuanMnKTtcbnZhciBSRVBMQWN0aW9ucyA9ICByZXF1aXJlKCcuL2FjdGlvbnMvUkVQTEFjdGlvbnMuanMnKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBSRVBMJ3MgTGl0dGxlIEhlbHBlcnMgKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyBQbGFjZXMgY3Vyc29yIG9uIHRoZSB0ZXh0IGlucHV0LlxudmFyIGZvY3VzT25JbnB1dCA9ICgpID0+IHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcGwtdGV4dC1pbnB1dCcpLmZvY3VzKCk7XG59O1xuXG52YXIgZ2V0UkVQTHN0YXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgb3V0cHV0QnVmZmVyOiBPdXRwdXRCdWZmZXJTdG9yZS5nZXRBbGwoKSxcbiAgICB3aG9hbWk6IEFwcFN0YXRlU3RvcmUuZ2V0V2hvQW1JKCksXG4gICAgc3VkbzogQXBwU3RhdGVTdG9yZS5nZXRTdWRvKClcbiAgfVxufTtcblxuLyoqKioqKioqKioqKioqKioqKioqL1xuLyogUmVhY3QgY29tcG9uZW50cyAqL1xuLyoqKioqKioqKioqKioqKioqKioqL1xuXG52YXIgUkVQTCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBnZXRSRVBMc3RhdGUoKTtcbiAgfSxcblxuICAvLyBSZWFkcyBhIGNvbW1hbmQgdGhhdCB3YXMganVzdCBzdWJtaXR0ZWQgYW5kIHBhc3NlcyBpdCB0byBFVkFMVUFURVxuICBSRUFEOiBmdW5jdGlvbihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcGwtdGV4dC1pbnB1dCcpLnZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKCF0aGlzLnN0YXRlLnN1ZG8pIHtcbiAgICAgIFJFUExBY3Rpb25zLmFkZFRvQ29tbWFuZEhpc3RvcnkoaW5wdXQpO1xuICAgIH1cbiAgICB0aGlzLkVWQUxVQVRFKGlucHV0KTtcbiAgfSxcblxuICAvLyBFdmFsdWF0ZSBhIGNvbW1hbmQgYW5kIHBhc3NlcyBpdCBhbmQgaXRzIHJlc3VsdCB0byBQUklOVCwgdGhlbiBsb29wc1xuICBFVkFMVUFURTogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAvLyBBcmUgd2UgZG9pbmcgYSBwYXNzd29yZCBjaGVjayByaWdodCBub3c/XG4gICAgaWYgKHRoaXMuc3RhdGUuc3Vkbykge1xuICAgICAgaWYgKGlucHV0ID09PSAnMTIzNDUnKSB7XG4gICAgICAgIGxldCBQRVJNSVNTSU9OX0dSQU5URUQgPSB0cnVlO1xuICAgICAgICB0aGlzLnJ1bkNvbW1hbmQodGhpcy5zdGF0ZS5zdWRvLmNvbW1hbmQsIHRoaXMuc3RhdGUuc3Vkby5hcmdzLmNvbmNhdChQRVJNSVNTSU9OX0dSQU5URUQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuUFJJTlQoJ3N1ZG86IGluY29ycmVjdCBwYXNzd29yZCcpO1xuICAgICAgfVxuICAgICAgUkVQTEFjdGlvbnMuY2xlYXJTdWRvKCk7XG4gICAgICB0aGlzLkxPT1AoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBPdXRwdXQgdGhlIGlucHV0IGFzIG9uZSBkb2VzIGZyb20gdGltZSB0byB0aW1lXG4gICAgdGhpcy5QUklOVChcbiAgICAgIHRoaXMuc3RhdGUud2hvYW1pKycgJyArIGlucHV0XG4gICAgKTtcblxuICAgIGxldCBjb21tYW5kLCBhcmdzO1xuICAgIC8vIERlc3RydWN0dXJpbmcgYW5kIHJlc3QgZm9yIHRoZSB3aW4hXG4gICAgW2NvbW1hbmQsIC4uLmFyZ3NdID0gaW5wdXQuc3BsaXQoJyAnKTtcbiAgICAvLyBDaGVjayBpZiBjb21tYW5kIGV4aXN0c1xuICAgIHRoaXMucnVuQ29tbWFuZChjb21tYW5kLCBhcmdzKTtcbiAgICB0aGlzLkxPT1AoKTtcbiAgfSxcblxuICAvLyBQcmludHMgb3V0cHV0IGZyb20gYSBjb21tYW5kXG4gIFBSSU5UOiBmdW5jdGlvbihvdXRwdXQpIHtcbiAgICBSRVBMQWN0aW9ucy5hZGRUb091dHB1dEJ1ZmZlcihvdXRwdXQpO1xuICB9LFxuXG4gIC8vIENsZWFycyBhbmQgZm9jdXNlcyBpbnB1dCBhZ2FpblxuICBMT09QOiBmdW5jdGlvbigpIHtcbiAgICBSRVBMQWN0aW9ucy5yZXNldENvbW1hbmRIaXN0b3J5T2Zmc2V0KCk7XG4gICAgZm9jdXNPbklucHV0KCk7XG4gIH0sXG5cbiAgLy8gTWFrZSBzdXJlIGEgY29tbWFuZCBleGlzdHMsIHRoZW4gcnVuIGl0IHdpdGggaXRzIGFyZ3VtZW50c1xuICBydW5Db21tYW5kOiBmdW5jdGlvbihjb21tYW5kLCBhcmdzKSB7XG4gICAgaWYgKFJFUExjb21tYW5kc1tjb21tYW5kXSkge1xuICAgICAgdGhpcy5QUklOVChcbiAgICAgICAgUkVQTGNvbW1hbmRzW2NvbW1hbmRdLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLlBSSU5UKCdjb21tYW5kIG5vdCBmb3VuZDogJytjb21tYW5kKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGZvY3VzT25JbnB1dCgpO1xuICAgIE91dHB1dEJ1ZmZlclN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICBBcHBTdGF0ZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMuX29uQ2hhbmdlKTtcbiAgICBBcHBTdGF0ZVN0b3JlLmFkZENoYW5nZUxpc3RlbmVyKHRoaXMucmVuZGVySGlzdG9yaWNDb21tYW5kKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgT3V0cHV0QnVmZmVyU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIEFwcFN0YXRlU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UpO1xuICAgIEFwcFN0YXRlU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5yZW5kZXJIaXN0b3JpY0NvbW1hbmQpO1xuICB9LFxuXG4gIGhhbmRsZUtleURvd246IGZ1bmN0aW9uKGUpIHtcbiAgICAvLyBVcCBrZXkgcHJlc3NlZFxuICAgIGlmIChlLmtleUNvZGUgPT09IDM4KSB7XG4gICAgICBSRVBMQWN0aW9ucy5nb0JhY2tJbkNvbW1hbmRIaXN0b3J5KCk7XG4gICAgfVxuICAgIC8vIERvd24ga2V5IHByZXNzZWRcbiAgICBpZiAoZS5rZXlDb2RlID09PSA0MCkge1xuICAgICAgUkVQTEFjdGlvbnMuZ29Gb3J3YXJkSW5Db21tYW5kSGlzdG9yeSgpO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXJIaXN0b3JpY0NvbW1hbmQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb21tYW5kID0gQ29tbWFuZEhpc3RvcnlTdG9yZS5nZXRDb21tYW5kKEFwcFN0YXRlU3RvcmUuZ2V0Q29tbWFuZEhpc3RvcnlPZmZzZXQoKSk7XG4gICAgaWYgKCFjb21tYW5kKSB7XG4gICAgICB0aGlzLnNldElucHV0VmFsdWUoJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldElucHV0VmFsdWUoY29tbWFuZC5jb21tYW5kKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24odmFsKSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcGwtdGV4dC1pbnB1dCcpLnZhbHVlPXZhbDtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXRwdXRMaW5lcyA9IHRoaXMuc3RhdGUub3V0cHV0QnVmZmVyLm1hcChcbiAgICAgIChsaW5lKSA9PiAoIDxkaXYga2V5PXtsaW5lLmtleX0+e2xpbmUudGV4dH08L2Rpdj4gKVxuICAgICk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVwbC1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZXBsLW91dHB1dFwiPlxuICAgICAgICAgIHtvdXRwdXRMaW5lc31cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVwbC1pbnB1dFwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIndob2FtaVwiPnt0aGlzLnN0YXRlLndob2FtaX08L3NwYW4+XG4gICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e3RoaXMuUkVBRH0+XG4gICAgICAgICAgICA8aW5wdXQgb25CbHVyPXtmb2N1c09uSW5wdXR9IG9uS2V5RG93bj17dGhpcy5oYW5kbGVLZXlEb3dufSBpZD1cInJlcGwtdGV4dC1pbnB1dFwiPjwvaW5wdXQ+XG4gICAgICAgICAgPC9mb3JtPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN0YXRlKGdldFJFUExzdGF0ZSgpKTtcbiAgfVxuXG59KTtcblxuXG4vKioqKioqKioqKioqKioqL1xuLyogVlJPT00gVlJPT00gKi9cbi8qKioqKioqKioqKioqKiovXG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPFJFUEwgLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXBsJylcbik7XG4iLCJ2YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoJ2ZsdXgnKS5EaXNwYXRjaGVyO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBEaXNwYXRjaGVyKCk7XG4iLCJ2YXIgUkVQTEFjdGlvbnMgPSAgcmVxdWlyZSgnLi9hY3Rpb25zL1JFUExBY3Rpb25zLmpzJyk7XG5cbnZhciBSRVBMY29tbWFuZHMgPSB7XG4gIFwiaGVscFwiOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGJyIC8+XG4gICAgICAgIDxwPjxzdHJvbmc+V2VsY29tZSB0byBSRVBMb2dpbi48L3N0cm9uZz48L3A+XG4gICAgICAgIDxwPkhlcmUgYXJlIHNvbWUgY29tbWFuZHMgeW91IGNhbiB0cnk6PC9wPlxuICAgICAgICA8cD48ZW0+bHM8L2VtPiAgICAgTGlzdCBkaXJlY3RvcnkgY29udGVudHM8L3A+XG4gICAgICAgIDxwPjxlbT5jZDwvZW0+ICAgICBDaGFuZ2UgdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuPC9wPlxuICAgICAgICA8cD48ZW0+cHdkPC9lbT4gICAgUHJpbnQgbmFtZSBvZiBjdXJyZW50L3dvcmtpbmcgZGlyZWN0b3J5LjwvcD5cbiAgICAgICAgPHA+PGVtPmNhdDwvZW0+ICAgIFNob3cgdGhlIGNvbnRlbnRzIG9mIGEgZmlsZS48L3A+XG4gICAgICAgIDxwPjxlbT5zdWRvPC9lbT4gICBFeGVjdXRlIGEgY29tbWFuZCBhcyBhbm90aGVyIHVzZXIuPC9wPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuICBcImNkXCI6IGZ1bmN0aW9uKGRlc3RpbmF0aW9uKSB7XG4gICAgaWYgKGRlc3RpbmF0aW9uID09PSAnLicpIHtcbiAgICAgIHJldHVybiAoPGRpdj5UaGVyZSBhbmQgYmFjayBhZ2Fpbi48L2Rpdj4pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gKDxkaXY+Tm9uZSBzaGFsbCBwYXNzITwvZGl2Pik7XG4gICAgfVxuICB9LFxuICBcImxzXCI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2PmRyd3gtLS0tLS0gIDcgdGFsICB0YWwgICA0MDk2IFNlcCA3ICAxNzowOCAuPC9kaXY+XG4gICAgICAgIDxkaXY+ZHJ3eHIteHIteCAgMyByb290IHJvb3QgIDQwOTYgU2VwIDggIDEyOjI5IC4uPC9kaXY+XG4gICAgICAgIDxkaXY+LXJ3LS0tLS0tLSAgMSByb290IHJvb3QgICAzMDQgU2VwIDggIDEzOjIyIDxlbT5wYXNzd29yZHM8L2VtPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuICBcImxsXCI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBSRVBMY29tbWFuZHNbXCJsc1wiXSgpO1xuICB9LFxuICBcInB3ZFwiOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj4vVXNlcnMvdGFsPC9kaXY+XG4gICAgKVxuICB9LFxuICBcIi4vcGFzc3dvcmRzXCI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBSRVBMY29tbWFuZHNbXCJwYXNzd29yZHNcIl0oKTtcbiAgfSxcbiAgXCJwYXNzd29yZHNcIjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXY+Y29tbWFuZCBub3QgZm91bmQ6IHBhc3N3b3JkczwvZGl2PlxuICAgICAgICA8ZGl2PlRyeSB1c2luZyA8c3Ryb25nPmNhdDwvc3Ryb25nPiB0byB2aWV3IHRoZSBjb250ZW50cyBvZiB0aGlzIGZpbGUuPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG4gIFwiY2F0XCI6IGZ1bmN0aW9uKGZpbGVuYW1lLCBwZXJtaXNzaW9uKSB7XG4gICAgaWYgKCFmaWxlbmFtZSkge1xuICAgICAgcmV0dXJuICg8ZGl2PmNhdDogUmVxdWlyZXMgYSBmaWxlbmFtZSBhcyBpdHMgZmlyc3QgYXJndW1lbnQ8L2Rpdj4pO1xuICAgIH1cbiAgICBpZiAoZmlsZW5hbWUgIT09ICdwYXNzd29yZHMnKSB7XG4gICAgICByZXR1cm4gKDxkaXY+Y2F0OiB7ZmlsZW5hbWV9OiBObyBzdWNoIGZpbGUgb3IgZGlyZWN0b3J5PC9kaXY+KTtcbiAgICB9XG4gICAgaWYgKHBlcm1pc3Npb24pIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGltZyBzcmM9XCJodHRwczovL2Nkbi5tZW1lLmFtL2luc3RhbmNlcy81MzM3NjA2MC5qcGdcIiAvPlxuICAgICAgICAgIDxkaXY+PGEgaHJlZj1cIi9yZXF1aXJlbWVudHMuaHRtbFwiPkhvdyBkaWQgd2UgZG8/PC9hPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGRpdj5jYXQ6IHtmaWxlbmFtZX06IFBlcm1pc3Npb24gZGVuaWVkPC9kaXY+XG4gICAgICAgICAgPGRpdj5IYXZlIHlvdSB0cmllZCA8c3Ryb25nPnN1ZG8gY2F0IHtmaWxlbmFtZX08L3N0cm9uZz4/PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIFwic3Vkb1wiOiBmdW5jdGlvbihjb21tYW5kLCAuLi5hcmdzKSB7XG4gICAgUkVQTEFjdGlvbnMuc2V0U3Vkbyhjb21tYW5kLCBhcmdzKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgWW91IG5lZWQgdG8gYmUgXCJsb2dnZWQgaW5cIiBhcyByb290LlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSRVBMY29tbWFuZHM7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcbnZhciBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG52YXIgQ29tbWFuZEhpc3RvcnlTdG9yZSA9IHJlcXVpcmUoJy4vQ29tbWFuZEhpc3RvcnlTdG9yZScpO1xuXG5jb25zdCBDSEFOR0VfRVZFTlQgPSAnY2hhbmdlJztcbmNvbnN0IERFRkFVTFRfV0hPQU1JID0gJ1t0YWxAYXRlciB+XSAkJztcblxudmFyIF9hcHBTdGF0ZSA9IHtcbiAgc3VkbzogdW5kZWZpbmVkLFxuICB3aG9hbWk6IERFRkFVTFRfV0hPQU1JLFxuICBjb21tYW5kSGlzdG9yeU9mZnNldDogLTFcbn07XG5cbnZhciBBcHBTdGF0ZVN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG4gIGdldFdob0FtSTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF9hcHBTdGF0ZS53aG9hbWk7XG4gIH0sXG4gIGdldFN1ZG86IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfYXBwU3RhdGUuc3VkbztcbiAgfSxcbiAgZ2V0Q29tbWFuZEhpc3RvcnlPZmZzZXQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfYXBwU3RhdGUuY29tbWFuZEhpc3RvcnlPZmZzZXQ7XG4gIH0sXG4gIGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZW1pdChDSEFOR0VfRVZFTlQpO1xuICB9LFxuICBhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLm9uKENIQU5HRV9FVkVOVCwgY2FsbGJhY2spO1xuICB9LFxuICByZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKENIQU5HRV9FVkVOVCwgY2FsbGJhY2spO1xuICB9XG59KTtcblxuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgc3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG4gICAgY2FzZSAnc2V0LXN1ZG8nOlxuICAgICAgX2FwcFN0YXRlLnN1ZG8gPSB7Y29tbWFuZDogYWN0aW9uLmNvbW1hbmQsIGFyZ3M6IGFjdGlvbi5hcmdzfTtcbiAgICAgIF9hcHBTdGF0ZS53aG9hbWkgPSBhY3Rpb24ud2hvYW1pO1xuICAgICAgQXBwU3RhdGVTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjbGVhci1zdWRvJzpcbiAgICAgIF9hcHBTdGF0ZS5zdWRvID0gdW5kZWZpbmVkO1xuICAgICAgX2FwcFN0YXRlLndob2FtaSA9IERFRkFVTFRfV0hPQU1JO1xuICAgICAgQXBwU3RhdGVTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdtb3ZlLWNvbW1hbmQtaGlzdG9yeS1vZmZzZXQnOlxuICAgICAgdmFyIG9mZnNldCA9IF9hcHBTdGF0ZS5jb21tYW5kSGlzdG9yeU9mZnNldCArIGFjdGlvbi5vZmZzZXRDaGFuZ2U7XG4gICAgICB2YXIgY29tbWFuZEhpc3RvcnlMZW5ndGggPSBDb21tYW5kSGlzdG9yeVN0b3JlLmdldENvbW1hbmRIaXN0b3J5TGVuZ3RoKCk7XG4gICAgICBpZiAob2Zmc2V0ID49IGNvbW1hbmRIaXN0b3J5TGVuZ3RoIHx8IG9mZnNldCA8IC0xKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIF9hcHBTdGF0ZS5jb21tYW5kSGlzdG9yeU9mZnNldCA9IG9mZnNldDtcbiAgICAgIEFwcFN0YXRlU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmVzZXQtY29tbWFuZC1oaXN0b3J5LW9mZnNldCc6XG4gICAgICBfYXBwU3RhdGUuY29tbWFuZEhpc3RvcnlPZmZzZXQgPSAtMTtcbiAgICAgIEFwcFN0YXRlU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgYnJlYWs7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcFN0YXRlU3RvcmU7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcbnZhciBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbmNvbnN0IENIQU5HRV9FVkVOVCA9ICdjaGFuZ2UnO1xuXG52YXIgX2NvbW1hbmRIaXN0b3J5ID0gW107XG5cbnZhciBDb21tYW5kSGlzdG9yeVN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG4gIGdldEFsbDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF9jb21tYW5kSGlzdG9yeTtcbiAgfSxcblxuICBnZXRDb21tYW5kSGlzdG9yeUxlbmd0aDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF9jb21tYW5kSGlzdG9yeS5sZW5ndGg7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzaW5nbGUgY29tbWFuZCBmcm9tIHRoZSBoaXN0b3J5XG4gICAqIElmIG9mZnNldCBpcyAwLCBpdCB3aWxsIHJldHVybiB0aGUgbGFzdCBjb21tYW5kLlxuICAgKiBJZiBvZmZzZXQgaXMgMSwgaXQgd2lsbCByZXR1cm4gdGhlIHNlY29uZCB0byBsYXN0IGNvbW1hbmQuXG4gICAqIGV0Yy5cbiAgICpcbiAgICogQHBhcmFtIHtpbnRlZ2VyfSBvZmZzZXQgIEFuIG9mZnNldCBmcm9tIHRoZSBsYXN0IGNvbW1hbmQgaW4gaGlzdG9yeVxuICAgKiBAcmV0dXJuIHtvYmplY3R9IENvbW1hbmQgQSBjb21tYW5kIG9iamVjdFxuICAgKi9cbiAgZ2V0Q29tbWFuZDogZnVuY3Rpb24ob2Zmc2V0KSB7XG4gICAgdmFyIGxlbiA9IF9jb21tYW5kSGlzdG9yeS5sZW5ndGg7XG4gICAgdmFyIGNvbW1hbmQgPSBfY29tbWFuZEhpc3Rvcnkuc2xpY2UobGVuLW9mZnNldC0xLCBsZW4tb2Zmc2V0KVswXTtcbiAgICByZXR1cm4gY29tbWFuZDtcbiAgfSxcblxuICBlbWl0Q2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmVtaXQoQ0hBTkdFX0VWRU5UKTtcbiAgfSxcbiAgYWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5vbihDSEFOR0VfRVZFTlQsIGNhbGxiYWNrKTtcbiAgfSxcbiAgcmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihDSEFOR0VfRVZFTlQsIGNhbGxiYWNrKTtcbiAgfVxufSk7XG5cbkFwcERpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gIHN3aXRjaChhY3Rpb24uYWN0aW9uVHlwZSkge1xuICAgIGNhc2UgJ2FkZC10by1jb21tYW5kLWhpc3RvcnknOlxuICAgICAgdmFyIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9TdHJpbmcoKTtcbiAgICAgIHZhciBpZCA9ICh0aW1lc3RhbXAgKyAnICcgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA5OTk5OTkpKS50b1N0cmluZygzNik7XG4gICAgICBfY29tbWFuZEhpc3RvcnkucHVzaCh7IGlkOiBpZCwgY29tbWFuZDogYWN0aW9uLmlucHV0LCB0aW1lc3RhbXA6IHRpbWVzdGFtcCB9KTtcbiAgICAgIENvbW1hbmRIaXN0b3J5U3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgYnJlYWs7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbW1hbmRIaXN0b3J5U3RvcmU7XG4iLCJ2YXIgQXBwRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlcicpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcbnZhciBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbmNvbnN0IENIQU5HRV9FVkVOVCA9ICdjaGFuZ2UnO1xuXG52YXIgX291dHB1dEJ1ZmZlciA9IFtcbiAge2tleTogMCwgdGV4dDogJ1dlbGNvbWUgdG8gUkVQTG9naW4nfSxcbiAge2tleTogMSwgdGV4dDogJ0xhc3QgbG9naW46IFRodSBTZXAgOCAwNjowNToxNSAyMDE2IGZyb20gNDYuMTIwLjUuMjA1IChub3QgcmVhbGx5KSd9LFxuICB7a2V5OiAyLCB0ZXh0OiAnLWJhc2g6IHdhcm5pbmc6IFRoaXMgaXMgbm90IGJhc2gnfSxcbiAge2tleTogMywgdGV4dDogJ0ZvciBhIGxpc3Qgb2YgYXZhaWxhYmxlIGNvbW1hbmRzLCB0cnkgdHlwaW5nIGhlbHAnfVxuXTtcblxudmFyIE91dHB1dEJ1ZmZlclN0b3JlID0gYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG4gIGdldEFsbDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF9vdXRwdXRCdWZmZXI7XG4gIH0sXG4gIGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZW1pdChDSEFOR0VfRVZFTlQpO1xuICB9LFxuICBhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLm9uKENIQU5HRV9FVkVOVCwgY2FsbGJhY2spO1xuICB9LFxuICByZW1vdmVDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKENIQU5HRV9FVkVOVCwgY2FsbGJhY2spO1xuICB9XG59KTtcblxuQXBwRGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihhY3Rpb24pIHtcbiAgc3dpdGNoKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG4gICAgY2FzZSAnYWRkLXRvLW91dHB1dC1idWZmZXInOlxuICAgICAgX291dHB1dEJ1ZmZlci5wdXNoKHtrZXk6IF9vdXRwdXRCdWZmZXIubGVuZ3RoKzEsIHRleHQ6IGFjdGlvbi5vdXRwdXR9KTtcbiAgICAgIE91dHB1dEJ1ZmZlclN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgIGJyZWFrO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBPdXRwdXRCdWZmZXJTdG9yZTtcbiJdfQ==
