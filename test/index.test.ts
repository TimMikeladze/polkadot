import { describe, expect, test } from 'bun:test';
import {
	createHandler,
	design,
	FONT_NAMES,
	hashSeed,
	MOTIFS,
	PALETTES,
	parseImageRequest,
	playgroundHtml,
	renderDataUri,
	renderSvg,
	VARIANTS,
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

	test('an explicit rotation wins over the seed and over rotate', () => {
		expect(design('abc', { rotation: 12 }).rotation).toBe(12);
		expect(design('abc', { rotation: 12, rotate: false }).rotation).toBe(12);
	});

	test('a forced variant wraps instead of clamping', () => {
		expect(design('abc', { variant: 2 }).variant).toBe(2);
		expect(design('abc', { variant: VARIANTS + 1 }).variant).toBe(1);
		expect(design('abc', { variant: -1 }).variant).toBe(VARIANTS - 1);
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

	test('align moves the type block and its anchor', () => {
		expect(renderSvg({ seed: 'x', title: 'Hi' })).toContain('text-anchor="start"');
		const centered = renderSvg({ seed: 'x', title: 'Hi', width: 600, align: 'center' });
		expect(centered).toContain('text-anchor="middle"');
		expect(centered).toContain('x="300"');
	});

	test('a named font pair replaces both stacks', () => {
		const svg = renderSvg({ seed: 'x', title: 'Hi', subtitle: 'Yo', font: 'mono' });
		expect(svg).toContain('ui-monospace');
		expect(svg).not.toContain('Georgia');
		// An unknown name is a fallback, not a crash.
		expect(renderSvg({ seed: 'x', title: 'Hi', font: 'nope' })).toContain('Georgia');
	});

	test('valign moves the block, and bottom is the default', () => {
		const yOf = (source: string) => Number(/<text[^>]*y="([\d.]+)"/.exec(source)?.[1]);
		const options = { seed: 'x', title: 'Hi', width: 600, height: 600 } as const;
		expect(renderSvg({ ...options, valign: 'bottom' })).toBe(renderSvg(options));
		expect(yOf(renderSvg({ ...options, valign: 'top' }))).toBeLessThan(
			yOf(renderSvg({ ...options, valign: 'middle' })),
		);
		expect(yOf(renderSvg({ ...options, valign: 'middle' }))).toBeLessThan(
			yOf(renderSvg({ ...options, valign: 'bottom' })),
		);
	});

	test('textX and textY place the block by fraction and clamp', () => {
		const svg = renderSvg({
			seed: 'x',
			title: 'Hi',
			width: 600,
			height: 400,
			textX: 0.5,
			textY: 0.25,
		});
		expect(svg).toContain('x="300"');
		expect(svg).toContain('y="100"');
		// Out of range is a clamp, not a title drawn off the canvas.
		expect(renderSvg({ seed: 'x', title: 'Hi', width: 600, textX: 4 })).toContain('x="600"');
		expect(renderSvg({ seed: 'x', title: 'Hi', width: 600, textX: -4 })).toContain('x="0"');
	});

	test('textRotation turns the block around its own anchor', () => {
		// The art always carries its own tilt group, so the type's group is the
		// second one, and its absence is what an unrotated title looks like.
		const groups = (source: string) => source.match(/<g transform="rotate/g)?.length ?? 0;
		expect(groups(renderSvg({ seed: 'x', title: 'Hi' }))).toBe(1);
		const svg = renderSvg({
			seed: 'x',
			title: 'Hi',
			width: 600,
			height: 600,
			textX: 0.5,
			textY: 0.5,
			textRotation: -12,
		});
		expect(svg).toContain('<g transform="rotate(-12 300 300)">');
		// One group around the whole block, not one per line.
		expect(groups(svg)).toBe(2);
	});

	test('type colours override the palette, per line', () => {
		const svg = renderSvg({
			seed: 'x',
			title: 'Hi',
			subtitle: 'Yo',
			titleColor: '#ffd166',
			subtitleColor: 'rebeccapurple',
		});
		expect(svg).toContain('fill="#ffd166"');
		expect(svg).toContain('fill="rebeccapurple"');
	});

	test('a type colour cannot break out of its attribute', () => {
		const svg = renderSvg({ seed: 'x', title: 'Hi', titleColor: '"><script>alert(1)</script>' });
		expect(svg).not.toContain('<script');
		// Quotes and brackets are stripped, so the value stays inside `fill`.
		expect(svg).toContain('fill="scriptalert(1)/script"');
	});

	test('the scrim is opt-in and keyed per design', () => {
		expect(renderSvg({ seed: 'x', title: 'Hi' })).not.toContain('linearGradient');
		const svg = renderSvg({ seed: 'x', title: 'Hi', scrim: 0.5 });
		expect(svg).toContain('linearGradient');
		expect(svg).toContain('stop-opacity="0.5"');
		// Two designs on one page must not share a gradient id.
		const other = renderSvg({ seed: 'y', title: 'Hi', scrim: 0.5 });
		const idOf = (source: string) => /linearGradient id="([^"]+)"/.exec(source)?.[1];
		expect(idOf(svg)).not.toBe(idOf(other));
	});

	test('a scrim without type draws nothing', () => {
		expect(renderSvg({ seed: 'x', scrim: true })).not.toContain('linearGradient');
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

	test('reads the design knobs', () => {
		const parsed = parseImageRequest(
			new URL('http://x/a.svg?variant=2&font=mono&align=center&scrim=0.4'),
		);
		expect(parsed?.options.variant).toBe(2);
		expect(parsed?.options.font).toBe('mono');
		expect(parsed?.options.align).toBe('center');
		expect(parsed?.options.scrim).toBe(0.4);
	});

	test('ignores unknown fonts and alignments', () => {
		const parsed = parseImageRequest(new URL('http://x/a.svg?font=comic&align=sideways'));
		expect(parsed?.options.font).toBeUndefined();
		expect(parsed?.options.align).toBeUndefined();
	});

	test('reads text placement, rotation, and colours', () => {
		const parsed = parseImageRequest(
			new URL('http://x/a.svg?valign=middle&tx=0.5&ty=0.25&textRotate=-8&color=ff3300'),
		);
		expect(parsed?.options.valign).toBe('middle');
		expect(parsed?.options.textX).toBe(0.5);
		expect(parsed?.options.textY).toBe(0.25);
		expect(parsed?.options.textRotation).toBe(-8);
		// A bare hex is the useful form in a URL, where '#' ends the query.
		expect(parsed?.options.titleColor).toBe('#ff3300');
		expect(parsed?.options.subtitleColor).toBe('#ff3300');
	});

	test('a per-line colour beats the shared one', () => {
		const parsed = parseImageRequest(new URL('http://x/a.svg?titleColor=%23fff&color=000'));
		expect(parsed?.options.titleColor).toBe('#fff');
		expect(parsed?.options.subtitleColor).toBe('#000');
	});

	test('rejects colours that are neither hex nor a keyword', () => {
		const parsed = parseImageRequest(new URL('http://x/a.svg?color=url(javascript:alert(1))'));
		expect(parsed?.options.titleColor).toBeUndefined();
	});

	test('text rotation is clamped to half a turn', () => {
		expect(parseImageRequest(new URL('http://x/a.svg?textRotate=900'))?.options.textRotation).toBe(
			180,
		);
	});

	test('scrim reads as a switch or a strength', () => {
		const on = (query: string) =>
			parseImageRequest(new URL('http://x/a.svg' + query))?.options.scrim;
		expect(on('?scrim')).toBe(true);
		expect(on('?scrim=true')).toBe(true);
		expect(on('?scrim=0.6')).toBe(0.6);
		expect(on('?scrim=false')).toBeUndefined();
		expect(on('?scrim=0')).toBeUndefined();
		expect(on('')).toBeUndefined();
	});

	test('rotate is a switch or an angle, and the angle is clamped', () => {
		expect(parseImageRequest(new URL('http://x/a.svg?rotate=false'))?.options.rotate).toBe(false);
		expect(parseImageRequest(new URL('http://x/a.svg?rotate=12'))?.options.rotation).toBe(12);
		expect(parseImageRequest(new URL('http://x/a.svg?rotate=900'))?.options.rotation).toBe(45);
		expect(parseImageRequest(new URL('http://x/a.svg'))?.options.rotation).toBeUndefined();
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

	test('a HEAD carries the length its GET would', async () => {
		const get = await handler(new Request('http://x/head.svg'));
		const head = await handler(new Request('http://x/head.svg', { method: 'HEAD' }));
		const body = await get.text();
		expect(head.headers.get('content-length')).toBe(String(new Blob([body]).size));
		expect(await head.text()).toBe('');
	});

	test('the usage document lists the fonts it accepts', async () => {
		const usage = await (await handler(new Request('http://x/'))).json();
		expect(usage.fonts).toEqual(FONT_NAMES);
		expect(usage.motifs.length).toBe(MOTIFS.length);
	});

	test('serves the playground to a browser at the root', async () => {
		const response = await handler(
			new Request('http://x/', { headers: { accept: 'text/html,*/*' } }),
		);
		expect(response.headers.get('content-type')).toContain('text/html');
		const body = await response.text();
		expect(body).toContain('polkadot playground');
		// The knob config carries the mount point the page must build URLs against.
		expect(body).toContain('"base":""');
	});

	test('playground can be disabled, leaving the JSON usage document', async () => {
		const bare = createHandler({ playground: false });
		const response = await bare(new Request('http://x/', { headers: { accept: 'text/html' } }));
		expect(await response.json()).toMatchObject({ motifs: [...MOTIFS] });
	});

	test('playground knows its base path and size cap', async () => {
		const scoped = createHandler({ basePath: '/img', maxSize: 512 });
		const body = await (
			await scoped(new Request('http://x/img', { headers: { accept: 'text/html' } }))
		).text();
		expect(body).toContain('"base":"/img"');
		expect(body).toContain('"maxSize":512');
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

describe('playgroundHtml', () => {
	const html = playgroundHtml();

	test('inlines the full knob vocabulary', () => {
		for (const motif of MOTIFS) expect(html).toContain(`"${motif}"`);
		for (const palette of PALETTES) expect(html).toContain(`"${palette.name}"`);
		for (const font of FONT_NAMES) expect(html).toContain(`"${font}"`);
		expect(html).toContain(`"variants":${VARIANTS}`);
	});

	test('loads its type from Google Fonts, and nothing else off-site', () => {
		const external = html.match(/(?:src|href)="(?:https?:)?\/\/[^"]+/g) ?? [];
		expect(external.length).toBeGreaterThan(0);
		for (const url of external) expect(url).toMatch(/fonts\.(googleapis|gstatic)\.com/);
		expect(html.startsWith('<!doctype html>')).toBe(true);
	});

	test('webfonts: false leaves no external asset at all', () => {
		const offline = playgroundHtml({ webfonts: false });
		expect(offline).not.toMatch(/(src|href)="(?:https?:)?\/\//);
		expect(offline).toContain('Inter Tight');
	});

	test('stays ASCII, because the bundler escapes raw templates', () => {
		// A non-ASCII glyph inside `String.raw` survives transpilation as a
		// literal `\uXXXX`, which would then print as text in the page.
		expect([...html].every((character) => character.codePointAt(0) < 128)).toBe(true);
	});

	test('a palette name cannot close the inline script', () => {
		const hostile = playgroundHtml({
			palettes: [
				{
					name: '</script><script>alert(1)</script>',
					field: '#fff',
					mark: '#000',
					shade: '#333',
					spark: '#f00',
					type: '#000',
				},
			],
		});
		expect(hostile).not.toContain('</script><script>alert(1)');
		expect(hostile).toContain('\\u003c/script');
	});
});
