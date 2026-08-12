import { MOTIFS, VARIANTS } from './design.ts';
import { FONT_NAMES } from './fonts.ts';
import { PALETTES, type Palette } from './palettes.ts';

export type PlaygroundOptions = {
	/** Path prefix the handler is mounted under, e.g. `/img`. */
	basePath?: string;
	/** Palette set offered by the knobs. Defaults to the built-in twelve. */
	palettes?: Palette[];
	/** Largest accepted `w`/`h`. Caps the size sliders. */
	maxSize?: number;
};

/** Canvas sizes worth one click, in the order a designer reaches for them. */
const PRESETS: Array<[label: string, width: number, height: number]> = [
	['Avatar', 256, 256],
	['Square', 800, 800],
	['OG card', 1200, 630],
	['Banner', 1600, 400],
	['Wide', 1280, 720],
	['Story', 1080, 1920],
	['Thumb', 320, 180],
];

const STYLE = String.raw`
:root {
	color-scheme: light dark;
	--bg: #f4f3ef;
	--panel: #fffffe;
	--sunk: #eceae4;
	--ink: #17161a;
	--muted: #6d6a75;
	--line: #e1ded8;
	--accent: #17161a;
	--on-accent: #fffffe;
	--shadow: 0 1px 2px rgba(20, 18, 24, 0.05), 0 8px 24px -16px rgba(20, 18, 24, 0.3);
	--radius: 12px;
}
:root[data-theme="dark"] {
	color-scheme: dark;
	--bg: #101013;
	--panel: #191920;
	--sunk: #121217;
	--ink: #f2f1ee;
	--muted: #9b98a3;
	--line: #2b2b33;
	--accent: #f2f1ee;
	--on-accent: #101013;
	--shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px -16px rgba(0, 0, 0, 0.8);
}
@media (prefers-color-scheme: dark) {
	:root:not([data-theme="light"]) {
		--bg: #101013;
		--panel: #191920;
		--sunk: #121217;
		--ink: #f2f1ee;
		--muted: #9b98a3;
		--line: #2b2b33;
		--accent: #f2f1ee;
		--on-accent: #101013;
		--shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px -16px rgba(0, 0, 0, 0.8);
	}
}
* { box-sizing: border-box; }
html { scrollbar-gutter: stable; }
body {
	margin: 0;
	background: var(--bg);
	color: var(--ink);
	font: 14px/1.5 ui-sans-serif, -apple-system, "Helvetica Neue", Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
}
header {
	display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
	padding: 12px 20px; border-bottom: 1px solid var(--line);
	background: var(--panel); position: sticky; top: 0; z-index: 5;
}
header h1 { font: 600 15px/1 inherit; margin: 0; letter-spacing: -0.01em; }
header .tag { color: var(--muted); font-size: 12px; }
header .grow { flex: 1; }
@media (max-width: 720px) { header .tag.keys { display: none; } }
.wrap { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 20px; padding: 20px; align-items: start; }
@media (max-width: 900px) { .wrap { grid-template-columns: 1fr; } }

.panel { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); }
#knobs { position: sticky; top: 68px; max-height: calc(100vh - 88px); overflow-y: auto; padding: 4px 0 8px; }
@media (max-width: 900px) { #knobs { position: static; max-height: none; } }
fieldset { border: 0; border-top: 1px solid var(--line); margin: 0; padding: 12px 16px 16px; }
fieldset:first-of-type { border-top: 0; }
legend { padding: 0; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
label { display: block; margin: 12px 0 0; }
label > span { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; color: var(--muted); font-size: 11px; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 5px; }
label > span b { color: var(--ink); font-variant-numeric: tabular-nums; font-weight: 600; letter-spacing: 0; text-transform: none; }
input[type=text], select {
	width: 100%; padding: 7px 9px; border: 1px solid var(--line); border-radius: 8px;
	background: var(--sunk); color: var(--ink); font: inherit;
}
input[type=text]:focus-visible, select:focus-visible, button:focus-visible {
	outline: 2px solid var(--accent); outline-offset: 1px;
}
input[type=range] { width: 100%; accent-color: var(--accent); }
input[type=range]:disabled { opacity: 0.4; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: end; }
.seed-row { display: flex; gap: 6px; }
.seed-row input { flex: 1; min-width: 0; }
button {
	padding: 7px 11px; border: 1px solid var(--line); border-radius: 8px;
	background: var(--sunk); color: var(--ink); font: inherit; cursor: pointer;
	white-space: nowrap;
}
button:hover { border-color: var(--muted); }
button.primary { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
button.icon { padding: 7px 9px; }
.seg { display: flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--sunk); }
.seg button {
	flex: 1; border: 0; border-radius: 0; background: transparent; padding: 6px 4px;
	font-size: 12px; color: var(--muted);
}
.seg button + button { border-left: 1px solid var(--line); }
.seg button[aria-pressed="true"] { background: var(--accent); color: var(--on-accent); }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.chips button { font-size: 12px; padding: 5px 9px; }
.check { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
.color-row { display: flex; gap: 6px; }
input[type=color] {
	flex: 1; min-width: 0; height: 32px; padding: 2px; border: 1px solid var(--line);
	border-radius: 8px; background: var(--sunk); cursor: pointer;
}
.check input { accent-color: var(--accent); }

.stage { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.tabs { display: flex; gap: 4px; padding: 6px; overflow-x: auto; }
.tabs button { border: 0; background: transparent; color: var(--muted); font-size: 13px; }
.tabs button[aria-selected="true"] { background: var(--accent); color: var(--on-accent); }
.view { padding: 18px; }
.view[hidden] { display: none; }
.frame {
	display: flex; align-items: center; justify-content: center; min-height: 340px; border-radius: 8px;
}
/* A checkerboard keeps both very light and very dark palettes readable. */
.frame[data-backdrop="checker"] {
	background-image: linear-gradient(45deg, var(--sunk) 25%, transparent 25%),
		linear-gradient(-45deg, var(--sunk) 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, var(--sunk) 75%),
		linear-gradient(-45deg, transparent 75%, var(--sunk) 75%);
	background-size: 18px 18px;
	background-position: 0 0, 0 9px, 9px -9px, -9px 0;
}
.frame[data-backdrop="light"] { background: #ffffff; }
.frame[data-backdrop="dark"] { background: #0b0b0d; }
#preview {
	width: auto; height: auto; max-width: 100%; max-height: 66vh; object-fit: contain;
	border-radius: 4px; display: block; box-shadow: var(--shadow);
}
.meta { display: flex; flex-wrap: wrap; gap: 6px 16px; color: var(--muted); font-size: 12px; margin-top: 14px; font-variant-numeric: tabular-nums; }
.meta b { color: var(--ink); font-weight: 600; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.tile { display: flex; flex-direction: column; gap: 6px; padding: 0; border: 1px solid var(--line); background: var(--sunk); border-radius: 10px; overflow: hidden; cursor: pointer; text-align: left; }
.tile:hover { border-color: var(--muted); }
.tile[aria-pressed="true"] { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.tile img { width: 100%; display: block; aspect-ratio: var(--tile-ratio, 1); object-fit: cover; background: var(--sunk); }
.tile span { padding: 0 8px 7px; font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tile[aria-pressed="true"] span { color: var(--ink); }
.grid-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.grid-head p { margin: 0; color: var(--muted); font-size: 12px; flex: 1; min-width: 200px; }
.grid-head select { width: auto; }

.out { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; }
.out .url { display: flex; gap: 8px; align-items: center; }
.out code {
	flex: 1; min-width: 0; overflow-x: auto; white-space: nowrap; background: var(--sunk);
	border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px;
	font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
}
.out .chips { margin-top: 0; }
.toast {
	position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%) translateY(8px);
	background: var(--accent); color: var(--on-accent); padding: 8px 14px; border-radius: 999px;
	font-size: 13px; opacity: 0; pointer-events: none; transition: opacity 0.15s, transform 0.15s;
}
.toast[data-show="true"] { opacity: 1; transform: translateX(-50%) translateY(0); }
kbd { font: 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; border: 1px solid var(--line); border-bottom-width: 2px; border-radius: 4px; padding: 3px 4px; color: var(--muted); }
@media (prefers-reduced-motion: reduce) { .toast { transition: none; } }
`;

const BODY = String.raw`
<header>
	<h1>placeholder-images</h1>
	<span class="tag">every knob is a URL parameter</span>
	<span class="grow"></span>
	<span class="tag keys"><kbd>R</kbd> seed <kbd>M</kbd> motif <kbd>P</kbd> palette <kbd>&larr;</kbd><kbd>&rarr;</kbd> variant</span>
	<button type="button" id="surprise">Surprise me</button>
	<button type="button" id="theme" class="icon" title="Toggle theme" aria-label="Toggle theme">&#9680;</button>
</header>

<div class="wrap">
	<form class="panel" id="knobs" autocomplete="off" onsubmit="return false">
		<fieldset>
			<legend>Seed</legend>
			<label>
				<span>Seed <b id="designOut"></b></span>
				<span class="seed-row"><input type="text" id="seed" value="hello-world"><button type="button" id="dice" class="icon" title="Random seed" aria-label="Random seed">&#10539;</button></span>
			</label>
		</fieldset>

		<fieldset>
			<legend>Type</legend>
			<label><span>Title</span><input type="text" id="title" value="Hello World"></label>
			<label><span>Subtitle</span><input type="text" id="subtitle" value=""></label>
			<label><span>Alt text</span><input type="text" id="label" value="" placeholder="defaults to the title"></label>
			<div class="row">
				<label><span>Font</span><select id="font"></select></label>
				<label><span>Align</span><span class="seg" id="align" role="group" aria-label="Align"></span></label>
			</div>
			<label><span>Vertical <b id="valignOut">bottom</b></span><span class="seg" id="valign" role="group" aria-label="Vertical align"></span></label>
			<label><span>Text X <b id="txOut">auto</b></span><input type="range" id="tx" min="0" max="100" step="1" value="7"></label>
			<label><span>Text Y <b id="tyOut">auto</b></span><input type="range" id="ty" min="0" max="100" step="1" value="93"></label>
			<label><span>Turn text <b id="textRotateOut">0&deg;</b></span><input type="range" id="textRotate" min="-90" max="90" step="1" value="0"></label>
			<label><span>Scrim <b id="scrimOut">off</b></span><input type="range" id="scrim" min="0" max="100" step="5" value="0"></label>
			<div class="row">
				<label><span>Title <b id="titleColorOut">auto</b></span><span class="color-row"><input type="color" id="titleColor" value="#222222"></span></label>
				<label><span>Subtitle <b id="subtitleColorOut">auto</b></span><span class="color-row"><input type="color" id="subtitleColor" value="#222222"></span></label>
			</div>
			<div class="chips">
				<button type="button" id="autoPlace">Auto placement</button>
				<button type="button" id="autoColor">Palette colours</button>
			</div>
		</fieldset>

		<fieldset>
			<legend>Design</legend>
			<div class="row">
				<label><span>Motif</span><select id="motif"></select></label>
				<label><span>Palette</span><select id="palette"></select></label>
			</div>
			<label><span>Variant</span><span class="seg" id="variant" role="group" aria-label="Variant"></span></label>
			<label><span>Tilt <b id="tiltOut">auto</b></span><input type="range" id="tilt" min="-30" max="30" step="1" value="0"></label>
			<div class="chips">
				<button type="button" data-tilt="auto">Auto tilt</button>
				<button type="button" data-tilt="0">Flat</button>
			</div>
		</fieldset>

		<fieldset>
			<legend>Canvas</legend>
			<label><span>Width <b id="wOut">600</b></span><input type="range" id="w" min="64" max="2048" step="8" value="600"></label>
			<label><span>Height <b id="hOut">600</b></span><input type="range" id="h" min="64" max="2048" step="8" value="600"></label>
			<div class="chips">
				<button type="button" id="swap">Swap</button>
				<label class="check"><input type="checkbox" id="lock"> lock ratio</label>
			</div>
			<div class="chips" id="presets"></div>
		</fieldset>

		<fieldset>
			<legend>Output</legend>
			<div class="row">
				<label><span>Format</span><span class="seg" id="format" role="group" aria-label="Format"></span></label>
				<label><span>Scale <b id="scaleOut">1&times;</b></span><input type="range" id="scale" min="1" max="4" step="1" value="1"></label>
			</div>
			<label><span>Backdrop</span><span class="seg" id="backdrop" role="group" aria-label="Backdrop"></span></label>
			<div class="chips">
				<button type="button" id="download">Download</button>
				<button type="button" id="open">Open raw</button>
				<button type="button" id="reset">Reset</button>
			</div>
		</fieldset>
	</form>

	<div class="stage">
		<div class="panel"><div class="tabs" id="tabs" role="tablist"></div></div>

		<div class="panel view" id="view-preview" role="tabpanel" aria-label="Preview">
			<div class="frame" id="frame" data-backdrop="checker"><img id="preview" alt="preview"></div>
			<div class="meta">
				<span>Rendered <b id="metaSize">&mdash;</b></span>
				<span>Motif <b id="metaMotif">&mdash;</b></span>
				<span>Palette <b id="metaPalette">&mdash;</b></span>
				<span>Variant <b id="metaVariant">&mdash;</b></span>
				<span>Weight <b id="metaWeight">&mdash;</b></span>
			</div>
		</div>

		<div class="panel view" id="view-gallery" role="tabpanel" aria-label="Gallery" hidden>
			<div class="grid-head">
				<p>Random seeds with the current knobs. Click one to adopt its seed.</p>
				<select id="galleryCount"></select>
				<button type="button" id="shuffle">Shuffle</button>
			</div>
			<div class="grid" id="galleryGrid"></div>
		</div>

		<div class="panel view" id="view-motifs" role="tabpanel" aria-label="Motifs" hidden>
			<div class="grid-head"><p>This seed in every motif. Click one to lock it in.</p></div>
			<div class="grid" id="motifGrid"></div>
		</div>

		<div class="panel view" id="view-palettes" role="tabpanel" aria-label="Palettes" hidden>
			<div class="grid-head"><p>This design in every palette.</p></div>
			<div class="grid" id="paletteGrid"></div>
		</div>

		<div class="panel view" id="view-variants" role="tabpanel" aria-label="Variants" hidden>
			<div class="grid-head"><p>Placement variants of the current motif.</p></div>
			<div class="grid" id="variantGrid"></div>
		</div>

		<div class="panel out">
			<div class="url"><code id="urlOut"></code><button type="button" id="copyUrl" class="primary">Copy</button></div>
			<div class="chips">
				<button type="button" data-copy="absolute">Absolute URL</button>
				<button type="button" data-copy="markdown">Markdown</button>
				<button type="button" data-copy="html">&lt;img&gt;</button>
				<button type="button" data-copy="css">CSS</button>
				<button type="button" data-copy="source">SVG source</button>
				<button type="button" data-copy="datauri">Data URI</button>
			</div>
		</div>
	</div>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

/**
 * The page script. Written without template literals, so it can live inside
 * one, and without a framework: the UI is a state object plus DOM calls.
 */
const SCRIPT = String.raw`
const $ = (id) => document.getElementById(id);
const TABS = [
	['preview', 'Preview'],
	['gallery', 'Gallery'],
	['motifs', 'Motifs'],
	['palettes', 'Palettes'],
	['variants', 'Variants'],
];
const DEFAULTS = {
	seed: 'hello-world', title: 'Hello World', subtitle: '', label: '',
	motif: '', palette: '', variant: '', font: '', align: 'left', valign: 'bottom', scrim: 0,
	tx: '', ty: '', textRotate: 0, titleColor: '', subtitleColor: '',
	w: 600, h: 600, format: 'svg', scale: 1, tilt: 'auto',
	backdrop: 'checker', tab: 'preview', count: 12, lock: false,
};
const state = Object.assign({}, DEFAULTS);
let ratio = 1;

/* ---------- URL building ---------- */

function urlFor(over) {
	const s = Object.assign({}, state, over || {});
	const params = new URLSearchParams();
	params.set('w', String(Math.round(s.w)));
	params.set('h', String(Math.round(s.h)));
	if (s.title) params.set('title', s.title);
	if (s.subtitle) params.set('subtitle', s.subtitle);
	if (s.label) params.set('label', s.label);
	if (s.motif) params.set('motif', s.motif);
	if (s.palette) params.set('palette', s.palette);
	if (s.variant !== '') params.set('variant', String(s.variant));
	if (s.font) params.set('font', s.font);
	if (s.align !== 'left') params.set('align', s.align);
	if (s.valign !== 'bottom') params.set('valign', s.valign);
	if (s.tx !== '') params.set('tx', String(s.tx / 100));
	if (s.ty !== '') params.set('ty', String(s.ty / 100));
	if (s.textRotate) params.set('textRotate', String(s.textRotate));
	// Hex without the '#': a raw hash would end the query string.
	if (s.titleColor) params.set('titleColor', s.titleColor.replace('#', ''));
	if (s.subtitleColor) params.set('subtitleColor', s.subtitleColor.replace('#', ''));
	if (s.scrim > 0) params.set('scrim', String(s.scrim / 100));
	if (s.tilt !== 'auto') params.set('rotate', String(s.tilt));
	if (s.format === 'png' && s.scale > 1) params.set('scale', String(s.scale));
	// encodeURIComponent, not the raw seed: a seed may contain '/', '?' or '#'.
	return CONFIG.base + '/' + encodeURIComponent(s.seed || 'seed') + '.' + s.format + '?' + params;
}

/* Tiles are always small SVGs: a contact sheet of 48 PNGs would rasterise 48
   times server-side for pictures 200px wide. */
function tileUrl(over) {
	const factor = Math.min(1, 320 / Math.max(state.w, state.h));
	return urlFor(Object.assign({
		format: 'svg', scale: 1,
		w: Math.max(64, Math.round(state.w * factor)),
		h: Math.max(64, Math.round(state.h * factor)),
	}, over || {}));
}

/* ---------- Rendering ---------- */

let pending = 0;
let currentUrl = '';
const dirty = { gallery: true, motifs: true, palettes: true, variants: true };

/* One update per ~frame, regardless of how many input events a drag fires. A
   timer rather than requestAnimationFrame: rAF is throttled to a stop in a
   background tab, which would leave the preview stale behind the knobs. */
function schedule() {
	if (pending) return;
	pending = setTimeout(function () { pending = 0; apply(); }, 16);
}

function markDirty() {
	for (const key in dirty) dirty[key] = true;
}

function apply() {
	syncKnobs();
	const url = urlFor();
	if (url !== currentUrl) {
		currentUrl = url;
		$('urlOut').textContent = url;
		swapPreview(url);
	}
	refreshTab();
	saveHash();
}

function swapPreview(url) {
	const preview = $('preview');
	// Decode off-thread and swap only when ready, so dragging a slider never
	// blanks the preview between frames.
	const next = new Image();
	next.src = url;
	next.decode().then(function () {
		// A faster later request may already have won; keep the newest.
		if (currentUrl !== url) return;
		preview.src = url;
		preview.alt = state.label || state.title || state.seed;
		// Drive the box from the ratio, not pixel attributes: a 1768x600 image
		// must scale down whole, not get letter-boxed against a stale height.
		preview.style.aspectRatio = state.w + ' / ' + state.h;
		$('metaSize').textContent = Math.round(state.w) + ' \u00d7 ' + Math.round(state.h) +
			(state.format === 'png' && state.scale > 1 ? ' @' + state.scale + '\u00d7' : '') + ' ' + state.format;
	}).catch(function () {});
	weigh(url);
}

/* Transfer size is the honest number here, and the image is same-origin, so a
   HEAD answers it without downloading the body twice. */
let weighToken = 0;
function weigh(url) {
	const token = ++weighToken;
	$('metaWeight').textContent = '\u2026';
	fetch(url, { method: 'HEAD' }).then(function (response) {
		if (token !== weighToken) return;
		const length = Number(response.headers.get('content-length'));
		$('metaWeight').textContent = !response.ok ? response.status + ' ' + response.statusText
			: length ? (length < 1024 ? length + ' B' : (length / 1024).toFixed(1) + ' kB')
			: '\u2014';
	}).catch(function () {
		if (token === weighToken) $('metaWeight').textContent = '\u2014';
	});
}

/* ---------- Tabs and contact sheets ---------- */

function refreshTab() {
	const tab = state.tab;
	if (tab === 'preview' || !dirty[tab]) return;
	dirty[tab] = false;
	if (tab === 'gallery') {
		fillGrid($('galleryGrid'), gallerySeeds().map(function (seed) {
			return { over: { seed: seed }, text: seed, on: seed === state.seed };
		}));
	} else if (tab === 'motifs') {
		fillGrid($('motifGrid'), [{ over: { motif: '' }, text: 'auto', on: state.motif === '' }].concat(
			CONFIG.motifs.map(function (motif) {
				return { over: { motif: motif }, text: motif, on: state.motif === motif };
			})));
	} else if (tab === 'palettes') {
		fillGrid($('paletteGrid'), [{ over: { palette: '' }, text: 'auto', on: state.palette === '' }].concat(
			CONFIG.palettes.map(function (palette) {
				return { over: { palette: palette.name }, text: palette.name, on: state.palette === palette.name };
			})));
	} else if (tab === 'variants') {
		fillGrid($('variantGrid'), [{ over: { variant: '' }, text: 'auto', on: state.variant === '' }].concat(
			Array.from({ length: CONFIG.variants }, function (_, index) {
				return { over: { variant: index }, text: 'variant ' + index, on: state.variant === index };
			})));
	}
}

/* Tiles are reused rather than rebuilt, so switching a knob never throws away
   images the browser already decoded. */
function fillGrid(grid, items) {
	grid.style.setProperty('--tile-ratio', state.w + ' / ' + state.h);
	while (grid.children.length > items.length) grid.lastChild.remove();
	while (grid.children.length < items.length) {
		const tile = document.createElement('button');
		tile.type = 'button';
		tile.className = 'tile';
		const image = new Image();
		image.loading = 'lazy';
		image.decoding = 'async';
		image.alt = '';
		tile.append(image, document.createElement('span'));
		grid.append(tile);
	}
	items.forEach(function (item, index) {
		const tile = grid.children[index];
		const url = tileUrl(item.over);
		const image = tile.firstChild;
		if (image.getAttribute('src') !== url) image.setAttribute('src', url);
		tile.lastChild.textContent = item.text;
		tile.setAttribute('aria-pressed', item.on ? 'true' : 'false');
		tile.dataset.over = JSON.stringify(item.over);
	});
}

let gallerySalt = 1;
function gallerySeeds() {
	const seeds = [];
	for (let index = 0; index < state.count; index++) {
		// Seeds only have to look arbitrary and hold still between renders; the
		// salt is what a shuffle bumps.
		seeds.push((gallerySalt * 7919 + index * 977).toString(36) + '-' + ((gallerySalt + index) * 2654435 % 99991).toString(36));
	}
	return seeds;
}

function selectTab(tab) {
	state.tab = tab;
	for (const entry of TABS) {
		$('view-' + entry[0]).hidden = entry[0] !== tab;
		$('tab-' + entry[0]).setAttribute('aria-selected', String(entry[0] === tab));
	}
	refreshTab();
	saveHash();
}

/* ---------- Knob wiring ---------- */

function segmented(host, values, key, format) {
	host.textContent = '';
	for (const value of values) {
		const button = document.createElement('button');
		button.type = 'button';
		button.textContent = format ? format(value) : String(value);
		button.dataset.value = String(value);
		button.addEventListener('click', function () {
			state[key] = value;
			markDirty();
			schedule();
		});
		host.append(button);
	}
}

function syncKnobs() {
	$('seed').value = state.seed;
	$('title').value = state.title;
	$('subtitle').value = state.subtitle;
	$('label').value = state.label;
	$('motif').value = state.motif;
	$('palette').value = state.palette;
	$('font').value = state.font;
	$('w').value = String(Math.round(state.w));
	$('h').value = String(Math.round(state.h));
	$('wOut').textContent = String(Math.round(state.w));
	$('hOut').textContent = String(Math.round(state.h));
	$('scale').value = String(state.scale);
	$('scaleOut').textContent = state.scale + '\u00d7';
	$('scale').disabled = state.format !== 'png';
	$('scrim').value = String(state.scrim);
	$('scrimOut').textContent = state.scrim > 0 ? state.scrim + '%' : 'off';
	$('valignOut').textContent = state.valign;
	// An untouched slider still has to sit where the automatic placement puts
	// it, so the first drag nudges from there instead of jumping.
	$('tx').value = String(state.tx === '' ? autoX() : state.tx);
	$('ty').value = String(state.ty === '' ? autoY() : state.ty);
	$('txOut').textContent = state.tx === '' ? 'auto' : state.tx + '%';
	$('tyOut').textContent = state.ty === '' ? 'auto' : state.ty + '%';
	$('textRotate').value = String(state.textRotate);
	$('textRotateOut').textContent = state.textRotate + '\u00b0';
	$('titleColor').value = state.titleColor || paletteType();
	$('subtitleColor').value = state.subtitleColor || paletteType();
	$('titleColorOut').textContent = state.titleColor || 'auto';
	$('subtitleColorOut').textContent = state.subtitleColor || 'auto';
	$('tilt').value = String(state.tilt === 'auto' ? 0 : state.tilt);
	$('tilt').disabled = state.tilt === 'auto';
	$('tiltOut').textContent = state.tilt === 'auto' ? 'auto' : state.tilt + '\u00b0';
	$('lock').checked = state.lock === true;
	$('frame').dataset.backdrop = state.backdrop;
	$('galleryCount').value = String(state.count);
	for (const group of ['align', 'valign', 'format', 'backdrop', 'variant']) {
		for (const button of $(group).children) {
			button.setAttribute('aria-pressed', String(button.dataset.value === String(state[group])));
		}
	}
	$('designOut').textContent = (state.motif || 'auto') + ' \u00b7 ' + (state.palette || 'auto');
	$('metaMotif').textContent = state.motif || 'from seed';
	$('metaPalette').textContent = state.palette || 'from seed';
	$('metaVariant').textContent = state.variant === '' ? 'from seed' : String(state.variant);
}

function setSize(width, height) {
	state.w = Math.max(64, Math.min(CONFIG.maxSize, Math.round(width)));
	state.h = Math.max(64, Math.min(CONFIG.maxSize, Math.round(height)));
	markDirty();
	schedule();
}

/* ---------- Sharing ---------- */

function absolute(url) { return new URL(url, location.href).href; }

let toastTimer = 0;
function toast(message) {
	const node = $('toast');
	node.textContent = message;
	node.dataset.show = 'true';
	clearTimeout(toastTimer);
	toastTimer = setTimeout(function () { node.dataset.show = 'false'; }, 1600);
}

function copy(text, note) {
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(text).then(
			function () { toast(note || 'Copied'); },
			function () { toast('Copy blocked by the browser'); });
	} else {
		toast('Copy blocked by the browser');
	}
}

function copyAs(kind) {
	const url = currentUrl;
	const alt = state.label || state.title || state.seed;
	if (kind === 'absolute') return copy(absolute(url), 'URL copied');
	if (kind === 'markdown') return copy('![' + alt + '](' + absolute(url) + ')', 'Markdown copied');
	if (kind === 'html') {
		return copy('<img src="' + absolute(url) + '" width="' + Math.round(state.w) +
			'" height="' + Math.round(state.h) + '" alt="' + alt + '">', 'HTML copied');
	}
	if (kind === 'css') return copy('background-image: url("' + absolute(url) + '");', 'CSS copied');
	if (kind === 'source' || kind === 'datauri') {
		if (state.format !== 'svg') return toast('Switch to SVG for that');
		return fetch(url).then(function (response) { return response.text(); }).then(function (text) {
			copy(kind === 'source' ? text : 'data:image/svg+xml;utf8,' + encodeURIComponent(text),
				kind === 'source' ? 'SVG source copied' : 'Data URI copied');
		}).catch(function () { toast('Could not read the image'); });
	}
}

function download() {
	const link = document.createElement('a');
	link.href = currentUrl;
	link.download = (state.seed || 'placeholder') + '.' + state.format;
	link.click();
	toast('Downloading ' + link.download);
}

/* ---------- Hash state ---------- */

let hashTimer = 0;
function saveHash() {
	clearTimeout(hashTimer);
	hashTimer = setTimeout(function () {
		const params = new URLSearchParams();
		for (const key in DEFAULTS) {
			if (String(state[key]) !== String(DEFAULTS[key])) params.set(key, String(state[key]));
		}
		const hash = params.toString();
		// replaceState, not a hash assignment: a knob drag must not fill the back
		// button with hundreds of entries.
		history.replaceState(null, '', hash ? '#' + hash : location.pathname + location.search);
	}, 250);
}

function loadHash() {
	const params = new URLSearchParams(location.hash.slice(1));
	let found = false;
	for (const key in DEFAULTS) {
		if (!params.has(key)) continue;
		found = true;
		const raw = params.get(key);
		const fallback = DEFAULTS[key];
		if (typeof fallback === 'number') state[key] = Number(raw) || fallback;
		else if (typeof fallback === 'boolean') state[key] = raw === 'true';
		else if (
			(key === 'variant' || key === 'tilt' || key === 'tx' || key === 'ty') &&
			raw !== '' && raw !== 'auto'
		) state[key] = Number(raw);
		else state[key] = raw;
	}
	if (found) ratio = state.w / state.h;
}

/* ---------- Boot ---------- */

(function build() {
	const motifSelect = $('motif');
	motifSelect.append(new Option('auto (from seed)', ''));
	for (const motif of CONFIG.motifs) motifSelect.append(new Option(motif, motif));

	const paletteSelect = $('palette');
	paletteSelect.append(new Option('auto (from seed)', ''));
	for (const palette of CONFIG.palettes) paletteSelect.append(new Option(palette.name, palette.name));

	const fontSelect = $('font');
	fontSelect.append(new Option('default (serif)', ''));
	for (const font of CONFIG.fonts) fontSelect.append(new Option(font, font));

	for (const count of [6, 12, 24, 48]) $('galleryCount').append(new Option(count + ' tiles', String(count)));
	for (const slider of [$('w'), $('h')]) slider.max = String(CONFIG.maxSize);

	segmented($('align'), ['left', 'center', 'right'], 'align');
	segmented($('valign'), ['top', 'middle', 'bottom'], 'valign');
	segmented($('format'), ['svg', 'png'], 'format');
	segmented($('backdrop'), ['checker', 'light', 'dark'], 'backdrop');
	segmented($('variant'), [''].concat(Array.from({ length: CONFIG.variants }, function (_, i) { return i; })),
		'variant', function (value) { return value === '' ? 'auto' : String(value); });

	for (const preset of CONFIG.presets) {
		const button = document.createElement('button');
		button.type = 'button';
		button.textContent = preset[0];
		button.title = preset[1] + '\u00d7' + preset[2];
		button.addEventListener('click', function () { setSize(preset[1], preset[2]); ratio = state.w / state.h; });
		$('presets').append(button);
	}

	const tabs = $('tabs');
	for (const entry of TABS) {
		const button = document.createElement('button');
		button.type = 'button';
		button.id = 'tab-' + entry[0];
		button.textContent = entry[1];
		button.setAttribute('role', 'tab');
		button.addEventListener('click', function () { selectTab(entry[0]); });
		tabs.append(button);
	}
})();

for (const id of ['seed', 'title', 'subtitle', 'label']) {
	$(id).addEventListener('input', function () { state[id] = $(id).value; markDirty(); schedule(); });
}
for (const id of ['motif', 'palette', 'font']) {
	$(id).addEventListener('change', function () { state[id] = $(id).value; markDirty(); schedule(); });
}

$('w').addEventListener('input', function () {
	const value = Number($('w').value);
	if (state.lock) setSize(value, value / ratio);
	else { setSize(value, state.h); ratio = state.w / state.h; }
});
$('h').addEventListener('input', function () {
	const value = Number($('h').value);
	if (state.lock) setSize(value * ratio, value);
	else { setSize(state.w, value); ratio = state.w / state.h; }
});
$('lock').addEventListener('change', function () { state.lock = $('lock').checked; ratio = state.w / state.h; saveHash(); });
$('swap').addEventListener('click', function () { setSize(state.h, state.w); ratio = state.w / state.h; });
$('scale').addEventListener('input', function () { state.scale = Number($('scale').value); schedule(); });
$('scrim').addEventListener('input', function () { state.scrim = Number($('scrim').value); markDirty(); schedule(); });
$('tx').addEventListener('input', function () { state.tx = Number($('tx').value); markDirty(); schedule(); });
$('ty').addEventListener('input', function () { state.ty = Number($('ty').value); markDirty(); schedule(); });
$('textRotate').addEventListener('input', function () { state.textRotate = Number($('textRotate').value); markDirty(); schedule(); });
$('titleColor').addEventListener('input', function () { state.titleColor = $('titleColor').value; markDirty(); schedule(); });
$('subtitleColor').addEventListener('input', function () { state.subtitleColor = $('subtitleColor').value; markDirty(); schedule(); });
$('autoPlace').addEventListener('click', function () {
	state.tx = '';
	state.ty = '';
	state.textRotate = 0;
	markDirty();
	schedule();
});
$('autoColor').addEventListener('click', function () {
	state.titleColor = '';
	state.subtitleColor = '';
	markDirty();
	schedule();
});
$('tilt').addEventListener('input', function () { state.tilt = Number($('tilt').value); markDirty(); schedule(); });
for (const button of document.querySelectorAll('[data-tilt]')) {
	button.addEventListener('click', function () {
		state.tilt = button.dataset.tilt === 'auto' ? 'auto' : Number(button.dataset.tilt);
		markDirty();
		schedule();
	});
}

/* Where the automatic placement would put the block, in the same percent units
   the sliders speak, so 'auto' and the first drag agree. */
function autoX() {
	const pad = (Math.min(state.w, state.h) * 0.07) / state.w * 100;
	return state.align === 'center' ? 50 : state.align === 'right' ? 100 - pad : pad;
}
function autoY() {
	const pad = (Math.min(state.w, state.h) * 0.07) / state.h * 100;
	return state.valign === 'top' ? pad : state.valign === 'middle' ? 50 : 100 - pad;
}

/* The palette's own type colour, so the colour inputs open on the colour the
   image is actually using. Unknown while the palette comes from the seed. */
function paletteType() {
	for (const palette of CONFIG.palettes) {
		if (palette.name === state.palette) return palette.type;
	}
	return '#808080';
}

function pick(values) { return values[Math.floor(Math.random() * values.length)]; }
function randomSeed() { state.seed = Math.random().toString(36).slice(2, 10); markDirty(); schedule(); }

$('dice').addEventListener('click', randomSeed);
$('shuffle').addEventListener('click', function () { gallerySalt++; dirty.gallery = true; refreshTab(); });
$('galleryCount').addEventListener('change', function () {
	state.count = Number($('galleryCount').value);
	dirty.gallery = true;
	refreshTab();
	saveHash();
});
$('surprise').addEventListener('click', function () {
	state.seed = Math.random().toString(36).slice(2, 10);
	state.motif = pick([''].concat(CONFIG.motifs));
	state.palette = pick([''].concat(CONFIG.palettes.map(function (palette) { return palette.name; })));
	state.variant = pick(['', 0, 1, 2, 3]);
	state.font = pick([''].concat(CONFIG.fonts));
	state.align = pick(['left', 'left', 'center', 'right']);
	state.scrim = pick([0, 0, 45, 70]);
	state.valign = pick(['bottom', 'bottom', 'top', 'middle']);
	state.textRotate = pick([0, 0, 0, -6, 8, -90]);
	markDirty();
	schedule();
});
$('reset').addEventListener('click', function () {
	Object.assign(state, DEFAULTS);
	ratio = 1;
	markDirty();
	schedule();
});
$('download').addEventListener('click', download);
$('open').addEventListener('click', function () { window.open(currentUrl, '_blank', 'noopener'); });
$('copyUrl').addEventListener('click', function () { copy(absolute(currentUrl), 'URL copied'); });
for (const button of document.querySelectorAll('[data-copy]')) {
	button.addEventListener('click', function () { copyAs(button.dataset.copy); });
}

for (const grid of document.querySelectorAll('.grid')) {
	// One delegated listener per grid, so a 48-tile sheet still costs one.
	grid.addEventListener('click', function (event) {
		const tile = event.target.closest('.tile');
		if (!tile || !tile.dataset.over) return;
		Object.assign(state, JSON.parse(tile.dataset.over));
		markDirty();
		schedule();
	});
}

$('theme').addEventListener('click', function () {
	const dark = document.documentElement.dataset.theme
		? document.documentElement.dataset.theme === 'dark'
		: matchMedia('(prefers-color-scheme: dark)').matches;
	document.documentElement.dataset.theme = dark ? 'light' : 'dark';
	try { localStorage.setItem('placeholder-theme', document.documentElement.dataset.theme); } catch (error) {}
});

document.addEventListener('keydown', function (event) {
	const tag = (event.target.tagName || '').toLowerCase();
	if (tag === 'input' || tag === 'select' || tag === 'textarea' || event.metaKey || event.ctrlKey || event.altKey) return;
	const key = event.key.toLowerCase();
	if (key === 'r') randomSeed();
	else if (key === 'm') { state.motif = pick(CONFIG.motifs); markDirty(); schedule(); }
	else if (key === 'p') { state.palette = pick(CONFIG.palettes).name; markDirty(); schedule(); }
	else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
		const step = event.key === 'ArrowRight' ? 1 : -1;
		const next = (state.variant === '' ? 0 : state.variant) + step;
		state.variant = (next + CONFIG.variants) % CONFIG.variants;
		markDirty();
		schedule();
	} else return;
	event.preventDefault();
});

try {
	const saved = localStorage.getItem('placeholder-theme');
	if (saved) document.documentElement.dataset.theme = saved;
} catch (error) {}

/* A pasted link changes the hash without reloading the document, and
   history.replaceState never fires this, so the only events here are real
   navigations. */
addEventListener('hashchange', function () {
	loadHash();
	markDirty();
	selectTab(state.tab);
	schedule();
});

loadHash();
selectTab(state.tab);
apply();
`;

/**
 * A single self-contained HTML page for driving the renderer by hand. No build
 * step and no external assets: the knobs write a URL, and the URL is the image.
 *
 * Performance comes from four things:
 * - every preview is an `<img>` on the same immutable-cached URL the API
 *   serves, so revisiting a knob position is a browser cache hit;
 * - knob changes are coalesced to one update per ~16ms, so dragging a slider
 *   cannot queue a request per pixel;
 * - the main preview is decoded off-thread and swapped in only when ready, so
 *   it never flashes empty mid-drag;
 * - contact sheets fill lazily, reuse their tiles across updates, and always
 *   ask for small SVGs, so a 48-tile grid costs less than one full-size PNG.
 */
export function playgroundHtml(options: PlaygroundOptions = {}): string {
	const base = (options.basePath ?? '').replace(/\/+$/, '');
	const palettes = options.palettes ?? PALETTES;
	const config = JSON.stringify({
		base,
		maxSize: options.maxSize ?? 2048,
		motifs: MOTIFS,
		// `type` rides along so the colour inputs can open on the colour the image
		// is actually drawing with.
		palettes: palettes.map((entry) => ({
			name: entry.name,
			type: entry.type,
			dark: entry.dark === true,
		})),
		fonts: FONT_NAMES,
		variants: VARIANTS,
		presets: PRESETS,
	})
		// The config is inlined into a <script>, so a palette named `</script>`
		// must not be able to close it.
		.replace(/</g, '\\u003c');

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>placeholder-images playground</title>
<style>${STYLE}</style>
</head>
<body>
${BODY}
<script>
const CONFIG = ${config};
${SCRIPT}
</script>
</body>
</html>
`;
}
