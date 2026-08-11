import { hashSeed, MOTIFS, type Motif } from './design.ts';
import { PALETTES, type Palette } from './palettes.ts';
import { renderPng } from './png.ts';
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
};

const DEFAULT_MAX_SIZE = 2048;
const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

function clamp(value: number, max: number): number {
	return Math.min(max, Math.max(1, Math.round(value)));
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
			rotate: params.get('rotate') !== 'false',
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
		return new Response(request.method === 'HEAD' ? null : (body as BodyInit), {
			headers: { 'content-type': contentType, 'cache-control': cacheControl, etag },
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
			return Response.json({
				usage: '/{seed}.svg or /{seed}.png',
				params: [
					'w, h, size',
					'title, subtitle',
					'motif',
					'palette',
					'scale (png)',
					'rotate=false',
				],
				motifs: MOTIFS,
				palettes: (options.palettes ?? PALETTES).map((entry) => entry.name),
			});
		}

		const parsed = parseImageRequest(url, options);
		if (!parsed) return new Response('Not found', { status: 404 });

		const etag = `"${configTag}-${hashSeed(`${parsed.format}:${url.pathname}?${url.search}`).toString(36)}"`;

		if (parsed.format === 'png') {
			try {
				const png = await renderPng(parsed.options);
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
