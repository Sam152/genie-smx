const Palette = require('jascpal');

export default class PaletteCollection {
    public palettes: { [p: number]: typeof Palette };

    constructor(palettes: {[key: number]: typeof Palette}) {
        this.palettes = palettes;
    }

    byNumber(num: number) {
        return this.palettes[num];
    }

}
