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

  const imageData = smx.renderFrame(frame % smx.getFramesCount(), 8, false);
  const bitmap = await createImageBitmap(imageData);
  ctx.drawImage(bitmap, 0, 0);

  const shadow = smx.renderShadow(frame % smx.getFramesCount());
  const shadowBitmap = await createImageBitmap(shadow);
  ctx.drawImage(shadowBitmap, 0, 0);

  frame++;

  }, 100);
}

start();
