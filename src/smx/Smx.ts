import struct, {SmxStruct} from "./struct";
import createImageData from "../helper/createImageData";
import Commands from "./Commands";
import PaletteCollection from "../palette/PaletteCollection";

export default class Smx {
    private buffer: Buffer;
    private parsed: SmxStruct;

    private commandIndex!: number;
    private pixelsIndex!: number;
    private yIndex!: number;

    private frame!: any;
    private imageLayer!: any;
    private imageData!: ImageData;
    private pixels!: Uint8ClampedArray;
    private palettes: PaletteCollection;

    constructor (buffer: Buffer, palettes: PaletteCollection) {
        this.buffer = buffer
        this.palettes = palettes;
        this.parsed = struct(this.buffer, this.palettes);
    }

    renderFrame (frameIdx: number, player: number, outline: boolean) {
        this.commandIndex = 0;
        this.pixelsIndex = 0;
        this.yIndex = 0;

        this.frame = this.parsed.frames[frameIdx]!;
        this.imageLayer = this.frame.layers[0];

        this.imageData = createImageData(this.imageLayer.width, this.imageLayer.height)
        this.pixels = this.imageData.data;

        this.addLeftSpacing();
        this.imageLayer.commands.forEach(({command, pixels}: any) => {
            if (command === Commands.Draw) {
                this.repeat(pixels, this.fillPixel.bind(this));
            }
            if (command === Commands.DrawPlayer) {
                this.repeat(pixels, this.fillPixel.bind(this));
            }
            if (command === Commands.Skip) {
                this.repeat(pixels, this.fillTransparentPixel.bind(this));
            }
            if (command === Commands.EndRow) {
                this.addRightSpacing();
                this.yIndex++;
                this.addLeftSpacing();
            }
        });

        return this.imageData;
    }

    fillPixel() {
        // this.imageLayer.pixelDataArray
        const pixelValue = [100, 20, 35];

        this.pixels[++this.commandIndex] = pixelValue[0];
        this.pixels[++this.commandIndex] = pixelValue[1];
        this.pixels[++this.commandIndex] = pixelValue[2];
        this.pixels[++this.commandIndex] = 1;
    }

    fillRandomPixel() {
        this.pixels[++this.commandIndex] = Math.random() * 255;
        this.pixels[++this.commandIndex] = Math.random() * 255;
        this.pixels[++this.commandIndex] = Math.random() * 255;
        this.pixels[++this.commandIndex] = 1;
    }

    fillTransparentPixel() {
        this.pixels[++this.commandIndex] = 0;
        this.pixels[++this.commandIndex] = 0;
        this.pixels[++this.commandIndex] = 0;
        this.pixels[++this.commandIndex] = 0;
    }

    repeat(n: number, func: () => void) {
        Array(n).fill(0).map(func);
    }

    addLeftSpacing() {
        // When drawing the last row, no left spacing will exist.
        if (!this.imageLayer.layerData.layerRowEdge[this.yIndex]) {
            return;
        }
        const spacing = this.imageLayer.layerData.layerRowEdge[this.yIndex].leftSpacing;
        this.pixels.fill(0, this.commandIndex, this.commandIndex + spacing * 4);
        this.commandIndex += spacing * 4;
    }

    addRightSpacing() {
        const spacing = this.imageLayer.layerData.layerRowEdge[this.yIndex].rightSpacing;
        this.pixels.fill(0, this.commandIndex, this.commandIndex + spacing * 4);
        this.commandIndex += spacing * 4;
    }

}
