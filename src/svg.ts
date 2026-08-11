import { design, type DesignOptions, type Design } from './design.ts';
import { renderMotif, safeColor, VIEWBOX } from './motifs.ts';

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
	/** Font stacks for the two type lines. */
	titleFont?: string;
	subtitleFont?: string;
	/** Emit an XML prolog. Needed when writing a standalone `.svg` file. */
	xmlDeclaration?: boolean;
};

const DEFAULT_TITLE_FONT = "Georgia, 'Times New Roman', ui-serif, serif";
const DEFAULT_SUBTITLE_FONT = "'Helvetica Neue', Helvetica, Arial, ui-sans-serif, sans-serif";

const round = (value: number): string => String(Math.round(value * 100) / 100);

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
		renderType(options, width, height, safeColor(palette.type)) +
		`</svg>`
	);
}

function renderType(options: SvgOptions, width: number, height: number, color: string): string {
	if (!options.title && !options.subtitle) return '';

	const base = Math.min(width, height);
	const pad = base * 0.07;
	const titleSize = base * 0.09;
	const subtitleSize = base * 0.045;
	const titleLeading = titleSize * 1.06;
	const charsPerLine = Math.max(8, Math.floor((width - pad * 2) / (titleSize * 0.5)));

	const titleLines = options.title ? wrapText(options.title, 3, charsPerLine) : [];
	const parts: string[] = [];

	// Lay out from the bottom up so the block always sits on the baseline edge.
	let y = height - pad;
	for (let index = titleLines.length - 1; index >= 0; index--) {
		parts.unshift(
			`<text x="${round(pad)}" y="${round(y)}" font-family="${escapeXml(options.titleFont ?? DEFAULT_TITLE_FONT)}" font-size="${round(titleSize)}" font-weight="600" letter-spacing="${round(-titleSize * 0.02)}" fill="${color}">${escapeXml(titleLines[index] as string)}</text>`,
		);
		y -= titleLeading;
	}

	if (options.subtitle) {
		const subtitleChars = Math.max(8, Math.floor((width - pad * 2) / (subtitleSize * 0.75)));
		const [line] = wrapText(options.subtitle.toUpperCase(), 1, subtitleChars);
		parts.unshift(
			`<text x="${round(pad)}" y="${round(y - subtitleSize * 0.4)}" font-family="${escapeXml(options.subtitleFont ?? DEFAULT_SUBTITLE_FONT)}" font-size="${round(subtitleSize)}" font-weight="700" letter-spacing="${round(subtitleSize * 0.16)}" opacity="0.8" fill="${color}">${escapeXml(line ?? '')}</text>`,
		);
	}

	return parts.join('');
}

/** The SVG as a `data:` URI, ready for `src` or `background-image`. */
export function renderDataUri(options: SvgOptions): string {
	return `data:image/svg+xml;utf8,${encodeURIComponent(renderSvg(options))}`;
}
