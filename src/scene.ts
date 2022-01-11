import {Destroyable} from "./render/utils/destroyable";


export interface Scene extends Destroyable {

    init(gl: WebGLRenderingContext): Promise<any>

    update(dt: number, pressedKeyMap: Map<number, boolean>, changeScene: (Scene) => void)

    render(gl: WebGLRenderingContext, dt: number)

}
