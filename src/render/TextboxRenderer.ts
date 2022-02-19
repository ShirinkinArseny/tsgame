import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {Text} from './FontRenderer';
import {fontRenderer} from '../SharedResources';
import {FrameRenderer, mirrorVertical, SourceOrientation} from './FrameRenderer';
import {fh, fw} from '../GlobalContext';

const wLimit = 100;

export class TextboxRenderer implements Loadable, Destroyable {

	frameRenderer = new FrameRenderer('ui/tooltip/tooltip');

	renderTextBox(
		x: number,
		y: number,
		w: number,
		h: number,
		text: Text,
	) {

		const u = 8;

		const positions = fontRenderer.getTextElementsPositions(
			text,
			wLimit,
		);
		const tooltipHeight = positions.height + u * 2;
		const tooltipWidth = positions.width + u * 2;

		let o: SourceOrientation;
		let xx = x;

		const w1 = x - (-fw / 2);
		const w2 = fw / 2 - (x + w);
		if (w1 > w2) {
			o = SourceOrientation.SW;
			xx = x - tooltipWidth;
		} else {
			o = SourceOrientation.SE;
			xx = x + w;
		}

		let yy: number;
		const h1 = y - (-fh / 2);
		const h2 = fh / 2 - (y + h);
		if (h1 > h2) {
			yy = y - tooltipHeight;
		} else {
			o = mirrorVertical(o);
			yy = y + h;
		}


		this.frameRenderer.renderFrame(
			xx, yy,
			positions.width, positions.height,
			o
		);

		fontRenderer.drawTextImpl(
			text,
			xx + u,
			yy + u,
			wLimit,
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
