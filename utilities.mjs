const sortObject = object =>
	Object.fromEntries(
		Object.entries(object).sort(([propertyA], [propertyB]) =>
			propertyA.localeCompare(propertyB),
		),
	);

function mergeGlobals(globalsA, globalsB) {
	const existsInA = Object.keys(globalsB).filter(name => Object.hasOwn(globalsA, name));
	if (existsInA.length > 0) {
		throw new Error(`Already exits:\n${existsInA.map(name => ` - ${name}`).join('\n')}`);
	}

	const existsInB = Object.keys(globalsA).filter(name => Object.hasOwn(globalsB, name));
	if (existsInB.length > 0) {
		throw new Error(`Already exits:\n${existsInB.map(name => ` - ${name}`).join('\n')}`);
	}

	return sortObject({...globalsA, ...globalsB});
}

export {mergeGlobals};
