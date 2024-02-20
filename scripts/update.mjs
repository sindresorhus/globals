import util from 'node:util';
import {outdent} from 'outdent';
import {execaCommand} from 'execa';
import getBuiltinGlobals from './get-builtin-globals.mjs';
import getNodeBuiltinGlobals from './get-node-builtin-globals.mjs';
import getBrowserGlobals from './get-browser-globals.mjs';
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
		= await updateGlobals({environment, getGlobals, dry: options.dry});

		console.log(
			outdent`
				✅ ${environment} globals updated.

				Added(${added.length}):
				${added.map(name => ` - ${name}`).join('\n') || 'None'}

				Removed(${removed.length}):
				${removed.map(name => ` - ${name}`).join('\n') || 'None'}
			`,
		);
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
	},
});

await run(options);

