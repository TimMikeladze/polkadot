import { design, hashSeed, type DesignOptions, type Design } from './design.ts';
import { fontPair } from './fonts.ts';
import { renderMotif, safeColor, VIEWBOX } from './motifs.ts';
import type { Palette } from './palettes.ts';

export type SvgOptions = DesignOptions & {
	/** Seed. The same seed always produces the same image. */
	seed: string;
	width?: number;
	height?: number;
	/** Large line printed at the bottom of the image. */
	title?: string;
	/** Small uppercase line printed above the title. */
	subtitle?: string;
	/** Accessible label. Defaults to title/subtitle, then the seed. */
	label?: string;
	/** Named type pairing from `FONTS`. Unknown names fall back to `grotesk`. */
	font?: string;
	/** Font stacks for the two type lines. Win over `font` when given. */
	titleFont?: string;
	subtitleFont?: string;
	/** Horizontal placement of the type block. Defaults to `left`. */
	align?: 'left' | 'center' | 'right';
	/** Vertical placement of the type block. Defaults to `bottom`. */
	valign?: 'top' | 'middle' | 'bottom';
	/**
	 * Anchor of the type block as a fraction of the canvas, 0-1, overriding the
	 * padding `align`/`valign` would use. Fractions, not pixels, so one URL
	 * places the type the same way at every size.
	 */
	textX?: number;
	textY?: number;
	/** Rotate the type block, in degrees, around its own anchor. */
	textRotation?: number;
	/** Type colours. Default to the palette's `type`. */
	titleColor?: string;
	subtitleColor?: string;
	/**
	 * Fade the field colour up behind the type, so a title stays legible over a
	 * motif that fills the canvas. `true` is 0.85; a number sets the opacity.
	 */
	scrim?: boolean | number;
	/** Emit an XML prolog. Needed when writing a standalone `.svg` file. */
	xmlDeclaration?: boolean;
};

const round = (value: number): string => String(Math.round(value * 100) / 100);

/** A 0-1 placement fraction, or undefined when the caller did not set one. */
function fraction(value: number | undefined): number | undefined {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.max(0, Math.min(1, value))
		: undefined;
}

export function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Wrap text without a font metrics engine. Average glyph advance is close
 * enough at these sizes, and the result is clipped to `maxLines` with an
 * ellipsis so a long title can never overflow the image.
 */
export function wrapText(text: string, maxLines: number, charsPerLine: number): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let current = '';
	// Count words, not characters: collapsing runs of whitespace would otherwise
	// look like truncation and add a spurious ellipsis.
	let used = 0;

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length <= charsPerLine || !current) {
			current = candidate;
			used++;
		} else {
			lines.push(current);
			current = word;
			used++;
			if (lines.length === maxLines) break;
		}
	}
	if (current && lines.length < maxLines) lines.push(current);
	else if (lines.length === maxLines && current) used--;

	if (lines.length === maxLines) {
		const last = lines[maxLines - 1] as string;
		if (used < words.length) {
			lines[maxLines - 1] =
				last.length > charsPerLine - 1 ? `${last.slice(0, charsPerLine - 1)}…` : `${last}…`;
		}
	}
	return lines;
}

/** Render the image as an SVG string. Pure, synchronous, no dependencies. */
export function renderSvg(options: SvgOptions): string {
	const width = Math.max(1, Math.round(options.width ?? 600));
	const height = Math.max(1, Math.round(options.height ?? width));
	const spec: Design = design(options.seed, options);
	const { palette } = spec;

	// An empty `aria-label` on `role="img"` is worse than a generic one, so an
	// empty seed still gets described.
	const label =
		options.label ||
		[options.title, options.subtitle].filter(Boolean).join(' — ') ||
		options.seed ||
		'Placeholder image';

	const art =
		`<svg x="0" y="0" width="${width}" height="${height}" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" preserveAspectRatio="xMidYMid slice">` +
		`<rect width="${VIEWBOX}" height="${VIEWBOX}" fill="${safeColor(palette.field)}"/>` +
		`<g transform="rotate(${spec.rotation} 60 60)">${renderMotif(spec.motif, palette, spec.variant, options.seed)}</g>` +
		`</svg>`;

	const prolog = options.xmlDeclaration ? `<?xml version="1.0" encoding="UTF-8"?>` : '';

	return (
		`${prolog}<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}">` +
		`<title>${escapeXml(label)}</title>` +
		art +
		renderType(options, width, height, palette, spec) +
		`</svg>`
	);
}

function renderType(
	options: SvgOptions,
	width: number,
	height: number,
	palette: Palette,
	spec: Design,
): string {
	if (!options.title && !options.subtitle) return '';

	const color = safeColor(palette.type);

	const base = Math.min(width, height);
	const pad = base * 0.07;
	const titleSize = base * 0.09;
	const subtitleSize = base * 0.045;
	const titleLeading = titleSize * 1.06;
	const fonts = fontPair(options.font);
	// Break on the chosen face's own advance, so a mono or geometric title
	// wraps before it runs off the canvas.
	const charsPerLine = Math.max(8, Math.floor((width - pad * 2) / (titleSize * fonts.advance)));

	const align = options.align ?? 'left';
	const valign = options.valign ?? 'bottom';
	const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
	const defaultX = align === 'center' ? width / 2 : align === 'right' ? width - pad : pad;
	const fractionX = fraction(options.textX);
	const x = fractionX === undefined ? defaultX : fractionX * width;

	const titleLines = options.title ? wrapText(options.title, 3, charsPerLine) : [];
	const titleColor = options.titleColor ? safeColor(options.titleColor) : color;
	const subtitleColor = options.subtitleColor ? safeColor(options.subtitleColor) : color;

	// How far the block reaches either side of the last line's baseline. Used
	// both to honour `valign` and to size the scrim.
	const above = titleLines.length
		? (titleLines.length - 1) * titleLeading +
			titleSize * 0.75 +
			(options.subtitle ? subtitleSize * 1.5 : 0)
		: subtitleSize * 1.15;
	const below = titleLines.length ? titleSize * 0.25 : 0;

	const defaultAnchorY = valign === 'top' ? pad : valign === 'middle' ? height / 2 : height - pad;
	const fractionY = fraction(options.textY);
	const anchorY = fractionY === undefined ? defaultAnchorY : fractionY * height;
	// The anchor is the last line's baseline at the bottom, the block's own
	// centre in the middle, and its cap height at the top.
	const baseline =
		valign === 'top'
			? anchorY + above
			: valign === 'middle'
				? anchorY + (above - below) / 2
				: anchorY;

	const parts: string[] = [];

	// Lay out from the bottom up so the block always sits on the baseline edge.
	let y = baseline;
	for (let index = titleLines.length - 1; index >= 0; index--) {
		parts.unshift(
			`<text x="${round(x)}" y="${round(y)}" text-anchor="${anchor}" font-family="${escapeXml(options.titleFont ?? fonts.title)}" font-size="${round(titleSize)}" font-weight="600" letter-spacing="${round(-titleSize * 0.02)}" fill="${titleColor}">${escapeXml(titleLines[index] as string)}</text>`,
		);
		y -= titleLeading;
	}

	if (options.subtitle) {
		const subtitleChars = Math.max(8, Math.floor((width - pad * 2) / (subtitleSize * 0.75)));
		const [line] = wrapText(options.subtitle.toUpperCase(), 1, subtitleChars);
		parts.unshift(
			`<text x="${round(x)}" y="${round(y - subtitleSize * 0.4)}" text-anchor="${anchor}" font-family="${escapeXml(options.subtitleFont ?? fonts.subtitle)}" font-size="${round(subtitleSize)}" font-weight="700" letter-spacing="${round(subtitleSize * 0.16)}" opacity="0.8" fill="${subtitleColor}">${escapeXml(line ?? '')}</text>`,
		);
	}

	// Rotate around the anchor, not the canvas: turning the type must not move
	// it away from where the position knobs put it.
	if (options.textRotation) {
		const group = parts.join('');
		parts.length = 0;
		parts.push(
			`<g transform="rotate(${round(options.textRotation)} ${round(x)} ${round(baseline)})">${group}</g>`,
		);
	}

	// The gradient sits under the type but over the art, and covers the block
	// the type actually occupies rather than a fixed fraction of the canvas.
	if (options.scrim) {
		const strength =
			typeof options.scrim === 'number' ? Math.max(0, Math.min(1, options.scrim)) : 0.85;
		// The scrim stays axis-aligned and covers the block's own extent. Rotated
		// type is the caller's business; a tilted gradient would read as a bug.
		const top = Math.max(0, Math.min(baseline - above - titleSize * 0.4, height * 0.9));
		// Two SVGs on one page must not share a gradient id, so it carries the
		// design's own fingerprint.
		const id = `pi-scrim-${hashSeed(`${options.seed}:${palette.name}:${spec.motif}:${width}x${height}`).toString(36)}`;
		parts.unshift(
			`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
				`<stop offset="0" stop-color="${safeColor(palette.field)}" stop-opacity="0"/>` +
				`<stop offset="0.55" stop-color="${safeColor(palette.field)}" stop-opacity="${round(strength * 0.75)}"/>` +
				`<stop offset="1" stop-color="${safeColor(palette.field)}" stop-opacity="${round(strength)}"/>` +
				`</linearGradient></defs>` +
				`<rect x="0" y="${round(top)}" width="${width}" height="${round(height - top)}" fill="url(#${id})"/>`,
		);
	}

	return parts.join('');
}

/** The SVG as a `data:` URI, ready for `src` or `background-image`. */
export function renderDataUri(options: SvgOptions): string {
	return `data:image/svg+xml;utf8,${encodeURIComponent(renderSvg(options))}`;
}
