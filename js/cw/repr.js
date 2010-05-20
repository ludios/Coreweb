/**
 * @fileoverview Python-style repr() for JavaScript, supporting both
 * 	__repr__ and toString on objects.
 *
 * TODO XXX LICENSE: Closure Library (we copied functions from goog.json)
 *
 * For primitive objects, the priority for deciding how to represent is:
 * 	- cw.repr internals
 *
 * For non-primitive objects that cw.repr understands, the priority is:
 * 	- .__reprToPieces__(sb)
 * 	- .__repr__()
 * 	- cw.repr internals
 *
 * For non-primitive objects that cw.repr doesn't understand, the priority is:
 * 	- .__reprToPieces__(sb)
 * 	- .__repr__()
 * 	- .toString()
 */

goog.provide('cw.repr');

goog.require('goog.json');


/**
 * Serializes an array to a string representation.
 * @param {!Array} arr The array to serialize.
 * @param {!Array} sb Array used as a string builder.
 * @private
 */
cw.repr.serializeArray_ = function(arr, sb) {
	var l = arr.length;
	sb.push('[');
	var sep = '';
	for (var i = 0; i < l; i++) {
		sb.push(sep)
		cw.repr.serializeAny_(arr[i], sb);
		sep = ', ';
	}
	sb.push(']');
};


/**
 * Serializes an object to a string representation.
 * @param {!Object} obj The object to serialize.
 * @param {!Array} sb Array used as a string builder.
 * @private
 */
cw.repr.serializeObject_ = function(obj, sb) {
	sb.push('{');
	var sep = '';
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			var value = obj[key];
			sb.push(sep);
			goog.json.Serializer.prototype.serializeString_(key, sb);
			sb.push(': ');
			cw.repr.serializeAny_(value, sb);
			sep = ', ';
		}
	}
	sb.push('}');
};


/**
 * Serializes a Date to a string representation.
 * @param {!Date} obj The date to serialize.
 * @param {!Array} sb Array used as a string builder.
 * @private
 */
cw.repr.serializeDate_ = function(obj, sb) {
	sb.push('(new Date(', obj.valueOf(), '))');
};



/**
 * Serializes anything to a string representation.
 * @param {*} obj The object to serialize.
 * @param {!Array} sb Array used as a string builder.
 * @private
 */
cw.repr.serializeAny_ = function(obj, sb) {
	var type = goog.typeOf(obj);
	if(type == 'boolean' || type == 'number') {
		sb.push(obj.toString());
	} else if(type == 'null') {
		sb.push('null');
	} else if(type == 'undefined') {
		sb.push('undefined');
	} else if(type == 'string') {
		goog.json.Serializer.prototype.serializeString_(/** @type {string} */ (obj), sb);
	} else {
		if(typeof obj.__reprToPieces__ == 'function') {
			obj.__reprToPieces__(sb);
		} else if(typeof obj.__repr__ == 'function') {
			sb.push(obj.__repr__());
		} else if(obj instanceof RegExp) {
			sb.push(obj.toString());
		} else if(type == 'array') {
			cw.repr.serializeArray_(/** @type {!Array} */ (obj), sb)
		} else if(type == 'object') {
			// `getFullYear' check is identical to the one in goog.isDateLike
			if(typeof obj.getFullYear == 'function') {
				// TODO: find out if it's a good idea to be possibly lying
				// to the type system here.
				cw.repr.serializeDate_(/** @type {!Date} */ (obj), sb);
			} else {
				cw.repr.serializeObject_(/** @type {!Object} */ (obj), sb);
			}
		} else { // ('function' or 'unknown') with no (__reprToPieces __ or __repr__)
			sb.push(obj.toString());
		}
	}
}


/**
 * Return a string representation of an arbitrary value, similar to
 * Python's builtin repr() function. Returned as an array of strings
 * that you have to join yourself with {@code .join('')}.
 *
 * This may be useful if you are trying to avoid unnecessary string copies.
 *
 * @param {*} obj The object to serialize to a string representation.
 * @param {!Array.<string>} sb Array to use as a string builder.
 * 	May already have string values.
 */
cw.repr.reprToPieces = function(obj, sb) {
	cw.repr.serializeAny_(obj, sb);
}


/**
 * Return a string representation of an arbitrary value, similar to
 * Python's builtin repr() function.
 *
 * @param {*} obj The object to serialize to a string representation.
 * @return {string} The string representation.
 */
cw.repr.repr = function(obj) {
	var sb = [];
	cw.repr.reprToPieces(obj, sb);
	return sb.join('');
}
