import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {ImageTexture} from './textures/imageTexture';
import {Rect} from './shapes/rect';
import {range} from './utils/lists';
import {error} from './utils/errors';

export class TextureMap implements Loadable, Destroyable {

	texture: ImageTexture;
	rects = new Map<string, Rect[]>();
	durations = new Map<string, number[]>();
	totalDurations = new Map<string, number[]>();

	constructor(private path: string) {
		this.texture = new ImageTexture(path + '.png');
	}

	getRects(tag: string): Rect[] {
		return this.rects.get(tag) || error('No tag with name ' + tag + ' found');
	}

	getRect(tag: string): Rect {
		const rects = this.getRects(tag);
		if (rects.length === 1) return rects[0];
		const totalDurs = this.totalDurations.get(tag) || error('No duration for tag ' + tag);
		const time = new Date().getTime() % totalDurs[totalDurs.length - 1];
		const frame = totalDurs.findIndex(d => d > time);
		return rects[frame];
	}

	load(): Promise<any> {
		return Promise.all([
			this.texture.load(),
			fetch('/assets/images/' + this.path + '.json')
				.then(r => r.text())
				.then(r => {
					const j = JSON.parse(r);
					const frames = Object.values(j.frames)
						.map((f: any) => ({
							x: f.frame.x,
							y: f.frame.y,
							w: f.frame.w,
							h: f.frame.h,
							duration: f.duration
						}));
					const {w, h} = j.meta.size;

					interface Tag {
						name: string;
						from: number;
						to: number;
					}

					const tags: Tag[] = j.meta.frameTags
						.map((t: any) => {
							if (typeof t !== 'object') throw new Error('WTF?');
							return {
								name: t.name as string,
								from: t.from as number,
								to: t.to as number
							};
						});
					tags.forEach(({name, from, to}) => {
						const rects: Rect[] = [];
						const durations: number[] = [];
						range(from, to).forEach(idx => {
							const f = frames[idx];
							rects.push(new Rect(
								f.x / w,
								f.y / h,
								(f.x + f.w) / w,
								(f.y + f.h) / h
							));
							durations.push(f.duration);
						});
						this.rects.set(name, rects);
						this.durations.set(name, durations);
						const totalDurations = [...durations];
						for (let i = 1; i < totalDurations.length; i++) {
							totalDurations[i] += totalDurations[i - 1];
						}
						this.totalDurations.set(name, totalDurations);
					});
					return;
				})
		]);
	}

	destroy() {
		this.texture.destroy();
		this.rects.valuesList().flat().forEach(r => r.destroy());
	}


}
