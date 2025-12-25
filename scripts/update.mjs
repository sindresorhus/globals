import {parseArgs} from 'node:util';
import {outdent} from 'outdent';
import spawn from 'nano-spawn';
import {getBuiltinGlobals, buildYearlyBuiltinGlobals} from './es-builtin.mjs';
import getNodeBuiltinGlobals from './get-node-builtin-globals.mjs';
import {
	getBrowserGlobals,
	getWebWorkerGlobals,
	getServiceWorkerGlobals,
	getSharedWorkerGlobals,
	getAudioWorkletGlobals,
} from './get-browser-globals.mjs';
import getShelljsGlobals from './get-shelljs-globals.mjs';
import getJestGlobals from './get-jest-globals.mjs';
import {updateGlobals} from './utilities.mjs';
import getVitestGlobals from './get-vitest-globals.mjs';

const ALL_JOBS = [
	{
		id: 'builtin',
		build: createBuildFunction(getBuiltinGlobals, {
			incremental: false,
			excludeBuiltins: false,
		}),
	},
	{
		id: 'builtin-yearly',
		build: buildYearlyBuiltinGlobals,
	},
	{
		id: 'nodeBuiltin',
		build: createBuildFunction(getNodeBuiltinGlobals),
	},
	{
		id: 'browser',
		build: createBuildFunction(getBrowserGlobals),
	},
	{
		id: 'worker',
		build: createBuildFunction(getWebWorkerGlobals),
	},
	{
		id: 'serviceworker',
		build: createBuildFunction(getServiceWorkerGlobals),
	},
	{
		id: 'sharedWorker',
		build: createBuildFunction(getSharedWorkerGlobals),
	},
	{
		id: 'audioWorklet',
		build: createBuildFunction(getAudioWorkletGlobals),
	},
	{
		id: 'shelljs',
		build: createBuildFunction(getShelljsGlobals, {incremental: false}),
	},
	{
		id: 'jest',
		build: createBuildFunction(getJestGlobals, {incremental: false}),
	},
	{
		id: 'vitest',
		build: createBuildFunction(getVitestGlobals, {incremental: false}),
	},
];

function createBuildFunction(getGlobals, {incremental = true, excludeBuiltins = true} = {}) {
	return (job, options) => updateGlobals({
		job,
		getGlobals,
		dryRun: options.dry,
		incremental: options.clean ? false : incremental,
		excludeBuiltins,
	});
}

function report(job, {environment, added, removed}) {
	console.log(`✅ ${environment ?? job.id} globals updated.`);

	if (added.length > 0) {
		console.log();
		console.log(
			outdent`
				Added(${added.length}):
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

async function run(options) {
	const jobs = options.job
		? ALL_JOBS.filter(job => job.id === options.job)
		: ALL_JOBS;

	for (const job of jobs) {
		// eslint-disable-next-line no-await-in-loop
		const result = await job.build(job, options);
		report(job, result);
	}

	if (!options.dry) {
		try {
			await spawn('npm', ['run', 'build'], {stdio: 'inherit'});
		} catch {}

		try {
			await spawn('npx', ['xo', '--fix'], {stdio: 'inherit'});
		} catch {}
	}
}

const {
	values: options,
} = parseArgs({
	options: {
		job: {
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
