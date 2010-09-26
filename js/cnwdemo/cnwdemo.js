goog.provide('cnwdemo');

goog.require('goog.array');
goog.require('goog.debug.DivConsole');
goog.require('goog.debug.Logger');
goog.require('goog.string');

goog.require('cw.autoTitle');
goog.require('cw.repr');
goog.require('cw.crosstab');


new goog.debug.DivConsole(document.getElementById('log')).setCapturing(true);

cnwdemo.logger = goog.debug.Logger.getLogger('cnwdemo.logger');
cnwdemo.logger.setLevel(goog.debug.Logger.Level.ALL);

cnwdemo.logger.info('Logger works.');

window.onerror = function(msg, url, lineNumber) {
	cnwdemo.logger.severe('window.onerror: message: ' + cw.repr.repr(msg) +
		'\nURL: ' + url + '\nLine Number: ' + lineNumber)
};


/**
 * @constructor
 */
cnwdemo.Demo = function() {
	/**
	 * @type {!Array.<!cw.crosstab.Client>}
	 */
	this.slaves_ = [];

	/**
	 * @type {cw.crosstab.Client}
	 */
	this.master_ = null;
};

cnwdemo.Demo.prototype.gotMaster_ = function(ev) {
	cnwdemo.logger.info('Got master: ' + cw.repr.repr(ev.master));
	ev.master.onmessage = goog.bind(this.onMessage_, this, ev.master.id);
	this.master_ = ev.master;
};

cnwdemo.Demo.prototype.lostMaster_ = function(ev) {
	cnwdemo.logger.info('Lost master');
	this.master_ = null;
};

cnwdemo.Demo.prototype.becameMaster_ = function(ev) {
	cnwdemo.logger.info('Became master');
	ev.master.onmessage = goog.bind(this.onMessage_, this, ev.master.id);
};

cnwdemo.Demo.prototype.newSlave_ = function(ev) {
	cnwdemo.logger.info('New slave: ' + cw.repr.repr(ev.slave));
	ev.slave.onmessage = goog.bind(this.onMessage_, this, ev.slave.id);
	this.slaves_.push(ev.slave);
};

cnwdemo.Demo.prototype.lostSlave_ = function(ev) {
	cnwdemo.logger.info('Lost slave: ' + cw.repr.repr(ev.slave));
		this.slaves_.push(ev.slave);
	var ret = goog.array.remove(this.slaves_, ev.slave);
	if(!ret) {
		throw Error("cnwdemo.Demo didn't know about slave " + ev.slave);
	}
};

cnwdemo.Demo.prototype.onMessage_ = function(id, from, message) {
	var repr = cw.repr.repr;
	cnwdemo.logger.info(repr(id) + ' got message from ' + repr(from) + ': ' + repr(message));
};

/**
 * @param {string} text
 */
cnwdemo.Demo.prototype.sendTextToSlaves = function(text) {
	for(var i=0; i < this.slaves_.length; i++) {
		var slave = this.slaves_[i];
		cw.crosstab.theCrossNamedWindow.sendMessage(slave, text);
	};
	cnwdemo.logger.info('Sent ' + cw.repr.repr(text) + ' to ' + this.slaves_.length + ' slave(s)');
};

/**
 * @param {string} text
 */
cnwdemo.Demo.prototype.sendTextToMaster = function(text) {
	cw.crosstab.theCrossNamedWindow.sendMessage(this.master_, text);
	cnwdemo.logger.info('Sent ' + cw.repr.repr(text) + ' to master');
};

cnwdemo.Demo.prototype.start = function() {
	var cnw = cw.crosstab.theCrossNamedWindow;
	cnw.addEventListener(cw.crosstab.EventType.GOT_MASTER, this.gotMaster_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.LOST_MASTER, this.lostMaster_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.BECAME_MASTER, this.becameMaster_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.NEW_SLAVE, this.newSlave_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.LOST_SLAVE, this.lostSlave_, false, this);

	cnw.start();
};

/**
 * @param {string} text
 */
cnwdemo.sendText = function(text) {
	if(cw.crosstab.theCrossNamedWindow.isMaster()) {
		cnwdemo.lastDemo.sendTextToSlaves(text);
	} else {
		cnwdemo.lastDemo.sendTextToMaster(text);
	}
};


cnwdemo.start = function() {
	cnwdemo.lastDemo = new cnwdemo.Demo();
	cnwdemo.lastDemo.start();
};


goog.exportSymbol('__cnwdemo_start', cnwdemo.start);
