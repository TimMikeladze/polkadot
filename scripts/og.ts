#!/usr/bin/env bun
/**
 * Build the site's static social card, favicon, and touch icon into `public/`.
 *
 * The card is a real composition rather than a raw render: crawlers show it at
 * thumbnail size next to a link, so it has to say what the project is, not just
 * show one picture. Run `bun run og` after changing the brand or the motifs.
 */
import { mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import { renderSvg } from '../src/svg.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const FONT_DIR = `${ROOT}fonts`;
const OUT = `${ROOT}public`;

const INK = '#201a14';
const BG = '#f2ebda';
const MUTED = '#7d6f5b';
const BRAND = '#c0563e';
const MUSTARD = '#eeac2b';
const GRAPE = '#7a5cd0';

/** The six seeds on the card. Picked for one motif and one palette each. */
const TILES = ['album-42', 'northern-line', 'floating-points', 'four-tet', 'stereolab', 'caribou'];

/** The five-dot mark, at any size. */
function mark(x: number, y: number, size: number): string {
	const u = size / 24;
	const at = (value: number): string => String(Math.round(value * 100) / 100);
	const dot = (cx: number, cy: number, r: number, fill: string) =>
		`<circle cx="${at(x + cx * u)}" cy="${at(y + cy * u)}" r="${at(r * u)}" fill="${fill}"/>`;
	return (
		dot(6, 6, 3.1, MUSTARD) +
		dot(18, 6, 3.1, GRAPE) +
		dot(6, 18, 3.1, GRAPE) +
		dot(18, 18, 3.1, MUSTARD) +
		dot(12, 12, 4.4, BRAND)
	);
}

/** A tile, drawn as a card: hard offset shadow, ink outline, clipped art. */
function tile(seed: string, x: number, y: number, size: number, index: number): string {
	const radius = size * 0.14;
	const art = renderSvg({ seed, width: size, height: size });
	const href = `data:image/svg+xml;utf8,${encodeURIComponent(art)}`;
	const id = `clip-${index}`;
	return (
		`<rect x="${x + 8}" y="${y + 8}" width="${size}" height="${size}" rx="${radius}" fill="${INK}"/>` +
		`<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}"/></clipPath></defs>` +
		`<image x="${x}" y="${y}" width="${size}" height="${size}" href="${href}" clip-path="url(#${id})"/>` +
		`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="none" stroke="${INK}" stroke-width="2.5"/>`
	);
}

function card(): string {
	const width = 1200;
	const height = 630;
	const size = 164;
	const gap = 22;
	const gridX = 632;
	const gridY = (height - (size * 2 + gap)) / 2;

	const tiles = TILES.map((seed, index) =>
		tile(
			seed,
			gridX + (index % 3) * (size + gap),
			gridY + Math.floor(index / 3) * (size + gap),
			size,
			index,
		),
	).join('');

	const url = 'polkadot.sh/album-42.svg';
	const chipWidth = url.length * 15.5 + 40;

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
		`<rect width="${width}" height="${height}" fill="${BG}"/>` +
		mark(80, 124, 60) +
		`<text x="78" y="280" font-family="Baloo 2" font-size="104" font-weight="800" fill="${INK}" letter-spacing="-3">polkadot</text>` +
		`<text x="80" y="344" font-family="Inter Tight" font-size="31" font-weight="400" fill="${MUTED}">Simple, minimal SVGs,</text>` +
		`<text x="80" y="384" font-family="Inter Tight" font-size="31" font-weight="400" fill="${MUTED}">generated from any seed string.</text>` +
		// The URL chip is the whole pitch: one link is the whole API.
		`<rect x="88" y="446" width="${chipWidth}" height="60" rx="16" fill="${INK}"/>` +
		`<rect x="80" y="438" width="${chipWidth}" height="60" rx="16" fill="#fffdf6" stroke="${INK}" stroke-width="2.5"/>` +
		`<text x="100" y="477" font-family="JetBrains Mono" font-size="25" font-weight="700" fill="${INK}">${url}</text>` +
		tiles +
		`</svg>`
	);
}

/** The mark alone, for the tab and the home screen. */
function icon(size: number, background: string | null): string {
	// The bare mark is the tab icon at 16px, so it gets almost the whole box;
	// the touch icon sits on a rounded tile and needs the inset.
	const pad = size * (background ? 0.14 : 0.06);
	const inner = size - pad * 2;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
		(background
			? `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${background}"/>`
			: '') +
		mark(pad, pad, inner) +
		`</svg>`
	);
}

function rasterise(svg: string, width: number): Uint8Array {
	return new Resvg(svg, {
		fitTo: { mode: 'width', value: width },
		// The card names three specific faces, so the build must not depend on
		// whichever machine runs it.
		font: { loadSystemFonts: false, fontDirs: [FONT_DIR] },
	})
		.render()
		.asPng();
}

await mkdir(OUT, { recursive: true });
await Bun.write(`${OUT}/og.png`, rasterise(card(), 1200));
await Bun.write(`${OUT}/favicon.svg`, icon(32, null));
await Bun.write(`${OUT}/apple-touch-icon.png`, rasterise(icon(180, BG), 180));
console.log('wrote public/og.png, public/favicon.svg, public/apple-touch-icon.png');
