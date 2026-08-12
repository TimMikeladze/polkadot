import { type Motif, seededNumbers } from './design.ts';
import type { Palette } from './palettes.ts';

/**
 * Motifs draw into a fixed 120x120 coordinate space. The outer <svg> scales it
 * to whatever size the caller asked for, so every motif can use plain numbers.
 */
export const VIEWBOX = 120;

const round = (value: number): string => String(Math.round(value * 1000) / 1000);

/**
 * Palettes may come from user data. Colours land in attribute values, so a
 * quote in one would otherwise let the caller inject markup.
 */
export function safeColor(value: string): string {
	return value.replace(/["'<>&]/g, '');
}

export function renderMotif(motif: Motif, palette: Palette, variant: number, seed: string): string {
	const random = seededNumbers(seed, 12);
	const at = (index: number): number => random[index % random.length] as number;
	const mark = safeColor(palette.mark);
	const shade = safeColor(palette.shade);
	const spark = safeColor(palette.spark);
	const field = safeColor(palette.field);
	const parts: string[] = [];

	switch (motif) {
		case 'rings': {
			const cx = 60 + (variant - 1.5) * 9;
			const cy = 54 + (variant % 2) * 8;
			parts.push(
				`<circle cx="${round(cx)}" cy="${round(cy)}" r="42" fill="${shade}"/>`,
				`<circle cx="${round(cx)}" cy="${round(cy)}" r="30" fill="${mark}"/>`,
				`<circle cx="${round(cx)}" cy="${round(cy)}" r="17" fill="${field}"/>`,
				`<circle cx="${round(cx)}" cy="${round(cy)}" r="6" fill="${spark}"/>`,
			);
			break;
		}

		case 'sun': {
			const rays = 7 + variant;
			parts.push(`<circle cx="60" cy="74" r="30" fill="${mark}"/>`);
			for (let index = 0; index < rays; index++) {
				const angle = (Math.PI * (index + 0.5)) / rays;
				parts.push(
					`<line x1="${round(60 - Math.cos(angle) * 34)}" y1="${round(74 - Math.sin(angle) * 34)}" x2="${round(60 - Math.cos(angle) * 56)}" y2="${round(74 - Math.sin(angle) * 56)}" stroke="${shade}" stroke-width="3.5" stroke-linecap="round"/>`,
				);
			}
			parts.push(`<circle cx="60" cy="74" r="13" fill="${spark}"/>`);
			break;
		}

		case 'split': {
			const y = 46 + variant * 8;
			parts.push(
				`<rect x="0" y="${round(y)}" width="120" height="${round(120 - y)}" fill="${mark}"/>`,
				`<circle cx="${round(38 + variant * 12)}" cy="${round(y)}" r="26" fill="${spark}"/>`,
				`<rect x="0" y="${round(y - 1.5)}" width="120" height="3" fill="${shade}"/>`,
			);
			break;
		}

		case 'grid': {
			const size = 4 + (variant % 2);
			const gap = 96 / (size - 1);
			// `at()` can return exactly 1, which would put the highlight one past
			// the last dot and drop it entirely.
			const highlight = Math.min(size * size - 1, Math.floor(at(0) * size * size));
			for (let index = 0; index < size * size; index++) {
				const column = index % size;
				const row = Math.floor(index / size);
				const isHighlight = index === highlight;
				const radius = isHighlight ? 11 : 4.5 + at(index) * 2;
				const fill = isHighlight ? spark : index % 3 === 0 ? shade : mark;
				parts.push(
					`<circle cx="${round(12 + column * gap)}" cy="${round(12 + row * gap)}" r="${round(radius)}" fill="${fill}"/>`,
				);
			}
			break;
		}

		case 'waves': {
			const count = 5 + variant;
			for (let index = 0; index < count; index++) {
				const y = 24 + index * (72 / count);
				const amplitude = 6 + at(index) * 9;
				parts.push(
					`<path d="M -5 ${round(y)} Q 25 ${round(y - amplitude)} 55 ${round(y)} T 125 ${round(y)}" fill="none" stroke="${index % 2 === 0 ? mark : shade}" stroke-width="${round(2 + at(index + 3) * 3)}" stroke-linecap="round"/>`,
				);
			}
			parts.push(`<circle cx="92" cy="30" r="9" fill="${spark}"/>`);
			break;
		}

		case 'arch': {
			const width = 52 + variant * 6;
			const x = (120 - width) / 2;
			const outer = width / 2;
			const inner = width / 2 - 14;
			parts.push(
				`<path d="M ${round(x)} 108 L ${round(x)} 58 A ${round(outer)} ${round(outer)} 0 0 1 ${round(x + width)} 58 L ${round(x + width)} 108 Z" fill="${mark}"/>`,
				`<path d="M ${round(x + 14)} 108 L ${round(x + 14)} 66 A ${round(inner)} ${round(inner)} 0 0 1 ${round(x + width - 14)} 66 L ${round(x + width - 14)} 108 Z" fill="${field}"/>`,
				`<circle cx="60" cy="30" r="11" fill="${spark}"/>`,
				`<rect x="0" y="106" width="120" height="14" fill="${shade}"/>`,
			);
			break;
		}

		case 'bands': {
			const count = 4 + variant;
			for (let index = 0; index < count; index++) {
				const offset = -40 + index * (200 / count);
				const width = 10 + at(index) * 16;
				const fill = index % 3 === 0 ? spark : index % 2 === 0 ? mark : shade;
				parts.push(
					`<rect x="${round(offset)}" y="-30" width="${round(width)}" height="190" transform="rotate(24 60 60)" fill="${fill}"/>`,
				);
			}
			break;
		}

		case 'orbit': {
			parts.push(
				`<circle cx="60" cy="60" r="24" fill="${mark}"/>`,
				`<ellipse cx="60" cy="60" rx="52" ry="20" fill="none" stroke="${shade}" stroke-width="3" transform="rotate(${round(-25 + variant * 18)} 60 60)"/>`,
				`<ellipse cx="60" cy="60" rx="44" ry="15" fill="none" stroke="${spark}" stroke-width="2" transform="rotate(${round(35 - variant * 14)} 60 60)"/>`,
				`<circle cx="98" cy="48" r="6" fill="${spark}"/>`,
			);
			break;
		}

		case 'prism': {
			parts.push(
				`<polygon points="60,14 108,102 12,102" fill="${mark}"/>`,
				`<polygon points="60,${round(40 + variant * 6)} 92,102 28,102" fill="${shade}"/>`,
				`<polygon points="60,68 76,102 44,102" fill="${spark}"/>`,
			);
			break;
		}

		case 'halftone': {
			const rows = 7;
			const focus = 44 + variant * 10;
			for (let index = 0; index < rows * rows; index++) {
				const column = index % rows;
				const row = Math.floor(index / rows);
				const x = 12 + column * (96 / (rows - 1));
				const y = 12 + row * (96 / (rows - 1));
				const distance = Math.hypot(x - 60, y - focus) / 70;
				const radius = Math.max(0.8, 7.5 * (1 - distance));
				parts.push(
					`<circle cx="${round(x)}" cy="${round(y)}" r="${round(radius)}" fill="${row < 3 ? mark : shade}"/>`,
				);
			}
			parts.push(`<circle cx="60" cy="${round(focus)}" r="5" fill="${spark}"/>`);
			break;
		}

		case 'horizon': {
			parts.push(
				`<circle cx="${round(78 - variant * 8)}" cy="40" r="17" fill="${spark}"/>`,
				`<path d="M -5 92 Q 30 58 62 88 T 125 76 L 125 125 L -5 125 Z" fill="${shade}"/>`,
				`<path d="M -5 106 Q 40 80 74 104 T 125 96 L 125 125 L -5 125 Z" fill="${mark}"/>`,
			);
			break;
		}

		case 'lattice': {
			const count = 5 + variant;
			const step = 120 / count;
			for (let index = 0; index <= count; index++) {
				const offset = index * step;
				parts.push(
					`<line x1="${round(offset)}" y1="-10" x2="${round(offset - 40)}" y2="130" stroke="${mark}" stroke-width="${round(2 + at(index) * 3)}" stroke-linecap="round"/>`,
					`<line x1="${round(offset - 40)}" y1="-10" x2="${round(offset)}" y2="130" stroke="${shade}" stroke-width="${round(2 + at(index + 4) * 3)}" stroke-linecap="round"/>`,
				);
			}
			parts.push(`<circle cx="${round(34 + variant * 18)}" cy="60" r="8" fill="${spark}"/>`);
			break;
		}

		case 'bloom': {
			const petals = 6 + variant * 2;
			for (let index = 0; index < petals; index++) {
				const angle = (360 / petals) * index;
				parts.push(
					`<ellipse cx="60" cy="36" rx="13" ry="26" fill="${index % 2 === 0 ? mark : shade}" opacity="0.9" transform="rotate(${round(angle)} 60 60)"/>`,
				);
			}
			parts.push(
				`<circle cx="60" cy="60" r="12" fill="${field}"/>`,
				`<circle cx="60" cy="60" r="6" fill="${spark}"/>`,
			);
			break;
		}

		case 'stack': {
			const count = 4 + variant;
			const height = 104 / count;
			for (let index = 0; index < count; index++) {
				const inset = 8 + at(index) * 24;
				parts.push(
					`<rect x="${round(inset)}" y="${round(8 + index * height)}" width="${round(120 - inset * 2)}" height="${round(height - 3)}" rx="${round(height / 2 - 1.5)}" fill="${index % 3 === 1 ? shade : mark}"/>`,
				);
			}
			parts.push(
				`<circle cx="${round(24 + at(2) * 72)}" cy="${round(8 + height / 2)}" r="6" fill="${spark}"/>`,
			);
			break;
		}

		case 'beam': {
			const count = 6 + variant;
			// Rays fan out of one corner, so the spread has to cover a quarter turn.
			for (let index = 0; index < count; index++) {
				const from = (90 / count) * index;
				const to = (90 / count) * (index + 1);
				const radius = 190;
				parts.push(
					`<path d="M 0 0 L ${round(Math.cos((from * Math.PI) / 180) * radius)} ${round(Math.sin((from * Math.PI) / 180) * radius)} L ${round(Math.cos((to * Math.PI) / 180) * radius)} ${round(Math.sin((to * Math.PI) / 180) * radius)} Z" fill="${index % 2 === 0 ? mark : shade}" opacity="${index % 2 === 0 ? '1' : '0.75'}"/>`,
				);
			}
			parts.push(`<circle cx="96" cy="96" r="${round(11 + variant * 2)}" fill="${spark}"/>`);
			break;
		}

		case 'pebbles': {
			const count = 9 + variant * 3;
			for (let index = 0; index < count; index++) {
				const x = 12 + at(index) * 96;
				const y = 12 + at(index + 5) * 96;
				const radius = 5 + at(index + 2) * 13;
				parts.push(
					`<circle cx="${round(x)}" cy="${round(y)}" r="${round(radius)}" fill="${index % 4 === 0 ? shade : mark}" opacity="${index % 3 === 0 ? '0.72' : '1'}"/>`,
				);
			}
			parts.push(
				`<circle cx="${round(20 + at(7) * 80)}" cy="${round(20 + at(8) * 80)}" r="9" fill="${spark}"/>`,
			);
			break;
		}

		case 'chevron': {
			const count = 4 + variant;
			const step = 132 / count;
			for (let index = 0; index < count; index++) {
				const y = -12 + index * step;
				parts.push(
					`<path d="M -6 ${round(y + step * 0.6)} L 60 ${round(y)} L 126 ${round(y + step * 0.6)}" fill="none" stroke="${index % 2 === 0 ? mark : shade}" stroke-width="${round(step * 0.42)}" stroke-linejoin="round"/>`,
				);
			}
			parts.push(`<circle cx="60" cy="${round(108 - variant * 6)}" r="8" fill="${spark}"/>`);
			break;
		}

		default: {
			const offset = 10 + variant * 5;
			parts.push(
				`<circle cx="${round(60 - offset)}" cy="58" r="34" fill="${mark}"/>`,
				`<circle cx="${round(60 + offset)}" cy="62" r="34" fill="${shade}" opacity="0.88"/>`,
				`<circle cx="60" cy="60" r="9" fill="${spark}"/>`,
			);
			break;
		}
	}

	return parts.join('');
}
