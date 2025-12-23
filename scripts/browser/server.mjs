import fs from 'node:fs/promises';
import http from 'node:http';
import {inspect} from 'node:util';
import getPort from 'get-port';

async function startServer({silent = false, port: preferredPort} = {}) {
	const port = await getPort({port: preferredPort});

	const server = http.createServer(async (request, response) => {
		let {url} = request;
		if (!silent) {
			console.debug(url);
		}

		if (url === '/') {
			url = '/index.html';
		}

		// Only allow `.mjs` and `.html`
		if (!/\.(?:html|mjs)$/.test(url)) {
			response.statusCode = 404;
			return;
		}

		const file = new URL(url.slice(1), import.meta.url);
		let content;

		try {
			content = await fs.readFile(file, 'utf8');
		} catch (error) {
			if (!silent) {
				console.error(error);
			}

			response.statusCode = error.code === 'ENOENT' ? 404 : 500;
			response.end(inspect(error));
			return;
		}

		response.statusCode = 200;
		response.setHeader(
			'Content-Type',
			url.endsWith('.mjs') ? 'application/javascript' : 'text/html',
		);

		response.end(content);
	});

	// https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts
	const hostname = '127.0.0.1';
	server.listen(port, hostname);

	const url = `http://${hostname}:${port}`;

	const close = () => new Promise(resolve => {
		server.close(resolve);
	});

	return {
		url,
		close,
	};
}

export {startServer};
