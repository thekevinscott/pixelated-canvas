import * as Color from 'color';

const makeElement = (type: string = 'div', opts = {}) => {
  const el = document.createElement(type);
  Object.keys(opts).forEach(key => {
    el[key] = opts[key];
  });
  return el;
};

const BACKGROUND_COLORS: Color[] = [
  Color.rgb(...Array(3).fill(35)),
  Color.rgb(...Array(3).fill(0)),
];
const PAINT_COLOR: Color = Color.rgb(...Array(3).fill(255));

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
  private pixels: string[];
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

    this.pixels = Array(this.xPixels * this.yPixels).fill('rgba(0,0,0,0');

    const ctx = this.canvas.getContext('2d');

    if (ctx === null) {
      throw new Error('Context is null; your browser does not support canvas');
    }
    this.ctx = ctx;

    this.canvas.onmousedown = this._onMouseDown;
    window.onmouseup = this._onMouseUp;
    this.canvas.onmousemove = this._onMouseMove;
    this.drawBackground();
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

  drawPixel = ({ x, y }: IPoint, color:Color = PAINT_COLOR) => {
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

    for (let col = x - 1; col <= x + 1; col++) {
      for (let row = y - 1; row <= y + 1; row++) {
        let pixelColor;
        if (row === y && col === x) {
          pixelColor = color;
        } else if (row === y || col === x) {
          pixelColor = color.fade(0.5);
        } else {
          pixelColor = color.fade(0.8);
        }

        this.pixels[(row * this.canvas.width) + col] = pixelColor.toString();
        this.drawRect(pixelColor, col, row);
      }
    }
  }

  getPixels = () => this.pixels;

  drawRect = (color: Color, x: number, y: number, width: number = this.width / this.xPixels, height: number = this.height / this.yPixels) => {
    this.ctx.fillStyle = color.toString();
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
  }
}

export default Canvas;
