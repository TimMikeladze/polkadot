# polkadot

Deterministic generative placeholder images from a seed string. Zero dependencies, no network, no stored assets — the same seed always produces the same image, on every device and in every runtime.

Hosted at **[polkadot.sh](https://polkadot.sh)** — try `https://polkadot.sh/album-42.svg?title=Lahai`.

Use it inline as a library, or link out to a URL and let the endpoint render it.

- **12 palettes × 18 motifs × 4 variants × 9 tilts** — 7,776 combinations, 216 distinct palette/motif buckets at thumbnail size
- **Knobs, not guesswork** — force the motif, palette, variant, tilt, type pairing, alignment, and a legibility scrim, from code or from the URL
- **A playground** — the server root is a knob-driven page with contact sheets for every motif, palette, and variant
- **SVG** — pure string output, synchronous, no dependencies
- **PNG** — same drawing rasterised, via the optional `@resvg/resvg-js`
- **HTTP** — a `fetch` handler that works under Bun, Deno, Workers, and Next.js route handlers

## Installation

```bash
bun add polkadot
# optional, only for PNG output
bun add @resvg/resvg-js
```

## Usage

### SVG

```typescript
import { renderSvg, renderDataUri } from 'polkadot';

const svg = renderSvg({ seed: 'album-42', width: 600 });

// With type printed on the image
const cover = renderSvg({
	seed: 'album-42',
	width: 600,
	title: 'Process of Elimination',
	subtitle: 'Sampha',
});

// Every derived choice can be forced, and the type block placed
const art = renderSvg({
	seed: 'album-42',
	width: 1200,
	height: 630,
	title: 'Process of Elimination',
	motif: 'waves',
	palette: 'cobalt',
	variant: 2, // 0-3, wraps
	rotation: -6, // degrees; `rotate: false` flattens instead
	font: 'mono', // serif | sans | mono | display | rounded | slab | grotesk | humanist
	align: 'center',
	scrim: 0.7, // fade the field up behind the type so it stays legible
});

// The type block can go anywhere, at any angle, in any colour
const poster = renderSvg({
	seed: 'album-42',
	width: 800,
	height: 1000,
	title: 'Northern Line',
	subtitle: 'late edition',
	valign: 'middle', // top | middle | bottom
	textX: 0.5, // fractions of the canvas, so one URL scales
	textY: 0.4,
	textRotation: -8, // degrees, turned around the anchor
	titleColor: '#ffd166',
	subtitleColor: 'rebeccapurple',
});

// Ready for src / background-image
const uri = renderDataUri({ seed: 'album-42', width: 240 });
```

In React:

```tsx
<div dangerouslySetInnerHTML={{ __html: renderSvg({ seed: album.id, width: 400 }) }} />
// or
<img src={renderDataUri({ seed: album.id, width: 400 })} alt={album.title} />
```

### PNG

```typescript
import { renderPng } from 'polkadot';

const png = await renderPng({
	seed: 'album-42',
	width: 1200,
	height: 630,
	title: 'Process of Elimination',
	scale: 2, // renders at 2400px wide
});
```

Requires `@resvg/resvg-js`. Because it rasterises the exact SVG the library produces, an OG card and the inline image are literally the same artwork.

### HTTP endpoint

```bash
bunx polkadot --port 3000
```

```
http://localhost:3000/album-42.svg?size=600&title=Lahai&subtitle=Sampha
http://localhost:3000/album-42.png?w=1200&h=630&scale=2
```

Mount it inside an existing app:

```typescript
import { createHandler } from 'polkadot';

const handler = createHandler({ basePath: '/img', maxSize: 2048 });

// Bun / Deno / Workers
export default { fetch: handler };

// Next.js app router — app/img/[...seed]/route.ts
export const GET = handler;
```

Or programmatically with Bun:

```typescript
import { serve } from 'polkadot/server';

const server = serve({ port: 3000, basePath: '/img' });
console.log(server.url);
server.stop();
```

#### Query parameters

| Param                | Meaning                                      |
| -------------------- | -------------------------------------------- |
| `w`, `width`         | Output width in pixels (default 600)         |
| `h`, `height`        | Output height (defaults to the width)        |
| `size`, `s`          | Sets both dimensions                         |
| `title`              | Large line printed at the bottom             |
| `subtitle`, `artist` | Small uppercase line above the title         |
| `label`              | Accessible label; defaults to title/subtitle |
| `motif`              | Force one of the motifs below                |
| `palette`            | Force a palette by name                      |
| `variant`, `v`       | Force a placement variant, 0–3 (wraps)       |
| `font`               | Type pairing: `serif`…`slab`                 |
| `align`              | `left` (default), `center`, `right`          |
| `valign`             | `bottom` (default), `middle`, `top`          |
| `tx`, `ty`           | Type anchor as a 0–1 fraction of the canvas  |
| `textRotate`         | Turn the type block, in degrees              |
| `color`              | Type colour; bare hex is fine (`ff3300`)     |
| `titleColor`         | Title colour, overriding `color`             |
| `subtitleColor`      | Subtitle colour, overriding `color`          |
| `scrim`              | Legibility fade, `scrim` or `scrim=0.6`      |
| `scale`, `dpr`       | Pixel density for PNG, 1–4                   |
| `rotate`             | `false` to flatten, or a tilt in degrees     |

`GET /` (or the base path) serves the playground to a browser, and the JSON usage document — including the live motif and palette lists — to everything else. The switch is the `Accept` header, so `curl` still sees JSON. Pass `playground: false` to always serve JSON.

#### Playground

Open the server root in a browser and the same endpoint serves a knob-driven page instead of JSON:

```bash
bunx polkadot --port 3000
open http://localhost:3000/
```

- **Every knob**: seed, title, subtitle, alt text, font pairing, horizontal and vertical alignment, free X/Y placement, text rotation, per-line colours, scrim, motif, palette, variant, tilt, width, height, ratio lock, canvas presets (avatar, OG card, banner, story…), format, PNG scale, and preview backdrop
- **One page, no tabs**: preview, gallery, motifs, palettes, variants, and the API reference are all on the page at once — every sheet updates with the knobs, and the tiles below the fold fetch nothing until you scroll to them
- **Copy as**: URL, absolute URL, Markdown, `<img>`, CSS `background-image`, raw SVG source, or a `data:` URI, and a one-click download
- **Shareable state**: the knobs live in the page's hash, so a pasted link reopens the exact design
- **API reference**: a section listing every parameter, motif, palette, and font, built from the same config the server validates against
- **Honest states**: the preview shows when it is rendering, and says what went wrong when a URL does not render — a `501` from a host without the PNG rasteriser reads as exactly that
- **Keyboard**: `R` reseeds, `M` and `P` jump to a random motif or palette, `S` surprises, `C` copies, `D` downloads, `←`/`→` walk the variants, `1`–`6` jump to a section, and `?` opens the shortcut sheet

It is deliberately boring under the hood: every preview is an `<img>` on the same immutable-cached URL the API serves, so revisiting a knob position is a browser cache hit. Knob changes are coalesced to one update per ~16ms, the main preview is decoded off-thread and swapped in only once ready, and contact sheets fill lazily, reuse their tiles, and always request small SVGs — a 48-tile sheet costs less than one full-size PNG.

Serve the page from your own routes with `playgroundHtml({ basePath, palettes, maxSize })`, which returns a single HTML string with no build step. Its own type — Inter Tight for text, Space Grotesk for the wordmark and headings, JetBrains Mono for values and code — comes from Google Fonts with `display=swap`, so the page is readable on system stacks before the fonts land and stays readable if they never do. That link is the page's only external asset; `webfonts: false` drops it, on `playgroundHtml` or on `createHandler`, leaving a page that loads nothing off-site. `createHandler({ playground: false })` turns the page off entirely.

#### Deploying to Vercel

The repo deploys itself: `vercel.json` rewrites every path to `api/index.ts`, which mounts `createHandler()` at the root. `bun run build` produces the `dist/` the function imports, so the deployed code is the code the package publishes.

```bash
vercel link
vercel --prod
```

PNG needs the native rasteriser in the function bundle, which is why `api/index.ts` imports `@resvg/resvg-js` by name — `png.ts` loads it through an indirect specifier, and a file tracer cannot see through that.

Because output depends only on the URL and the configured palettes, responses carry a strong `ETag` and answer `304` to a matching `If-None-Match`, alongside a one-year immutable `Cache-Control`. `HEAD` is supported; anything other than `GET`/`HEAD` gets a `405`.

Sizes are clamped to `maxSize` (default 2048) and unknown motifs are ignored, so a hostile URL cannot ask for a 20000px render. The clamp counts rasterised pixels, so `?w=2048&scale=4` is capped rather than rendering at 8192px. A base path only matches at a segment boundary — `/imgevil.svg` will not hit an `/img` mount.

### Motifs and palettes

```typescript
import { MOTIFS, PALETTES, design } from 'polkadot';

MOTIFS;
// rings, sun, split, grid, waves, arch, bands, orbit, prism,
// halftone, horizon, lattice, bloom, stack, beam, pebbles,
// chevron, eclipse

PALETTES.map((p) => p.name);
// vermilion, forest, midnight, rust, plum, tide,
// press, cobalt, clay, dusk, coral, moss

// Inspect the choice without rendering
design('album-42');
// { palette, motif, variant, rotation, isDarkField }
```

Bring your own colours — palettes are inputs, not constants:

```typescript
const brand = [
	{
		name: 'brand',
		field: '#0b0b0f',
		mark: '#ff4d3d',
		shade: '#3a3f57',
		spark: '#ffd166',
		type: '#f5f5f7',
		dark: true,
	},
];

renderSvg({ seed: 'x', palettes: brand });
createHandler({ palettes: brand });
```

Colours land in SVG attribute values, so quotes and angle brackets are stripped before output — a palette built from user-supplied data cannot break out of its attribute.

### Type

```typescript
import { FONTS, FONT_NAMES } from 'polkadot';

FONT_NAMES; // serif, sans, mono, display, rounded, slab, grotesk, humanist
FONTS.mono; // { title, subtitle, advance } — plain CSS font stacks
```

Eight pairings: an old-style book serif (`serif`), a neutral grotesque (`sans`), a code face (`mono`), a high-contrast didone (`display`), a soft geometric (`rounded`), an editorial slab (`slab`), a wide poster geometric (`grotesk`, the default), and a calligraphic humanist sans (`humanist`).

Every stack is built from fonts that ship with common desktops: an SVG is rendered by whoever opens it, and the PNG rasteriser only sees installed system fonts, so there is no web font to load. Each one ends with the Liberation/DejaVu names a Linux server actually has and then a generic family, so a missing face degrades to the right _shape_ rather than to the renderer's single default. `advance` is the face's average glyph width in ems — a string renderer cannot measure text, so line breaking counts with that instead of one shared guess, and a mono or geometric title wraps before it runs past the edge. Pass `titleFont` / `subtitleFont` to override a stack outright.

A busy motif can swallow a title — `beam` and `bands` fill most of the canvas with the mark colour. `scrim` fades the field colour up behind the type block to fix that, either as a switch (`scrim: true`, 0.85) or a strength (`scrim: 0.6`).

Placement is a block, not a pair of loose lines: `align` and `valign` set which corner or edge it sits against, `textX`/`textY` override that with plain 0–1 fractions of the canvas, and `textRotation` turns the whole block around that same anchor — so turning the type never slides it out of position. Colours default to the palette's `type`; `titleColor` and `subtitleColor` take any CSS colour and are stripped of quotes and brackets before they reach an attribute. The scrim stays axis-aligned even when the type is turned, because a tilted gradient reads as a rendering bug rather than a choice.

### Avatars

```typescript
import { initials, seedColors } from 'polkadot';

initials('Sampha Sisay'); // "SS"
seedColors('user-7'); // { background, text }
```

## How it works

A 32-bit FNV-1a hash of the seed, sliced into separate bit ranges to pick a palette, a motif, a variant, and a rotation. Distinct ranges mean the choices are uncorrelated. Motifs that need continuous variation (dot radii, wave amplitudes) draw from a seeded xorshift32 stream. Everything is drawn into a 120×120 viewBox and scaled by the outer `<svg>`, so non-square output crops rather than stretches.

Collision note: at 216 perceptual buckets there is a ~50% chance of two lookalikes by the 17th seed. For catalogs beyond a few hundred items, treat this as a fallback rather than a primary identity system.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
