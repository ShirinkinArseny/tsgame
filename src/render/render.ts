import {Font, FontStyle} from "./font";

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

let font: Font

export const prepareRender = () => {
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    context = canvas.getContext("2d");
    font = new Font();
    return Promise.all([
        font.load()
    ])
}

const reapplyWindowSize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    return [w, h];
}

const time = () => new Date().getTime();

let prev = time();
let fps = 0;

export const doRender = () => {
    const [w, h] = reapplyWindowSize();
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, w, h);

    let now = time();
    let diff = now - prev;
    prev = now;
    const currentFps = fps * 0.98 + (1000 / diff) * 0.02;
    fps = currentFps;

    font.drawText(context, "FPS: "+currentFps,
        10, 200,
        4,
        FontStyle.BOLD
    )

    let d = (now % 10000) / 10000;
    let t = Math.abs(d * 600 - 300);

    font.drawText(context, "Hello world!",
        10 + t, 100,
        2,
        FontStyle.SEMIBOLD
    )

    font.drawText(context, "Eye-fuckery with",
        10 + t, 150,
        2,
        FontStyle.NORMAL
    )
    font.drawText(context, "HELLISH",
        315 + t, 150,
        2,
        FontStyle.BOLD
    )
    font.drawText(context, "FONT",
        455 + t, 150,
        2,
        FontStyle.ITALIC
    )


}
