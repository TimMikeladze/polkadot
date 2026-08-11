import { defineConfig } from 'bunup';

export default defineConfig({
	entry: ['src/index.ts', 'src/server.ts', 'src/cli.ts'],
	format: ['esm'],
	dts: true,
	external: ['@resvg/resvg-js'],
});
