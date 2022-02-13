import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {HorizontalAlign, Text, VerticalAlign} from './FontRenderer';
import {fontRenderer} from '../SharedResources';
import {FrameRenderer} from './FrameRenderer';

export class TextboxRenderer implements Loadable, Destroyable {

	frameRenderer = new FrameRenderer('ui/tooltip/tooltip');

	renderTextBox(
		x: number, y: number,
		w: number,
		text: Text,
		verticalAlign: VerticalAlign = VerticalAlign.TOP,
		horizontalAlign: HorizontalAlign = HorizontalAlign.LEFT
	) {

		const u = 8;

		const positions = fontRenderer.getTextElementsPositions(
			text,
			w,
		);

		const xx = Math.floor((() => {
			switch (horizontalAlign) {
			case HorizontalAlign.LEFT:
				return x;
			case HorizontalAlign.RIGHT:
				return x - positions.width - u * 2;
			case HorizontalAlign.CENTER:
				return x - (positions.width + u) / 2;
			}
		})());
		const yy = Math.floor((() => {
			switch (verticalAlign) {
			case VerticalAlign.TOP:
				return y;
			case VerticalAlign.BOTTOM:
				return y - positions.height - u * 2;
			}
		})());

		this.frameRenderer.renderFrame(xx, yy, positions.width, positions.height);

		fontRenderer.drawTextImpl(
			text,
			xx + u,
			yy + u,
			w,
			positions
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
