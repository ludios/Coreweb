// -*- test-case-name: nevow.test.test_javascript -*-

// import Divmod

/**
 * General limitations:
 * 
 * JavaScript has no __del__, so we can't print out
 * unhandled errors like twisted.internet.defer does.
 */

Divmod.Class.subclass(Divmod.Defer, 'AlreadyCalledError');

Divmod.Class.subclass(Divmod.Defer, 'Failure');

Divmod.Defer.Failure.prototype.__init__ = function(error) {
	this.error = error;
}

/**
 * Return the underlying Error instance if it is an instance of the given
 * error class, otherwise return null;
 */
Divmod.Defer.Failure.prototype.check = function(errorType) {
	if (this.error instanceof errorType) {
		return this.error;
	}
	return null;
}

Divmod.Defer.Failure.prototype.toString = function() {
	return 'Failure: ' + this.error;
}

Divmod.Defer.Failure.prototype.parseStack = function() {
	//console.log('this.error', this.error);
	var stackString = this.error.stack;
	var frames = [];

	var i;
	var line;
	var parts;
	var func;
	var rest;
	var divide;
	var fname;
	var lineNumber;
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
}


/**
 * Return a list of 'frames' from the stack, with many of the frames
 * filtered out. The removed frames are those which are added for every
 * single method call.
 *
 * @return: [{fname: <filename as string>,
 *			lineNumber: <line number as int>,
 *			func: <function that the frame is inside as string>}]
 */
Divmod.Defer.Failure.prototype.filteredParseStack = function() {
	var frames = this.parseStack();
	var ret = [];
	for (var i = 0; i < frames.length; ++i) {
		var f = frames[i];
		if (f.fname == "" && f.lineNumber == 0) {
			ret.pop();
			continue;
		}
		ret.push(f);
	};
	return ret;
}


/**
 * Format a single frame from L{Failure.filteredParseStack} as a pretty
 * string.
 *
 * @return: string
 */
Divmod.Defer.Failure.prototype.frameToPrettyText = function(frame) {
	return '  Function "' + frame.func + '":\n	' + frame.fname + ':'
		+ frame.lineNumber;
}


/**
 * Return a nicely formatted stack trace using L{Failure.frameToPrettyText}.
 */
Divmod.Defer.Failure.prototype.toPrettyText = function(/* optional */ frames) {
	if (frames == undefined) {
		frames = this.parseStack();
	}
	var ret = 'Traceback (most recent call last):\n';
	for (var i = 0; i < frames.length; ++i) {
		ret += this.frameToPrettyText(frames[i]) + '\n';
	}
	return ret + this.error;
}


Divmod.Defer.Failure.prototype.toPrettyNode = function() {
	var stack = this.error.stack;
	if (!stack) {
		return document.createTextNode(this.toString());
	}

	var frames = this.parseStack();
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
};


Divmod.Class.subclass(Divmod.Defer, 'Deferred');

Divmod.Defer.Deferred.prototype.__init__ = function() {
	this._callbacks = [];
	this._called = false;
	this._pauseLevel = 0;
};
Divmod.Defer.Deferred.prototype.addCallbacks = function(callback, errback, callbackArgs, errbackArgs) {
	if (!callbackArgs) {
		callbackArgs = [];
	}
	if (!errbackArgs) {
		errbackArgs = [];
	}
	this._callbacks.push([callback, errback, callbackArgs, errbackArgs]);
	if (this._called) {
		this._runCallbacks();
	}
	return this;
};
Divmod.Defer.Deferred.prototype.addCallback = function(callback) {
	var callbackArgs = [];
	for (var i = 2; i < arguments.length; ++i) {
		callbackArgs.push(arguments[i]);
	}
	this.addCallbacks(callback, null, callbackArgs, null);
	return this;
};
Divmod.Defer.Deferred.prototype.addErrback = function(errback) {
	var errbackArgs = [];
	for (var i = 2; i < arguments.length; ++i) {
		errbackArgs.push(arguments[i]);
	}
	this.addCallbacks(null, errback, null, errbackArgs);
	return this;
};
Divmod.Defer.Deferred.prototype.addBoth = function(callback) {
	var callbackArgs = [];
	for (var i = 2; i < arguments.length; ++i) {
		callbackArgs.push(arguments[i]);
	}
	this.addCallbacks(callback, callback, callbackArgs, callbackArgs);
	return this;
};
Divmod.Defer.Deferred.prototype._pause = function() {
	this._pauseLevel++;
};
Divmod.Defer.Deferred.prototype._unpause = function() {
	this._pauseLevel--;
	if (this._pauseLevel) {
		return;
	}
	if (!this._called) {
		return;
	}
	this._runCallbacks();
};
Divmod.Defer.Deferred.prototype._isFailure = function(obj) {
	return (obj instanceof Divmod.Defer.Failure);
};
Divmod.Defer.Deferred.prototype._isDeferred = function(obj) {
	return (obj instanceof Divmod.Defer.Deferred);
};
Divmod.Defer.Deferred.prototype._continue = function(result) {
	this._result = result;
	this._unpause();
};
Divmod.Defer.Deferred.prototype._runCallbacks = function() {
	var self = this;
	var callback;
	var args;
	if (!self._pauseLevel) {
		var cb = self._callbacks;
		self._callbacks = [];
		while (cb.length) {
			var item = cb.shift();
			if (self._isFailure(self._result)) {
				callback = item[1];
				args = item[3];
			} else {
				callback = item[0];
				args = item[2];
			}

			if (callback == null) {
				continue;
			}

			args.unshift(self._result);
			try {
				self._result = callback.apply(null, args);
				if (self._isDeferred(self._result)) {
					self._callbacks = cb;
					self._pause();
					self._result.addBoth(function (r) {
							self._continue(r);
						});
					break;
				}
			} catch (e) {
				self._result = Divmod.Defer.Failure(e);
			}
		}
	}

	if (self._isFailure(self._result)) {
		// This might be spurious
		Divmod.err(self._result.error);
	}
};
Divmod.Defer.Deferred.prototype._startRunCallbacks = function(result) {
	if (this._called) {
		throw new Divmod.Defer.AlreadyCalledError();
	}
	this._called = true;
	this._result = result;
	this._runCallbacks();
};
Divmod.Defer.Deferred.prototype.callback = function(result) {
	this._startRunCallbacks(result);
};
Divmod.Defer.Deferred.prototype.errback = function(err) {
	if (!this._isFailure(err)) {
		err = new Divmod.Defer.Failure(err);
	}
	this._startRunCallbacks(err);
};

Divmod.Defer.succeed = function succeed(result) {
	var d = new Divmod.Defer.Deferred();
	d.callback(result);
	return d;
};

Divmod.Defer.fail = function fail(err) {
	var d = new Divmod.Defer.Deferred();
	d.errback(err);
	return d;
};


/**
 * First error to occur in a DeferredList if fireOnOneErrback is set.
 *
 * @ivar err: the L{Divmod.Defer.Failure} that occurred.
 *
 * @ivar index: the index of the Deferred in the DeferredList where it
 * happened.
 */
Divmod.Error.subclass(Divmod.Defer, 'FirstError');

Divmod.Defer.FirstError.prototype.__init__ = function(err, index) {
	Divmod.Defer.FirstError.upcall(this, '__init__', []);
	this.err = err;
	this.index = index;
};

Divmod.Defer.FirstError.prototype.toString = function() {
	return '<FirstError @ ' + this.index + ': ' + this.err.toString() + '>';
};

/*
 * I combine a group of deferreds into one callback.
 *
 * I track a list of L{Deferred}s for their callbacks, and make a single
 * callback when they have all completed, a list of (success, result) tuples,
 * 'success' being a boolean.
 *
 * Note that you can still use a L{Deferred} after putting it in a
 * DeferredList.  For example, you can suppress 'Unhandled error in Deferred' (INCORRECT! No such thing!)
 * messages by adding errbacks to the Deferreds *after* putting them in the
 * DeferredList, as a DeferredList won't swallow the errors.  (Although a more
 * convenient way to do this is simply to set the consumeErrors flag)
 */
Divmod.Defer.Deferred.subclass(Divmod.Defer, 'DeferredList');

	/* Initialize a DeferredList.
	 *
	 * @type deferredList: C{Array} of L{Divmod.Defer.Deferred}s
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
Divmod.Defer.DeferredList.prototype.__init__ = function (deferredList,
				  /* optional */
				  fireOnOneCallback /* = false */,
				  fireOnOneErrback /* = false */,
				  consumeErrors /* = false */) {
	var self = this;
	self.resultList = new Array(deferredList.length);
	Divmod.Defer.DeferredList.upcall(self, '__init__', []);
	// don't callback in the fireOnOneCallback case because the result
	// type is different.
	if (deferredList.length == 0 && !fireOnOneCallback) {
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

	for (var index = 0; index < deferredList.length; ++index) {
		deferredList[index].addCallbacks(function(result, index) {
			self._cbDeferred(result, true, index);
		}, function(err, index) {
			self._cbDeferred(err, false, index);
		}, [index], [index]);
	}
};

Divmod.Defer.DeferredList.prototype._cbDeferred = function(result, success, index) {
	this.resultList[index] = [success, result];

	this.finishedCount += 1;
	if (!this._called) {
		if (success && this.fireOnOneCallback) {
			this.callback([result, index]);
		} else if (!success && this.fireOnOneErrback) {
			this.errback(new Divmod.Defer.FirstError(result, index));
		} else if (this.finishedCount == this.resultList.length) {
			this.callback(this.resultList);
		}
	}

	if (!success && this.consumeErrors) {
		return null;
	} else {
		return result;
	}
};


/* Returns list with result of given Deferreds.
 *
 * This builds on C{DeferredList} but is useful since you don't need to parse
 * the result for success/failure.
 *
 * @type deferredList: C{Array} of L{Divmod.Defer.Deferred}s
 */
Divmod.Defer.gatherResults = function gatherResults(deferredList) {
	var d = new Divmod.Defer.DeferredList(deferredList, false, true, false);
	d.addCallback(function(results) {
		var undecorated = [];
		for (var i = 0; i < results.length; ++i) {
			undecorated.push(results[i][1]);
		}
		return undecorated;
	});
	return d;
};
