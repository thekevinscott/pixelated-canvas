import Canvas from '../src';

const pixels = 20;
const pixelSize = 30;
const size = pixelSize * pixels;

const canvas = new Canvas({
  width: size,
  height: size,
  xPixels: pixels,
  yPixels: pixels,
});

console.log(canvas.getPixels());

const container = document.getElementById('canvas');
while (container.firstChild) {
  container.removeChild(container.firstChild);
}
canvas.render(container);

document.getElementById('reset').onclick = () => {
  canvas.reset();
}

let moving = false;
document.getElementById('pixel').onmousedown = () => moving = true;
document.getElementById('pixel').onmouseup = () => moving = false;
document.getElementById('pixel').onmousemove = (e) => {
  if (!moving) { return; }
  canvas.setPixelSize(e.target.value, e.target.value);
}
document.getElementById('pixel').onclick = e => canvas.setPixelSize(e.target.value);
