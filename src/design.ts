import { PALETTES, type Palette } from './palettes.ts';

export const MOTIFS = [
	'rings',
	'sun',
	'split',
	'grid',
	'waves',
	'arch',
	'bands',
	'orbit',
	'prism',
	'halftone',
	'horizon',
	'eclipse',
] as const;

export type Motif = (typeof MOTIFS)[number];

export type Design = {
	palette: Palette;
	motif: Motif;
	/** 0-3. Shifts placement or count within a motif so two seeds that land on
	 *  the same motif and palette still look like different images. */
	variant: number;
	/** Degrees, a small tilt applied to the motif group. */
	rotation: number;
	/** Whether the palette's field is dark. */
	isDarkField: boolean;
};

export type DesignOptions = {
	/** Force a motif instead of deriving it from the seed. */
	motif?: string;
	/** Force a palette by name instead of deriving it from the seed. */
	palette?: string;
	/** Replace the palette set entirely. */
	palettes?: Palette[];
	/** Replace the motif set entirely. Values must exist in `MOTIFS`. */
	motifs?: readonly Motif[];
	/** Disable the sub-degree tilt. */
	rotate?: boolean;
};

/** FNV-1a, 32-bit. Small, fast, and stable across runtimes. */
export function hashSeed(input: string): number {
	let hash = 0x811c9dc5;
	for (let index = 0; index < input.length; index++) {
		hash ^= input.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash >>> 0;
}

/** Derive the design for a seed. Pure: same seed always produces the same design. */
export function design(seed: string, options: DesignOptions = {}): Design {
	const hash = hashSeed(seed);
	const palettes = options.palettes?.length ? options.palettes : PALETTES;
	const motifs = options.motifs?.length ? options.motifs : MOTIFS;

	const hinted = options.palette
		? palettes.find((entry) => entry.name === options.palette)
		: undefined;
	const hintedMotif = motifs.find((motif) => motif === options.motif);

	const palette = hinted ?? (palettes[hash % palettes.length] as Palette);
	// Shift bits between choices so motif and palette are not correlated.
	const motif = hintedMotif ?? (motifs[(hash >>> 8) % motifs.length] as Motif);
	const variant = (hash >>> 16) % 4;
	const rotation = options.rotate === false ? 0 : (((hash >>> 20) % 9) - 4) * 1.5;

	return {
		palette,
		motif,
		variant,
		rotation,
		isDarkField: palette.dark === true,
	};
}

/**
 * A deterministic pseudo-random stream from a seed, for motifs that need a
 * handful of varying numbers (dot sizes, wave offsets).
 */
export function seededNumbers(seed: string, count: number): number[] {
	let state = hashSeed(seed) || 1;
	const values: number[] = [];
	for (let index = 0; index < count; index++) {
		// xorshift32
		state ^= state << 13;
		state >>>= 0;
		state ^= state >>> 17;
		state ^= state << 5;
		state >>>= 0;
		values.push(state / 0xffffffff);
	}
	return values;
}

/** Initials for avatar fallbacks. */
export function initials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
}

/** A stable colour pair per seed, useful for avatars. */
export function seedColors(
	seed: string,
	palettes: Palette[] = PALETTES,
): { background: string; text: string } {
	const palette = palettes[hashSeed(seed) % palettes.length] as Palette;
	return { background: palette.mark, text: palette.field };
}
