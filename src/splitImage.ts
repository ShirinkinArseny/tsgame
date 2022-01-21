import {error} from './render/utils/errors';

type Bounds = [number, number, number, number]

export function splitImage(image: HTMLImageElement): [number, Bounds[][]] {

	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	const context: CanvasRenderingContext2D = canvas.getContext('2d') || error('Failed to create canvas context');
	context.drawImage(image, 0, 0, image.width, image.height);

	const data = context.getImageData(0, 0, image.width, image.height).data.filter((_, idx) => idx % 4 === 3
	);

	const isFilled = (x: number, y: number) => {
		if (x < 0 || x >= image.width || y < 0 || y >= image.height) return false;
		return data[x + y * image.width] !== 0;
	};

	const already = new Map<string, boolean>();

	function detectSymbolBounds(x: number, y: number): Bounds {
		const pixels: [number, number][] = [];
		const collectPixels = (x: number, y: number) => {
			if (already.get(x + ':' + y)) return;
			already.set(x + ':' + y, true);
			if (!isFilled(x, y)) return;
			pixels.push([x, y]);
			for (let dx = -2; dx <= 2; dx++) {
				for (let dy = -2; dy <= 2; dy++) {
					collectPixels(x + dx, y + dy);
				}
			}
		};
		collectPixels(x, y);
		let minx = Number.MAX_SAFE_INTEGER;
		let maxx = -1;
		let miny = Number.MAX_SAFE_INTEGER;
		let maxy = -1;

		pixels.forEach(([x, y]) => {
			if (x < minx) minx = x;
			if (x > maxx) maxx = x;
			if (y < miny) miny = y;
			if (y > maxy) maxy = y;
		});

		if (minx === Number.MAX_SAFE_INTEGER || maxx === -1 || miny === Number.MAX_SAFE_INTEGER || maxy === -1) {
			throw new Error('WTF?');
		}

		return [minx, maxx, miny, maxy];
	}

	const bounds: Bounds[] = [];

	for (let x = 0; x < image.width; x++) {
		for (let y = 0; y < image.height; y++) {
			if (!isFilled(x, y)) continue;
			if (already.get(x + ':' + y)) continue;
			bounds.push(detectSymbolBounds(x, y));
		}
	}

	const maxh = bounds.reduce((acc, val) => Math.max(acc, val[3] - val[2]), 0);
	const linesY = bounds
		.filter(b => b[3] - b[2] === maxh)
		.map(b => b[2])
		.reduce(
			(acc, v) => {
				acc.set(v, true);
				return acc;
			},
			new Map<number, boolean>()
		)
		.keysList();

	const intersects = (x0: number, x1: number, x2: number, x3: number) => {
		if (x0 >= x2 && x0 <= x3) {
			return true;
		}
		if (x1 >= x2 && x1 <= x3) {
			return true;
		}
		if (x2 >= x0 && x2 <= x1) {
			return true;
		}
		if (x3 >= x0 && x3 <= x1) {
			return true;
		}
		return false;
	};

	const lines = linesY.map(liney => {
		const y0 = liney;
		const y1 = y0 + maxh;
		return bounds.filter(b => b[2] >= y0 && b[3] <= y1);
	}).map(a => {
		a.splice(0, 1);
		a.sort((a, b) => a[0] - b[0]);
		let i = 1;
		while (i < a.length) {
			const prev = a[i - 1];
			const curr = a[i];
			if (intersects(prev[0], prev[1], curr[0], curr[1])) {
				i--;
				a.splice(i + 1, 1);
				a[i] = [
					Math.min(prev[0], curr[0]),
					Math.max(prev[1], curr[1]),
					Math.min(prev[2], curr[2]),
					Math.max(prev[3], curr[3]),
				];
			}
			i++;
		}
		return a;
	});

	return [maxh + 1, lines];


}
