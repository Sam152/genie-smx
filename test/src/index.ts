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

  let frame = 0;
  setInterval(async () => {

    const imageData = smx.renderFrame(frame % smx.getFramesCount(), 1, false);
    const bitmap = await createImageBitmap(imageData);

    ctx.clearRect(0,0,500,500)
    ctx.drawImage(bitmap, 0, 0);

    frame++;

  }, 20);
}

start();
