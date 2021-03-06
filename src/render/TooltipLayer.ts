import {Text} from './FontRenderer';
import {textboxRenderer} from '../SharedResources';
import {pointerLayer} from './PointerLayer';


export type Tooltip = {
	x: number,
	y: number
	w: number,
	h: number,
	tooltip: Text
}

let tooltipToShow: Tooltip | undefined;

export const tooltipLayer = {

	registerTooltip: (tooltip: Tooltip) => {
		pointerLayer.listen({
			x: tooltip.x,
			y: tooltip.y,
			w: tooltip.w,
			h: tooltip.h,
			on: () => {
				tooltipToShow = tooltip;
			}
		});
	},

	draw: () => {
		if (tooltipToShow) {
			textboxRenderer.renderTextBox(
				tooltipToShow.x,
				tooltipToShow.y,
				tooltipToShow.w,
				tooltipToShow.h,
				tooltipToShow.tooltip,
			);
		}
		tooltipToShow = undefined;
	}

};
