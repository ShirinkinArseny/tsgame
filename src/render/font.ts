import {Destroyable} from "./utils/destroyable";
import {ImageTexture} from "./textures/imageTexture";
import {drawRect, Rect} from "./shapes/rect";
import {identity, ortho, scale, translate, Vec4} from "./matrices";
import {TexturedShader} from "./shaders/texturedShader";
import {splitImage} from "../splitImage";

export enum FontStyle {
    NORMAL, SEMIBOLD, BOLD, ITALIC
}


/*const alphabet: [string, number, number][] = [
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
    .flat(1)*/

const alphabet = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "1234567890.,:;=~'\"!$%^?*()[]<>_+-|/\\",
    "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
    "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
]

const spaceWidth = 0.4;

export type Text = {
    word: string,
    fontStyle: FontStyle
}[];

export class Font implements Destroyable {

    private readonly gl: WebGLRenderingContext
    private fontImage: ImageTexture
    private mainRectangle: Rect
    private symbolRectangles: { [k: string]: [number, Rect] }
    private shader: TexturedShader

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.mainRectangle = new Rect(gl);
        this.shader = new TexturedShader(gl);
        this.fontImage = new ImageTexture(gl, "/assets/images/font2.png");
    }

    load() {
        return Promise.all([
            this.fontImage.load()
                .then(i => {

                    const [ss, lines] = splitImage(i);
                    let scale = ss + 3;
                    const a = alphabet.map((line, lineIdx) => {
                        const bounds = lines[lineIdx];
                        return line.split("").map((symbol, symbolIdx) => {
                            const bound = bounds[symbolIdx];
                            if (!bound) {
                                throw new Error("WTF?")
                            }
                            const args = [
                                (bound[0]),
                                lineIdx * scale,
                                (bound[1] + 2),
                                ((lineIdx + 1) * scale - 2),
                            ]
                            const w = (bound[1] - bound[0] + 2) / (scale - 2);
                            return [symbol, [w, new Rect(
                                this.gl,
                                ...args.map(v => v / i.width)
                            )]]
                        })
                    }).flat(1)
                    this.symbolRectangles = Object.fromEntries(a)

                })
        ]);
    }

    destroy() {
        this.fontImage.destroy()
        this.mainRectangle.destroy()
        Object.values(this.symbolRectangles).flat().map(v => v[1]).forEach(r => r.destroy());
        this.shader.destroy()
    }

    private drawSymbol(
        symbol: string, x: number, y: number,
    ): number {
        const letter = this.symbolRectangles[symbol];
        if (!letter) return spaceWidth;
        this.shader.setMatrix(
            'modelMatrix',

                scale(translate(identity(),
                    [x, y, 0.0]
                ), [letter[0], 1.0, 1.0])
        );
        this.mainRectangle.bind(this.shader.getAttribute('aVertexPosition'));
        letter[1].bind(this.shader.getAttribute('aTexturePosition'));
        drawRect(this.gl);
        return letter[0];
    }

    private getStringWidth(str: string): number {
        return str.split("").map(s => {
            const ss = this.symbolRectangles[s];
            if (!ss) return spaceWidth;
            return ss[0];
        }).reduce((a, b) => a + b, 0);
    }

    private doDrawString(
        string: string, x: number, y: number,
        kerning: number
    ) {
        let xx = x;
        for (let i = 0; i < string.length; i++) {
            xx += this.drawSymbol(string[i], xx, y) * kerning;
        }
    }

    private initRenderingText(viewport: Vec4) {
        this.shader.useProgram();
        this.shader.setMatrix(
            'projectionMatrix',
            ortho(viewport[0], viewport[1], viewport[2], viewport[3], 0.0, 100.0)
        );
        this.fontImage.bindTexture();
    }

    drawString(
        text: string, x: number, y: number,
        viewport: Vec4,
        kerning = 1.0
    ) {
        this.initRenderingText(viewport);
        this.doDrawString(text, x, y, kerning)
    }

    drawText(
        text: Text,
        x: number, y: number, w: number,
        viewport: Vec4,
        kerning = 1.0
    ) {
        let xx = x;
        let yy = y;
        const x2 = x + w;
        this.initRenderingText(viewport);
        text.forEach(({word, fontStyle}) => {
            const w = this.getStringWidth(word);
            if (xx + w * kerning >= x + x2) {
                xx = x;
                yy++;
            }
            this.doDrawString(word, xx, yy, kerning);
            xx += (w + spaceWidth) * kerning;
        })

    }

}
