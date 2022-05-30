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
    private drawingLayer!: any;
    private imageData!: ImageData;
    private pixels!: Uint8ClampedArray;
    private palettes: PaletteCollection;
    private spacing: any;
    private yPixels: number;

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
        this.drawingLayer = this.frame.layers[0];
        this.spacing = this.drawingLayer.layerData.layerRowEdge;

        this.imageData = createImageData(this.drawingLayer.width, this.drawingLayer.height)
        this.pixels = this.imageData.data;

        this.addLeftSpacing();
        this.drawingLayer.commands.forEach(({command, pixels}: any) => {
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

    renderShadow (frameIdx: number) {
        this.writtenPixelBytes = 0;
        this.yIndex = 0;
        this.yPixels = 0;

        this.frame = this.parsed.frames[frameIdx]!;
        this.drawingLayer = this.frame.layers[1];

        this.imageData = createImageData(this.drawingLayer.width, this.drawingLayer.height)
        this.pixels = this.imageData.data;

        this.spacing = this.drawingLayer.layerData.layerRowEdge;

        console.log(this.spacing);
        console.log(this.frame);


        // https://github.com/SFTtech/openage/blob/1988f40a0fcc30d356150ac9e3f0cc9993cad04d/openage/convert/value_object/read/media/smx.pyx#L882
        this.addLeftSpacing();
        for (let shadowCommandIndex = 0; shadowCommandIndex < this.drawingLayer.layerData.commandArray.length;) {
            const commandByte = this.drawingLayer.layerData.commandArray[shadowCommandIndex];
            shadowCommandIndex++;

            const lastTwoBits = commandByte & 3;
            const pixels = (commandByte >> 2) + 1;

            if (lastTwoBits === Commands.Skip) {
                console.log('Skip', pixels, 'pixels');
                this.repeat(pixels, this.fillTransparentPixel.bind(this));
            }
            else if (lastTwoBits === Commands.Draw) {
                console.log('Draw', pixels, 'pixels');
                const alphaBytes = this.drawingLayer.layerData.commandArray.slice(shadowCommandIndex, shadowCommandIndex + pixels);
                alphaBytes.forEach((alphaByte: number) => {
                    this.fillAlphaPixel(alphaByte);
                });
                shadowCommandIndex += pixels;
            }
            else if (lastTwoBits === Commands.EndRow) {
                this.addRightSpacing();
                this.yIndex++;

                if (this.yPixels === this.drawingLayer.width - 1) {
                    this.fillTransparentPixel();
                }

                console.log('resetting y pixels', this.yPixels);
                this.yPixels = 0;

                let peekedSpacing = this.spacing[this.yIndex] ? this.spacing[this.yIndex].leftSpacing : 0;
                while (peekedSpacing === -1) {
                    this.addLeftSpacing();
                    this.yIndex++;
                    this.yPixels = 0;
                    peekedSpacing = this.spacing[this.yIndex] ? this.spacing[this.yIndex].leftSpacing : 0;
                }

                console.log('End row');
                this.addLeftSpacing();
            }
            else {
                console.error('Command not recognised', lastTwoBits);
            }
        }

        console.log('Total shadow pixels', this.writtenPixelBytes / 4);
        console.log(this.pixels);

        return this.imageData;
    }

    fillPixel() {
        const pixelValue = this.drawingLayer.pixelData.pixels[this.consumedPixels];
        this.consumedPixels++;
        this.yPixels++;

        const alpha = pixelValue[3] / 255;
        this.pixels[this.writtenPixelBytes++] = pixelValue[0] * alpha;
        this.pixels[this.writtenPixelBytes++] = pixelValue[1] * alpha;
        this.pixels[this.writtenPixelBytes++] = pixelValue[2] * alpha;
        this.pixels[this.writtenPixelBytes++] = 255;
    }

    fillRandomPixel() {
        this.yPixels++;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
    }

    fillAlphaPixel(alpha: number) {
        this.yPixels++;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = alpha;
    }

    fillPlayerPixel(player: number) {
        const pixelValue = this.drawingLayer.pixelData.playerPixels[player][this.consumedPixels];
        this.consumedPixels++;
        this.yPixels++;

        this.pixels[this.writtenPixelBytes++] = pixelValue[0];
        this.pixels[this.writtenPixelBytes++] = pixelValue[1];
        this.pixels[this.writtenPixelBytes++] = pixelValue[2];
        this.pixels[this.writtenPixelBytes++] = 255;
    }

    fillTransparentPixel() {
        this.yPixels++;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
    }

    repeat(n: number, func: () => void) {
        Array(n).fill(0).map(func);
    }

    addLeftSpacing() {
        // When drawing the last row, no left spacing will exist.
        if (!this.spacing[this.yIndex]) {
            return;
        }
        let spacing = this.spacing[this.yIndex].leftSpacing;

        if (spacing === -1) {
            spacing = this.drawingLayer.width;
            console.log('negative spacing');
        }

        console.log('left space index', this.yIndex, 'spacing', spacing, 'pixels');
        this.pixels.fill(0, this.writtenPixelBytes, this.writtenPixelBytes + spacing * 4);
        this.writtenPixelBytes += spacing * 4;
        this.yPixels += spacing;
    }

    addRightSpacing() {
        let spacing = this.spacing[this.yIndex].rightSpacing;

        if (spacing === -1) {
            spacing = 0;
        }

        this.yPixels += spacing;

        console.log('right space index', this.yIndex, 'spacing', spacing, 'pixels');
        this.pixels.fill(0, this.writtenPixelBytes, this.writtenPixelBytes + spacing * 4);
        this.writtenPixelBytes += spacing * 4;
    }

}
