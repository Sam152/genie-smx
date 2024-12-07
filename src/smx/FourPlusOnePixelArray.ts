import PaletteCollection from "../palette/PaletteCollection";

export default class FourPlusOnePixelArray {
    private buffer: Uint8Array;
    private palettes: PaletteCollection;
    private paletteNumber: number;
    public playerPalettes: Record<number, number>;

    constructor(paletteNumber: number, buffer: Uint8Array, palettes: PaletteCollection) {
        this.buffer = buffer;
        this.palettes = palettes;
        this.paletteNumber = paletteNumber;
        this.playerPalettes = {
            1: 55,
            2: 56,
            3: 57,
            4: 58,
            5: 60,
            6: 61,
            7: 62,
            8: 59,
        };
    }

    pixelAt(targetIndex: number, player?: number): [number, number, number] | null {
        const palette = this.palettes.palettes[player ? this.playerPalettes[player] : this.paletteNumber];

        const groupIndex = (targetIndex >> 2);
        const offsetWithinGroup = targetIndex & 3;
        const baseIndex = groupIndex * 5;
        const lastByte = this.buffer[baseIndex + 4];

        if (offsetWithinGroup === 0) {
            return palette[this.buffer[baseIndex] + ((lastByte & 0b11) << 8)];
        } else if (offsetWithinGroup === 1) {
            return palette[this.buffer[baseIndex + 1] + (((lastByte >> 2) & 0b11) << 8)];
        } else if (offsetWithinGroup === 2) {
            return palette[this.buffer[baseIndex + 2] + (((lastByte >> 4) & 0b11) << 8)];
        } else {
            return palette[this.buffer[baseIndex + 3] + (((lastByte >> 6) & 0b11) << 8)];
        }
    }
}
