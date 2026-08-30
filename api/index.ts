// `png.ts` reaches the rasteriser through an indirect specifier so the library
// dependency can stay optional. Vercel's file tracer cannot see through that,
// so name it once here to pull the native binary into the function bundle.
import '@resvg/resvg-js';
import { existsSync } from 'node:fs';
import { createHandler } from '../dist/index.js';

/**
 * The whole site is one function: the handler owns the playground at `/` and
 * every `/{seed}.svg|png` below it. `vercel.json` rewrites all paths here.
 *
 * It imports the build output rather than `src/`, so the deployed code is the
 * same code the package publishes.
 */

/**
 * The runtime image ships no fonts, and resvg draws nothing at all rather than
 * substituting, so without this every titled PNG would come back as artwork
 * with the type silently missing. `vercel.json` carries `fonts/` into the
 * bundle; the candidates cover both the traced layout and a plain `cwd` run.
 */
const fontDirs = [new URL('../fonts', import.meta.url).pathname, `${process.cwd()}/fonts`].filter(
	(dir) => existsSync(dir),
);

/**
 * Analytics is configuration, not code: the tag is only emitted when the
 * deployment carries a website ID, so local runs, forks and previews of this
 * repo serve a page with no tracker on it.
 */
const websiteId = process.env.UMAMI_WEBSITE_ID;
const analytics = websiteId
	? { websiteId, scriptUrl: process.env.UMAMI_SCRIPT_URL, domains: process.env.UMAMI_DOMAINS }
	: undefined;

const handler = createHandler({
	analytics,
	// Vercel caches on the URL, and so does the browser; the output is a pure
	// function of that URL, so a year is safe.
	cacheControl: 'public, max-age=31536000, s-maxage=31536000, immutable',
	fonts: { fontDirs, defaultFontFamily: 'Inter' },
	siteUrl: 'https://polkadot.sh',
});

export const GET = handler;
export const HEAD = handler;
