/**
 * Named type pairings. Every stack is built from fonts that ship with common
 * desktops, because the SVG is rendered by whoever opens it — there is no web
 * font to load, and the PNG rasteriser only sees installed system fonts.
 *
 * Each stack is ordered best-face-first and ends with the Liberation/DejaVu
 * names a Linux server actually has, then a generic family, so the same URL
 * degrades to the right *shape* — a serif stays a serif — rather than to the
 * renderer's single default face.
 */

export type FontPair = {
	/** Stack for the large bottom line. */
	title: string;
	/** Stack for the small uppercase line above it. */
	subtitle: string;
	/**
	 * Average glyph advance of the title face, in ems. There is no text
	 * measurement in a string renderer, so this is what line breaking counts
	 * with: a monospace or a geometric face runs much wider per character than
	 * a book serif, and a single shared guess sends those titles off the canvas.
	 */
	advance: number;
};

/** Neutral grotesque: the quiet partner under most of the title faces. */
const SANS =
	"'Inter', 'Helvetica Neue', Helvetica, 'Segoe UI Variable Text', 'Segoe UI', Roboto, 'Liberation Sans', Arial, ui-sans-serif, sans-serif";

const MONO =
	"'JetBrains Mono', 'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace";

/** Humanist sans, for the pairings that want warmth rather than neutrality. */
const HUMANIST =
	"Optima, 'Gill Sans', 'Gill Sans MT', Candara, 'Trebuchet MS', 'Segoe UI', ui-sans-serif, sans-serif";

export const FONTS: Record<string, FontPair> = {
	// Old-style book serif: generous, and the one pairing that reads as a book.
	serif: {
		title:
			"'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', 'Hoefler Text', Georgia, 'Liberation Serif', ui-serif, serif",
		subtitle: SANS,
		advance: 0.5,
	},
	sans: { title: SANS, subtitle: SANS, advance: 0.52 },
	mono: { title: MONO, subtitle: MONO, advance: 0.62 },
	// High-contrast didone: thin hairlines, so it wants size, which is exactly
	// what a cover title gives it.
	display: {
		title:
			"Didot, 'Bodoni 72', 'Bodoni MT', 'Playfair Display', 'Big Caslon', 'Times New Roman', 'Liberation Serif', serif",
		subtitle: SANS,
		advance: 0.47,
	},
	// Soft geometric, set against itself so the pairing stays friendly.
	rounded: {
		title:
			"'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Quicksand, Nunito, 'Avenir Next', Avenir, 'Segoe UI', system-ui, ui-rounded, sans-serif",
		subtitle:
			"'SF Pro Rounded', Nunito, 'Avenir Next', Avenir, 'Segoe UI', system-ui, ui-rounded, sans-serif",
		advance: 0.54,
	},
	// Slab: blunt, editorial, and the one pairing that reads as a headline
	// rather than as a book.
	slab: {
		title:
			"'Roboto Slab', Rockwell, 'Bookman Old Style', 'Sitka Display', Chaparral, Georgia, 'Liberation Serif', serif",
		subtitle: MONO,
		advance: 0.56,
	},
	// Geometric grotesque, the poster face and the default: wide, even, and
	// modern without being neutral.
	grotesk: {
		title:
			"Futura, 'Century Gothic', 'Avenir Next', Avenir, 'Segoe UI', 'Liberation Sans', ui-sans-serif, sans-serif",
		subtitle: SANS,
		advance: 0.58,
	},
	// Humanist: calligraphic stress in a sans, warmer than any of the above.
	humanist: { title: HUMANIST, subtitle: HUMANIST, advance: 0.5 },
};

export const FONT_NAMES: string[] = Object.keys(FONTS);

/** Resolve a font name to a pair. Unknown names fall back to `grotesk`. */
export function fontPair(name?: string): FontPair {
	return (name && FONTS[name]) || (FONTS.grotesk as FontPair);
}
