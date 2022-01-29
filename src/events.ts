import {Vec2} from './render/utils/vector';

export class PointerEvent {

	constructor(
		readonly xy: Vec2,
		readonly isCursorPressed: boolean,
		readonly isCursorClicked: boolean
	) {
	}

}
