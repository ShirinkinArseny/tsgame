import {Text} from './FontRenderer';
import {TextureMap} from './TextureMap';
import {texturedShader} from '../SharedResources';
import {vec2} from './utils/Vector';
import {tooltipLayer} from './TooltipLayer';

export type TooltippedIcon = {
	icon: string,
	tooltip: Text
}

export const tooltippedIconSize = 12;

export class TooltippedIcons {


	constructor(
		private readonly icons: () => TooltippedIcon[],
		private x: number, private y: number,
		private iconsMap: TextureMap
	) {
	}

	draw() {
		let xx = this.x;
		this.icons().forEach(icon => {
			texturedShader.useProgram();
			texturedShader.setSprite(this.iconsMap, icon.icon);
			texturedShader.draw(
				vec2(xx, this.y),
				vec2(tooltippedIconSize, tooltippedIconSize)
			);
			tooltipLayer.registerTooltip({
				x: xx,
				y: this.y,
				w: tooltippedIconSize,
				h: tooltippedIconSize,
				tooltip: icon.tooltip
			});
			xx += tooltippedIconSize;
		});
	}

}
