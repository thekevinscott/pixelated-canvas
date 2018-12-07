import Canvas from '../src';
console.log('canvas', canvas);

const canvas = new Canvas();
const container = document.getElementById('canvas');
while (container.firstChild) {
  container.removeChild(container.firstChild);
}
canvas.render(container);

document.getElementById('reset').onclick = () => {
  canvas.reset();
}

document.getElementById('brush').onchange = (e) => {
  canvas.setBrushSize(e.target.value);
}

let moving = false;
document.getElementById('pixel').onmousedown = () => moving = true;
document.getElementById('pixel').onmouseup = () => moving = false;
document.getElementById('pixel').onmousemove = (e) => {
  if (!moving) { return; }
  canvas.setPixelSize(e.target.value);
}
document.getElementById('pixel').onclick = e => canvas.setPixelSize(e.target.value);
