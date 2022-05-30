import PaletteCollection from "../palette/PaletteCollection";

export default class FourPlusOnePixelArray {
    private buffer: Uint8Array;
    private palettes: PaletteCollection;
    private paletteNumber: number;
    public pixels: Array<[number, number, number]>;
    public playerPixels: {
        [key: number]: Array<[number, number, number]>
    };

    constructor(paletteNumber: number, buffer: Uint8Array, palettes: PaletteCollection) {
        this.buffer = buffer;
        this.palettes = palettes;
        this.paletteNumber = paletteNumber;
        this.pixels = [];

        this.pixels = this.parseBuffer(this.paletteNumber);
        this.playerPixels = {
            1: this.parseBuffer(55),
            2: this.parseBuffer(56),
            3: this.parseBuffer(57),
            4: this.parseBuffer(58),
            5: this.parseBuffer(60),
            6: this.parseBuffer(61),
            7: this.parseBuffer(62),
            8: this.parseBuffer(59),
        };
    }

    parseBuffer(paletteNumber: number) {
        const pixels = [];
        const palette = this.palettes.byNumber(paletteNumber);

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
            pixels.push(
                palette[this.buffer[index] + px1Section],
                palette[this.buffer[index + 1] + px2Section],
                palette[this.buffer[index + 2] + px3Section],
                palette[this.buffer[index + 3] + px4Section],
            );
        }
        return pixels;
    }

    extractTwoBits(number: number, position: number): number {
        return 0b11 & (number >> position);
    }
}
