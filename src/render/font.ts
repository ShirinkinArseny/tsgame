export enum FontStyle {
    NORMAL, SEMIBOLD, BOLD, ITALIC
}

const alphabet = Object.fromEntries([
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
            line.map((symbol, symbolIdx) => [symbol, [lineIdx, symbolIdx]])
        )
        .flat()
)

const letterSize = 10;
const betweenLetterSize = 9;

export class Font {

    private font: HTMLImageElement;

    load() {
        return new Promise<void>((res, rej) => {
            const img = new Image();
            img.addEventListener('load', () => {
                this.font = img;
                res();
            }, false);
            img.src = '/assets/font.png';
        });
    }

    private drawSymbol(
        context: CanvasRenderingContext2D,
        symbol: string, x: number, y: number,
        scale: number,
        style: FontStyle
    ) {
        const letter = alphabet[symbol.toUpperCase()];
        if (!letter) return;
        const [lineIdx, symbolIdx] = letter;
        context.drawImage(
            this.font,
            symbolIdx * letterSize,
            lineIdx * letterSize + style * 7 * letterSize,
            letterSize,
            letterSize,
            x,
            y,
            letterSize * scale,
            letterSize * scale
        )
    }

    drawText(
        context: CanvasRenderingContext2D,
        text: string, x: number, y: number,
        scale: number = 1,
        style: FontStyle = FontStyle.NORMAL,
    ) {
        for (let i = 0; i < text.length; i++) {
            this.drawSymbol(context, text[i], x + i * betweenLetterSize * scale, y, scale, style)
        }
    }

}
