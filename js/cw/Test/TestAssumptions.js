/**
 * @fileoverview Test cases to verify assumptions we make about
 * 	how JavaScript works in the real world (modern browsers).
 */

goog.provide('cw.Test.TestAssumptions');

goog.require('cw.UnitTest');
goog.require('goog.userAgent');


// anti-clobbering for JScript
(function(){

cw.UnitTest.TestCase.subclass(cw.Test.TestAssumptions, 'TestAssumptions').methods(
	/**
	 * Test that coercing a Date object to Number returns the equivalent of getTime()
	 */
	function test_dateShortcut(self) {
		var normal = new Date().getTime();
		var shortForm = +new Date;

		// Can't compare normal and shortForm directly because time changes between calls.

		self.assertIdentical(String(normal).length, String(shortForm).length);
		self.assertIdentical(String(normal).substr(0, 7), String(shortForm).substr(0, 7));
	},


	/**
	 * Test that backslashed strings are supported by the JS parser.
	 *
	 * kangax said on twitter that some browsers may insert a space after the \ ,
	 * but I have found no such browser. -ivank
	 */
	function test_backslashedStrings(self) {
		var backslashed = 'hello\
there';
		self.assertIdentical('hellothere', backslashed);
	},


	/**
	 * IE can't eval anything with a U+0000 in it; other browsers can.
	 */
	function test_nullEval(self) {
		var func =  function() { return eval('"\u0000"'); };
		if(!goog.userAgent.IE) {
			self.assertIdentical('\u0000', func());
			self.assertIdentical(1, func().length);
			self.assertNotIdentical('', func());
		} else {
			self.assertThrows(Error, func, "Unterminated string constant");
			if(goog.userAgent.IE && goog.userAgent.isVersion('9.0')) {
				self.assertThrows(EvalError, func, "Unterminated string constant");
			}
		}
	},

	/**
	 * Test that eval("\\u0000\\u0001\\u0002...\\uFFFF") results in "\u0000\u0001\u0002...\uFFFF"
	 */
	function test_evalRainbow(self) {
		var expectedBuffer = [];
		// could use String.fromCharCode.apply(null, [0, 1, 2, 3, ...])
		for(var i=0; i < 65535 + 1; i++) {
			expectedBuffer.push(String.fromCharCode(i));
		}
		var expected = expectedBuffer.join('');

		var buffer = ['"'];
		for(var cc=0; cc < 65535 + 1; cc++) {
			var rv = '\\u';
			if (cc < 16) {
				rv += '000';
			} else if (cc < 256) {
				rv += '00';
			} else if (cc < 4096) { // \u1000
				rv += '0';
			}
			buffer.push(rv + cc.toString(16));
		}
		buffer.push('"');
		var bigString = buffer.join('');

		self.assertIdentical(expected, eval(bigString));
	},


	/**
	 * Confirm that nulls can exist peacefully, at least inside Strings..
	 */

	 function test_nullsOK(self) {
		var z1 = '\u0000';
		self.assertIdentical(1, z1.length);

		var z2 = '\u0000\u0000';
		self.assertIdentical(2, z2.length);

		var z9 = '\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000';
		self.assertIdentical(9, z9.length);
	 },


	/**
	 * Test that conditional compilation code is run by IE and nothing else.
	 */
	function test_conditionalCompilation(self) {
		var ccWasRun = /*@cc_on!@*/!1;
		if(!goog.userAgent.IE) {
			self.assertIdentical(false, ccWasRun);
		} else {
			self.assertIdentical(true, ccWasRun);
		}
	},


	/**
	 * Error object construction is broken in IE < 9, and works fine elsewhere.
	 */
	function test_errorIsBroken(self) {
		var e;
		if(goog.userAgent.IE && !goog.userAgent.isVersion('9.0')) {
			e = new Error("4");
			self.assertIdentical("", e.message);
			self.assertIdentical(4, e.number);
		} else {
			e = new Error("4");
			self.assertIdentical("4", e.message);
			self.assertIdentical(undefined, e.number);
		}
	},


	/**
	 * Errors object construction is broken in IE < 9 (even with bigger
	 * numbers), and works fine elsewhere.
	 */
	function test_errorIsBrokenBiggerNumbers(self) {
		var e;
		if(goog.userAgent.IE && !goog.userAgent.isVersion('9.0')) {
			e = new Error("49458712349712346723");
			self.assertIdentical("", e.message);
			self.assertIdentical(49458712349712346723, e.number);
		} else {
			e = new Error("49458712349712346723");
			self.assertIdentical("49458712349712346723", e.message);
			self.assertIdentical(undefined, e.number);
		}
	},


	function test_charCodeAt_NaN(self) {
		self.assertIdentical(true, isNaN('hello'.charCodeAt(124)));
	},


	/**
	 * Test the hack we use to do Python's '<character>'*howmany.
	 * jslint will complain, no matter how you do this.
	 */
	function test_arrayHack(self) {
		self.assertIdentical('.', Array(1+1).join('.'));
		self.assertIdentical('..', Array(2+1).join('.'));
		self.assertIdentical('....', Array(4+1).join('.'));
	},


	function _makeStringedArray(self, numItems) {
		var buffer = [];
		for(var i=0; i < numItems; i++) {
			buffer.push('1');
		}
		self.assertIdentical(numItems, buffer.length); // should be self.ensure

		var stringedArray = '[' + buffer.join(',') + ']';

		return stringedArray;
	},

	/**
	 * All browsers can eval an array with 65535 items.
	 */
	function test_arrayEvalBelowLimit(self) {
		var size = 65535;
		var stringedArray = self._makeStringedArray(size);
		var result = eval(stringedArray);
		
		self.assertIdentical(1, result[0]);
		self.assertIdentical(1, result[size-1]);
		self.assertIdentical(size, result.length);
	},

	/**
	 * IE6 and IE7 cannot eval a string array with 65536 or more items; other browsers can
	 *
	 * TODO: Test IE8 in IE7 compatibility mode.
	 */
	function test_arrayEvalLimit(self) {
		var size = 65536;
		var stringedArray = self._makeStringedArray(size);

		var IE6or7 = goog.userAgent.IE && !goog.userAgent.isVersion('8');

		if(!IE6or7) {
			var result = eval(stringedArray);

			self.assertIdentical(1, result[0]);
			self.assertIdentical(1, result[size-1]);
			self.assertIdentical(size, result.length);
		} else {
			try {
				eval(stringedArray);
				self.fail("This line should not be reached; eval should have thrown an Error with 'Out of memory' message");
			} catch(e) {
				self.assertIdentical("Out of memory", e.message);
			}
		}
	},

	/**
	 * Test that IE6-IE8 improperly skip over properties during iteration,
	 * while other browsers do not.
	 *
	 * From JScript Deviations from ES3 (2007 draft):
	 *
	 * "2.10 Enumerating shadowed [[DontEnum]] properties: §15.2.4
	 *
	 * Custom properties that shadow [[DontEnum]] properties on
	 * Object.prototype are not enumerated using for-in. In the following
	 * example toString is a property available on Object.prototype and is
	 * shadowed on cowboy. Since such properties are not enumerated through
	 * for-in, it is not possible to transfer them from a one object to another
	 * using for-in."
	 *
	 * Paraphrased in [MS-ES3]: Internet Explorer ECMA-262 ECMAScript Language
	 * Specification Standards Support Document (2010-03-26):
	 *
	 * "Note that JScript 5.x defines properties (see [ECMA-262] section
	 * 6.6.2.2) such that their DontEnum attribute is inherited from prototype
	 * properties with the same name. As a result of this, any properties that
	 * have the same name as built-in properties of a prototype object that
	 * have the DontEnum attribute are not included in an enumeration."
	   */
	function test_incorrectDontEnumInheritance(self) {
		var IEBefore9 = goog.userAgent.IE && !goog.userAgent.isVersion('9');
		var anObject = {'hello': 1, 'toString': 2, 'hasOwnProperty': 3, 'valueOf': 4};
		var foundKeys = [];
		for(var k in anObject) {
			foundKeys.push(k);
		}
		foundKeys.sort();
		if(IEBefore9) {
			self.assertEqual(['hello'], foundKeys);
		} else {
			self.assertEqual(['hasOwnProperty', 'hello', 'toString', 'valueOf'], foundKeys);
		}
	}
);

})(); // end anti-clobbering for JScript
