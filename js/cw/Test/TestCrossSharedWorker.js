/**
 * @fileoverview Tests for cw.crossSharedWorker
 */

goog.provide('cw.Test.TestCrossSharedWorker');

goog.require('cw.UnitTest');
goog.require('cw.eq');
goog.require('cw.crossSharedWorker');


// anti-clobbering for JScript; aliases
(function(){

/**
 * @constructor
 */
cw.Test.TestCrossSharedWorker.DummyMessagePort = function() {

};

/**
 * @constructor
 */
cw.Test.TestCrossSharedWorker.DummyMessagePort.prototype.receiveMessage_ = function(message, ports) {
	// TODO: buffer data if no `onmessage` yet.
	var event = cw.eq.plainObject({'data': message});
	if(ports && ports.length) {
		event['ports'] = ports;
	}
	this.onmessage(event);
};

/**
 * @constructor
 */
cw.Test.TestCrossSharedWorker.DummyMessagePort.prototype.postMessage = function(message, ports) {
	this.peer_.receiveMessage_(message, ports);
};



/**
 * @constructor
 */
cw.Test.TestCrossSharedWorker.DummyMessageChannel = function() {
	this.port1 = new cw.Test.TestCrossSharedWorker.DummyMessagePort();
	this.port2 = new cw.Test.TestCrossSharedWorker.DummyMessagePort();
	this.port1.peer_ = this.port2;
	this.port2.peer_ = this.port1;
};



var DummyMessagePort = cw.Test.TestCrossSharedWorker.DummyMessagePort;
var DummyMessageChannel = cw.Test.TestCrossSharedWorker.DummyMessageChannel;

var newDummyMessageChannel = function() {
	return new DummyMessageChannel();
};

var onMessageRecorder = function(log) {
	return function(event) {
		log.push(event);
	};
};


// TODO: move this somewhere else.
/**
 * Based on minerva.mocks._MockMixin
 */
var arrayGetNew = function() {
	if(!goog.isDef(this._returnNext)) {
		this._returnNext = 0;
	}
	var old = this._returnNext;
	this._returnNext = this.length;

	return this.slice(old, this.length);
};


var DummyMessageChannelWithLoggedPort1 = function() {
	var channel = new DummyMessageChannel();
	channel.port1log = [];
	channel.port1log.getNew = arrayGetNew;
	channel.port1.onmessage = onMessageRecorder(channel.port1log);
	return channel;
};


cw.UnitTest.TestCase.subclass(cw.Test.TestCrossSharedWorker, 'TestDecider').methods(

	function test_scenario(self) {
		var decider = new cw.crossSharedWorker.Decider(newDummyMessageChannel);

		// The first client to connect gets a 'become_master' message.
		var channel0 = DummyMessageChannelWithLoggedPort1();
		decider.gotNewPort_(channel0.port2);
		self.assertEqual([
			cw.eq.plainObject({'data': ['become_master', null]})
		], channel0.port1log.getNew());

		// The second client to connect get a 'connect_to_master' message.
		var channel1 = DummyMessageChannelWithLoggedPort1();
		decider.gotNewPort_(channel1.port2);
		self.assertEqual([
			cw.eq.plainObject({'data': ['connect_to_master', 1/*master.id*/], 'ports': [cw.eq.Wildcard]})
		], channel1.port1log.getNew());

		// Master is notified about the second client.
		self.assertEqual([
			cw.eq.plainObject({'data': ['add_slave', 2/*slave.id*/], 'ports': [cw.eq.Wildcard]})
		], channel0.port1log.getNew());

		// The third client to connect get a 'connect_to_master' message.
		var channel2 = DummyMessageChannelWithLoggedPort1();
		decider.gotNewPort_(channel2.port2);
		self.assertEqual([
			cw.eq.plainObject({'data': ['connect_to_master', 1/*master.id*/], 'ports': [cw.eq.Wildcard]})
		], channel2.port1log.getNew());

		// Master is notified about the third client.
		self.assertEqual([
			cw.eq.plainObject({'data': ['add_slave', 3/*slave.id*/], 'ports': [cw.eq.Wildcard]})
		], channel0.port1log.getNew());

		// If the first slave dies, master is notified.
		channel1.port1.postMessage(['dying', null]);
		self.assertEqual([
			cw.eq.plainObject({'data': ['remove_slave', 2]})
		], channel0.port1log.getNew());

		// Connect another slave.
		var channel3 = DummyMessageChannelWithLoggedPort1();
		decider.gotNewPort_(channel3.port2);
		self.assertEqual([
			cw.eq.plainObject({'data': ['connect_to_master', 1/*master.id*/], 'ports': [cw.eq.Wildcard]})
		], channel3.port1log.getNew());

		// If master dies, the oldest slave becomes master, and the other
		// slave connects to it.
		channel0.port1.postMessage(['dying', ['some_data']]);
		self.assertEqual([
			cw.eq.plainObject({'data': ['become_master', ['some_data']]}),
			cw.eq.plainObject({'data': ['add_slave', 4/*slave.id*/], 'ports': [cw.eq.Wildcard]})
		], channel2.port1log.getNew());

		self.assertEqual([
			cw.eq.plainObject({'data': ['connect_to_master', 3/*master.id*/], 'ports': [cw.eq.Wildcard]})
		], channel3.port1log.getNew());
	}

);

})(); // end anti-clobbering for JScript
