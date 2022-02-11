import {Vec2} from './render/utils/vector';

export enum PointerButton {
	LEFT, RIGHT
}

export class PointerEvent {

	public cancelled: boolean = false;

	constructor(
		readonly button: PointerButton,
		readonly xy: Vec2,
		readonly isCursorPressed: boolean,
		readonly isCursorClicked: boolean
	) {
	}

}
