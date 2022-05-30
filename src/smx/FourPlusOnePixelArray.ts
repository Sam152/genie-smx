import PaletteCollection from "../palette/PaletteCollection";

export default class FourPlusOnePixelArray {
    private buffer: Uint8Array;
    private palettes: PaletteCollection;
    private paletteNumber: number;
    public pixels: Array<[number, number, number]>;

    constructor(paletteNumber: number, buffer: Uint8Array, palettes: PaletteCollection) {
        this.buffer = buffer;
        this.palettes = palettes;
        this.paletteNumber = paletteNumber;
        this.pixels = [];
        this.parseBuffer();
    }

    parseBuffer() {
        const palette = this.palettes.byNumber(this.paletteNumber);

        for (let index = 0; index < this.buffer.length; index += 5) {
            const lastByte = this.buffer[index + 4];
            const [
                px1Section,
                px2Section,
                px3Section,
                px4Section,
            ] = [
                this.extractTwoBits(lastByte, 0) * 256,
                this.extractTwoBits(lastByte, 2) * 256,
                this.extractTwoBits(lastByte, 4) * 256,
                this.extractTwoBits(lastByte, 6) * 256,
            ];
            this.pixels.push(
                palette[this.buffer[index] + px1Section],
                palette[this.buffer[index + 1] + px2Section],
                palette[this.buffer[index + 2] + px3Section],
                palette[this.buffer[index + 3] + px4Section],
            );
        }
        // try http://marcodiiga.github.io/rgba-to-rgb-conversion
        console.log(this.pixels);
    }

    blendWithBg() {

    }

    extractTwoBits(number: number, position: number): number {
        return 0b11 & (number >> position);
    }
}
