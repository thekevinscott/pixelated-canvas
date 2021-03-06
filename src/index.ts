import * as Color from 'color';

const makeElement = (type: string = 'div', opts = {}) => {
  const el = document.createElement(type);
  Object.keys(opts).forEach(key => {
    el[key] = opts[key];
  });
  return el;
};

const BACKGROUND_COLORS = [
  35,
  0,
];
const PAINT_COLOR = 255;

interface IProps {
  width?: number;
  height?: number;
  xPixels?: number;
  yPixels?: number;
}

interface IPoint {
  x: number;
  y: number;
}

class Canvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseIsDown: boolean = false;
  private xPixels: number = 10;
  private yPixels: number = 10;
  private pixels: number[];
  private width: number = 560;
  private height: number = 560;
  private callbacks: {
    [index: string]: Function;
  } = {};
  // private lastE:MouseEvent;

  constructor(props: IProps = {}) {
    if (props.width) {
      this.width = props.width;
    }
    if (props.height) {
      this.height = props.height;
    }
    if (props.xPixels) {
      this.xPixels = props.xPixels;
    }
    if (props.yPixels) {
      this.yPixels = props.yPixels;
    }

    this.canvas = makeElement('canvas', {
      height: this.height,
      width: this.width,
    }) as HTMLCanvasElement;

    const ctx = this.canvas.getContext('2d');

    if (ctx === null) {
      throw new Error('Context is null; your browser does not support canvas');
    }
    this.ctx = ctx;

    this.canvas.onmousedown = this._onMouseDown;
    window.onmouseup = this._onMouseUp;
    this.canvas.onmousemove = this._onMouseMove;
    this.reset();
  }

  drawBackground = () => {
    for (let row = 0; row < this.yPixels; row++) {
      for (let col = 0; col < this.xPixels; col++) {
        const color = BACKGROUND_COLORS[(col + row + 1) % 2];
        this.drawRect(
          color,
          col,
          row,
        );
      }
    }
  }

  onMouseDown = (callback: Function) => this.callbacks.onMouseDown = callback;
  onMouseUp = (callback: Function) => this.callbacks.onMouseUp = callback;
  onMouseMove = (callback: Function) => this.callbacks.onMouseMove = callback;

  getCanvasData = () => this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

  drawPixel = ({ x, y }: IPoint, color = PAINT_COLOR) => {
    x -= 10;
    y -= 10;
    if (x > this.canvas.width || y > this.canvas.height || x < 0 || y < 0) {
      return;
    }

    const xPixelSize = this.width / this.xPixels;
    const yPixelSize = this.height / this.yPixels;
    // convert e event to pixelated pixels
    x = Math.floor(x / xPixelSize);
    y = Math.floor(y / yPixelSize);

    for (let row = y - 1; row <= y + 1; row++) {
      for (let col = x - 1; col <= x + 1; col++) {
        if (col >= 0 && row >= 0 && col < this.xPixels && row < this.yPixels) {
          const index = (row * this.xPixels) + col;
          let pixelColor = this.pixels[index];
          if (row === y && col === x) {
            pixelColor += color;
          } else if (row === y || col === x) {
            pixelColor += color * 0.2;
          } else {
            pixelColor += color * 0.1;
          }

          if (pixelColor > 255) {
            pixelColor = 255;
          } else if (pixelColor < 0) {
            pixelColor = 0;
          }

          this.pixels[index] = pixelColor;
          this.drawRect(pixelColor, col, row);
        }
      }
    }
  }

  getPixels = () => this.pixels.map(pixel => {
    const c = Color.rgb(pixel);
    return c.red() * c.alpha();
  });

  drawRect = (color: number, x: number, y: number, width: number = this.width / this.xPixels, height: number = this.height / this.yPixels) => {
    this.ctx.fillStyle = `rgba(${color}, ${color}, ${color}, 1)`;
    this.ctx.fillRect(x * width, y * height, width, height)
  }

  updateCanvasData = (data: ImageData) => this.ctx.putImageData(data, 0, 0, 0, 0, this.canvas.width, this.canvas.height);

  getPosition = (e: MouseEvent): IPoint => {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.x - rect.left,
      y: e.y - rect.top,
    };
  }

  _onMouseDown = (e: MouseEvent) => {
    this.mouseIsDown = true;
    // this.lastE = e;
    this.drawPixel(this.getPosition(e));
    if (this.callbacks.onMouseDown) {
      this.callbacks.onMouseDown(e);
    }
  }

  _onMouseUp = (e: MouseEvent) => {
    this.mouseIsDown = false;
    if (this.callbacks.onMouseUp) {
      this.callbacks.onMouseUp(e);
    }
  }

  _onMouseMove = (e: MouseEvent) => {
    if (this.ctx && this.mouseIsDown) {
      // this.lastE = e;
      // console.log('lasts and current');
      // console.log(this.lastE.x, this.lastE.y, e.x, e.y);
      this.drawPixel(this.getPosition(e));
      if (this.callbacks.onMouseMove) {
        this.callbacks.onMouseMove(e);
      }
    }
  }

  setPixelSize = (xPixels: number, yPixels: number) => {
    if (this.xPixels !== xPixels || this.yPixels !== yPixels) {
      this.xPixels = xPixels;
      this.yPixels = yPixels;
      this.drawBackground();
    }
  };

  render(target: HTMLElement) {
    target.appendChild(this.canvas);
  }

  reset = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.pixels = Array(this.xPixels * this.yPixels).fill(0);
  }
}

export default Canvas;
