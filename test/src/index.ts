import Smx, {PaletteCollectionFactory} from "genie-smx";

async function createSmx() {
    const palettes = await PaletteCollectionFactory.fromHttp('./static/palettes');
    const asset = await fetch(`./static/u_arc_crossbowman_decayA_x2.smx`).then((response) => response.arrayBuffer())
    console.time('Generating SMX');
    const smx = new Smx(new Buffer(asset), palettes);
    console.timeEnd('Generating SMX');

    console.time('Rendering frames');
    for (let i =0; i < smx.getFramesCount();i++) {
        if (smx.hasShadow(i)) {
            const shadow = smx.renderShadow(i);
            await createImageBitmap(shadow);
        }
        const imageData = smx.renderFrame(i, 8);
        await createImageBitmap(imageData);
    }
    console.timeEnd('Rendering frames');

    return smx;
}

async function start() {
    const smx = await createSmx();

    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    let frame = 10;
    setInterval(async () => {
        ctx.clearRect(0, 0, 800, 800);

        const position = [150, 150];

        const frameNumber = frame % smx.getFramesCount();

        const frameData = smx.getFrame(frameNumber);

        if (smx.hasShadow(frameNumber)) {
            const shadow = smx.renderShadow(frameNumber);
            const shadowBitmap = await createImageBitmap(shadow);
            ctx.drawImage(
                shadowBitmap,
                position[0] - frameData.layers[1]!.centerX,
                position[1] - frameData.layers[1]!.centerY,
            );
        }

        const imageData = smx.renderFrame(frameNumber, 8);
        const bitmap = await createImageBitmap(imageData);
        ctx.drawImage(
            bitmap,
            position[0] - frameData.layers[0].centerX,
            position[1] - frameData.layers[0].centerY,
        );

        frame++;
    }, 20);
}

start();
