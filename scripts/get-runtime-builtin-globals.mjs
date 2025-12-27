import spawn from 'nano-spawn';

function runCli(runtime) {
	switch (runtime) {
		case 'node.js': {
			return spawn('node', [
				'get-runtime-builtin-globals-cli.mjs',
				'--runtime',
				runtime,
			], {cwd: import.meta.dirname});
		}

		case 'bun': {
			return spawn('bun', [
				'get-runtime-builtin-globals-cli.mjs',
				'--runtime',
				runtime,
			], {cwd: import.meta.dirname});
		}

		case 'deno': {
			return spawn('deno', [
				'get-runtime-builtin-globals-cli.mjs',
				'--runtime',
				runtime,
			], {cwd: import.meta.dirname});
		}

		default: {
			throw new Error('Unexpected runtime argument.');
		}
	}
}

export default function getRuntimeBuiltinGlobals(runtime) {
	return async () => {
		const {stdout} = await runCli(runtime);
		return JSON.parse(stdout);
	};
}
