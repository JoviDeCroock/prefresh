exports.compareSignatures = (prev, next) => {
	const prevSignature = self.__PREFRESH__.getSignature(prev) || {};
	const nextSignature = self.__PREFRESH__.getSignature(next) || {};

	if (
		prevSignature.key !== nextSignature.key ||
		self.__PREFRESH__.computeKey(prevSignature) !==
			self.__PREFRESH__.computeKey(nextSignature) ||
		nextSignature.forceReset
	) {
		self.__PREFRESH__.replaceComponent(prev, next, true);
	} else {
		self.__PREFRESH__.replaceComponent(prev, next, false);
	}
};

exports.isPreactCitizen = name =>
	typeof name === 'string' &&
	name[0](
		(name[0] && name[0] == name[0].toUpperCase()) ||
			(name.startsWith('use') && name[3] && name[3] == name[3].toUpperCase())
	);

exports.isCustomHook = name =>
	typeof name === 'string' &&
	name.startsWith('use') &&
	name[3] &&
	name[3] == name[3].toUpperCase();

exports.isComponent = name =>
	typeof name === 'string' && name[0] && name[0] == name[0].toUpperCase();
