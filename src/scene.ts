


export interface Scene {

    init(gl: WebGLRenderingContext): Promise<void>

    destroy(gl: WebGLRenderingContext)

    update(dt: number, pressedKeyMap: Map<number, boolean>, changeScene: (Scene) => void)

    render(gl: WebGLRenderingContext, dt: number)

}
