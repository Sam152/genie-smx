export default function createImageData(width: number, height: number) {
    const canvas = document.createElement('canvas');
    return canvas.getContext('2d')!.createImageData(width, height);
}
