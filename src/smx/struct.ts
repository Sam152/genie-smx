import getBit from "../helper/getBit";
import {Buffer} from "buffer";
import Commands from "./Commands";
import PaletteCollection from "../palette/PaletteCollection";
import FourPlusOnePixelArray from "./FourPlusOnePixelArray";

const Struct = require('awestruct');
const t = Struct.types;

const smxStruct = Struct({
    fileDescriptor: t.string(4),
    probablyVersion: t.int16,
    numberFrames: t.int16,
    fileSizeSmx: t.int32,
    fileSizeSmp: t.int32,
    comment: t.string(16),

    frames: t.array('numberFrames', Struct({
        frameType: t.uint8,
        paletteNumber: t.uint8,
        possibleUncompressedSize: t.uint32,
        layers: t.array((struct: any) => getBit(struct.frameType, 0) + getBit(struct.frameType, 1) + getBit(struct.frameType, 2),
            Struct({
                width: t.uint16,
                height: t.uint16,
                centerX: t.int16,
                centerY: t.int16,
                layerBytesLength: t.uint32,
                unknown: t.uint32,
                layerData: t.buffer('layerBytesLength'),
            }))
    }))
});

function parseCommands(commandBuffer: Buffer) {
    const commandList: Array<any> = []
    commandBuffer.forEach(commandByte => {
        const lastTwoBits = commandByte & 3
        const pixels = (commandByte >> 2) + 1
        commandList.push({
            command: lastTwoBits,
            pixels: pixels,
        })
    })
    return commandList
}

// The struct used for the main graphics data.
const mainStructs: Record<number, typeof Struct> = {};
function mainGraphicStruct(frameHeight: number) {
    if (mainStructs[frameHeight]) {
        return mainStructs[frameHeight];
    }
    mainStructs[frameHeight] = Struct({
        layerRowEdge: t.array(frameHeight, Struct({
                leftSpacing: t.int16,
                rightSpacing: t.int16,
            })
        ),
        commandArrayLength: t.uint32,
        pixelDataArrayLength: t.uint32,
        commandArray: t.buffer('commandArrayLength'),
        pixelDataArray: t.buffer(function (struct: any) {
            return struct.pixelDataArrayLength;
        }),
    });
    return mainStructs[frameHeight];
}

// The struct used for outlines and shadows.
function secondaryGraphicStruct(frameHeight: number) {
    return Struct({
        layerRowEdge: t.array(frameHeight, Struct({
                leftSpacing: t.int16,
                rightSpacing: t.int16,
            })
        ),
        commandArrayLength: t.uint32,
        commandArray: t.buffer('commandArrayLength'),
    })
}

export type MainImageLayerStruct = {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    layerBytesLength: number;
    layerType: "main";
    commands: Array<{ pixels: number; command: Commands; }>;
    pixelData: FourPlusOnePixelArray;
}

export type SecondaryImageLayerStruct = {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    layerBytesLength: number;
    layerType: "secondary";
    commands: Array<{ pixels: number; command: Commands; }>;
}

export type SmxFrame = {
    frameType: number;
    paletteNumber: number;
    possibleUncompressedSize: number;
    layers: [MainImageLayerStruct, SecondaryImageLayerStruct?, SecondaryImageLayerStruct?];
};

export type SmxStruct = {
    fileDescriptor: string;
    fileSizeSmp: number;
    fileSizeSmx: number;
    numberFrames: number;
    probablyVersion: number;
    frames: Array<SmxFrame>
};

export default function struct(buffer: Buffer, palettes: PaletteCollection): SmxStruct {
    const parsed = smxStruct(buffer);
    parsed.frames.map((frame: any) => {
        frame.layers = frame.layers.map((layer: any, index: number) => {
            // Conditionally parse the graphics layers of each frame. The first frame will always be the main
            // graphics layer, while the next two (if they exist) will be the shadows and outline.
            if (index === 0) {
                const parsed = mainGraphicStruct(layer.height)(layer.layerData);
                const commands = parseCommands(parsed.commandArray);
                return {
                    ...layer,
                    layerData: parsed,
                    pixelData: new FourPlusOnePixelArray(frame.paletteNumber, parsed.pixelDataArray, palettes),
                    commands: commands,
                    layerType: 'main',
                }
            } else {
                return {
                    ...layer,
                    layerData: secondaryGraphicStruct(layer.height)(layer.layerData),
                    layerType: 'secondary',
                }
            }
        });
        return frame;
    });
    return parsed;
}
