import Canvas from '../src';

const canvas = new Canvas({
  xPixels: 28,
  yPixels: 28,
  width: 400,
  height: 400,
});

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
