import { renderSvg, type SvgOptions } from './svg.ts';

export type PngOptions = SvgOptions & {
	/** Pixel density multiplier applied to `width`/`height`. Defaults to 1. */
	scale?: number;
};

type ResvgModule = {
	Resvg: new (
		svg: string,
		options?: { fitTo?: { mode: 'width'; value: number } },
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
	});
	return image.render().asPng();
}
