import struct, {SmxStruct} from "./struct";
import createImageData from "../helper/createImageData";
import Commands from "./Commands";
import PaletteCollection from "../palette/PaletteCollection";

export default class Smx {
    private buffer: Buffer;
    private parsed: SmxStruct;

    private writtenPixelBytes!: number;
    private consumedPixels!: number;
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

    getFramesCount(): number {
        return this.parsed.frames.length;
    }

    renderFrame (frameIdx: number, player: number, outline: boolean) {
        this.writtenPixelBytes = 0;
        this.consumedPixels = 0;
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
                this.repeat(pixels, () => this.fillPlayerPixel(player));
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
        const pixelValue = this.imageLayer.pixelData.pixels[this.consumedPixels];
        this.consumedPixels++;

        const alpha = pixelValue[3] / 255;
        this.pixels[this.writtenPixelBytes++] = pixelValue[0] * alpha;
        this.pixels[this.writtenPixelBytes++] = pixelValue[1] * alpha;
        this.pixels[this.writtenPixelBytes++] = pixelValue[2] * alpha;
        this.pixels[this.writtenPixelBytes++] = 255;
    }

    fillPlayerPixel(player: number) {
        const pixelValue = this.imageLayer.pixelData.playerPixels[player][this.consumedPixels];
        this.consumedPixels++;

        this.pixels[this.writtenPixelBytes++] = pixelValue[0];
        this.pixels[this.writtenPixelBytes++] = pixelValue[1];
        this.pixels[this.writtenPixelBytes++] = pixelValue[2];
        this.pixels[this.writtenPixelBytes++] = 255;
    }

    fillTransparentPixel() {
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
    }

    fillRandomPixel() {
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
        this.pixels[this.writtenPixelBytes++] = 255;
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
        this.pixels.fill(0, this.writtenPixelBytes, this.writtenPixelBytes + spacing * 4);
        this.writtenPixelBytes += spacing * 4;
    }

    addRightSpacing() {
        const spacing = this.imageLayer.layerData.layerRowEdge[this.yIndex].rightSpacing;
        this.pixels.fill(0, this.writtenPixelBytes, this.writtenPixelBytes + spacing * 4);
        this.writtenPixelBytes += spacing * 4;
    }

}
