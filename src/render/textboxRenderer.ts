import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {HorizontalAlign, Text, VerticalAlign} from './fontRenderer';
import {defaultRect, fontRenderer, texturedShader} from '../sharedResources';
import {vec2} from './utils/vector';
import {FrameRenderer} from './frameRenderer';

export class TextboxRenderer implements Loadable, Destroyable {

	frameRenderer = new FrameRenderer('ui/tooltip/tooltip');

	renderTextBox(
		x: number, y: number,
		w: number,
		text: Text,
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

		this.frameRenderer.renderFrame(xx, yy, ww, hh);

		fontRenderer.drawText(
			text,
			xx + u,
			yy + u,
			w,
			lh
		);

	}

	load(): Promise<any> {
		return Promise.all(
			[
				this.frameRenderer.load()
			]
		);
	}

	destroy() {
		this.frameRenderer.destroy();
	}


}
