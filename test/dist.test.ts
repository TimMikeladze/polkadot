import { describe, expect, test } from 'bun:test';

/**
 * The published artefact is what users get, and it has broken twice in ways the
 * source tests could not see: a tree-shaken shared chunk, and a CLI that booted
 * a server on import. These tests run against `dist/`, so `bun run build` must
 * precede them.
 */

const distExists = await Bun.file('dist/index.js').exists();
const describeDist = distExists ? describe : describe.skip;

describeDist('dist', () => {
	test('exports everything index.ts declares', async () => {
		const dist = await import('../dist/index.js');
		for (const name of [
			'design',
			'hashSeed',
			'MOTIFS',
			'PALETTES',
			'renderSvg',
			'renderDataUri',
			'renderPng',
			'renderMotif',
			'createHandler',
			'parseImageRequest',
		]) {
			expect(typeof dist[name]).not.toBe('undefined');
		}
	});

	test('renders through the built handler', async () => {
		const { createHandler } = await import('../dist/index.js');
		const response = await createHandler()(new Request('http://x/a.svg'));
		expect(response.status).toBe(200);
	});

	test('importing the server entry does not start a server', async () => {
		const source = await Bun.file('dist/server.js').text();
		expect(source).not.toContain('Bun.argv');
		const dist = await import('../dist/server.js');
		expect(typeof dist.serve).toBe('function');
	});

	test('the CLI entry keeps its shebang', async () => {
		const source = await Bun.file('dist/cli.js').text();
		expect(source.startsWith('#!/usr/bin/env bun')).toBe(true);
	});
});
