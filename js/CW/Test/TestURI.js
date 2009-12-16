goog.require('cw.UnitTest');

goog.require('cw.URI');


cw.UnitTest.TestCase.subclass(CW.Test.TestURI, 'functionalTests').methods(

	function test_urisplit(self) {

		self.assertEqual(
			cw.URI.urisplit(
			"scheme://authority/path?query#fragment"),
			['scheme', 'authority', '/path', 'query', 'fragment'])

		self.assertEqual(
			cw.URI.urisplit(
			"scheme://authority/path?query#"),
			['scheme', 'authority', '/path', 'query', ''])

		self.assertEqual(
			cw.URI.urisplit(
			"scheme://authority/path?query"),
			['scheme', 'authority', '/path', 'query', null])

		self.assertEqual(
			cw.URI.urisplit(
			"scheme://authority/path?"),
			['scheme', 'authority', '/path', '', null])

		self.assertEqual(
			cw.URI.urisplit(
			"scheme://authority/path??"),
			['scheme', 'authority', '/path', '?', null])

		self.assertEqual(
			cw.URI.urisplit("scheme://authority/path#?"),
			['scheme', 'authority', '/path', null, '?'])

		self.assertEqual(
			cw.URI.urisplit("scheme://authority/path#?#"),
			['scheme', 'authority', '/path', null, '?#'])

		self.assertEqual(
			cw.URI.urisplit(
			"scheme://authority/path"),
			['scheme', 'authority', '/path', null, null])

		self.assertEqual(
			cw.URI.urisplit(
			"scheme://authority/"),
			['scheme', 'authority', '/', null, null])

		self.assertEqual(
			cw.URI.urisplit(
			"scheme://authority"),
			['scheme', 'authority', '', null, null])

		self.assertEqual(
			cw.URI.urisplit(
			"scheme://"),
			['scheme', '', '', null, null])

		// No authority is okay, too

		self.assertEqual(
			cw.URI.urisplit(
			"scheme:path"),
			['scheme', null, 'path', null, null])

		self.assertEqual(
			cw.URI.urisplit(
			"scheme:/path"),
			['scheme', null, '/path', null, null])

		// L{urisplit} automatically lowercases the scheme:

		self.assertEqual(
			cw.URI.urisplit(
			"SCHEME://authority"),
			['scheme', 'authority', '', null, null])

		self.assertEqual(
			cw.URI.urisplit(
			"sChEmE://authority"),
			['scheme', 'authority', '', null, null])

		// It is reversable:

		self.assertEqual(
			cw.URI.uriunsplit.apply(this, cw.URI.urisplit(
			"scheme://authority")),
			'scheme://authority')

		self.assertEqual(
			cw.URI.uriunsplit.apply(this, cw.URI.urisplit(
			"scheme://authority/")),
			'scheme://authority/')

	},

	function test_uriunsplit(self) {
		self.assertEqual(
			cw.URI.uriunsplit(
			'scheme', 'authority', '/path', 'query', 'fragment'),
			'scheme://authority/path?query#fragment');

		self.assertEqual(
			cw.URI.uriunsplit(
			'scheme', 'authority', '/path', null, 'fragment'),
			'scheme://authority/path#fragment');

		self.assertEqual(
			cw.URI.uriunsplit(
			'scheme', 'authority', '/path', '', 'fragment'),
			'scheme://authority/path?#fragment');

		self.assertEqual(
			cw.URI.uriunsplit(
			'scheme', 'authority', '/path', '?', '?'),
			'scheme://authority/path??#?');

		self.assertEqual(
			cw.URI.uriunsplit(
			'scheme', 'authority', '/path', '', null),
			'scheme://authority/path?');

		self.assertEqual(
			cw.URI.uriunsplit(
			'scheme', 'authority', '/path', '', ''),
			'scheme://authority/path?#');

		self.assertEqual(
			cw.URI.uriunsplit(
			'scheme', null, 'path', '', ''),
			'scheme:path?#');
	},

	function test_split_authority(self) {
		self.assertEqual(
			cw.URI.split_authority(
			"user:password@host:1"),
			['user', 'password', 'host', '1']);

		// No host, but a port? Ugly.
		self.assertEqual(
			cw.URI.split_authority(
			"user:password@:1"),
			['user', 'password', '', '1']);

		self.assertEqual(
			cw.URI.split_authority(
			"user@host:1"),
			['user', null, 'host', '1']);

		self.assertEqual(
			cw.URI.split_authority(
			"user:@host:999"),
			['user', '', 'host', '999']);

		self.assertEqual(
			cw.URI.split_authority(
			":@host:1000000"),
			['', '', 'host', '1000000']);
	},

	function test_join_authority(self) {
		self.assertEqual('user:password@host:90', cw.URI.join_authority('user', 'password', 'host', '90'));
		self.assertEqual('user:@host:90', cw.URI.join_authority('user', '', 'host', '90'));
		self.assertEqual('user:@:90', cw.URI.join_authority('user', '', '', '90'));
		self.assertEqual('user:@:', cw.URI.join_authority('user', '', '', ''));
		self.assertEqual('user@host:90', cw.URI.join_authority('user', null, 'host', '90'));
		self.assertEqual('host:90', cw.URI.join_authority(null, 'password', 'host', '90'));
		self.assertEqual(':password@host:90', cw.URI.join_authority('', 'password', 'host', '90'));
		self.assertEqual(':@host:90', cw.URI.join_authority('', '', 'host', '90'));
		self.assertEqual(':@host:0', cw.URI.join_authority('', '', 'host', '0'));
		self.assertEqual(':@host:-2', cw.URI.join_authority('', '', 'host', '-2')); // eh
		self.assertEqual(':@host', cw.URI.join_authority('', '', 'host', null));
		self.assertEqual('host', cw.URI.join_authority(null, null, 'host', null));
	}
);


cw.UnitTest.TestCase.subclass(CW.Test.TestURI, 'URLTests').methods(

	function test_fullURL(self) {
		var URL = cw.URI.URL;
		var u = new URL("scheme://user:password@host:81/path?query#fragment");

		self.assertEqual('scheme', u.scheme);
		self.assertEqual('user', u.user);
		self.assertEqual('password', u.password);
		self.assertEqual('host', u.host);
		self.assertEqual(81, u.port);
		self.assertEqual('/path', u.path);
		self.assertEqual('query', u.query);
		self.assertEqual('fragment', u.fragment);

		self.assertEqual("scheme://user:password@host:81/path?query#fragment", u.getString());
		self.assertEqual('cw.URI.URL("scheme://user:password@host:81/path?query#fragment")', u.toString());
	},


	function test_fullURLDefaults(self) {
		var URL = cw.URI.URL;
		var u = new URL("https://host");

		self.assertEqual('https', u.scheme);
		self.assertEqual(null, u.user);
		self.assertEqual(null, u.password);
		self.assertEqual('host', u.host);
		self.assertEqual(443, u.port);
		self.assertEqual('/', u.path);
		self.assertEqual(null, u.query);
		self.assertEqual(null, u.fragment);

		self.assertEqual("https://host/", u.getString());
		self.assertEqual('cw.URI.URL("https://host/")', u.toString());
	},


	function test_changeEverything(self) {
		var URL = cw.URI.URL;
		var u = new URL("https://host");
		self.assertEqual("https://host/", u.getString());

		u.update('scheme', 'http');
		u.update('host', 'newhost');
		u.update('port', 1);
		u.update('user', 'auser')
		// no password set.
		u.update('path', '/newpath');
		u.update('fragment', 'fragment');
		u.update('query', 'aquery?yes');
		self.assertEqual("http://auser@newhost:1/newpath?aquery?yes#fragment", u.getString());

		// and back...
		u.update('query', null);
		u.update('fragment', null);
		u.update('path', null);
		u.update('user', null);
		u.update('port', 443);
		u.update('host', 'host');
		u.update('scheme', 'https');
		self.assertEqual("https://host/", u.getString());
	},


	/**
	 * .update calls can be chained
	 */
	function test_fluentInterface(self) {
		var URL = cw.URI.URL;
		var u = new URL("https://host");
		u.update('host', 'newhost').update('scheme', 'http');
		self.assertEqual("http://newhost/", u.getString());
	}
);



cw.UnitTest.TestCase.subclass(CW.Test.TestURI, 'PortSchemeSwitchingTests').methods(

	function test_fullURLDefaultsUnknownScheme(self) {
		var URL = cw.URI.URL;
		var u = new URL("asdfq://host");

		self.assertEqual('asdfq', u.scheme);
		self.assertEqual(null, u.user);
		self.assertEqual(null, u.password);
		self.assertEqual('host', u.host);
		self.assertEqual(null, u.port);
		self.assertEqual('/', u.path);
		self.assertEqual(null, u.query);
		self.assertEqual(null, u.fragment);

		self.assertEqual("asdfq://host/", u.getString());
		self.assertEqual('cw.URI.URL("asdfq://host/")', u.toString());
	},


	function test_changeSchemeStrangePort(self) {
		var URL = cw.URI.URL;
		var u = new URL("http://user:pass@domain:81/path?query#fragment");
		self.assertEqual("http://user:pass@domain:81/path?query#fragment", u.getString());

		u.update('scheme', 'HTTPS');
		self.assertEqual("https://user:pass@domain:81/path?query#fragment", u.getString());
	},


	function test_changeSchemeExplicitPort1(self) {
		var URL = cw.URI.URL;
		var u = new URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());

		u.update('port', 80);
		u.update('scheme', 'HTTPS');

		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u.getString());
	},


	function test_changeSchemeExplicitPort2(self) {
		var URL = cw.URI.URL;
		var u = new URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());

		u.update('scheme', 'HTTPS');
		u.update('port', 80);

		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u.getString());
	},


	/**
	 * If a port is ever explicitly given in a parsed string, or a port is every explicitly
	 * set, cloning the URL means it's tainted with the 'explicit port set' bit
	 */
	function test_portMeansTaintedForever(self) {
		var URL = cw.URI.URL;
		var u = new URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());

		u.update('port', 80);
		var u2 = new URL(u);
		u2.update('scheme', 'https');

		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u2.getString());
	},


	function test_changeSchemeDefaultPort(self) {
		var URL = cw.URI.URL;
		var u = new URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());
		self.assertEqual(80, u.port);

		// to https
		u.update('scheme', "HTTPS");
		self.assertEqual("https://user:pass@domain/path?query#fragment", u.getString());
		self.assertEqual(443, u.port);

		// ...and back to http
		u.update('scheme', "htTP");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());
		self.assertEqual(80, u.port);
	},


	function test_changePortForKnownScheme(self) {
		var URL = cw.URI.URL;
		var u = new URL("http://user:pass@domain:81/path?query#fragment");
		u.update('port', 80);
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());
	},


	function test_changePortForUnknownScheme(self) {
		var URL = cw.URI.URL;
		var u = new URL("asdfq://user:pass@domain/path?query#fragment");
		self.assertEqual(null, u.port);

		u.update('port', 80);
		self.assertEqual(80, u.port);
		self.assertEqual("asdfq://user:pass@domain:80/path?query#fragment", u.getString());

		// Now go http
		u.update('scheme', 'http');
		self.assertEqual(80, u.port);
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());

		// Now go https
		u.update('scheme', 'https');
		self.assertEqual(80, u.port);
		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u.getString());
	},


	/**
	 * Even though 80 is the default port for HTTP, constructing it with the port
	 * in the string means the port number is tainted, and will remain the same
	 * after changing the scheme.
	 */
	function test_changeSchemeAfterExplicitPortInStringConstruction(self) {
		var URL = cw.URI.URL;
		var u = new URL("http://user:pass@domain:80/path?query#fragment");
		self.assertEqual(80, u.port);

		u.update('scheme', 'https');
		self.assertEqual(80, u.port);
	}
);
