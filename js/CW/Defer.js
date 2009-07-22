/* obfu-vars:
_pauseLevel, _continue, _runCallbacks, _callbacks, _called, _result */

// import CW

/**
 * General limitations:
 *
 * JavaScript has no __del__, so we can't (easily) print out
 * unhandled errors like twisted.internet.defer does.
 *
 * But it might still be possible, but having a buffer that logs
 * error and removes them when errback fires
 */

CW.Class.subclass(CW.Defer, 'AlreadyCalledError');

CW.Class.subclass(CW.Defer, 'Failure').methods(
	function __init__(self, error) {
		self.error = error;
	},

	/**
	 * Return the underlying Error instance if it is an instance of the given
	 * error class, otherwise return null;
	 */
	function check(self, errorType) {
		if (self.error instanceof errorType) {
			return self.error;
		}
		return null;
	},

	function toString(self) {
		return 'Failure: ' + self.error;
	},

	function parseStack(self) {
		var
			stackString = this.error.stack,
			frames = [],
			i, line, parts, func, rest, divide, fname, lineNumber;

		if(stackString !== undefined) {
			var lines = stackString.split('\n');
			for (i = 0, line = lines[i]; i < lines.length; ++i, line = lines[i]) {
				if (line.indexOf('@') == -1) {
					continue;
				}

				parts = line.split('@', 2);
				func = parts.shift();
				rest = parts.shift();

				divide = rest.lastIndexOf(':');
				if (divide == -1) {
					fname = rest;
					lineNumber = 0;
				} else {
					fname = rest.substr(0, divide);
					lineNumber = parseInt(rest.substr(divide + 1, rest.length));
				}
				frames.unshift({func: func, fname: fname, lineNumber: lineNumber});
			}
		}
		return frames;
	},


	/**
	 * Return a list of 'frames' from the stack, with many of the frames
	 * filtered out. The removed frames are those which are added for every
	 * single method call.
	 *
	 * @return: [{fname: <filename as string>,
	 *			lineNumber: <line number as int>,
	 *			func: <function that the frame is inside as string>}]
	 */
	function filteredParseStack(self) {
		var
			frames = self.parseStack(),
			ret = [],
			i, f;
		for (i = 0; i < frames.length; ++i) {
			f = frames[i];
			if (f.fname == "" && f.lineNumber == 0) {
				ret.pop();
				continue;
			}
			ret.push(f);
		};
		return ret;
	},


	/**
	 * Format a single frame from L{Failure.filteredParseStack} as a pretty
	 * string.
	 *
	 * @return: string
	 */
	function frameToPrettyText(self, frame) {
		return '  Function "' + frame.func + '":\n	' + frame.fname + ':'
			+ frame.lineNumber;
	},


	/**
	 * Return a nicely formatted stack trace using L{Failure.frameToPrettyText}.
	 */
	function toPrettyText(self, /* optional */ frames) {
		if (frames == undefined) {
			frames = self.parseStack();
		}
		var
			ret = 'Traceback (most recent call last):\n',
			i;
		for (i = 0; i < frames.length; ++i) {
			ret += self.frameToPrettyText(frames[i]) + '\n';
		}
		return ret + self.error;
	},


	function toPrettyNode(self) {
		var stack = self.error.stack;
		if (!stack) {
			return document.createTextNode(self.toString());
		}

		var frames = self.parseStack();
		var resultNode = document.createElement('div');
		resultNode.style.overflow = 'scroll';
		resultNode.style.height = 640;
		resultNode.style.width = 480;
		var frameNode;
		for (var i = 0, f = frames[i]; i < frames.length; ++i, f = frames[i]) {
			if (f.lineNumber == 0) {
				continue;
			}
			frameNode = document.createElement('div');
			frameNode.appendChild(document.createTextNode(f.fname + '|' + f.lineNumber));
			resultNode.appendChild(frameNode);
			frameNode = document.createElement('div');
			frameNode.appendChild(document.createTextNode(f.func));
			resultNode.appendChild(frameNode);
		}
		return resultNode;
	}
);

CW.Class.subclass(CW.Defer, 'Deferred')

CW.Defer.Deferred.prototype = {
	'__init__': function() {
		this._callbacks = [];
		this._called = false;
		this._pauseLevel = 0;
	},
	'addCallbacks': function(/* callback, errback, callbackArgs, errbackArgs */) {
		// use `arguments' so that JScript doesn't have to create 4 local variables.
		// TODO: need to verify that this really doesn't have adverse effects
		// (keeping an activation object alive)
		this._callbacks.push(arguments);
		if (this._called) {
			this._runCallbacks();
		}
		return this;
	},
	'addCallback': function(callback) {
		var callbackArgs = Array.prototype.slice.call(arguments);
		callbackArgs.shift();
		/* inlined a part of addCallbacks */
		this._callbacks.push([callback, null, callbackArgs, []]);
		if (this._called) {
			this._runCallbacks();
		}
		return this;
	},
	'addErrback': function(errback) {
		var errbackArgs = Array.prototype.slice.call(arguments);
		errbackArgs.shift();
		/* inlined a part of addCallbacks */
		this._callbacks.push([null, errback, [], errbackArgs]);
		if (this._called) {
			this._runCallbacks();
		}
		return this;
	},
	'addBoth': function(callback) {
		var callbackArgs = Array.prototype.slice.call(arguments);
		callbackArgs.shift();
		/* inlined a part of addCallbacks */
		this._callbacks.push([callback, callback, callbackArgs, callbackArgs]);
		if (this._called) {
			this._runCallbacks();
		}
		return this;
	},
	/* There is no _pause(). Just raise the this._pauseLevel: this._pauseLevel++ */
	/* There is no _unpause(). It's inlined into _continueFunc */
	'_continueFunc': function(result, parentDeferred) {
		/* inlined _continue */
		parentDeferred._result = result;
		parentDeferred._pauseLevel--;
		if (parentDeferred._pauseLevel) {
			return;
		}
		if (!parentDeferred._called) {
			return;
		}
		parentDeferred._runCallbacks();
	},
	'_runCallbacks': function() {
		var args, callback;
		if (!this._pauseLevel) {
			var cb = this._callbacks;
			this._callbacks = [];
			while (cb.length) {
				var item = cb.shift();
				if (this._result instanceof CW.Defer.Failure) {
					callback = item[1];
					args = item[3];
				} else {
					callback = item[0];
					args = item[2];
				}

				// Skip over undefined or null callbacks (often there is only a callback, or only an errback).
				if (callback == null) {
					continue;
				}

				// prepend the result to the callback arguments
				args.unshift(this._result);
				try {
					this._result = callback.apply(null, args);
					if (this._result instanceof CW.Defer.Deferred) {
						this._callbacks = cb;
						this._pauseLevel++;
						// Don't create a closure as Divmod.Defer does; they're somewhat expensive.
						this._result.addCallbacks(this._continueFunc, this._continueFunc, [this], [this]);
						break;
					}
				} catch (e) {
					this._result = CW.Defer.Failure(e);
				}
			}
		}

		if (this._result instanceof CW.Defer.Failure) {
			// This might be spurious
			CW.err(this._result.error);
		}
	},
	'callback': function(result) {
		if (this._called) {
			throw new CW.Defer.AlreadyCalledError();
		}
		this._called = true;
		this._result = result;
		this._runCallbacks();
	},
	'errback': function(err) {
		if (!(err instanceof CW.Defer.Failure)) {
			err = new CW.Defer.Failure(err);
		}
		this.callback(err); /* Divmod.Defer called _startRunCallbacks */
	}
}

CW.Defer.succeed = function succeed(result) {
	var d = new CW.Defer.Deferred();
	d.callback(result);
	return d;
};

CW.Defer.fail = function fail(err) {
	var d = new CW.Defer.Deferred();
	d.errback(err);
	return d;
};


/**
 * First error to occur in a DeferredList if fireOnOneErrback is set.
 *
 * @ivar err: the L{CW.Defer.Failure} that occurred.
 *
 * @ivar index: the index of the Deferred in the DeferredList where it
 * happened.
 */
CW.Error.subclass(CW.Defer, 'FirstError').methods(
	function __init__(self, err, index) {
		CW.Defer.FirstError.upcall(self, '__init__', []);
		self.err = err;
		self.index = index;
	},

	function toString(self) {
		return '<FirstError @ ' + self.index + ': ' + self.err.toString() + '>';
	}
);

/*
 * I combine a group of deferreds into one callback.
 *
 * I track a list of L{Deferred}s for their callbacks, and make a single
 * callback when they have all completed, a list of (success, result) tuples,
 * 'success' being a boolean.
 *
 * Note that you can still use a L{Deferred} after putting it in a
 * DeferredList.  For example, you can suppress 'Unhandled error in Deferred'
 * messages by adding errbacks to the Deferreds *after* putting them in the
 * DeferredList, as a DeferredList won't swallow the errors.  (Although a more
 * convenient way to do this is simply to set the consumeErrors flag)
 */
CW.Defer.Deferred.subclass(CW.Defer, 'DeferredList').methods(
	/* Initialize a DeferredList.
	 *
	 * @type deferredList: C{Array} of L{CW.Defer.Deferred}s
	 *
	 * @param deferredList: The list of deferreds to track.
	 *
	 * @param fireOnOneCallback: A flag indicating that only one callback needs
	 * to be fired for me to call my callback.
	 *
	 * @param fireOnOneErrback: A flag indicating that only one errback needs to
	 * be fired for me to call my errback.
	 *
	 * @param consumeErrors: A flag indicating that any errors raised in the
	 * original deferreds should be consumed by this DeferredList.  This is
	 * useful to prevent spurious warnings being logged.
	 */
	function __init__(self,
					  deferredList,
					  /* optional */
					  fireOnOneCallback /* = false */,
					  fireOnOneErrback /* = false */,
					  consumeErrors /* = false */) {
		var dListLen = deferredList.length;

		self.resultList = new Array(dListLen);
		CW.Defer.DeferredList.upcall(self, '__init__', []);
		// don't callback in the fireOnOneCallback case because the result
		// type is different.
		if (dListLen == 0 && !fireOnOneCallback) {
			self.callback(self.resultList);
		}

		if (fireOnOneCallback == undefined) {
			fireOnOneCallback = false;
		}

		if (fireOnOneErrback == undefined) {
			fireOnOneErrback = false;
		}

		if (consumeErrors == undefined) {
			consumeErrors = false;
		}

		/* These flags need to be set *before* attaching callbacks to the
		 * deferreds, because the callbacks use these flags, and will run
		 * synchronously if any of the deferreds are already fired.
		 */
		self.fireOnOneCallback = fireOnOneCallback;
		self.fireOnOneErrback = fireOnOneErrback;
		self.consumeErrors = consumeErrors;
		self.finishedCount = 0;

		for (var index = 0; index < dListLen; ++index) {
			deferredList[index].addCallbacks(
				function(result, index) {
					self._cbDeferred(result, true, index);
				},
				function(err, index) {
					self._cbDeferred(err, false, index);
				}, [index], [index]
			);
		}
	},

	function _cbDeferred(self, result, success, index) {
		self.resultList[index] = [success, result];

		self.finishedCount += 1;
		if (!self._called) {
			if (success && self.fireOnOneCallback) {
				self.callback([result, index]);
			} else if (!success && self.fireOnOneErrback) {
				self.errback(new CW.Defer.FirstError(result, index));
			} else if (self.finishedCount == self.resultList.length) {
				self.callback(self.resultList);
			}
		}

		if (!success && self.consumeErrors) {
			return null;
		} else {
			return result;
		}
	}
);


/* Returns list with result of given Deferreds.
 *
 * This builds on C{DeferredList} but is useful since you don't need to parse
 * the result for success/failure.
 *
 * @type deferredList: C{Array} of L{CW.Defer.Deferred}s
 */
CW.Defer.gatherResults = function gatherResults(deferredList) {
	var d = new CW.Defer.DeferredList(deferredList, false, true, false);
	// TODO: maybe use while(n--) loop, then reverse the array?
	d.addCallbacks(function(results) {
		var undecorated = [];
		for (var i = 0; i < results.length; ++i) {
			undecorated.push(results[i][1]);
		}
		return undecorated;
	}, null, [], []);
	return d;
};
