import PaletteCollection from "./PaletteCollection";
const Palette = require('jascpal');

const palettes = {
    0: 'original',
    1: 'clf_pal',
    2: 'pal_2',
    3: 'pal_3',
    4: 'pal_4',
    5: 'pal_5',
    6: 'pal_6',
    16: 'b_dark',
    17: 'b_orie',
    18: 'b_seas',
    19: 'b_ceas',
    20: 'b_east',
    21: 'b_west',
    22: 'b_asia',
    23: 'b_meso',
    24: 'b_slav',
    25: 'b_afri',
    26: 'b_indi',
    27: 'b_medi',
    28: 'b_scen',
    29: 'b_scen',
    30: 'n_trees',
    31: 'n_trees',
    // 32: 'n_alpha_ground', .palx
    // 33: 'n_alpha_underwater', .palx
    40: 'n_cliffs',
    41: 'effects_2',
    42: 'b_scen',
    50: 'playercolor_white',
    54: 'effects',
    55: 'playercolor_blue',
    56: 'playercolor_red',
    57: 'playercolor_green',
    58: 'playercolor_yellow',
    59: 'playercolor_orange',
    60: 'playercolor_teal',
    61: 'playercolor_purple',
    62: 'playercolor_grey',
    // 63: 'modulation_colors', .palx
};

export default class PaletteCollectionFactory {

    static fromHttp(uri: string): Promise<PaletteCollection> {
        const paletteRequests = Object.keys(palettes).map((key) => {
            const objectKey = parseInt(key);
            // @ts-ignore
            const filename = palettes[objectKey];
            return fetch(`${uri}/${filename}.pal`).then((response) => response.arrayBuffer()).then(arrayBuffer => ({
                key: objectKey,
                buffer: arrayBuffer,
            }));
        });

        return Promise.all(paletteRequests).then(loadedPalettes => {
            const palettes = loadedPalettes.reduce((accumulator, value) => {
                return {
                    [value.key]: new Palette(new Buffer(value.buffer)),
                    ...accumulator,
                }
            }, {});
            return new PaletteCollection(palettes);
        });
    }

}
