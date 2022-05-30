// @todo, could add support for a node.js version of this, @see genie-slp.
export default function createImageData(width: number, height: number) {
    const canvas = document.createElement('canvas');
    return canvas.getContext('2d')!.createImageData(width, height);
}
