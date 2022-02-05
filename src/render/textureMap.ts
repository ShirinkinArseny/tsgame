import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {ImageTexture} from './textures/imageTexture';
import {Rect} from './shapes/rect';
import {range} from './utils/lists';
import {error} from './utils/errors';
import {Texture} from './textures/texture';
import {vec4, Vec4} from './utils/vector';

export class TextureMap implements Loadable, Destroyable, Texture {

	private texture: ImageTexture;
	rects = new Map<string, Vec4[]>();
	durations = new Map<string, number[]>();
	totalDurations = new Map<string, number[]>();

	constructor(private path: string) {
		this.texture = new ImageTexture(path + '.png');
	}

	getTargetTexture() {
		return this.texture.getTargetTexture();
	}

	getRects(tag: string): Vec4[] {
		return this.rects.get(tag) || error('No tag with name ' + tag + ' found');
	}

	getRect(tag: string): Vec4 {
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
						const rects: Vec4[] = [];
						const durations: number[] = [];
						range(from, to).forEach(idx => {
							const f = frames[idx];
							rects.push(vec4(
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
	}


}
