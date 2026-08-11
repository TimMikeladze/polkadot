# placeholder-images

Deterministic generative placeholder images from a seed string. Zero dependencies, no network, no stored assets — the same seed always produces the same image, on every device and in every runtime.

Use it inline as a library, or link out to a URL and let the endpoint render it.

- **12 palettes × 12 motifs × 4 variants × 9 tilts** — 5,184 combinations, 144 distinct palette/motif buckets at thumbnail size
- **SVG** — pure string output, synchronous, no dependencies
- **PNG** — same drawing rasterised, via the optional `@resvg/resvg-js`
- **HTTP** — a `fetch` handler that works under Bun, Deno, Workers, and Next.js route handlers

## Installation

```bash
bun add placeholder-images
# optional, only for PNG output
bun add @resvg/resvg-js
```

## Usage

### SVG

```typescript
import { renderSvg, renderDataUri } from 'placeholder-images';

const svg = renderSvg({ seed: 'album-42', width: 600 });

// With type printed on the image
const cover = renderSvg({
	seed: 'album-42',
	width: 600,
	title: 'Process of Elimination',
	subtitle: 'Sampha',
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
import { renderPng } from 'placeholder-images';

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
bunx placeholder-images --port 3000
```

```
http://localhost:3000/album-42.svg?size=600&title=Lahai&subtitle=Sampha
http://localhost:3000/album-42.png?w=1200&h=630&scale=2
```

Mount it inside an existing app:

```typescript
import { createHandler } from 'placeholder-images';

const handler = createHandler({ basePath: '/img', maxSize: 2048 });

// Bun / Deno / Workers
export default { fetch: handler };

// Next.js app router — app/img/[...seed]/route.ts
export const GET = handler;
```

Or programmatically with Bun:

```typescript
import { serve } from 'placeholder-images/server';

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
| `scale`, `dpr`       | Pixel density for PNG, 1–4                   |
| `rotate=false`       | Disable the sub-degree tilt                  |

`GET /` (or the base path) returns the usage document, including the live motif and palette lists.

Because output depends only on the URL and the configured palettes, responses carry a strong `ETag` and answer `304` to a matching `If-None-Match`, alongside a one-year immutable `Cache-Control`. `HEAD` is supported; anything other than `GET`/`HEAD` gets a `405`.

Sizes are clamped to `maxSize` (default 2048) and unknown motifs are ignored, so a hostile URL cannot ask for a 20000px render. The clamp counts rasterised pixels, so `?w=2048&scale=4` is capped rather than rendering at 8192px. A base path only matches at a segment boundary — `/imgevil.svg` will not hit an `/img` mount.

### Motifs and palettes

```typescript
import { MOTIFS, PALETTES, design } from 'placeholder-images';

MOTIFS;
// rings, sun, split, grid, waves, arch, bands, orbit,
// prism, halftone, horizon, eclipse

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

### Avatars

```typescript
import { initials, seedColors } from 'placeholder-images';

initials('Sampha Sisay'); // "SS"
seedColors('user-7'); // { background, text }
```

## How it works

A 32-bit FNV-1a hash of the seed, sliced into separate bit ranges to pick a palette, a motif, a variant, and a rotation. Distinct ranges mean the choices are uncorrelated. Motifs that need continuous variation (dot radii, wave amplitudes) draw from a seeded xorshift32 stream. Everything is drawn into a 120×120 viewBox and scaled by the outer `<svg>`, so non-square output crops rather than stretches.

Collision note: at 144 perceptual buckets there is a ~50% chance of two lookalikes by the 14th seed. For catalogs beyond a few hundred items, treat this as a fallback rather than a primary identity system.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
