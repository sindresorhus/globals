import {parseArgs} from 'node:util';
import {outdent} from 'outdent';
import spawn from 'nano-spawn';
import {getBuiltinGlobals, buildYearlyBuiltinGlobals} from './es-builtin.mjs';
import getRuntimeBuiltinGlobals from './get-runtime-builtin-globals.mjs';
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
		build: createBuildFunction(getRuntimeBuiltinGlobals('node.js')),
	},
	{
		id: 'bunBuiltin',
		build: createBuildFunction(getRuntimeBuiltinGlobals('bun')),
	},
	{
		id: 'denoBuiltin',
		build: createBuildFunction(getRuntimeBuiltinGlobals('deno')),
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

function reportChange(label, names, marker) {
	if (names.length === 0) {
		return;
	}

	console.log();
	console.log(
		outdent`
			${label}(${names.length}):
			${names.map(name => ` ${marker} ${name}`).join('\n')}
		`,
	);
}

function report(job, {environment, added, removed}) {
	console.log(`✅ ${environment ?? job.id} globals updated.`);

	reportChange('Added', added, '+');
	reportChange('Removed', removed, '-');
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

	if (options.dry) {
		return;
	}

	try {
		await spawn('npm', ['run', 'build'], {stdio: 'inherit'});
	} catch {}

	try {
		await spawn('npx', ['xo', '--fix'], {stdio: 'inherit'});
	} catch {}
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
