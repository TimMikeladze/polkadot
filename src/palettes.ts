/**
 * Palettes are data, not constants baked into the renderer. Pass your own
 * through `palettes` on any render call to brand the output.
 */

export type Palette = {
	name: string;
	/** Sleeve background. */
	field: string;
	/** Primary shape colour. */
	mark: string;
	/** Secondary shape colour. */
	shade: string;
	/** Small highlight, used sparingly. */
	spark: string;
	/** Type colour, guaranteed legible on `field`. */
	type: string;
	/** Whether `field` is dark, so callers can pick overlay colours. */
	dark?: boolean;
};

export const PALETTES: Palette[] = [
	{
		name: 'vermilion',
		field: '#e7dcc6',
		mark: '#c2402c',
		shade: '#2a2724',
		spark: '#e2a03f',
		type: '#2a2724',
	},
	{
		name: 'forest',
		field: '#eee8d5',
		mark: '#22403b',
		shade: '#7d9b7f',
		spark: '#b98a3f',
		type: '#22403b',
	},
	{
		name: 'midnight',
		field: '#171a2b',
		mark: '#d8ab5c',
		shade: '#6f7bb0',
		spark: '#f2eee5',
		type: '#f2eee5',
		dark: true,
	},
	{
		name: 'rust',
		field: '#ccd6d4',
		mark: '#a8492c',
		shade: '#2d4654',
		spark: '#e9c98d',
		type: '#2d4654',
	},
	{
		name: 'plum',
		field: '#f1ddcf',
		mark: '#59405c',
		shade: '#d97f5f',
		spark: '#2c2334',
		type: '#2c2334',
	},
	{
		name: 'tide',
		field: '#0f2b33',
		mark: '#6fb3a8',
		shade: '#d97d4a',
		spark: '#e5e0cd',
		type: '#e5e0cd',
		dark: true,
	},
	{
		name: 'press',
		field: '#dcd5c1',
		mark: '#1a1c17',
		shade: '#8b8874',
		spark: '#b7452e',
		type: '#1a1c17',
	},
	{
		name: 'cobalt',
		field: '#e4e9ee',
		mark: '#24408c',
		shade: '#9aa8bd',
		spark: '#cf5b3a',
		type: '#24408c',
	},
	{
		name: 'clay',
		field: '#e4d4b7',
		mark: '#7a4a2b',
		shade: '#4c5f37',
		spark: '#cf9a4e',
		type: '#3a2b1c',
	},
	{
		name: 'dusk',
		field: '#1c1520',
		mark: '#e8546a',
		shade: '#6ac6c9',
		spark: '#f0c05a',
		type: '#f5ece8',
		dark: true,
	},
	{
		name: 'coral',
		field: '#f5e6df',
		mark: '#e0654a',
		shade: '#2f3a52',
		spark: '#f0b271',
		type: '#2f3a52',
	},
	{
		name: 'moss',
		field: '#e9e4d2',
		mark: '#4b6042',
		shade: '#c0752f',
		spark: '#2b3327',
		type: '#2b3327',
	},
];
