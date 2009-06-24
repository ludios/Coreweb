
Divmod.debugging = false;
//
///**
// * Initialize state in this module that only the server knows about.
// *
// * See the Python module "nevow.athena" for where this is expected to be
// * called.
// *
// * @param transportRoot: a string, the URL where the root of the server-side
// * Athena transport hierarchy for the current page is located.
// */
//Divmod.bootstrap = function (transportRoot) {
//	this._location = transportRoot;
//};
//
//
//Divmod.baseURL = function() {
//	// Use "cached" value if it exists
//	if (Divmod._baseURL != undefined) {
//		return Divmod._baseURL;
//	}
//	var nevowURL = Nevow.Athena.page.baseURL();
//	// "Cache" and return
//	Divmod._baseURL = nevowURL;
//	return Divmod._baseURL;
//};
//
//
//Divmod.importURL = function(moduleName) {
//	return Divmod.baseURL() + 'jsmodule/' + moduleName;
//};
//

///**
// * Create an object with properties from C{keys} bound to the corresponding
// * objects from C{values}.  This is like C{dict(zip(keys, values))} in Python.
// *
// * @type keys: Array of strings
// * @param keys: The names of the properties to bind on the resulting object.
// *
// * @type values: Array of anything
// * @param values: The values to which to bind the properties.
// *
// * @rtype: object
// * @return: An object where C{o[keys[i]] == values[i]} for all values of C{i}
// * from C{[i..keys.length)}.
// *
// * @throw Error: Thrown if C{keys.length != values.length}.
// */
//Divmod.objectify = function objectify(keys, values) {
//	if (keys.length != values.length) {
//		throw Error("Lengths of keys and values must be the same.");
//	}
//
//	var result = {};
//	for (var i = 0; i < keys.length; ++i) {
//		result[keys[i]] = values[i];
//	}
//	return result;
//};


Divmod._global = Divmod.window = this;


// namedAny looks handy, but we don't need it at this time.
///* Retrieve an object via its fully-qualified javascript name.
// *
// * @type name: C{string}
// * @param name: The name of an object.  For example, "Divmod.namedAny".
// *
// * @type path: C{array}
// * @param path: An optional output array.  If provided, it will have the
// * superior objects on the path to the given object pushed onto it.  For
// * example, for "foo.bar.baz", C{foo} and then C{foo.bar} will be pushed
// * onto it.
// */
//Divmod.namedAny = function(name, /* optional output */ path) {
//	var namedParts = name.split('.');
//	var obj = Divmod._global;
//	for (var i = 0; i < namedParts.length; ++i) {
//		obj = obj[namedParts[i]];
//		if (obj == undefined) {
//			Divmod.debug('widget', 'Failed in namedAny for ' + name + ' at ' + namedParts[i]);
//			break;
//		}
//		if (i != namedParts.length - 1 && path != undefined) {
//			path.push(obj);
//		}
//	}
//	return obj;
//};


// just use Math.max
//Divmod.max = function(a, b) {
//	if (a >= b) {
//		return a;
//	} else {
//		return b;
//	}
//};


Divmod.vars = function(obj) {
	var L = [];
	for (var i in obj) {
		L.push([i, obj[i]]);
	}
	return L;
};


Divmod.dir = function(obj) {
	var L = [];
	for (var i in obj) {
		L.push(i);
	}
	return L;
};


Divmod.__classDebugCounter__ = 0;

/**
 * This tracks the number of instances of L{Divmod.Class} subclasses.
 */
Divmod.__instanceCounter__ = 0;

/* C{Divmod._CONSTRUCTOR} chosen to be C{{}} because it has the nice property of
 *    ({} === {}) === false
 *    (Divmod._CONSTRUCTOR === Divmod._CONSTRUCTOR) === true
 *
 *    which avoids any ambiguitity when "instantiating" instances.
 */
Divmod._CONSTRUCTOR = {};

Divmod.Class = function() {};

/**
 * Create a new subclass.
 *
 * Passing a module object for C{classNameOrModule} and C{subclassName} will
 * result in the subclass being added to the global variables, allowing for a
 * more concise method of defining a subclass.
 *
 * @type classNameOrModule: C{String} or a module object
 * @param classNameOrModule: Name of the new subclass or the module object
 *	 C{subclassName} should be created in
 *
 * @type subclassName: C{String} or C{undefined}
 * @param subclassName: Name of the new subclass if C{classNameOrModule} is a
 *	 module object
 *
 * @rtype: C{Divmod.Class}
 */
Divmod.Class.subclass = function(classNameOrModule, /* optional */ subclassName) {
	Divmod.__classDebugCounter__ += 1;

	/*
	 * subclass() must always be called on Divmod.Class or an object returned
	 * from subclass() - so in this execution context, C{this} is the "class"
	 * object.
	 */
	var superClass = this;

	/*
	 * Create a function which basically serves the purpose of type.__call__ in Python:
	 */
	var subClass = function(asConstructor) {
		var self;
		if (this instanceof subClass) {
			/*
			 * If the instance is being created using C{new Class(args)},
			 * C{this} will already be an object with the appropriate
			 * prototype, so we can skip creating one ourself.
			 */
			self = this;
		} else {
			/*
			 * If the instance is being created using just C{Class(args)} (or,
			 * similarly, C{Class.apply(null, args)} or C{Class.call(null,
			 * args)}), then C{this} is actually some random object - maybe the
			 * global execution context object, maybe the window, maybe a
			 * pseudo-namespace object (ie, C{Divmod}), maybe null.  Whichever,
			 * invoke C{new subClass(Divmod._CONSTRUCTOR)} to create an object
			 * with the right prototype without invoking C{__init__}.
			 */
			self = new subClass(Divmod._CONSTRUCTOR);
		}
		/*
		 * Once we have an instance, if C{asConstructor} is not the magic internal
		 * object C{Divmod._CONSTRUCTOR}, pass all our arguments on to the
		 * instance's C{__init__}.
		 */
		if (asConstructor !== Divmod._CONSTRUCTOR) {
			Divmod.__instanceCounter__++;

			/* set an ID unique to this instance */
			self.__id__ = Divmod.__instanceCounter__;

			self.__class__ = subClass;
			self.__init__.apply(self, arguments);
		}

		/*
		 * We've accomplished... Something.  Either we made a blank, boring
		 * instance of a particular class, or we actually initialized an
		 * instance of something (possibly something that we had to create).
		 * Whatever it is, give it back to our caller to enjoy.
		 */
		return self;
	};

	/*
	 * This is how you spell inheritance in JavaScript.
	 */
	subClass.prototype = new superClass(Divmod._CONSTRUCTOR);

	/*
	 * Make the subclass subclassable in the same way.
	 */
	subClass.subclass = Divmod.Class.subclass;

	/*
	 * Support both new and old-style subclassing.
	 */
	var className;
	if (subclassName !== undefined) {
		className = classNameOrModule.__name__ + '.' + subclassName;
		classNameOrModule[subclassName] = subClass;
	} else {
		className = classNameOrModule;
	}

	// TODO: check if subclass already exists (using namedAny? or directly?)
	// and don't override it if it already exists.

	var classIdentifier;
	if(className === undefined) {
		classIdentifier = '#' + Divmod.__classDebugCounter__;
	} else {
		classIdentifier = className;
	}


	// disabling attribute-copying for now, in attempt to simplify and increase speed.
	// TestObject.test_class tests were changed as well.

//	/*
//	 * Copy class methods and attributes, so that you can do
//	 * polymorphism on class methods (useful for things like
//	 * Nevow.Athena.Widget.get in widgets.js).
//	 */
//	for (var varname in superClass) {
//		if ((varname != 'prototype') &&
//			(varname != 'constructor') &&
//			(varname != '__name__') &&
//			(superClass[varname] != undefined)) {
//			//console.log('copying', varname, 'from', superClass.__name__, 'to', className);
//			subClass[varname] = superClass[varname];
//		}
//	}

	subClass.upcall = function(otherThis, methodName) {
		/* TODO: maybe build an upcall that doesn't create a new list with a for loop.
		* (just pass in argument list)  */
		var funcArgs = [];
		for (var i = 2; i < arguments.length; ++i) {
			funcArgs.push(arguments[i]);
		}
		var superResult = superClass.prototype[methodName].apply(otherThis, funcArgs);
		return superResult;
	};

	/*
	 * Helper function for adding a method to the prototype.
	 *
	 * C{methodFunction} will be called with its class instance as the first argument,
	 *    so that you will not have to do: C{var self = this;} in each method.
	 * Classes with prototypes created with method/methods will be slower than
	 * those with prototypes created by directly setting C{.prototype}
	 */
	subClass.method = function(methodFunction) {
		var methodName = methodFunction.name;

		if (methodName == undefined) {
			/* No C{methodFunction.name} in IE, so try this workaround. */
			var methodSource = methodFunction.toString();
			methodName = methodSource.slice(methodSource.indexOf(' ') + 1, methodSource.indexOf('('));
		}

		subClass.prototype[methodName] = function() {
			var args = [this];
			// C{arguments} is not a real array, so C{args.concat} won't work on it,
			// even if you try to convert it to an array with C{new Array(arguments)} or
			// C{Array.slice(arguments)}.
			for (var i = 0; i < arguments.length; ++i) {
				args.push(arguments[i]);
			}
			return methodFunction.apply(this, args);
		};
	};

	/*
	 * Add many methods. See comment for subClass.method.
	 */
	subClass.methods = function() {
		for (var i = 0; i < arguments.length; ++i) {
			subClass.method(arguments[i]);
		}
	};


	/**
	 * Return C{true} if class C{a} is a subclass of class {b} (or is {b}).
	 * Return C{false} otherwise.
	 */
	subClass.subclassOf = function(superClass) {
		return (subClass.prototype instanceof superClass
				|| subClass == superClass);
	};

	/*
	 * Make the subclass identifiable somehow.
	 */
	subClass.__name__ = className;

	subClass.toString = function() {
		return '<Class ' + classIdentifier + '>';
	};
	subClass.prototype.toString = function() {
		return '<"Instance" of ' + classIdentifier + '>';
	};
	return subClass;
};


Divmod.Class.prototype.__init__ = function() {
	/* throw new Error("If you ever hit this code path something has gone horribly wrong");
	 */
};

/**
 * Base class for all error classes.
 *
 * @ivar stack: On Firefox, a string describing the call stack at the time the
 * error was instantiated (/not/ thrown).
 */
Divmod.Error = Divmod.Class.subclass("Divmod.Error");
Divmod.Error.methods(
	function __init__(self, /* optional */ message) {
		self.message = message;
		self.stack = Error().stack;
	},

	/**
	 * Represent this error as a string.
	 *
	 * @rtype: string
	 * @return: This error, as a string.
	 */
	function toString(self) {
		return self.__name__ + ': ' + self.message;
	});

/**
 * Sequence container index out of bounds.
 */
Divmod.IndexError = Divmod.Error.subclass("Divmod.IndexError");


/**
 * Base class for all warning classes.
 */
Divmod.Warning = Divmod.Class.subclass("Divmod.Warning");
Divmod.DeprecationWarning = Divmod.Warning.subclass("Divmod.DeprecationWarning");

Divmod.Module = Divmod.Class.subclass('Divmod.Module');
Divmod.Module.method(
	function __init__(self, name) {
		self.name = name;
	});


Divmod.Logger = Divmod.Class.subclass('Divmod.Logger');
Divmod.Logger.methods(
	function __init__(self) {
		self.observers = [];
	},

	function addObserver(self, observer) {
		self.observers.push(observer);
		return function() {
			self._removeObserver(observer);
		};
	},

	function _removeObserver(self, observer) {
		for (var i = 0; i < self.observers.length; ++i) {
			if (observer === self.observers[i]) {
				self.observers.splice(i, 1);
				return;
			}
		}
	},

	function _emit(self, event) {
		var errors = [];
		var obs = self.observers.slice();
		for (var i = 0; i < obs.length; ++i) {
			try {
				obs[i](event);
			} catch (e) {
				self._removeObserver(obs[i]);
				errors.push([e, "Log observer caused error, removing."]);
			}
		}
		return errors;
	},

	function emit(self, event) {
		var errors = self._emit(event);
		while (errors.length) {
			var moreErrors = [];
			for (var i = 0; i < errors.length; ++i) {
				var e = self._emit({'isError': true, 'error': errors[i][0], 'message': errors[i][1]});
				for (var j = 0; j < e.length; ++j) {
					moreErrors.push(e[j]);
				}
			}
			errors = moreErrors;
		}
	},

	function err(self, error, /* optional */ message) {
		var event = {'isError': true, 'error': error};
		if (message != undefined) {
			event['message'] = message;
		} else {
			event['message'] = error.message;
		}
		self.emit(event);
	},

	function msg(self, message) {
		var event = {'isError': false, 'message': message};
		self.emit(event);
	}
);


Divmod.logger = new Divmod.Logger();
Divmod.msg = function() {
	return Divmod.logger.msg.apply(Divmod.logger, arguments);
};

Divmod.err = function() {
	return Divmod.logger.err.apply(Divmod.logger, arguments);
};

Divmod.debug = function(kind, msg) {
	Divmod.logger.emit({'isError': false,
			'message': msg, 'debug': true,
			'channel': kind});
};

Divmod.log = Divmod.debug;

/**
 * Emit a warning log event.  Warning events have four keys::
 *
 *   isError, which is always C{false}.
 *
 *   message, which is a human-readable explanation of the warning.
 *
 *   category, which is a L{Divmod.Warning} subclass categorizing the warning.
 *
 *   channel, which is always C{'warning'}.
 */
Divmod.warn = function warn(message, category) {
	Divmod.logger.emit({'isError': false,
				'message': message,
				'category': category,
				'channel': 'warning'});
};

/*
 * Set up the Firebug console as a Divmod log observer.
 */
if(Divmod.window.firebug) { // non-firebug use can cause infinite loop in Safari 4 (? Confirm later.)
	Divmod.logger.addObserver(function (evt) {
		if (evt.isError) {
			console.log("Divmod error: " + evt.message);
			console.log(evt.error);
		} else {
			console.log("Divmod log: " + evt.message);
		}
	});
}



/**
 * Return C{true} if the two arrays contain identical elements and C{false}
 * otherwise.
 */
Divmod.arraysEqual = function arraysEqual(a, b) {
	var i;
	if (!(a instanceof Array && b instanceof Array)) {
		return false;
	}
	if (a.length !== b.length) {
		return false;
	}
	for (i in a) {
		if (!(i in b && a[i] === b[i])) {
			return false;
		}
	}
	for (i in b) {
		if (!(i in a)) {
			return false;
		}
	}
	return true;
};


Divmod.startswith = function(haystack, starter) {
	return !!(haystack.substr(0, starter.length) === starter); // == yields same test results
};


Divmod.now = function() {
	return (new Date).getTime();
};


Divmod.random = function() {
	return (''+Math.random()).substr(2);
};


/*
 * Adapted from json2.js (version 2008-07-15)
 * 
 * The behavior differs from internal window.JSON parsers:
 *    this json2-adapted version doesn't look at toJSON (does IE8? don't know.)
 *    fewer/more characters are encoded to \u escapes
 *    FF3.1 stringifier will convert \t and other "short characters" to \u escapes instead of \\t 
 *
 * 'Safe' parsing was removed. We'll just use eval().
 */
Divmod.JSON = function() {
	if(Divmod.window.JSON && JSON.stringify && JSON.parse) {
		Divmod.debug("Using browser's native JSON stringifier and parser.");
		return {stringify: JSON.stringify, parse: JSON.parse};
	}

	// C{escapable} covers all the characters we'll need to specially handle
	var escapeable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

	// C{meta} maps just the simple escapes
	var meta = {/*__BEGIN_SHUFFLE_COMMA__*/
				'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"' :'\\"','\\':'\\\\'
				/*__END_SHUFFLE_COMMA__*/};

	function json_quote(string) {

		// If the string contains no control characters, no quote characters, and no
		// backslash characters, then we can safely slap some quotes around it.
		// Otherwise we must also replace the offending characters with safe escape
		// sequences.

		escapeable.lastIndex = 0;
		return escapeable.test(string) ?
			'"' + string.replace(escapeable, function (a) {
				var c = meta[a];
				// If the character is in meta, use the meta replacement,
				// otherwise, generate a \u escape.
				return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			}) + '"' : '"' + string + '"';
	}

	function str(key, holder) {

		// Produce a string from holder[key].

		var i, // loop counter.
			k, // member key.
			v, // member value.
			length,
			partial,
			value = holder[key];

		switch (typeof value) {
			case 'string':
				return json_quote(value);

			case 'number':
				// JSON numbers must be finite. Encode non-finite numbers as null.
				return isFinite(value) ? String(value) : 'null';

			case 'boolean':
				// if JS starts producing 'null' for C{typeof null} some day, add C{case 'null':} on this line.
				return String(value);

			case 'object':
				// If the type is 'object', we might be dealing with an object or an array or null.

				// Due to a specification blunder in ECMAScript, typeof null is 'object'
				if (!value) {
					return 'null';
				}

				// Make an array to hold the partial results of stringifying this object value.
				partial = [];

				// If the object has a dontEnum length property, we'll treat it as an array.
				if (typeof value.length === 'number' && !value.propertyIsEnumerable('length')) {
					// The object is an array. Stringify every element. Use null as a placeholder for non-JSON values.

					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}

					// Join all of the elements together, separated with commas, and wrap them in brackets.

					return '[' + partial.join(',') + ']';
				}

				//iterate through all of the keys in the object.
				// if we get an error here in IE, it's because we're trying to stringify an object that can't be stringified
				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = str(k, value);
						if (v) {
							partial.push(json_quote(k) + ':' + v);
						}
					}
				}

				return '{' + partial.join(',') + '}';
			}
		}



	// if we want to use parser only?
	
//	if(Divmod.window.JSON && JSON.parse) {
//		Divmod.debug("Using browser's native JSON parser.");
//		return {stringify: function (value) {return str('', {'': value});}, parse: JSON.parse};
//	}

	return {
		stringify: function (value) {
			return str('', {'': value});
		},
		parse: function(value) {
			return eval('(' + value + ')');
		}
	};
}();

