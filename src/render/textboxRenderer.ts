import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {HorizontalAlign, Text, VerticalAlign} from './fontRenderer';
import {Rect} from './shapes/rect';
import {identity, scale, translate} from './utils/matrices';
import {fontRenderer, texturedShader} from '../sharedResources';
import {TextureMap} from './textureMap';
import {Mat4, vec3, vec4} from './utils/vector';

export class TextboxRenderer implements Loadable, Destroyable {

	textureMap: TextureMap = new TextureMap('ui/tooltip/tooltip');


	r: Rect = new Rect(0, 0, 8, 8);

	renderTextBox(
		x: number, y: number,
		w: number,
		text: Text,
		projMatrix: Mat4,
		verticalAlign: VerticalAlign,
		horizontalAlign: HorizontalAlign
	) {

		const lh = fontRenderer.lineHeight - 2;
		const u = 8;

		const positions = fontRenderer.getTextPositions(
			text,
			w,
			lh
		);
		const ww = positions
			.map(({x, z}) => x + z)
			.reduce((a, b) => Math.max(a, b), 0);
		const hh = positions
			.map(({y}) => y)
			.reduce((a, b) => Math.max(a, b), 0) + fontRenderer.lineHeight;

		const xx = Math.floor((() => {
			switch (horizontalAlign) {
			case HorizontalAlign.LEFT:
				return x;
			case HorizontalAlign.RIGHT:
				return x - ww - u * 2;
			case HorizontalAlign.CENTER:
				return x - (ww + u) / 2;
			}
		})());
		const yy = Math.floor((() => {
			switch (verticalAlign) {
			case VerticalAlign.TOP:
				return y;
			case VerticalAlign.BOTTOM:
				return y - hh - u * 2;
			}
		})());

		texturedShader.useProgram();

		texturedShader.setTexture('texture', this.textureMap.texture);
		texturedShader.setMatrix('projectionMatrix', projMatrix);
		texturedShader.setModel('aVertexPosition', this.r);


		const draw = (x: number, y: number, name: string, w: number | undefined = undefined, h: number | undefined = undefined) => {
			if (w && h) {
				texturedShader.setMatrix(
					'modelMatrix',
					scale(translate(identity(), vec3(x, y, 0)), vec3(w / u, h / u, 1))
				);
			} else {
				texturedShader.setMatrix('modelMatrix', translate(identity(), vec3(x, y, 0)));
			}
			texturedShader.setModel('aTexturePosition', this.textureMap.getRect(name));
			texturedShader.draw();
		};

		draw(xx + u, yy + u, 'M', ww, hh);

		draw(xx, yy, 'LT');
		draw(xx + u, yy, 'T', ww, u);
		draw(xx + u + ww, yy, 'RT');

		draw(xx, yy + u, 'L', u, hh);
		draw(xx + u + ww, yy + u, 'R', u, hh);

		draw(xx, yy + u + hh, 'LB');
		draw(xx + u + ww, yy + u + hh, 'RB');
		draw(xx + u, yy + u + hh, 'B', ww, u);

		fontRenderer.drawText(
			text,
			xx + u,
			yy + u,
			w,
			vec4(0, 0, 0, 1),
			projMatrix,
			lh
		);

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
