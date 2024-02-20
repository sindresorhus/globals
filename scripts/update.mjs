import util from 'node:util';
import {outdent} from 'outdent';
import {execaCommand} from 'execa';
import getBuiltinGlobals from './get-builtin-globals.mjs';
import getNodeBuiltinGlobals from './get-node-builtin-globals.mjs';
import {getBrowserGlobals, getWebWorkerGlobals} from './get-browser-globals.mjs';
import getShelljsGlobals from './get-shelljs-globals.mjs';
import {updateGlobals} from './utilities.mjs';

const ALL_JOBS = [
	{
		environment: 'builtin',
		getGlobals: getBuiltinGlobals,
	},
	{
		environment: 'nodeBuiltin',
		getGlobals: getNodeBuiltinGlobals,
	},
	{
		environment: 'browser',
		getGlobals: getBrowserGlobals,
	},
	{
		environment: 'worker',
		getGlobals: getWebWorkerGlobals,
	},
	{
		environment: 'shelljs',
		getGlobals: getShelljsGlobals,
	},
];

async function run(options) {
	const jobs = options.environment
		? ALL_JOBS.filter(job => job.environment === options.environment)
		: ALL_JOBS;

	for (const {environment, getGlobals} of jobs) {
		const {
			added,
			removed,
		}
		// eslint-disable-next-line no-await-in-loop
		= await updateGlobals({
			environment,
			getGlobals,
			dry: options.dry,
			clean: options.clean,
		});

		console.log(`✅ ${environment} globals updated.`);

		if (added.length > 0) {
			console.log();
			console.log(
				outdent`
					Added(${removed.length}):
					${added.map(name => ` + ${name}`).join('\n')}
				`,
			);
		}

		if (removed.length > 0) {
			console.log();
			console.log(
				outdent`
					Removed(${removed.length}):
					${removed.map(name => ` - ${name}`).join('\n')}
				`,
			);
		}
	}

	if (!options.dry) {
		try {
			await execaCommand('npm run build');
		} catch {}

		try {
			await execaCommand('npx xo --fix');
		} catch {}
	}
}

const {
	values: options,
} = util.parseArgs({
	options: {
		environment: {
			type: 'string',
		},
		dry: {
			type: 'boolean',
			default: false,
		},
		clean: {
			type: 'boolean',
			default: false,
		},
	},
});

await run(options);
