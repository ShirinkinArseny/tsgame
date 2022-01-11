import {Destroyable} from "./utils/destroyable";
import {ImageTexture} from "./textures/imageTexture";
import {drawRect, Rect} from "./shapes/rect";
import {identity, ortho, rotate, translate} from "./matrices";
import {TexturedShader} from "./shaders/texturedShader";

export enum FontStyle {
    NORMAL, SEMIBOLD, BOLD, ITALIC
}

const alphabet: [string, number, number][] = [
    "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
    "",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "",
    "0123456789",
    "!\"#*()[]-_+=.,?%><:;/\\'",
    "─│┐┌└┘├┤┬┴"
]
    .map(s => s.split(""))
    .map((line, lineIdx) =>
        line.map((symbol, symbolIdx) => [symbol, lineIdx, symbolIdx] as [string, number, number])
    )
    .flat(1)

const letterSize = 10;
const betweenLetterSize = 9;
const fontBitmapSize = 640;
const fontBitmapSizeRel = letterSize / fontBitmapSize;

export class Font implements Destroyable {

    private gl: WebGLRenderingContext
    private fontImage: ImageTexture
    private mainRectangle: Rect
    private symbolRectangles: { [k: string]: Rect }
    private shader: TexturedShader

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.mainRectangle = new Rect(gl);
        this.shader = new TexturedShader(gl);
        this.symbolRectangles = Object.fromEntries(alphabet.map(([symbol, lineIdx, symbolIdx]) =>
            [
                symbol,
                new Rect(gl,
                    symbolIdx * fontBitmapSizeRel,
                    lineIdx * fontBitmapSizeRel,
                    (symbolIdx + 1) * fontBitmapSizeRel,
                    (lineIdx + 1) * fontBitmapSizeRel,
                )
            ]
        ))
        this.fontImage = new ImageTexture(gl, "/assets/font.png");
    }

    load() {
        return Promise.all([
            this.fontImage.load()
        ]);
    }

    destroy() {
        this.fontImage.destroy()
        this.mainRectangle.destroy()
        Object.values(this.symbolRectangles).forEach(r => r.destroy());
        this.shader.destroy()
    }

    private drawSymbol(
        symbol: string, x: number, y: number,
        style: FontStyle
    ) {
        const letter = this.symbolRectangles[symbol.toUpperCase()];
        if (!letter) return;
        this.shader.setMatrix(
            'modelMatrix',
            translate(identity(), [x, y, 0.0])
        );
        this.mainRectangle.bind(this.shader.getAttribute('aVertexPosition'));
        letter.bind(this.shader.getAttribute('aTexturePosition'));
        drawRect(this.gl);
    }

    drawText(
        text: string, x: number, y: number,
        style: FontStyle = FontStyle.NORMAL,
    ) {
        this.shader.useProgram();
        this.shader.set1i('u_texture', 0);

        this.shader.setMatrix(
            'projectionMatrix',
            ortho(-30.0, 30.0, 10.0, -10.0, 0.0, 100.0)
        );
        this.fontImage.bindTexture();
        for (let i = 0; i < text.length; i++) {
            this.drawSymbol(text[i], x + i, y, style)
        }
    }

}
