import { renderSvg, type SvgOptions } from './svg.ts';

/**
 * Fonts the rasteriser may use. The SVG names plain CSS stacks and lets the
 * viewer resolve them, but a rasteriser has to find real files: a bare Linux
 * container often ships none at all, and resvg silently draws nothing rather
 * than falling back. Point `fontDirs`/`fontFiles` at the faces the host should
 * use and the same URL renders type everywhere.
 */
export type PngFontOptions = {
	/** Directories scanned for font files. */
	fontDirs?: string[];
	/** Individual font files to load. */
	fontFiles?: string[];
	/** Also use the host's installed fonts. Defaults to true. */
	loadSystemFonts?: boolean;
	/** Face used when a stack matches nothing that was loaded. */
	defaultFontFamily?: string;
};

export type PngOptions = SvgOptions & {
	/** Pixel density multiplier applied to `width`/`height`. Defaults to 1. */
	scale?: number;
	/** Where the rasteriser looks for type. */
	fonts?: PngFontOptions;
};

type ResvgModule = {
	Resvg: new (
		svg: string,
		options?: {
			fitTo?: { mode: 'width'; value: number };
			font?: PngFontOptions;
		},
	) => { render: () => { asPng: () => Uint8Array } };
};

let resvg: Promise<ResvgModule> | undefined;

function loadResvg(): Promise<ResvgModule> {
	// Indirect specifier: the dependency is optional, so it must not become a
	// static import that bundlers or type resolution insist on finding.
	const specifier = '@resvg/resvg-js';
	resvg ??= import(specifier).catch(() => {
		throw new Error(
			'PNG rendering needs the optional peer dependency `@resvg/resvg-js`. Install it with `bun add @resvg/resvg-js`.',
		);
	}) as Promise<ResvgModule>;
	return resvg;
}

/**
 * Rasterise the same drawing the SVG renderer produces, so a share card and an
 * inline image are literally the same artwork.
 *
 * Requires the optional peer dependency `@resvg/resvg-js`.
 */
export async function renderPng(options: PngOptions): Promise<Uint8Array> {
	const { Resvg } = await loadResvg();
	const width = Math.max(1, Math.round(options.width ?? 600));
	const scale = options.scale && options.scale > 0 ? options.scale : 1;

	const image = new Resvg(renderSvg({ ...options, xmlDeclaration: false }), {
		fitTo: { mode: 'width', value: Math.round(width * scale) },
		font: { loadSystemFonts: true, ...options.fonts },
	});
	return image.render().asPng();
}
