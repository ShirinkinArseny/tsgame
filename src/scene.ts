import {Destroyable} from './render/utils/destroyable';
import {Loadable} from './render/utils/loadable';


export interface Scene extends Destroyable, Loadable {

	name: string;

	load(): Promise<any>;

	update(dt: number,
		pressedKeyMap: Map<number, boolean>,
		cursorX: number,
		cursorY: number,
		changeScene: (Scene) => void);

	render(w: number, h: number, dt: number);

}
