import PaletteCollection from "../palette/PaletteCollection";

export default class FourPlusOnePixelArray {
    private buffer: Uint8Array;
    private palettes: PaletteCollection;

    constructor(buffer: Uint8Array, palettes: PaletteCollection) {
        this.buffer = buffer;
        this.palettes = palettes;
    }

}
