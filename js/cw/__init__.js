/**
 * @fileoverview This file was needed to do // import-style imports,
 * 	before we stopped using those.
 */

// This line is useless because it's actually goog.require that creates the
// necessary `cw` namespace. Its only purpose is to prevent IntelliJ IDEA
// from displaying squiggly underlines under every usage of `cw.`.
var cw = cw || {};
