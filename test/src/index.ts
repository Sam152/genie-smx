import Smx, {PaletteCollectionFactory} from "genie-smx";

async function createSmx() {
  const palettes = await PaletteCollectionFactory.fromHttp('/static/palettes');
  const asset = await fetch(`./static/u_arc_crossbowman_walkA_x2.smx`).then((response) => response.arrayBuffer())
  const smx = new Smx(new Buffer(asset), palettes);
  return smx;
}

async function start() {
  const smx = await createSmx();

  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  let frame = 10;
  setInterval(async () => {

  ctx.clearRect(0,0,500,500);

  const position = [150, 150];

  const frameData = smx.getFrame(frame % smx.getFramesCount());

  const shadow = smx.renderShadow(frame % smx.getFramesCount());
  const shadowBitmap = await createImageBitmap(shadow);
    ctx.drawImage(
        shadowBitmap,
        position[0] - frameData.layers[1]!.centerX,
        position[1] - frameData.layers[1]!.centerY,
    );

  const imageData = smx.renderFrame(frame % smx.getFramesCount(), 8);
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
