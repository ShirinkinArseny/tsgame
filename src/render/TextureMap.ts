import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {ImageTexture} from './textures/ImageTexture';
import {range} from './utils/Lists';
import {error} from './utils/Errors';
import {Texture} from './textures/Texture';
import {vec4, Vec4} from './utils/Vector';

export class Frame {
	constructor(
		readonly texture: ImageTexture,
		readonly rect: Vec4,
		readonly duration: number,
		readonly startTimestamp: number,
		readonly endTimestamp: number,
	) {
	}
}

export function animate<T extends boolean>(
	frames: Frame[],
	time: number,
	looped: T
): T extends true ? Frame : (Frame | undefined) {
	if (looped && frames.length === 1) return frames[0];
	let timeFixed = time;
	const animationDuration = frames[frames.length - 1].endTimestamp;
	if (time >= animationDuration) {
		if (looped) {
			timeFixed %= animationDuration;
		} else {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return undefined;
		}
	}
	const frameIdx = frames.findIndex(d => d.startTimestamp <= timeFixed && timeFixed <= d.endTimestamp);
	return frames[frameIdx];
}

export class Animation {

	readonly time = new Date().getTime();

	constructor(
		readonly frames: Frame[],
	) {
	}

	getFrame() {
		const t = new Date().getTime() - this.time;
		return animate(
			this.frames,
			t,
			false
		);
	}

}

export class TextureMap implements Loadable, Destroyable, Texture {

	private texture: ImageTexture;
	frames = new Map<string, Frame[]>();

	constructor(private path: string) {
		this.texture = new ImageTexture(path + '.png');
	}

	getTargetTexture() {
		return this.texture.getTargetTexture();
	}

	private getTag(tag: string): string {
		const direct = this.frames.get(tag);
		if (direct) return tag;
		const splitted = tag.split('.');
		for (let i = splitted.length - 2; i >= 0; i--) {
			const subname = range(0, i).map(i => splitted[i]).join('.');
			const subrects = this.frames.get(subname);
			if (subrects) return subname;
		}
		return error('No tag with name ' + tag + ' found');
	}

	getFrames(tag: string): Frame[] {
		return this.frames.get(this.getTag(tag)) || error('No tag with name ' + tag + ' found');
	}

	getFrame(tag: string): Frame {
		const fixedTag = this.getTag(tag);
		const frames = this.getFrames(fixedTag);
		return animate(
			frames,
			new Date().getTime(),
			true
		);
	}

	getAnimation(tag: string) {
		return new Animation(this.getFrames(tag));
	}

	private register(
		name: string,
		rects: Vec4[],
		durations: number[]
	) {
		const splitted = name.split('.');
		for (let i = 0; i < splitted.length; i++) {
			const subname = range(0, i).map(i => splitted[i]).join('.');
			let timestamp = 0;
			this.frames.set(
				subname,
				rects.map((r, idx) => {
					timestamp += durations[idx];
					return new Frame(
						this.texture,
						r,
						durations[idx],
						timestamp - durations[idx],
						timestamp,
					);
				})
			);
		}
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
						this.register(name, rects, durations);
					});
					return;
				})
		]);
	}

	destroy() {
		this.texture.destroy();
	}
}
