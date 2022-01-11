import {Destroyable} from "./utils/destroyable";
import {ImageTexture} from "./textures/imageTexture";
import {drawRect, Rect} from "./shapes/rect";
import {identity, ortho, scale, translate, Vec3, Vec4} from "./matrices";
import {splitImage} from "../splitImage";
import {LoadableShader} from "./shaders/loadableShader";

export enum FontStyle {
    NORMAL, BOLD
}

const fontStyles = [FontStyle.NORMAL, FontStyle.BOLD]

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
    private symbolRectangles: { [k: number]: { [k: string]: [number, Rect] } }
    private shader: LoadableShader

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.mainRectangle = new Rect(gl);
        this.shader = new LoadableShader(gl, "font");
        this.fontImage = new ImageTexture(gl, "font2.png");
    }

    load() {
        return Promise.all([
            this.shader.load(),
            this.fontImage.load()
                .then(i => {

                    const [ss, lines] = splitImage(i);
                    let scale = ss + 3;
                    const a = Object.fromEntries(
                        fontStyles.map((style, styleIdx) => [
                            style,
                            Object.fromEntries(
                                alphabet
                                    .map((line, lineIdx) => {
                                        const bounds = lines[lineIdx + styleIdx * alphabet.length];
                                        return line.split("").map((symbol, symbolIdx) => {
                                            const bound = bounds[symbolIdx];
                                            if (!bound) {
                                                throw new Error("WTF?")
                                            }
                                            const args = [
                                                (bound[0]),
                                                (lineIdx + styleIdx * alphabet.length) * scale,
                                                (bound[1] + 2),
                                                ((lineIdx + styleIdx * alphabet.length + 1) * scale - 2),
                                            ]
                                            const w = (bound[1] - bound[0] + 2) / (scale - 2);
                                            return [symbol, [w, new Rect(
                                                this.gl,
                                                ...args.map(v => v / i.width)
                                            )]]
                                        })
                                    })
                                    .flat(1)
                            )
                        ])
                    );
                    this.symbolRectangles = a;

                })
        ]);
    }

    destroy() {
        this.fontImage.destroy()
        this.mainRectangle.destroy()
        Object.values(this.symbolRectangles).flat()
            .map(v => Object.values(v))
            .flat(1)
            .map(v => v[1]).forEach(r => r.destroy());
        this.shader.destroy()
    }

    private drawSymbol(
        symbol: string, x: number, y: number, fontStyle: FontStyle
    ): number {
        const letter = this.symbolRectangles[fontStyle][symbol];
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

    private getStringWidth(str: string, fontStyle: FontStyle): number {
        return str.split("").map(s => {
            const ss = this.symbolRectangles[fontStyle][s];
            if (!ss) return spaceWidth;
            return ss[0];
        }).reduce((a, b) => a + b, 0);
    }

    private doDrawString(
        string: string, x: number, y: number,
        kerning: number, fontStyle: FontStyle
    ) {
        let xx = x;
        for (let i = 0; i < string.length; i++) {
            xx += this.drawSymbol(string[i], xx, y, fontStyle) * kerning;
        }
    }

    private initRenderingText(viewport: Vec4, color: Vec3) {
        this.shader.useProgram();
        this.shader.setMatrix(
            'projectionMatrix',
            ortho(viewport[0], viewport[1], viewport[2], viewport[3], 0.0, 100.0)
        );
        this.shader.setVector3f('color', color);
        this.fontImage.bindTexture();
    }

    drawString(
        text: string, x: number, y: number,
        fontStyle: FontStyle = FontStyle.NORMAL,
        color: Vec3 = [0, 0, 0],
        viewport: Vec4,
        kerning = 1.0
    ) {
        this.initRenderingText(viewport, color);
        this.doDrawString(text, x, y, kerning, fontStyle)
    }

    drawText(
        text: Text,
        x: number, y: number, w: number,
        color: Vec3 = [0, 0, 0],
        viewport: Vec4,
        kerning = 1.0,
        lineHeight = 1.0
    ) {
        let xx = x;
        let yy = y;
        const x2 = x + w;
        this.initRenderingText(viewport, color);
        text.forEach(({word, fontStyle}) => {
            const w = this.getStringWidth(word, fontStyle);
            if (xx + w * kerning >= x + x2) {
                xx = x;
                yy += lineHeight;
            }
            this.doDrawString(word, xx, yy, kerning, fontStyle);
            xx += (w + spaceWidth) * kerning;
        })

    }

}