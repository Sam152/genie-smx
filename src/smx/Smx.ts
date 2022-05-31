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
    private yPixels!: number;

    constructor (buffer: Buffer, palettes: PaletteCollection) {
        this.buffer = buffer
        this.palettes = palettes;
        this.parsed = struct(this.buffer, this.palettes);
    }

    public getFramesCount(): number {
        return this.parsed.frames.length;
    }

    public getFrame(frameIdx: number) {
        return this.parsed.frames[frameIdx];
    }

    public getImageLayer(frameIdx: number) {
        return this.getFrame(frameIdx).layers[0];
    }

    public getShadowLayer(frameIdx: number) {
        return this.getFrame(frameIdx).layers[1];
    }

    getFrames() {
        return this.parsed.frames;
    }

    public renderFrame (frameIdx: number, player: number) {
        this.writtenPixelBytes = 0;
        this.consumedPixels = 0;
        this.yIndex = 0;
        this.yPixels = 0;

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
                this.peekEmptyRows();
                this.addLeftSpacing();
            }
        });

        return this.imageData;
    }

    public hasShadow(frameIdx: number): boolean {
        this.frame = this.parsed.frames[frameIdx]!;
        return typeof this.frame.layers[1] !== 'undefined';
    }

    public renderShadow (frameIdx: number) {
        this.writtenPixelBytes = 0;
        this.yIndex = 0;
        this.yPixels = 0;

        this.frame = this.parsed.frames[frameIdx]!;
        this.drawingLayer = this.frame.layers[1];

        this.imageData = createImageData(this.drawingLayer.width, this.drawingLayer.height)
        this.pixels = this.imageData.data;

        this.spacing = this.drawingLayer.layerData.layerRowEdge;

        this.addLeftSpacing();

        for (let shadowCommandIndex = 0; shadowCommandIndex < this.drawingLayer.layerData.commandArray.length;) {
            const commandByte = this.drawingLayer.layerData.commandArray[shadowCommandIndex];
            shadowCommandIndex++;

            const command = commandByte & 0b11;
            const pixels = (commandByte >> 2) + 1;

            if (command === Commands.Skip) {
                this.repeat(pixels, this.fillTransparentPixel.bind(this));
            }

            if (command === Commands.Draw) {
                const alphaBytes = this.drawingLayer.layerData.commandArray.slice(shadowCommandIndex, shadowCommandIndex + pixels);
                alphaBytes.forEach((alphaByte: number) => {
                    this.fillAlphaPixel(alphaByte);
                });
                shadowCommandIndex += pixels;
            }

            if (command === Commands.EndRow) {
                this.addRightSpacing();

                // Sometimes rows will miss drawing 1 pixel for some reason.
                if (this.yPixels === this.drawingLayer.width - 1) {
                    this.fillTransparentPixel();
                }

                this.yIndex++;
                this.yPixels = 0;

                // Peek empty rows, where an entire row is empty, no commands should be processed,
                // instead the y value should be incremented and transparent pixels should be written.
                this.peekEmptyRows();

                this.addLeftSpacing();
            }
        }

        return this.imageData;
    }

    private peekEmptyRows() {
        let peekedSpacing = this.spacing[this.yIndex] ? this.spacing[this.yIndex].leftSpacing : 0;
        while (peekedSpacing === -1) {
            const width = this.drawingLayer.width;
            this.pixels.fill(0, this.writtenPixelBytes, this.writtenPixelBytes + width * 4);
            this.writtenPixelBytes += width * 4;

            this.yIndex++;
            this.yPixels = 0;
            peekedSpacing = this.spacing[this.yIndex] ? this.spacing[this.yIndex].leftSpacing : 0;
        }
    }

    private fillPixel() {
        const pixelValue = this.drawingLayer.pixelData.pixels[this.consumedPixels];
        this.consumedPixels++;
        this.yPixels++;

        const alpha = pixelValue[3] / 255;
        this.pixels[this.writtenPixelBytes++] = pixelValue[0] * alpha;
        this.pixels[this.writtenPixelBytes++] = pixelValue[1] * alpha;
        this.pixels[this.writtenPixelBytes++] = pixelValue[2] * alpha;
        this.pixels[this.writtenPixelBytes++] = 255;
    }

    private fillRandomPixel() {
        this.yPixels++;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
        this.pixels[this.writtenPixelBytes++] = Math.random() * 255;
    }

    private fillAlphaPixel(alpha: number) {
        this.yPixels++;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = alpha;
    }

    private fillPlayerPixel(player: number) {
        const pixelValue = this.drawingLayer.pixelData.playerPixels[player][this.consumedPixels];
        this.consumedPixels++;
        this.yPixels++;

        this.pixels[this.writtenPixelBytes++] = pixelValue[0];
        this.pixels[this.writtenPixelBytes++] = pixelValue[1];
        this.pixels[this.writtenPixelBytes++] = pixelValue[2];
        this.pixels[this.writtenPixelBytes++] = 255;
    }

    private fillTransparentPixel() {
        this.yPixels++;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
        this.pixels[this.writtenPixelBytes++] = 0;
    }

    private repeat(n: number, func: () => void) {
        Array(n).fill(0).map(func);
    }

    private addLeftSpacing() {
        // When drawing the last row, no left spacing will exist.
        if (!this.spacing[this.yIndex]) {
            return;
        }
        let spacing = this.spacing[this.yIndex].leftSpacing;
        this.pixels.fill(0, this.writtenPixelBytes, this.writtenPixelBytes + spacing * 4);
        this.writtenPixelBytes += spacing * 4;
        this.yPixels += spacing;
    }

    private addRightSpacing() {
        let spacing = this.spacing[this.yIndex].rightSpacing;
        this.yPixels += spacing;
        this.pixels.fill(0, this.writtenPixelBytes, this.writtenPixelBytes + spacing * 4);
        this.writtenPixelBytes += spacing * 4;
    }

}
