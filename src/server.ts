import { createHandler, type HandlerOptions } from './http.ts';

export type ServeOptions = HandlerOptions & {
	port?: number;
	hostname?: string;
};

/**
 * Start a Bun server that renders images on demand. Importing this module has
 * no side effects — the CLI entry point lives in `cli.ts`, because
 * `import.meta.main` does not survive bundling and would otherwise boot a
 * server on import.
 */
export function serve(options: ServeOptions = {}): {
	port: number;
	hostname: string;
	stop: () => void;
	url: URL;
} {
	if (typeof Bun === 'undefined') {
		throw new Error(
			'`serve()` needs the Bun runtime. On other runtimes use `createHandler()` and wire it to your own server.',
		);
	}
	const fetchHandler = createHandler(options);
	const server = Bun.serve({
		port: options.port ?? 3000,
		hostname: options.hostname,
		fetch: fetchHandler,
	});

	return {
		port: server.port ?? 0,
		hostname: server.hostname ?? 'localhost',
		url: server.url,
		stop: () => {
			server.stop();
		},
	};
}
