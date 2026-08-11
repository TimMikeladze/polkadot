import { describe, expect, test } from 'bun:test';
import {
	createHandler,
	design,
	hashSeed,
	MOTIFS,
	PALETTES,
	parseImageRequest,
	renderDataUri,
	renderSvg,
	wrapText,
} from '../src';
import { serve } from '../src/server.ts';

describe('design', () => {
	test('is deterministic for a seed', () => {
		expect(design('abc')).toEqual(design('abc'));
		expect(hashSeed('abc')).toBe(hashSeed('abc'));
	});

	test('different seeds land on different designs', () => {
		const a = design('album-one');
		const b = design('album-two');
		expect(`${a.palette.name}/${a.motif}/${a.variant}`).not.toBe(
			`${b.palette.name}/${b.motif}/${b.variant}`,
		);
	});

	test('hints override the derived choice', () => {
		const spec = design('abc', { motif: 'prism', palette: 'midnight' });
		expect(spec.motif).toBe('prism');
		expect(spec.palette.name).toBe('midnight');
		expect(spec.isDarkField).toBe(true);
	});

	test('rotate: false removes the tilt', () => {
		expect(design('abc', { rotate: false }).rotation).toBe(0);
	});

	test('custom palettes replace the built-ins', () => {
		const custom = [
			{
				name: 'brand',
				field: '#fff',
				mark: '#000',
				shade: '#333',
				spark: '#f00',
				type: '#000',
			},
		];
		expect(design('anything', { palettes: custom }).palette.name).toBe('brand');
	});
});

describe('renderSvg', () => {
	test('renders every motif and palette without throwing', () => {
		for (const motif of MOTIFS) {
			for (const palette of PALETTES) {
				const svg = renderSvg({ seed: `${motif}-${palette.name}`, motif, palette: palette.name });
				expect(svg.startsWith('<svg')).toBe(true);
				expect(svg.endsWith('</svg>')).toBe(true);
				expect(svg).not.toContain('NaN');
				expect(svg).not.toContain('undefined');
			}
		}
	});

	test('honours width and height', () => {
		const svg = renderSvg({ seed: 'x', width: 1200, height: 630 });
		expect(svg).toContain('width="1200" height="630"');
		expect(svg).toContain('viewBox="0 0 1200 630"');
	});

	test('escapes type and label', () => {
		const svg = renderSvg({ seed: 'x', title: 'A & B <"c">' });
		expect(svg).toContain('&amp;');
		expect(svg).not.toContain('<"c">');
	});

	test('omits text elements when no type is given', () => {
		expect(renderSvg({ seed: 'x' })).not.toContain('<text');
		expect(renderSvg({ seed: 'x', title: 'Hi' })).toContain('<text');
	});

	test('a palette colour cannot inject markup', () => {
		const svg = renderSvg({
			seed: 'x',
			motif: 'rings',
			palettes: [
				{
					name: 'hostile',
					field: '"/><script>alert(1)</script>',
					mark: '#000',
					shade: '#000',
					spark: '#000',
					type: '"onload="x',
				},
			],
			title: 'Hi',
		});
		// Quotes and angle brackets are stripped, so the value stays inside its
		// attribute and cannot open an element or a second attribute.
		expect(svg).not.toContain('<script');
		expect(svg).not.toContain('onload="');
		expect(svg).toContain('fill="/scriptalert(1)/script"');
	});

	test('an empty seed still gets a described label', () => {
		expect(renderSvg({ seed: '' })).toContain('aria-label="Placeholder image"');
	});

	test('data URI round-trips to the same SVG', () => {
		const uri = renderDataUri({ seed: 'x' });
		expect(uri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
		expect(decodeURIComponent(uri.slice('data:image/svg+xml;utf8,'.length))).toBe(
			renderSvg({ seed: 'x' }),
		);
	});
});

describe('wrapText', () => {
	test('wraps on word boundaries', () => {
		expect(wrapText('one two three four', 3, 8)).toEqual(['one two', 'three', 'four']);
	});

	test('clips to maxLines with an ellipsis', () => {
		const lines = wrapText('alpha beta gamma delta epsilon', 2, 10);
		expect(lines.length).toBe(2);
		expect(lines[1]?.endsWith('…')).toBe(true);
	});

	test('collapsed whitespace is not mistaken for truncation', () => {
		expect(wrapText('one  two', 2, 4)).toEqual(['one', 'two']);
	});

	test('keeps a word longer than the line rather than dropping it', () => {
		expect(wrapText('supercalifragilistic', 2, 5)).toEqual(['supercalifragilistic']);
	});
});

describe('parseImageRequest', () => {
	test('reads seed, format, and params', () => {
		const parsed = parseImageRequest(
			new URL('http://x/my-album.png?w=800&h=400&title=Hi&motif=waves&scale=2'),
		);
		expect(parsed?.format).toBe('png');
		expect(parsed?.options.seed).toBe('my-album');
		expect(parsed?.options.width).toBe(800);
		expect(parsed?.options.height).toBe(400);
		expect(parsed?.options.title).toBe('Hi');
		expect(parsed?.options.motif).toBe('waves');
		expect(parsed?.options.scale).toBe(2);
	});

	test('defaults to svg and a square', () => {
		const parsed = parseImageRequest(new URL('http://x/seed?size=300'));
		expect(parsed?.format).toBe('svg');
		expect(parsed?.options.width).toBe(300);
		expect(parsed?.options.height).toBe(300);
	});

	test('an empty numeric param means absent, not zero', () => {
		const parsed = parseImageRequest(new URL('http://x/a.svg?w=&h=%20'));
		expect(parsed?.options.width).toBe(600);
		expect(parsed?.options.height).toBe(600);
	});

	test('clamps size and ignores unknown motifs', () => {
		const parsed = parseImageRequest(new URL('http://x/a.svg?w=99999&motif=nope'), {
			maxSize: 1024,
		});
		expect(parsed?.options.width).toBe(1024);
		expect(parsed?.options.motif).toBeUndefined();
	});

	test('respects basePath and rejects paths outside it', () => {
		expect(
			parseImageRequest(new URL('http://x/img/a.svg'), { basePath: '/img' })?.options.seed,
		).toBe('a');
		expect(parseImageRequest(new URL('http://x/other/a.svg'), { basePath: '/img' })).toBeNull();
	});

	test('basePath only matches at a segment boundary', () => {
		expect(parseImageRequest(new URL('http://x/imgevil.svg'), { basePath: '/img' })).toBeNull();
	});

	test('a malformed percent-escape is not a request', () => {
		expect(parseImageRequest(new URL('http://x/%E0%A4%A.svg'))).toBeNull();
	});

	test('scale cannot push the raster past maxSize', () => {
		const parsed = parseImageRequest(new URL('http://x/a.png?w=1024&scale=4'), { maxSize: 2048 });
		expect(parsed?.options.scale).toBe(2);
	});
});

describe('createHandler', () => {
	const handler = createHandler();

	test('serves an SVG', async () => {
		const response = await handler(new Request('http://x/hello.svg?title=Hello'));
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('image/svg+xml');
		const body = await response.text();
		expect(body.startsWith('<?xml')).toBe(true);
		expect(body).toContain('Hello');
	});

	test('serves usage at the root', async () => {
		const response = await handler(new Request('http://x/'));
		expect(await response.json()).toMatchObject({ motifs: [...MOTIFS] });
	});

	test('404s an empty path under a base path', async () => {
		const scoped = createHandler({ basePath: '/img' });
		expect((await scoped(new Request('http://x/nope/a.svg'))).status).toBe(404);
	});

	test('serves usage at a base path, with or without a trailing slash', async () => {
		const scoped = createHandler({ basePath: '/img' });
		expect((await scoped(new Request('http://x/img'))).status).toBe(200);
		expect((await scoped(new Request('http://x/img/'))).status).toBe(200);
	});

	test('rejects non-GET methods', async () => {
		const response = await handler(new Request('http://x/a.svg', { method: 'POST' }));
		expect(response.status).toBe(405);
		expect(response.headers.get('allow')).toBe('GET, HEAD');
	});

	test('answers 304 to a matching If-None-Match', async () => {
		const first = await handler(new Request('http://x/etag.svg'));
		const etag = first.headers.get('etag') as string;
		expect(etag).toBeTruthy();
		const second = await handler(
			new Request('http://x/etag.svg', { headers: { 'if-none-match': etag } }),
		);
		expect(second.status).toBe(304);
	});

	test('changing the palettes changes the ETag', async () => {
		const branded = createHandler({
			palettes: [
				{ name: 'brand', field: '#fff', mark: '#000', shade: '#333', spark: '#f00', type: '#000' },
			],
		});
		const base = (await handler(new Request('http://x/same.svg'))).headers.get('etag');
		const other = (await branded(new Request('http://x/same.svg'))).headers.get('etag');
		expect(base).not.toBe(other);
	});

	test('HEAD returns headers with no body', async () => {
		const response = await handler(new Request('http://x/a.svg', { method: 'HEAD' }));
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('');
	});

	test('renders a PNG', async () => {
		const response = await handler(new Request('http://x/a.png?size=64'));
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/png');
		const bytes = new Uint8Array(await response.arrayBuffer());
		// PNG magic number.
		expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
	});

	test('same seed renders byte-identical output', async () => {
		const one = await (await handler(new Request('http://x/stable.svg'))).text();
		const two = await (await handler(new Request('http://x/stable.svg'))).text();
		expect(one).toBe(two);
	});
});

describe('serve', () => {
	test('answers over a real socket and stops cleanly', async () => {
		const server = serve({ port: 0, basePath: '/img' });
		try {
			const response = await fetch(new URL('/img/live.svg?size=64', server.url));
			expect(response.status).toBe(200);
			expect(await response.text()).toContain('<svg');
		} finally {
			server.stop();
		}
	});
});
