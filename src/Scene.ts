import {Destroyable} from './render/utils/Destroyable';
import {Loadable} from './render/utils/Loadable';
import {PointerEvent} from './Events';


export interface Scene extends Destroyable, Loadable {

	name: string;

	load(): Promise<any>;

	update(
		pressedKeyMap: Map<string, boolean>,
		pointerEvent: PointerEvent,
		changeScene: (scene: Scene) => void): void;

	render(): void;

}
