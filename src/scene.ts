import {Destroyable} from './render/utils/destroyable';


export interface Scene extends Destroyable {

	name: string;

	load(gl: WebGLRenderingContext): Promise<any>;

	update(dt: number, pressedKeyMap: Map<number, boolean>, changeScene: (Scene) => void);

	render(gl: WebGLRenderingContext, w: number, h: number, dt: number);

}
