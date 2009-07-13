import os
import struct

from twisted.python import log

from webmagic import uriparse

#globalBasePath = os.environ.get('JSPATH', None)
#if not globalBasePath:
#	log.msg("No JSPATH in env variables, program might fail very soon.")


class FindScriptError(Exception):
	"""
	Module/package doesn't exist, or __init__.js is missing.
	"""


def cacheBreakerForPath(path, os=os):
	"""
	Create a ?cachebreaker useful for appending to a URL.

	This could really be used for anything. It's not just for JavaScript,
	and not just for development.
	"""

	# Timestamp from the filesystem may come in nanosecond precision (6 decimal places)
	timestamp = os.stat(path).st_mtime

	# Pack the timestamp (float) for slight obfuscation.
	cacheBreaker = struct.pack('<d', timestamp).encode('hex')

	return cacheBreaker



def _getAllDeps(theScripts, depsFor=None, inverse=None):
	if depsFor is None:
		depsFor = {}

	for s in theScripts:
		if s in depsFor:
			continue

		deps = s.getDependencies()
		depsFor[s] = deps
		if deps:
			##print 'recursing', deps, depsFor
			_getAllDeps(deps, depsFor) # ignore return

	return depsFor



def getScriptOrderFor(theScripts, depsFor=None):
	"""
	Return an optimal <script> tag order for L{theScripts}, a sequence
	of L{Script} objects.

	Internally, this creates a dependency tree and then reads it breadth-first.
	"""




class Script(object):
	"""
	Represents a JavaScript file.

	Modifying private attributes will screw up everything.
	"""

	__slots__ = ['_name', '_basePath', '_mountedAt', '__weakref__']

	def __init__(self, name, basePath, mountedAt=None):
		# The __setattr__ blocks a simple `self.value = value'
		self._name = name
		self._basePath = basePath
		self._mountedAt = mountedAt


	def __eq__(self, other):
		if not isinstance(other, Script):
			return False
		return (self._name == other._name and
			self._basePath == other._basePath and
			self._mountedAt == other._mountedAt)


	def __hash__(self):
		return hash((self._name, self._basePath, self._mountedAt))


	def __repr__(self):
		return '<Script %r in %r @ %r>' % (
			self._name, os.path.split(self._basePath)[-1], self._mountedAt)


	def getFilename(self):
		"""
		Useful for both disk access and referencing the script for a URL.

		An __init__.js file is not required in a package directory.
		"""
		parts = self._name.split('.')

		if os.path.isdir(os.path.join(self._basePath, '/'.join(parts))):
			full = '/'.join(parts + ['__init__.js'])
			if not os.path.exists(os.path.join(self._basePath, full)):
				raise FindScriptError(
					"Directory for package "
					"%r exists but missing the __init__.js required for this import." % (self._name,))
		else:
			full = '/'.join(parts) + '.js'
			if not os.path.exists(os.path.join(self._basePath, full)):
				raise FindScriptError("Tried to find %r but no such file %r" % (self._name, full))

		return full


	def getAbsoluteFilename(self):
		return os.path.join(self._basePath, self.getFilename())


	def getContent(self):
		return open(self.getAbsoluteFilename(), 'rb').read()


	def _getImportStrings(self):
		imports = []
		for line in self.getContent().split('\n'):
			clean = line.rstrip()
			if clean.startswith('// import '):
				imports.append(clean.replace('// import ', '', 1))
			elif clean.startswith('//import '):
				imports.append(clean.replace('//import ', '', 1))
			else:
				continue

		return imports


	def getDependencies(self):
		deps = []
		for mod in self._getImportStrings():
			deps.append(Script(mod, self._basePath, self._mountedAt))
		return deps


#	def getAllDependencies(self, deps=None):
#		if deps is None:
#			deps = set()


	def _underscoreName(self):
		"""
		Return the header required for the JS module to run.

		TODO: but only CW things require this. Should it just be in the module?
		"""
		
		return "%s={'__name__':'%s'}" % (self._name, self._name)


	def scriptContent(self):
		"""
		Generate an HTML4/5 <script> tag with the script contents.
		"""

		template = "<script>%s;%s</script>"

		return template % (self._underscoreName(), self.getContent())


	def scriptSrc(self):
		"""
		Generate an HTML4/5 <script src="...">
		"""

		if not isinstance(self._mountedAt, str):
			raise ValueError("Need a str for self._mountedAt; had %r" % (self._mountedAt,))

		template = """<script>%s</script><script src="%s?%s"></script>"""

		cacheBreaker = cacheBreakerForPath(self.getAbsoluteFilename())

		return template % (
			self._underscoreName(),
			uriparse.urljoin(self._mountedAt, self.getFilename()),
			cacheBreaker)
