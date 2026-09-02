import { MOTIFS, VARIANTS } from './design.ts';
import { FONT_NAMES, FONTS } from './fonts.ts';
import { PALETTES, type Palette } from './palettes.ts';

export type PlaygroundOptions = {
	/** Path prefix the handler is mounted under, e.g. `/img`. */
	basePath?: string;
	/** Palette set offered by the knobs. Defaults to the built-in twelve. */
	palettes?: Palette[];
	/** Largest accepted `w`/`h`. Caps the size sliders. */
	maxSize?: number;
	/**
	 * Load the page's own type from Google Fonts. Default true. Turn it off for
	 * an offline or air-gapped mount: the page then has no external asset at
	 * all, and falls back to the system stacks behind each family.
	 */
	webfonts?: boolean;
	/**
	 * Absolute origin the page is served from, e.g. `https://polkadot.sh`.
	 * Social crawlers reject relative image URLs, so the canonical link and the
	 * Open Graph tags are only emitted when this is known.
	 */
	siteUrl?: string;
	/**
	 * Umami analytics for the page. The tag is emitted only when a website ID
	 * is given, so an unconfigured mount ships a page with no tracker on it.
	 */
	analytics?: PlaygroundAnalytics;
};

export type PlaygroundAnalytics = {
	/** The site's ID in the Umami dashboard. */
	websiteId: string;
	/**
	 * Absolute URL of the Umami instance's tracker, e.g.
	 * `https://analytics.example.com/script.js`. Defaults to Umami Cloud.
	 */
	scriptUrl?: string;
	/** Comma-separated hostnames to count, so previews stay out of the numbers. */
	domains?: string;
};

const UMAMI_CLOUD_SCRIPT = 'https://cloud.umami.is/script.js';

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
	--bg: #f2ebda;
	--panel: #fffdf6;
	--sunk: #ece0c8;
	--ink: #201a14;
	--muted: #8a7c68;
	--line: rgba(32, 26, 20, 0.14);
	--line-strong: rgba(32, 26, 20, 0.5);
	--accent: #201a14;
	--on-accent: #fffdf6;
	/* Hard, unblurred offsets rather than blur-and-fade: everything sits on the
	   page like it was cut out and set down, not lit from above. */
	--shadow: 6px 6px 0 var(--ink);
	--shadow-sm: 3px 3px 0 var(--ink);
	--brand: #c0563e;
	--mustard: #eeac2b;
	--grape: #7a5cd0;
	--radius: 20px;
	--ui: 'Inter Tight', Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	--mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	/* A rounded display face for anything that names something — the wordmark,
	   dialog titles — so the interface has a voice the body text does not.
	   Section labels use --mono instead: small caps read as a stamp, not a name. */
	--display: 'Baloo 2', 'Inter Tight', -apple-system, 'Segoe UI', Roboto, sans-serif;
}
:root[data-theme="dark"] {
	color-scheme: dark;
	--bg: #161210;
	--panel: #211a15;
	--sunk: #150f0c;
	--ink: #f5ecdb;
	--muted: #ab9c85;
	--line: rgba(245, 236, 219, 0.14);
	--line-strong: rgba(245, 236, 219, 0.4);
	--accent: #f5ecdb;
	--on-accent: #161210;
	--brand: #e8805f;
	--mustard: #f2c25a;
	--grape: #9c85e6;
}
@media (prefers-color-scheme: dark) {
	:root:not([data-theme="light"]) {
		color-scheme: dark;
		--bg: #161210;
		--panel: #211a15;
		--sunk: #150f0c;
		--ink: #f5ecdb;
		--muted: #ab9c85;
		--line: rgba(245, 236, 219, 0.14);
		--line-strong: rgba(245, 236, 219, 0.4);
		--accent: #f5ecdb;
		--on-accent: #161210;
		--brand: #e8805f;
		--mustard: #f2c25a;
		--grape: #9c85e6;
	}
}
* { box-sizing: border-box; }
html { scrollbar-gutter: stable; }
/* Touch: a tap acts at once and never doubles as a zoom gesture, so the
   double-tap-to-zoom delay and the accidental zoom on a fast second tap both
   go. Pinch-to-zoom and scrolling are untouched, so nothing about
   reading the page gets taken away. */
html, body { touch-action: manipulation; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
button, label, select, summary, a, input, .tile { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
body {
	margin: 0;
	background: var(--bg);
	/* A soft highlight over a dot grid — paper under a loupe, not a flat fill. */
	background-image:
		radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--panel) 60%, transparent), transparent 26rem),
		radial-gradient(circle, var(--line) 1px, transparent 1px);
	background-size: auto, 18px 18px;
	color: var(--ink);
	font: 400 13.5px/1.5 var(--ui);
	font-feature-settings: 'cv05' 1, 'ss03' 1, 'tnum' 0;
	-webkit-font-smoothing: antialiased;
	text-rendering: optimizeLegibility;
}
header {
	display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
	padding: 10px max(20px, env(safe-area-inset-right)) 10px max(20px, env(safe-area-inset-left));
	padding-top: max(10px, env(safe-area-inset-top));
	border-bottom: 2px solid var(--ink);
	background: color-mix(in srgb, var(--panel) 92%, transparent);
	backdrop-filter: saturate(180%) blur(12px);
	position: sticky; top: 0; z-index: 5;
}
header .brand { display: flex; align-items: center; gap: 10px; margin-right: 2px; }
/* The mark as a little pinned sticker, not an inline glyph. */
header .logo-badge {
	display: grid; place-items: center; flex: none; width: 34px; height: 34px;
	padding: 5px; background: var(--panel); border: 2px solid var(--ink); border-radius: 10px;
	box-shadow: var(--shadow-sm); transform: rotate(-4deg);
}
header .logo { display: block; width: 100%; height: 100%; }
header h1 { font: 700 20px/1 var(--display); margin: 0; letter-spacing: -0.01em; }
header .tag {
	display: flex; align-items: center; gap: 5px; color: var(--ink);
	font: 600 10.5px/1 var(--mono); letter-spacing: 0.04em; text-transform: uppercase;
	padding: 7px 10px; background: var(--sunk); border: 1.5px solid var(--line-strong); border-radius: 999px;
}
header .tag.keys em { font-style: normal; margin-right: 4px; opacity: 0.7; }
header .grow { flex: 1; }
header .actions { display: flex; align-items: center; gap: 6px; }
/* One height for the whole row and a square for every icon, so the outbound
   links, the glyph buttons and the primary button read as one set of controls
   rather than as parts collected from different places. Glyphs and SVG marks differ in
   natural width, so the box is fixed and the mark is centred inside it. */
header .actions button { height: 38px; }
header .actions .icon {
	display: grid; place-items: center; width: 38px; height: 38px; padding: 0;
	border: 2px solid var(--ink); border-radius: 10px;
	background: var(--sunk); color: var(--ink); box-shadow: var(--shadow-sm);
	font: 600 14px/1 var(--ui);
	transition: transform 0.08s ease, box-shadow 0.08s ease;
}
header .actions .icon svg { display: block; width: 15px; height: 15px; fill: currentColor; }
@media (hover: hover) { header .actions a.icon:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); } }
header .actions a.icon:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--ink); }
header .actions a.icon:focus-visible { outline: 3px solid var(--grape); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { header .actions a.icon { transition: none; } }
@media (max-width: 980px) { header .tag.keys { display: none; } }
@media (max-width: 560px) { header .tag { display: none; } }
/* One row on a phone. The bar stops wrapping and every part steps down a size
   instead, so the mark, the wordmark and the whole control set stay on the
   single strip a phone has room for. The spacer between them is the only thing
   that gives ground; the controls keep their square shape. */
@media (max-width: 560px) {
	header {
		flex-wrap: nowrap; gap: 8px;
		padding: 8px max(12px, env(safe-area-inset-right)) 8px max(12px, env(safe-area-inset-left));
		padding-top: max(8px, env(safe-area-inset-top));
	}
	header .brand { gap: 7px; margin-right: 0; min-width: 0; }
	header .logo-badge { width: 30px; height: 30px; padding: 4px; border-radius: 9px; }
	header h1 { font-size: 17px; white-space: nowrap; }
	header .grow { flex: 1 1 0; min-width: 0; }
	header .actions { flex: none; gap: 5px; }
	header .actions button.primary { height: 34px; min-height: 34px; padding: 0 11px; font-size: 12.5px; white-space: nowrap; }
	header .actions .icon { width: 34px; min-width: 34px; height: 34px; min-height: 34px; border-radius: 9px; }
	header .actions .icon svg { width: 14px; height: 14px; }
}
@media (max-width: 400px) {
	header { gap: 6px; }
	header .brand { gap: 6px; }
	header .logo-badge { width: 27px; height: 27px; padding: 3.5px; }
	header h1 { font-size: 15.5px; }
	header .actions { gap: 4px; }
	header .actions button.primary { height: 32px; min-height: 32px; padding: 0 9px; font-size: 12px; }
	header .actions .icon { width: 32px; min-width: 32px; height: 32px; min-height: 32px; }
	header .actions .icon svg { width: 13px; height: 13px; }
}
/* On the narrowest phones the wordmark is the one part with a stand-in: the
   badge already says which site this is, so it goes rather than the row. */
@media (max-width: 359px) { header h1 { display: none; } }
.wrap {
	display: grid; grid-template-columns: 300px minmax(0, 1fr) 280px; gap: 20px;
	padding: 20px max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
	align-items: start; max-width: 1680px; margin: 0 auto;
}
/* Knobs, stage, output. Below 1240px the output rail drops under the stage;
   below 900px everything stacks. */
@media (max-width: 1240px) { .wrap { grid-template-columns: 300px minmax(0, 1fr); } .rail { grid-column: 2; } }
/* Mobile: the picture and its copy/share controls come before the knob form,
   not after it — a visitor on a phone wants the result, not the sliders. */
@media (max-width: 900px) {
	.wrap { grid-template-columns: 1fr; }
	.rail { grid-column: 1; order: 2; }
	.stage { order: 1; }
	#knobs { order: 3; }
}

.panel { background: var(--panel); border: 2px solid var(--ink); border-radius: var(--radius); box-shadow: var(--shadow); }
#knobs { position: sticky; top: 70px; max-height: calc(100vh - 90px); max-height: calc(100dvh - 90px); overflow-y: auto; padding: 0 0 8px; overscroll-behavior: contain; }
@media (max-width: 900px) { #knobs { position: static; max-height: none; } }
fieldset { border: 0; margin: 0; padding: 4px 16px 18px; }
fieldset + fieldset { border-top: 1.5px solid var(--line); }
/* A no-JS accordion: a checkbox styled as a button, and the fieldsets it
   reveals via a sibling selector. Desktop never sees it — the knobs stay
   open there — so it only exists to keep the form out of the way below the
   preview on a phone. */
.knobs-toggle { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
.knobs-toggle-label { display: none; }
@media (max-width: 900px) {
	.knobs-toggle-label {
		display: flex; align-items: center; justify-content: space-between; gap: 8px;
		margin: 14px 16px 2px; padding: 11px 12px; border: 1.5px solid var(--line-strong); border-radius: 10px;
		background: var(--sunk); color: var(--ink); font: 600 11px/1.2 var(--mono);
		letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
	}
	.knobs-toggle-label .chev { transition: transform 0.15s; color: var(--muted); }
	.knobs-toggle:checked ~ .knobs-toggle-label .chev { transform: rotate(180deg); }
	.knobs-toggle:focus-visible ~ .knobs-toggle-label { outline: 2px solid var(--accent); outline-offset: 1px; }
	.knobs-toggle ~ fieldset { display: none; }
	.knobs-toggle:checked ~ fieldset { display: block; }
}
@media (max-width: 900px) and (prefers-reduced-motion: reduce) { .knobs-toggle-label .chev { transition: none; } }
legend { padding: 0; }
/* The heading sits on a hairline that runs to the panel edge, so the sections
   read as bands rather than as one long column of controls. */
legend > span {
	display: flex; align-items: center; gap: 10px;
	padding: 12px 0 2px; color: var(--muted);
	font: 600 11px/1.4 var(--mono); letter-spacing: 0.14em; text-transform: uppercase;
}
legend > span::after { content: ""; flex: 1; height: 1px; background: var(--line); }
label { display: block; margin: 12px 0 0; }
label > span { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; color: var(--muted); font: 600 10.5px/1.4 var(--mono); letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 6px; }
/* Live values are read while dragging, so they get monospace digits and a chip
   of their own rather than blending into the label. */
label > span b {
	color: var(--ink); font: 600 11px/1.4 var(--mono);
	font-variant-numeric: tabular-nums; letter-spacing: 0; text-transform: none;
	background: var(--sunk); border: 1.5px solid var(--line-strong); border-radius: 999px; padding: 1px 7px;
}
input[type=text], select {
	width: 100%; padding: 8px 10px; border: 1.5px solid var(--line-strong); border-radius: 10px;
	background: var(--sunk); color: var(--ink); font: inherit;
}
@media (hover: hover) { input[type=text]:hover, select:hover { border-color: var(--ink); } }
select {
	appearance: none; padding-right: 28px; cursor: pointer;
	background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
		linear-gradient(135deg, currentColor 50%, transparent 50%);
	background-size: 5px 5px, 5px 5px;
	background-position: right 13px center, right 8px center;
	background-repeat: no-repeat;
}
input[type=text]:focus-visible, select:focus-visible, button:focus-visible,
input[type=range]:focus-visible, input[type=color]:focus-visible {
	outline: 3px solid var(--grape); outline-offset: 2px;
}
/* A hand-drawn track: the native control is a different height in every
   browser, which makes the slider rows fail to line up with each other. */
input[type=range] {
	appearance: none; width: 100%; height: 20px; background: transparent; cursor: pointer;
}
input[type=range]::-webkit-slider-runnable-track { height: 5px; border-radius: 999px; background: var(--line-strong); }
input[type=range]::-moz-range-track { height: 5px; border-radius: 999px; background: var(--line-strong); }
input[type=range]::-webkit-slider-thumb {
	appearance: none; width: 16px; height: 16px; margin-top: -6px; border-radius: 50%;
	background: var(--ink); border: 2.5px solid var(--panel); box-shadow: 0 0 0 1.5px var(--ink);
}
input[type=range]::-moz-range-thumb {
	width: 16px; height: 16px; border-radius: 50%;
	background: var(--ink); border: 2.5px solid var(--panel); box-shadow: 0 0 0 1.5px var(--ink);
}
@media (hover: hover) {
	input[type=range]:hover::-webkit-slider-thumb { background: var(--brand); box-shadow: 0 0 0 1.5px var(--brand); }
	input[type=range]:hover::-moz-range-thumb { background: var(--brand); box-shadow: 0 0 0 1.5px var(--brand); }
}
input[type=range]:disabled { opacity: 0.4; cursor: not-allowed; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: end; }
.seed-row { display: flex; gap: 6px; }
.seed-row input { flex: 1; min-width: 0; }
/* Tactile: a button sits on its own hard shadow and presses flat into it,
   rather than dimming or lifting on a soft glow. */
button {
	padding: 8px 12px; border: 2px solid var(--ink); border-radius: 10px;
	background: var(--sunk); color: var(--ink); font: 600 12.5px/1 var(--ui); cursor: pointer;
	white-space: nowrap; box-shadow: var(--shadow-sm);
	transition: transform 0.08s ease, box-shadow 0.08s ease;
}
@media (hover: hover) { button:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); } }
button:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--ink); }
button.primary { background: var(--brand); color: var(--on-accent); border-color: var(--ink); }
button.icon { padding: 8px 10px; }
@media (prefers-reduced-motion: reduce) { button { transition: none; } }
.seg { display: flex; border: 2px solid var(--ink); border-radius: 10px; overflow: hidden; background: var(--sunk); }
.seg button {
	flex: 1; border: 0; border-radius: 0; background: transparent; padding: 7px 4px; box-shadow: none;
	font-size: 12px; color: var(--muted);
}
@media (hover: hover) { .seg button:hover { color: var(--ink); transform: none; box-shadow: none; } }
.seg button:active { transform: none; box-shadow: none; }
.seg button + button { border-left: 1.5px solid var(--line-strong); }
.seg button[aria-pressed="true"] { background: var(--ink); color: var(--on-accent); }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.chips button { font-size: 11.5px; padding: 6px 10px; box-shadow: 2px 2px 0 var(--ink); }
@media (hover: hover) { .chips button:hover { box-shadow: 3px 3px 0 var(--ink); } }
.check { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
.color-row { display: flex; gap: 6px; }
input[type=color] {
	flex: 1; min-width: 0; height: 32px; padding: 2px; border: 1.5px solid var(--line-strong);
	border-radius: 9px; background: var(--sunk); cursor: pointer;
}
.check input { accent-color: var(--brand); }

.stage { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
/* One page, so each panel names itself instead of leaning on a tab. */
h2.section {
	margin: 0 0 14px; color: var(--muted);
	font: 600 11px/1.4 var(--mono); letter-spacing: 0.14em; text-transform: uppercase;
	display: flex; align-items: center; gap: 10px;
}
h2.section::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.view { padding: 18px; }
.view[hidden] { display: none; }
/* An artboard inset rather than a second hard shadow: the picture sits inside
   the panel's own shadow instead of stacking another one on top of it. */
.frame {
	display: flex; align-items: center; justify-content: center; min-height: 340px; border-radius: 14px;
	border: 1.5px solid var(--line-strong);
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
	width: auto; height: auto; max-width: 100%; max-height: 66vh; max-height: 66dvh; object-fit: contain;
	border-radius: 8px; display: block;
}
.meta { display: flex; flex-wrap: wrap; gap: 6px 16px; color: var(--muted); font-size: 12px; margin-top: 14px; font-variant-numeric: tabular-nums; }
.meta b { color: var(--ink); font-weight: 600; }

/* Copy / randomise / download, right under the picture. The full URL rail
   still exists below for the export formats, but a thumb on a phone
   shouldn't have to reach past the gallery and the docs to get there. */
.mobileBar { display: none; }
@media (max-width: 900px) {
	.mobileBar { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
	.mobileBar button { padding: 10px 8px; font-size: 12.5px; }
}

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
/* A phone column is ~310px wide, which misses two 150px tiles by a hair and
   drops the gallery to one tile per screen. Shrink the floor so it stays two. */
@media (max-width: 560px) { .grid { grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: 10px; } }
.tile { display: flex; flex-direction: column; gap: 6px; padding: 0; border: 1.5px solid var(--line-strong); background: var(--sunk); border-radius: 12px; overflow: hidden; cursor: pointer; text-align: left; }
@media (hover: hover) { .tile:hover { border-color: var(--ink); } }
.tile[aria-pressed="true"] { border-color: var(--ink); box-shadow: 3px 3px 0 var(--ink); }
.tile img { width: 100%; display: block; aspect-ratio: var(--tile-ratio, 1); object-fit: cover; background: var(--sunk); }
.tile span { padding: 0 8px 7px; font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tile[aria-pressed="true"] span { color: var(--ink); }
.grid-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.grid-head p { margin: 0; color: var(--muted); font-size: 12px; flex: 1; min-width: 200px; }
.grid-head select { width: auto; }

/* The URL is what the page is for, so it gets its own rail and rides along
   while the sheets scroll past. */
.rail { position: sticky; top: 70px; }
@media (max-width: 1240px) { .rail { position: static; } }
.out { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
.out h2.section { margin: 0; }
.out .url { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
.out code {
	min-width: 0; background: var(--sunk); max-height: 140px; overflow-y: auto;
	border: 1.5px solid var(--line-strong); border-radius: 9px; padding: 9px 10px;
	font: 400 12px/1.5 var(--mono);
	/* Wrapped, not scrolled: in a narrow rail a one-line URL would hide most of
	   itself behind a scrollbar nobody drags. */
	white-space: pre-wrap; overflow-wrap: anywhere;
}
.out .chips { margin-top: 0; }
.out .chips button { flex: 1 1 calc(50% - 3px); }
@media (max-width: 1240px) { .out .chips button { flex: 0 1 auto; } }
.toast {
	position: fixed; left: 50%; bottom: max(24px, calc(env(safe-area-inset-bottom) + 12px));
	transform: translateX(-50%) translateY(8px);
	background: var(--accent); color: var(--on-accent); padding: 8px 14px; border-radius: 999px;
	border: 2px solid var(--ink); font: 600 12.5px/1.4 var(--ui);
	opacity: 0; pointer-events: none; transition: opacity 0.15s, transform 0.15s;
}
.toast[data-show="true"] { opacity: 1; transform: translateX(-50%) translateY(0); }
/* A little keycap: a solid bottom edge reads as depth without a blurred shadow. */
kbd {
	font: 600 11px/1 var(--mono); border: 1.5px solid var(--line-strong); border-bottom-width: 2.5px;
	border-radius: 5px; padding: 3px 5px; color: var(--ink); background: var(--panel);
}
@media (prefers-reduced-motion: reduce) { .toast { transition: none; } }

/* The preview owns its own busy and broken states, so a slow render or a 501
   from the PNG rasteriser is visible instead of an empty box. */
.frame { position: relative; }
.frame[data-state="loading"]::after {
	content: ""; position: absolute; inset: auto 10px 10px auto;
	width: 12px; height: 12px; border-radius: 50%;
	border: 2px solid var(--muted); border-top-color: transparent;
	animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.frame[data-state="error"] #preview { display: none; }
.error {
	display: none; max-width: 320px; text-align: center; color: var(--muted); font-size: 13px;
	padding: 16px; border: 1.5px dashed var(--line-strong); border-radius: 12px; background: var(--panel);
}
.frame[data-state="error"] .error { display: block; }
.error b { display: block; color: var(--ink); margin-bottom: 4px; }
@media (prefers-reduced-motion: reduce) { .frame[data-state="loading"]::after { animation: none; } }

/* API reference tab */
.docs { display: flex; flex-direction: column; gap: 22px; }
.docs h2 { font: 600 11px/1.4 var(--mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; }
.docs p { margin: 0 0 12px; color: var(--muted); max-width: 68ch; }
.docs pre {
	margin: 0; overflow-x: auto; background: var(--sunk); border: 1.5px solid var(--line-strong);
	border-radius: 9px; padding: 10px 12px;
	font: 400 12px/1.7 var(--mono);
}
.docs table { width: 100%; border-collapse: collapse; font-size: 13px; }
.docs th, .docs td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
.docs th { color: var(--muted); font-size: 11px; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 600; }
.docs td:first-child { white-space: nowrap; font: 500 12px/1.5 var(--mono); }
.docs .scroll { overflow-x: auto; }
.docs .tokens { display: flex; flex-wrap: wrap; gap: 6px; }
.docs .tokens code { background: var(--sunk); border: 1.5px solid var(--line-strong); border-radius: 999px; padding: 3px 9px; font: 400 12px/1.5 var(--mono); }

/* Attribution. The page is one long scroll, so the footer gets the same
   cut-out treatment as the panels rather than fading into the background. */
footer {
	display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px 14px;
	max-width: 1680px; margin: 0 auto;
	padding: 4px max(20px, env(safe-area-inset-right)) max(28px, calc(env(safe-area-inset-bottom) + 20px)) max(20px, env(safe-area-inset-left));
	color: var(--muted); font-size: 12.5px; text-align: center;
}
footer .by { display: inline-flex; align-items: center; gap: 5px; }
footer a {
	display: inline-flex; align-items: center; gap: 6px; color: var(--ink); text-decoration: none;
	padding: 6px 11px; background: var(--panel); border: 1.5px solid var(--line-strong); border-radius: 999px;
	font-weight: 600; box-shadow: 2px 2px 0 var(--ink);
	transition: transform 0.08s ease, box-shadow 0.08s ease;
}
footer a svg { width: 14px; height: 14px; flex: none; fill: currentColor; }
@media (hover: hover) { footer a:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ink); border-color: var(--ink); } }
footer a:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--ink); }
footer a:focus-visible { outline: 3px solid var(--grape); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { footer a { transition: none; } }
@media (pointer: coarse) { footer a { padding: 9px 13px; } }

/* Shortcut sheet */
dialog {
	border: 2px solid var(--ink); border-radius: var(--radius); background: var(--panel);
	color: var(--ink); padding: 20px 22px; box-shadow: var(--shadow); max-width: 340px; width: calc(100% - 32px);
}
dialog::backdrop { background: rgba(20, 16, 12, 0.45); }
dialog h2 { margin: 0 0 14px; font: 700 16px/1 var(--display); letter-spacing: -0.01em; }
dialog dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 14px; margin: 0; font-size: 13px; align-items: center; }
dialog dd { margin: 0; color: var(--muted); }
/* Finger-sized on touch. Two things happen here: every control clears the
   ~40px tap target, and the text fields reach 16px, below which iOS Safari
   zooms the page in the moment a field takes focus. */
@media (pointer: coarse) {
	input[type=text], select { font-size: 16px; padding: 10px 12px; }
	select { padding-right: 30px; }
	button { min-height: 40px; padding: 10px 14px; }
	button.icon { min-width: 42px; }
	.seg button { min-height: 40px; padding: 10px 6px; }
	.chips button { min-height: 38px; }
	input[type=range] { height: 34px; }
	input[type=range]::-webkit-slider-thumb { width: 22px; height: 22px; margin-top: -9px; }
	input[type=range]::-moz-range-thumb { width: 22px; height: 22px; }
	input[type=color] { height: 42px; }
	.check { font-size: 14px; }
	.check input { width: 20px; height: 20px; }
	.knobs-toggle-label { padding: 14px 12px; }
	.tile span { padding: 0 8px 9px; }
}
/* The toolbar goes finger-sized only where the row has the width to spare;
   narrower than that the phone rules above keep it to one strip. */
@media (pointer: coarse) and (min-width: 561px) {
	header .actions button { height: 42px; }
	header .actions .icon { width: 42px; height: 42px; }
}
.skip {
	position: absolute; left: -9999px; top: 0; background: var(--accent); color: var(--on-accent);
	padding: 8px 12px; border-radius: 0 0 8px 0; z-index: 10;
}
.skip:focus { left: 0; }
`;

const BODY = String.raw`
<a class="skip" href="#view-preview">Skip to the preview</a>
<header>
	<span class="brand"><span class="logo-badge"><svg class="logo" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><circle cx="6" cy="6" r="3.1" fill="var(--mustard)"/><circle cx="18" cy="6" r="3.1" fill="var(--grape)"/><circle cx="6" cy="18" r="3.1" fill="var(--grape)"/><circle cx="18" cy="18" r="3.1" fill="var(--mustard)"/><circle cx="12" cy="12" r="4.4" fill="var(--brand)"/></svg></span><h1>polkadot</h1></span>
	<span class="tag">every knob is a URL parameter</span>
	<span class="grow"></span>
	<span class="tag keys"><kbd>R</kbd><em>seed</em><kbd>M</kbd><em>motif</em><kbd>P</kbd><em>palette</em><kbd>?</kbd><em>all</em></span>
	<span class="actions">
		<a class="icon" href="https://github.com/TimMikeladze/polkadot" target="_blank" rel="noopener noreferrer" title="Source on GitHub" aria-label="Source on GitHub">
			<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.19c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"/></svg>
		</a>
		<a class="icon" href="https://x.com/linesofcode" target="_blank" rel="noopener noreferrer" title="@linesofcode on X" aria-label="@linesofcode on X">
			<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M12.6 0h2.45l-5.36 6.13L16 16h-4.94l-3.87-5.06L2.77 16H.32l5.73-6.55L0 0h5.06l3.5 4.63L12.6 0Zm-.86 14.54h1.36L4.32 1.38H2.87l8.87 13.16Z"/></svg>
		</a>
		<button type="button" id="keys" class="icon" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">?</button>
		<button type="button" id="theme" class="icon" title="Toggle theme" aria-label="Toggle theme">&#9680;</button>
		<button type="button" id="surprise" class="primary">Surprise me</button>
	</span>
</header>

<div class="wrap">
	<form class="panel" id="knobs" autocomplete="off" onsubmit="return false">
		<input type="checkbox" id="knobsToggle" class="knobs-toggle">
		<label for="knobsToggle" class="knobs-toggle-label"><span>Customize</span><svg class="chev" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" focusable="false"><path d="M5 7l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></label>
		<fieldset>
			<legend><span>Seed</span></legend>
			<label>
				<span>String <b id="designOut"></b></span>
				<span class="seed-row"><input type="text" id="seed" value="polkadot"><button type="button" id="dice" class="icon" title="Random seed" aria-label="Random seed">&#8635;</button></span>
			</label>
		</fieldset>

		<fieldset>
			<legend><span>Type</span></legend>
			<label><span>Title</span><input type="text" id="title" value="" placeholder="none"></label>
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
			<legend><span>Design</span></legend>
			<label><span>Motif</span><select id="motif"></select></label>
			<label><span>Palette</span><select id="palette"></select></label>
			<label><span>Variant</span><span class="seg" id="variant" role="group" aria-label="Variant"></span></label>
			<label><span>Tilt <b id="tiltOut">auto</b></span><input type="range" id="tilt" min="-30" max="30" step="1" value="0"></label>
			<div class="chips">
				<button type="button" data-tilt="auto">Auto tilt</button>
				<button type="button" data-tilt="0">Flat</button>
			</div>
		</fieldset>

		<fieldset>
			<legend><span>Canvas</span></legend>
			<label><span>Width <b id="wOut">600</b></span><input type="range" id="w" min="64" max="2048" step="8" value="600"></label>
			<label><span>Height <b id="hOut">600</b></span><input type="range" id="h" min="64" max="2048" step="8" value="600"></label>
			<div class="chips">
				<button type="button" id="swap">Swap</button>
				<label class="check"><input type="checkbox" id="lock"> lock ratio</label>
			</div>
			<div class="chips" id="presets"></div>
		</fieldset>

		<fieldset>
			<legend><span>Output</span></legend>
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

		<div class="panel view" id="view-preview" aria-labelledby="h-preview">
			<h2 class="section" id="h-preview">Preview</h2>
			<div class="frame" id="frame" data-backdrop="checker" data-state="loading"><img id="preview" alt="preview"><div class="error" role="alert"><b id="errorTitle">That URL did not render</b><span id="errorBody"></span></div></div>
			<div class="meta">
				<span>Rendered <b id="metaSize">&mdash;</b></span>
				<span>Motif <b id="metaMotif">&mdash;</b></span>
				<span>Palette <b id="metaPalette">&mdash;</b></span>
				<span>Variant <b id="metaVariant">&mdash;</b></span>
				<span>Weight <b id="metaWeight">&mdash;</b></span>
			</div>
			<div class="mobileBar">
				<button type="button" id="mobileCopy" class="primary">Copy URL</button>
				<button type="button" id="mobileDownload">Download</button>
			</div>
		</div>

		<div class="panel view" id="view-gallery" aria-labelledby="h-gallery">
			<h2 class="section" id="h-gallery">Gallery</h2>
			<div class="grid-head">
				<p>Random designs, each from its own seed. Click one to adopt it.</p>
				<label class="check"><input type="checkbox" id="galleryLock"> match current design</label>
				<select id="galleryCount"></select>
				<button type="button" id="shuffle">Shuffle</button>
			</div>
			<div class="grid" id="galleryGrid"></div>
		</div>

		<div class="panel view" id="view-motifs" aria-labelledby="h-motifs">
			<h2 class="section" id="h-motifs">Motifs</h2>
			<div class="grid-head"><p>This seed in every motif. Click one to lock it in.</p></div>
			<div class="grid" id="motifGrid"></div>
		</div>

		<div class="panel view" id="view-palettes" aria-labelledby="h-palettes">
			<h2 class="section" id="h-palettes">Palettes</h2>
			<div class="grid-head"><p>This design in every palette.</p></div>
			<div class="grid" id="paletteGrid"></div>
		</div>

		<div class="panel view" id="view-variants" aria-labelledby="h-variants">
			<h2 class="section" id="h-variants">Variants</h2>
			<div class="grid-head"><p>Placement variants of the current motif.</p></div>
			<div class="grid" id="variantGrid"></div>
		</div>

		<div class="panel view docs" id="view-docs" aria-labelledby="h-docs"></div>
	</div>

	<aside class="rail">
		<div class="panel out" aria-labelledby="h-url">
			<h2 class="section" id="h-url">URL</h2>
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
	</aside>
</div>

<footer>
	<span class="by">Made by <b>Tim Mikeladze</b></span>
	<a href="https://github.com/TimMikeladze/polkadot" target="_blank" rel="noopener noreferrer">
		<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.19c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"/></svg>
		GitHub
	</a>
	<a href="https://x.com/linesofcode" target="_blank" rel="noopener noreferrer">
		<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M12.6 0h2.45l-5.36 6.13L16 16h-4.94l-3.87-5.06L2.77 16H.32l5.73-6.55L0 0h5.06l3.5 4.63L12.6 0Zm-.86 14.54h1.36L4.32 1.38H2.87l8.87 13.16Z"/></svg>
		@linesofcode
	</a>
	<a href="https://linesofcode.dev" target="_blank" rel="noopener noreferrer">
		<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm5.42 4.8h-2.1a11.4 11.4 0 0 0-1.13-2.9 6.53 6.53 0 0 1 3.23 2.9ZM8 1.54c.63.75 1.16 1.83 1.5 3.26h-3c.34-1.43.87-2.51 1.5-3.26ZM1.72 9.6a6.5 6.5 0 0 1 0-3.2h2.35a13.9 13.9 0 0 0 0 3.2H1.72Zm.64 1.6h2.1c.24 1.05.6 2.03 1.05 2.9a6.53 6.53 0 0 1-3.15-2.9Zm2.1-6.4h-2.1a6.53 6.53 0 0 1 3.15-2.9c-.45.87-.81 1.85-1.05 2.9ZM8 14.46c-.63-.75-1.16-1.83-1.5-3.26h3c-.34 1.43-.87 2.51-1.5 3.26ZM9.77 9.6H6.23a12.4 12.4 0 0 1 0-3.2h3.54a12.4 12.4 0 0 1 0 3.2Zm.42 4.5c.46-.87.82-1.85 1.06-2.9h2.09a6.53 6.53 0 0 1-3.15 2.9Zm1.74-4.5a13.9 13.9 0 0 0 0-3.2h2.35a6.5 6.5 0 0 1 0 3.2h-2.35Z"/></svg>
		linesofcode.dev
	</a>
</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<dialog id="keysDialog">
	<h2>Keyboard shortcuts</h2>
	<dl>
		<dt><kbd>R</kbd></dt><dd>Random seed</dd>
		<dt><kbd>M</kbd></dt><dd>Random motif</dd>
		<dt><kbd>P</kbd></dt><dd>Random palette</dd>
		<dt><kbd>S</kbd></dt><dd>Surprise me</dd>
		<dt><kbd>C</kbd></dt><dd>Copy the URL</dd>
		<dt><kbd>D</kbd></dt><dd>Download</dd>
		<dt><kbd>&larr;</kbd><kbd>&rarr;</kbd></dt><dd>Step the variant</dd>
		<dt><kbd>1</kbd>&ndash;<kbd>6</kbd></dt><dd>Jump to a section</dd>
		<dt><kbd>?</kbd></dt><dd>This sheet</dd>
	</dl>
	<div class="chips"><button type="button" id="keysClose" class="primary">Close</button></div>
</dialog>
`;

/**
 * The page script. Written without template literals, so it can live inside
 * one, and without a framework: the UI is a state object plus DOM calls.
 */
const SCRIPT = String.raw`
const $ = (id) => document.getElementById(id);
/* Section ids, in page order. Everything renders at once now; the list is what
   the number keys jump to and what a refresh walks. */
const SECTIONS = ['preview', 'gallery', 'motifs', 'palettes', 'variants', 'docs'];
const DEFAULTS = {
	seed: 'polkadot', title: '', subtitle: '', label: '',
	motif: '', palette: '', variant: '', font: '', align: 'left', valign: 'bottom', scrim: 0,
	tx: '', ty: '', textRotate: 0, titleColor: '', subtitleColor: '',
	w: 600, h: 600, format: 'svg', scale: 1, tilt: 'auto',
	backdrop: 'checker', count: 12, lock: false, galleryLock: false,
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
	const merged = Object.assign({}, over || {});
	// A tile may carry its own canvas, so the thumbnail cap is applied to what
	// the tile actually draws rather than to the main preview's size.
	const width = merged.w === undefined ? state.w : merged.w;
	const height = merged.h === undefined ? state.h : merged.h;
	const factor = Math.min(1, 320 / Math.max(width, height));
	return urlFor(Object.assign(merged, {
		format: 'svg', scale: 1,
		w: Math.max(64, Math.round(width * factor)),
		h: Math.max(64, Math.round(height * factor)),
	}));
}

/* ---------- Rendering ---------- */

let pending = 0;
let currentUrl = '';
const dirty = { gallery: true, motifs: true, palettes: true, variants: true, docs: true };

/* One update per ~frame, regardless of how many input events a drag fires. A
   timer rather than requestAnimationFrame: rAF is throttled to a stop in a
   background tab, which would leave the preview stale behind the knobs. */
function schedule() {
	// Anything that asks for a redraw is a knob being turned, so the state is
	// the reader's from here on and worth writing to the hash.
	owned = true;
	if (pending) return;
	pending = setTimeout(function () { pending = 0; apply(); }, 16);
}

function markDirty() {
	for (const key in dirty) { if (key !== 'docs') dirty[key] = true; }
}

function apply() {
	syncKnobs();
	const url = urlFor();
	if (url !== currentUrl) {
		currentUrl = url;
		$('urlOut').textContent = url;
		swapPreview(url);
	}
	refreshSheets();
	saveHash();
}

function swapPreview(url) {
	const preview = $('preview');
	$('frame').dataset.state = 'loading';
	// Decode off-thread and swap only when ready, so dragging a slider never
	// blanks the preview between frames.
	const next = new Image();
	next.src = url;
	next.decode().then(function () {
		// A faster later request may already have won; keep the newest.
		if (currentUrl !== url) return;
		$('frame').dataset.state = 'ready';
		preview.src = url;
		preview.alt = state.label || state.title || state.seed;
		// Drive the box from the ratio, not pixel attributes: a 1768x600 image
		// must scale down whole, not get letter-boxed against a stale height.
		preview.style.aspectRatio = state.w + ' / ' + state.h;
		$('metaSize').textContent = Math.round(state.w) + ' \u00d7 ' + Math.round(state.h) +
			(state.format === 'png' && state.scale > 1 ? ' @' + state.scale + '\u00d7' : '') + ' ' + state.format;
	}).catch(function () {
		// A decode failure is a real answer — usually a 501 from a PNG request on
		// a host without the rasteriser — and it should say so, not sit blank.
		if (currentUrl !== url) return;
		$('frame').dataset.state = 'error';
		fetch(url).then(function (response) {
			return response.text().then(function (text) { return { ok: response.ok, status: response.status, text: text }; });
		}).then(function (result) {
			if (currentUrl !== url) return;
			$('errorTitle').textContent = result.status === 501
				? 'PNG is not available here'
				: 'That URL did not render (' + result.status + ')';
			$('errorBody').textContent = result.status === 501
				? 'This host has no PNG rasteriser. SVG still renders.'
				: (result.text || '').slice(0, 200);
		}).catch(function () {
			if (currentUrl !== url) return;
			$('errorTitle').textContent = 'That URL did not render';
			$('errorBody').textContent = 'The request could not be reached.';
		});
	});
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

/* ---------- Contact sheets ---------- */

/* Every sheet lives on the page at once. Rebuilding them all on a knob change
   is cheap because the tiles are reused and their images are lazy: a sheet
   below the fold updates its src attributes and fetches nothing until it is
   scrolled to. */
function refreshSheets() {
	for (const section of SECTIONS) refreshSheet(section);
}

function refreshSheet(tab) {
	if (tab === 'preview' || !dirty[tab]) return;
	dirty[tab] = false;
	if (tab === 'gallery') {
		fillGrid($('galleryGrid'), gallerySeeds().map(function (seed) {
			// Forcing a motif and a palette makes every tile the same picture with
			// a different hash. Unless the gallery is locked to the current design,
			// each tile drops those knobs and draws whatever its own seed asks for,
			// which is the only thing that makes the sheet worth scrolling.
			const over = { seed: seed };
			if (!state.galleryLock) {
				over.motif = '';
				over.palette = '';
				over.variant = '';
				over.tilt = 'auto';
			}
			return { over: over, text: seed, on: seed === state.seed };
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
	} else if (tab === 'docs') {
		fillDocs();
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
		// A tile with its own canvas shows that canvas, rather than being cropped
		// to the sheet's shared ratio.
		image.style.aspectRatio =
			item.over.w && item.over.h ? item.over.w + ' / ' + item.over.h : '';
		tile.lastChild.textContent = item.text;
		tile.setAttribute('aria-pressed', item.on ? 'true' : 'false');
		tile.dataset.over = JSON.stringify(item.over);
	});
}

/* The API reference, built from the same CONFIG the knobs read, so the list of
   motifs, palettes and fonts can never drift from what the server accepts. */
const PARAMS = [
	['w, h, size', 'Pixels. ~size~ sets both. Capped at the host maximum.', '600'],
	['title', 'Headline printed on the image.', '—'],
	['subtitle', 'Second line under the title. ~artist~ is an alias.', '—'],
	['label', 'Alt text baked into the SVG. Defaults to the title.', 'title'],
	['motif', 'Force the drawing. Otherwise derived from the seed.', 'from seed'],
	['palette', 'Force the colours. Otherwise derived from the seed.', 'from seed'],
	['variant', 'Placement variant, 0–3. Wraps.', 'from seed'],
	['font', 'Type pairing.', 'grotesk'],
	['align', '~left~, ~center~, or ~right~.', 'left'],
	['valign', '~top~, ~middle~, or ~bottom~.', 'bottom'],
	['tx, ty', 'Type position as a fraction of the canvas, 0–1.', 'auto'],
	['textRotate', 'Turn the type block, −180 to 180 degrees.', '0'],
	['color, titleColor, subtitleColor', 'Hex without the ~#~, or a CSS keyword.', 'from palette'],
	['scrim', 'Fade the field up behind the type, 0–1.', 'off'],
	['rotate', '~false~ flattens the motif; a number tilts it, −45 to 45.', 'from seed'],
	['scale', 'PNG pixel density, 1–4.', '1'],
];

function docsSection(heading, body) {
	return '<section><h2>' + heading + '</h2>' + body + '</section>';
}

function tokenList(values) {
	return '<div class="tokens">' + values.map(function (value) {
		return '<code>' + value + '</code>';
	}).join('') + '</div>';
}

let docsBuilt = false;
function fillDocs() {
	if (docsBuilt) return;
	docsBuilt = true;
	const origin = location.origin + CONFIG.base;
	$('view-docs').innerHTML =
		docsSection('Endpoint',
			'<p>Every image is a GET. The URL is the whole cache key, answers carry a strong <code>ETag</code>, and the same URL renders the same image forever.</p>' +
			'<pre>GET ' + origin + '/{seed}.svg\nGET ' + origin + '/{seed}.png</pre>') +
		docsSection('Parameters',
			'<div class="scroll"><table><thead><tr><th>Name</th><th>What it does</th><th>Default</th></tr></thead><tbody>' +
			PARAMS.map(function (row) {
				return '<tr><td>' + row[0] + '</td><td>' + row[1].replace(/~([^~]+)~/g, '<code>$1</code>') +
					'</td><td>' + row[2] + '</td></tr>';
			}).join('') + '</tbody></table></div>') +
		docsSection('Motifs', tokenList(CONFIG.motifs)) +
		docsSection('Palettes', tokenList(CONFIG.palettes.map(function (palette) { return palette.name; }))) +
		docsSection('Fonts', tokenList(CONFIG.fonts)) +
		docsSection('In a page',
			'<pre>&lt;img src="' + origin + '/album-42.svg?w=1200&amp;h=630&amp;title=Hello" width="1200" height="630" alt="Hello"&gt;</pre>') +
		docsSection('As a library',
			'<pre>import { renderSvg } from \'polkadot.sh\';\n\nconst svg = renderSvg({ seed: \'album-42\', width: 600, title: \'Hello\' });</pre>') +
		docsSection('Machine-readable',
			'<p>The same root answers JSON to anything that does not ask for HTML.</p>' +
			'<pre>curl -H \'accept: application/json\' ' + (origin || location.origin) + '/</pre>');
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

function jumpTo(section) {
	const view = $('view-' + section);
	if (view) view.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
	$('galleryLock').checked = state.galleryLock === true;
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
/* False until the reader touches something. The page opens on a random seed,
   and writing that seed to the hash would pin every later reload to the same
   picture — the one thing a fresh visit must not do. */
let owned = false;
function saveHash() {
	if (!owned) return;
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
	return found;
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
	fontSelect.append(new Option('default (grotesk)', ''));
	for (const font of CONFIG.fonts) {
		const option = new Option(font, font);
		// Preview the pairing in the menu: the name of a face says much less
		// than the face itself.
		if (CONFIG.fontStacks[font]) option.style.fontFamily = CONFIG.fontStacks[font];
		fontSelect.append(option);
	}

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
$('lock').addEventListener('change', function () { state.lock = $('lock').checked; ratio = state.w / state.h; owned = true; saveHash(); });
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
function newSeed() { return Math.random().toString(36).slice(2, 10); }
function randomSeed() { state.seed = newSeed(); markDirty(); schedule(); }

$('dice').addEventListener('click', randomSeed);
$('shuffle').addEventListener('click', function () { gallerySalt++; dirty.gallery = true; refreshSheet('gallery'); });
$('galleryLock').addEventListener('change', function () {
	state.galleryLock = $('galleryLock').checked;
	dirty.gallery = true;
	refreshSheet('gallery');
	owned = true;
	saveHash();
});
$('galleryCount').addEventListener('change', function () {
	state.count = Number($('galleryCount').value);
	dirty.gallery = true;
	refreshSheet('gallery');
	owned = true;
	saveHash();
});
function surprise() {
	state.seed = newSeed();
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
}
$('surprise').addEventListener('click', surprise);
$('mobileDownload').addEventListener('click', download);
$('mobileCopy').addEventListener('click', function () { copy(absolute(currentUrl), 'URL copied'); });
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
	try { localStorage.setItem('polkadot-theme', document.documentElement.dataset.theme); } catch (error) {}
});

$('keys').addEventListener('click', function () { $('keysDialog').showModal(); });
$('keysClose').addEventListener('click', function () { $('keysDialog').close(); });

document.addEventListener('keydown', function (event) {
	const tag = (event.target.tagName || '').toLowerCase();
	if (tag === 'input' || tag === 'select' || tag === 'textarea' || event.metaKey || event.ctrlKey || event.altKey) return;
	// While the shortcut sheet is up, the only shortcut left is closing it —
	// the dialog handles Escape itself.
	if ($('keysDialog').open) return;
	const key = event.key.toLowerCase();
	if (event.key === '?') $('keysDialog').showModal();
	else if (key >= '1' && key <= String(SECTIONS.length) && SECTIONS[Number(key) - 1]) jumpTo(SECTIONS[Number(key) - 1]);
	else if (key === 's') $('surprise').click();
	else if (key === 'c') copy(absolute(currentUrl), 'URL copied');
	else if (key === 'd') download();
	else if (key === 'r') randomSeed();
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
	const saved = localStorage.getItem('polkadot-theme');
	if (saved) document.documentElement.dataset.theme = saved;
} catch (error) {}

/* A pasted link changes the hash without reloading the document, and
   history.replaceState never fires this, so the only events here are real
   navigations. */
addEventListener('hashchange', function () {
	loadHash();
	markDirty();
	schedule();
});

/* A link with state in it has to reproduce exactly; a bare visit does not, so
   it opens on a seed and a contact sheet nobody has seen before. */
if (!loadHash()) state.seed = newSeed();
gallerySalt = 1 + Math.floor(Math.random() * 9973);
fillDocs();
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
const PAGE_TITLE = 'polkadot: deterministic placeholder images from a seed';
const PAGE_DESCRIPTION =
	'Generative placeholder images from a seed string. Twelve palettes, 28 motifs, SVG or PNG from one URL. Same seed, same picture, every time: no dependencies, no network, no stored assets.';
const OG_IMAGE_ALT =
	'Six polkadot placeholder images beside the polkadot wordmark and an example image URL';

/** Escape a value for an HTML attribute or text node. */
function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function playgroundHtml(options: PlaygroundOptions = {}): string {
	const base = (options.basePath ?? '').replace(/\/+$/, '');
	// `display=swap`, so the page is readable on the system stacks before the
	// web fonts land — and stays readable if they never do.
	const fonts =
		options.webfonts === false
			? ''
			: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Baloo+2:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
`;
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
		// The title stack of each pairing, so the font menu can show every option
		// set in its own face.
		fontStacks: Object.fromEntries(FONT_NAMES.map((name) => [name, FONTS[name]?.title ?? ''])),
		variants: VARIANTS,
		presets: PRESETS,
	})
		// The config is inlined into a <script>, so a palette named `</script>`
		// must not be able to close it.
		.replace(/</g, '\\u003c');

	// Crawlers will not resolve a relative image, and Twitter and LinkedIn drop
	// an SVG outright, so the card points at a static PNG on an absolute origin.
	// Without a known origin the social tags are left out rather than emitted
	// broken.
	const site = (options.siteUrl ?? '').replace(/\/+$/, '');
	const social = site
		? `<link rel="canonical" href="${site}${base || '/'}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="polkadot">
<meta property="og:title" content="${escapeHtml(PAGE_TITLE)}">
<meta property="og:description" content="${escapeHtml(PAGE_DESCRIPTION)}">
<meta property="og:url" content="${site}${base || '/'}">
<meta property="og:image" content="${site}${base}/og.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(PAGE_TITLE)}">
<meta name="twitter:description" content="${escapeHtml(PAGE_DESCRIPTION)}">
<meta name="twitter:image" content="${site}${base}/og.png">
<meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}">
<script type="application/ld+json">${JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'SoftwareApplication',
				name: 'polkadot',
				description: PAGE_DESCRIPTION,
				url: `${site}${base || '/'}`,
				image: `${site}${base}/og.png`,
				applicationCategory: 'DeveloperApplication',
				operatingSystem: 'Any',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
			}).replace(/</g, '\\u003c')}</script>
`
		: '';

	// The tracker is the one asset the page loads that is not its own type, and
	// it is opt-in: with no website ID configured nothing is emitted at all.
	const analytics = options.analytics?.websiteId
		? `<script defer src="${escapeHtml(options.analytics.scriptUrl ?? UMAMI_CLOUD_SCRIPT)}" data-website-id="${escapeHtml(options.analytics.websiteId)}"${
				options.analytics.domains ? ` data-domains="${escapeHtml(options.analytics.domains)}"` : ''
			}></script>
`
		: '';

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(PAGE_TITLE)}</title>
<meta name="description" content="${escapeHtml(PAGE_DESCRIPTION)}">
<link rel="icon" href="${base}/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">
<meta name="theme-color" content="#f2ebda" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#201a14" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
${social}${fonts}${analytics}
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
