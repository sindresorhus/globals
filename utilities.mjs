const DATA_DIRECTORY = new URL('data/', import.meta.url);

const readGlobals = async (environment, {ignoreNonExits} = {}) => {
	const file = new URL(`${environment}.mjs`, DATA_DIRECTORY);
	file.searchParams.set('ts', Date.now());

	let data;

	try {
		({default: data} = await import(file));
	} catch (error) {
		if (ignoreNonExits && error.code === 'ERR_MODULE_NOT_FOUND') {
			return {};
		}

		throw error;
	}

	return data;
};

const sortObject = object =>
	Object.fromEntries(
		Object.entries(object).sort(([propertyA], [propertyB]) =>
			propertyA.localeCompare(propertyB),
		),
	);

function unique(array) {
	return [...new Set(array)];
}

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

function getIntersectionGlobals(globalsA, globalsB) {
	return sortObject(
		Object.fromEntries([
			...Object.entries(globalsA).filter(([name]) => Object.hasOwn(globalsB, name)),
			...Object.entries(globalsB).filter(([name]) => Object.hasOwn(globalsA, name)),
		]),
	);
}

export {
	DATA_DIRECTORY,
	unique,
	sortObject,
	mergeGlobals,
	getIntersectionGlobals,
	readGlobals,
};
