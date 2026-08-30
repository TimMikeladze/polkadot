import { hashSeed, MOTIFS, type Motif } from './design.ts';
import { FONT_NAMES } from './fonts.ts';
import { PALETTES, type Palette } from './palettes.ts';
import { playgroundHtml, type PlaygroundAnalytics } from './playground.ts';
import { renderPng, type PngFontOptions } from './png.ts';
import { renderSvg, type SvgOptions } from './svg.ts';

export type HandlerOptions = {
	/** Path prefix the handler is mounted under, e.g. `/img`. */
	basePath?: string;
	/** Palette set offered to requests. Defaults to the built-in twelve. */
	palettes?: Palette[];
	/** Largest accepted `w`/`h`, to stop a URL asking for a 20000px PNG. */
	maxSize?: number;
	/** `Cache-Control` for successful responses. */
	cacheControl?: string;
	/** Serve the knob-driven HTML playground at the mount root. Default true. */
	playground?: boolean;
	/**
	 * Let the playground load its own type from Google Fonts. Default true;
	 * `false` keeps the page free of every external asset.
	 */
	webfonts?: boolean;
	/**
	 * Where the PNG rasteriser looks for type. A host with no installed fonts
	 * draws no text at all, so a deployment that wants titles on its PNGs has to
	 * point this at real font files.
	 */
	fonts?: PngFontOptions;
	/** Absolute origin used for the playground's canonical and social tags. */
	siteUrl?: string;
	/**
	 * Umami analytics for the playground page. Passed straight through; with no
	 * website ID the page carries no tracker.
	 */
	analytics?: PlaygroundAnalytics;
};

const DEFAULT_MAX_SIZE = 2048;
const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

function clamp(value: number, max: number): number {
	return Math.min(max, Math.max(1, Math.round(value)));
}

/**
 * A colour from a URL. Hex may arrive without its `#`, since a raw `#` ends the
 * query string, and anything that is not a hex triplet or a bare CSS keyword is
 * dropped rather than passed through to an attribute.
 */
function colorParam(params: URLSearchParams, ...names: string[]): string | undefined {
	for (const name of names) {
		const raw = params.get(name)?.trim();
		if (!raw) continue;
		if (/^#?[0-9a-f]{3,8}$/i.test(raw)) return raw.startsWith('#') ? raw : `#${raw}`;
		if (/^[a-z]{3,20}$/i.test(raw)) return raw.toLowerCase();
	}
	return undefined;
}

function numberParam(params: URLSearchParams, ...names: string[]): number | undefined {
	for (const name of names) {
		const raw = params.get(name)?.trim();
		// `?w=` is an absent width, not a zero one.
		if (!raw) continue;
		const parsed = Number(raw);
		if (Number.isFinite(parsed)) return parsed;
	}
	return undefined;
}

export type ParsedRequest = {
	format: 'svg' | 'png';
	options: SvgOptions & { scale?: number };
};

/**
 * Turn `/my-seed.png?w=800&title=Hello` into render options. Returns null when
 * the path does not look like an image request, so a host app can fall through
 * to its own routes.
 */
export function parseImageRequest(url: URL, options: HandlerOptions = {}): ParsedRequest | null {
	const basePath = (options.basePath ?? '').replace(/\/+$/, '');
	let path: string;
	try {
		path = decodeURIComponent(url.pathname);
	} catch {
		// A malformed percent-escape is not an image request, not a crash.
		return null;
	}
	if (basePath) {
		// `/imgfoo.svg` must not match a `/img` mount, so the prefix has to end
		// at a segment boundary.
		if (path !== basePath && !path.startsWith(`${basePath}/`)) return null;
		path = path.slice(basePath.length);
	}
	path = path.replace(/^\/+/, '');
	if (!path) return null;

	const match = /^(.+)\.(svg|png)$/i.exec(path);
	const format = (match ? match[2]?.toLowerCase() : 'svg') as 'svg' | 'png';
	const seed = match ? (match[1] as string) : path;
	if (!seed) return null;

	const params = url.searchParams;
	const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
	const size = numberParam(params, 'size', 's');
	const width = clamp(numberParam(params, 'w', 'width') ?? size ?? 600, maxSize);
	const height = clamp(numberParam(params, 'h', 'height') ?? size ?? width, maxSize);

	const motif = params.get('motif') ?? undefined;
	const palette = params.get('palette') ?? undefined;
	const font = params.get('font') ?? undefined;
	const align = params.get('align') ?? undefined;
	const rotate = params.get('rotate');
	// `rotate` is a boolean by history and a number by request: `rotate=false`
	// flattens, `rotate=12` tilts by twelve degrees, anything else keeps the
	// seed's own tilt.
	const rotation = rotate && rotate !== 'false' ? numberParam(params, 'rotate') : undefined;
	const scrim = params.get('scrim');
	const valign = params.get('valign') ?? undefined;
	const textRotation = numberParam(params, 'textRotate', 'trotate');

	return {
		format,
		options: {
			seed,
			width,
			height,
			title: params.get('title') ?? undefined,
			subtitle: params.get('subtitle') ?? params.get('artist') ?? undefined,
			label: params.get('label') ?? undefined,
			motif: MOTIFS.includes(motif as Motif) ? motif : undefined,
			palette,
			palettes: options.palettes ?? PALETTES,
			variant: numberParam(params, 'variant', 'v'),
			font: font && FONT_NAMES.includes(font) ? font : undefined,
			align: align === 'center' || align === 'right' ? align : undefined,
			valign: valign === 'top' || valign === 'middle' ? valign : undefined,
			// Fractions of the canvas, so the same URL places the type identically
			// at every size.
			textX: numberParam(params, 'tx', 'textX'),
			textY: numberParam(params, 'ty', 'textY'),
			textRotation:
				textRotation === undefined ? undefined : Math.max(-180, Math.min(180, textRotation)),
			titleColor: colorParam(params, 'titleColor', 'color'),
			subtitleColor: colorParam(params, 'subtitleColor', 'color'),
			// `scrim` reads as a switch or a strength: `scrim`, `scrim=true` and
			// `scrim=0.6` all mean something, `scrim=false` and `scrim=0` mean off.
			scrim:
				scrim === null || scrim === 'false'
					? undefined
					: scrim === '' || scrim === 'true'
						? true
						: Math.max(0, Math.min(1, Number(scrim) || 0)) || undefined,
			rotate: rotate !== 'false',
			rotation: rotation !== undefined ? Math.max(-45, Math.min(45, rotation)) : undefined,
			// `maxSize` caps rasterised pixels, not just the nominal width, so
			// `?w=2048&scale=4` cannot ask for an 8192px PNG.
			scale: Math.min(4, maxSize / width, Math.max(1, numberParam(params, 'scale', 'dpr') ?? 1)),
		},
	};
}

/**
 * A `fetch`-style handler. Works under Bun.serve, Deno, Cloudflare Workers, and
 * any Web-standard runtime — except PNG, which needs a native rasteriser and so
 * answers 501 where `@resvg/resvg-js` cannot load.
 */
export function createHandler(
	options: HandlerOptions = {},
): (request: Request) => Promise<Response> {
	const cacheControl = options.cacheControl ?? DEFAULT_CACHE_CONTROL;

	const basePath = (options.basePath ?? '').replace(/\/+$/, '');
	// The page's canonical and social tags need the absolute origin, which is
	// only known per request unless the caller configured one. Keyed by origin
	// and capped, so a spoofed `Host` cannot grow the cache without bound.
	const pages = new Map<string, string>();

	// Palettes are part of the output, so they belong in the cache key. Without
	// this, changing a brand colour would serve 304 to every client still
	// holding the old image under a `max-age=31536000` policy.
	const configTag = hashSeed(
		(options.palettes ?? PALETTES)
			.map(
				(entry) =>
					`${entry.name}:${entry.field}${entry.mark}${entry.shade}${entry.spark}${entry.type}`,
			)
			.join('|'),
	).toString(36);

	const respond = (
		request: Request,
		body: string | Uint8Array,
		contentType: string,
		etag: string,
	): Response => {
		// Output depends only on the URL, so the URL is the whole cache key.
		if (request.headers.get('if-none-match') === etag) {
			return new Response(null, { status: 304, headers: { etag, 'cache-control': cacheControl } });
		}
		// A HEAD answer carries the headers its GET would, `content-length`
		// included — that is the whole point of asking for one.
		const length =
			typeof body === 'string' ? new TextEncoder().encode(body).byteLength : body.byteLength;
		return new Response(request.method === 'HEAD' ? null : (body as BodyInit), {
			headers: {
				'content-type': contentType,
				'cache-control': cacheControl,
				'content-length': String(length),
				etag,
			},
		});
	};

	return async (request: Request): Promise<Response> => {
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			return new Response('Method not allowed', {
				status: 405,
				headers: { allow: 'GET, HEAD' },
			});
		}

		const url = new URL(request.url);
		const root = url.pathname.replace(/\/+$/, '') || '/';

		if (root === (basePath || '/')) {
			// The page is the default, and JSON has to be asked for. Social crawlers
			// send `Accept: */*` — answering those with the usage document served
			// them a body with no meta tags in it, so every shared link previewed
			// as a bare URL. `?format=json` is the switch that needs no header.
			const accept = request.headers.get('accept') ?? '';
			const wantsJson =
				url.searchParams.get('format') === 'json' ||
				(accept.includes('application/json') && !accept.includes('text/html'));
			if (options.playground !== false && !wantsJson) {
				// The page is static for a given config and origin, so build it once.
				const siteUrl = options.siteUrl ?? url.origin;
				let page = pages.get(siteUrl);
				if (page === undefined) {
					page = playgroundHtml({ ...options, siteUrl });
					if (pages.size < 8) pages.set(siteUrl, page);
				}
				return new Response(request.method === 'HEAD' ? null : page, {
					headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' },
				});
			}
			return Response.json({
				usage: '/{seed}.svg or /{seed}.png',
				params: [
					'w, h, size',
					'title, subtitle, label',
					'motif',
					'palette',
					'variant (0-3)',
					'font',
					'align (left|center|right)',
					'valign (top|middle|bottom)',
					'tx, ty (0-1)',
					'textRotate (degrees)',
					'color, titleColor, subtitleColor',
					'scrim (0-1)',
					'scale (png)',
					'rotate=false or rotate=<degrees>',
				],
				motifs: MOTIFS,
				palettes: (options.palettes ?? PALETTES).map((entry) => entry.name),
				fonts: FONT_NAMES,
			});
		}

		const parsed = parseImageRequest(url, options);
		if (!parsed) return new Response('Not found', { status: 404 });

		const etag = `"${configTag}-${hashSeed(`${parsed.format}:${url.pathname}?${url.search}`).toString(36)}"`;

		if (parsed.format === 'png') {
			try {
				const png = await renderPng({ ...parsed.options, fonts: options.fonts });
				return respond(request, png, 'image/png', etag);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'PNG rendering failed';
				// A missing rasteriser is "not implemented here"; anything else is a
				// real failure and should not read as an unsupported format.
				const missing = message.includes('@resvg/resvg-js');
				return new Response(message, { status: missing ? 501 : 500 });
			}
		}

		return respond(
			request,
			renderSvg({ ...parsed.options, xmlDeclaration: true }),
			'image/svg+xml; charset=utf-8',
			etag,
		);
	};
}
