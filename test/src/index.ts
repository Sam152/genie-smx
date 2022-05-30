import Smx, {PaletteCollectionFactory} from "genie-smx";


async function render() {

  const palettes = await PaletteCollectionFactory.fromHttp('/static/palettes');

  console.log(palettes);

  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const asset = await fetch(`./static/u_arc_crossbowman_walkA_x2.smx`).then((response) => response.arrayBuffer())

  const smx = new Smx(new Buffer(asset), palettes);
  //
  // const palette = new Palette(new Buffer(paletteArrayBuffer));
  const imageData = smx.renderFrame(0, 1, false);

  const bitmap = await createImageBitmap(imageData);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
}

render();
