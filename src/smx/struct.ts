import getBit from "../helper/getBit";
import {Buffer} from "buffer";

const Struct = require('awestruct');
const t = Struct.types;

export const smxStruct = Struct({
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

        layers: t.array(function (struct: any) {
            return getBit(struct.frameType, 0) + getBit(struct.frameType, 1) + getBit(struct.frameType, 2)
        }, Struct({
            width: t.uint16,
            height: t.uint16,
            centerX: t.int16,
            centerY: t.int16,
            layerBytesLength: t.uint32,
            unknown: t.uint32,

            layerData: t.buffer(function (struct: any) {
                return struct.layerBytesLength
            }),
        }))
    }))
});

export function parseCommands (commandBuffer: Buffer) {
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
export const mainGraphicStruct = (frameHeight: number) => {
    return Struct({
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
    })
}

// The struct used for outlines and shadows.
export const secondaryGraphicStruct = (frameHeight: number) => {
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
