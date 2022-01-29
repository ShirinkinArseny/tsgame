import {Destroyable} from './render/utils/destroyable';
import {Loadable} from './render/utils/loadable';
import {PointerEvent} from './events';


export interface Scene extends Destroyable, Loadable {

	name: string;

	load(): Promise<any>;

	update(dt: number,
		pressedKeyMap: Map<string, boolean>,
		pointerEvent: PointerEvent,
		changeScene: (scene: Scene) => void): void;

	render(w: number, h: number, dt: number): void;

}
