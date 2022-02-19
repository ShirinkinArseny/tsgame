import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {defaultRect, texturedShader} from '../SharedResources';
import {TextureMap} from './TextureMap';
import {vec2} from './utils/Vector';

export enum SourceOrientation {
	NONE,
	SW,
	SE,
	NW,
	NE
}

export const mirrorHorizontal = (o: SourceOrientation) => {
	switch (o) {
	case SourceOrientation.NONE:
		return SourceOrientation.NONE;
	case SourceOrientation.SW:
		return SourceOrientation.SE;
	case SourceOrientation.SE:
		return SourceOrientation.SW;
	case SourceOrientation.NW:
		return SourceOrientation.NE;
	case SourceOrientation.NE:
		return SourceOrientation.NW;
	}
};

export const mirrorVertical = (o: SourceOrientation) => {
	switch (o) {
	case SourceOrientation.NONE:
		return SourceOrientation.NONE;
	case SourceOrientation.SW:
		return SourceOrientation.NW;
	case SourceOrientation.SE:
		return SourceOrientation.NE;
	case SourceOrientation.NW:
		return SourceOrientation.SW;
	case SourceOrientation.NE:
		return SourceOrientation.SE;
	}
};

export class FrameRenderer implements Loadable, Destroyable {

	textureMap: TextureMap;

	constructor(textureName: string) {
		this.textureMap = new TextureMap(textureName);
	}

	renderFrame(
		x: number, y: number,
		w: number, h: number,
		orientation: SourceOrientation = SourceOrientation.NONE
	) {

		const u = 8;

		texturedShader.useProgram(true, false);

		texturedShader.setModel('vertexPosition', defaultRect);


		const draw = (x: number, y: number, name: string, w: number | undefined = undefined, h: number | undefined = undefined) => {
			texturedShader.setFrame(this.textureMap.getFrame(name));
			texturedShader.setVec2('textureScale', vec2((w || u) / u, (h || u) / u));
			texturedShader.draw(
				vec2(x, y),
				vec2(w || u, h || u)
			);
		};

		draw(x + u, y + u, 'M', w, h);

		draw(x, y, 'LT' + (orientation === SourceOrientation.NE ? 'S' : ''));
		draw(x + u + w, y, 'RT' + (orientation === SourceOrientation.NW ? 'S' : ''));
		draw(x + u, y, 'T', w, u);

		draw(x, y + u, 'L', u, h);
		draw(x + u + w, y + u, 'R', u, h);

		draw(x, y + u + h, 'LB' + (orientation === SourceOrientation.SE ? 'S' : ''));
		draw(x + u + w, y + u + h, 'RB' + (orientation === SourceOrientation.SW ? 'S' : ''));
		draw(x + u, y + u + h, 'B', w, u);

		texturedShader.setVec2('textureScale', vec2(1.0, 1.0));
	}

	load(): Promise<any> {
		return Promise.all(
			[
				this.textureMap.load()
			]
		);
	}

	destroy() {
		this.textureMap.destroy();
	}


}
