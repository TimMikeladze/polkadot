/**
 * Named type pairings. Every stack is built from fonts that ship with common
 * desktops, because the SVG is rendered by whoever opens it — there is no web
 * font to load, and the PNG rasteriser only sees installed system fonts.
 */

export type FontPair = {
	/** Stack for the large bottom line. */
	title: string;
	/** Stack for the small uppercase line above it. */
	subtitle: string;
};

const SANS = "'Helvetica Neue', Helvetica, Arial, ui-sans-serif, sans-serif";
const MONO = "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";

export const FONTS: Record<string, FontPair> = {
	serif: { title: "Georgia, 'Times New Roman', ui-serif, serif", subtitle: SANS },
	sans: { title: SANS, subtitle: SANS },
	mono: { title: MONO, subtitle: MONO },
	display: {
		title: "'Playfair Display', Didot, 'Bodoni MT', 'Times New Roman', serif",
		subtitle: SANS,
	},
	rounded: {
		title: "'Avenir Next', Avenir, 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif",
		subtitle: "'Avenir Next', Avenir, 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif",
	},
	slab: { title: "Rockwell, 'Courier Bold', Courier, Georgia, serif", subtitle: MONO },
};

export const FONT_NAMES: string[] = Object.keys(FONTS);

/** Resolve a font name to a pair. Unknown names fall back to `serif`. */
export function fontPair(name?: string): FontPair {
	return (name && FONTS[name]) || (FONTS.serif as FontPair);
}
