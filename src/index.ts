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
  pixelSize?: number;
}

interface IPoint {
  x: number;
  y: number;
}

class Canvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouseIsDown: boolean = false;
  private backgroundRows: number;
  private backgroundCols: number;
  private pixelSize: number = 20;
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
    if (props.pixelSize) {
      this.pixelSize = props.pixelSize;
    }

    this.canvas = makeElement('canvas', {
      height: this.height,
      width: this.width,
    }) as HTMLCanvasElement;

    this.backgroundRows = this.canvas.height / this.pixelSize;
    this.backgroundCols = this.canvas.width / this.pixelSize;

    this.pixels = Array(this.pixelSize * this.pixelSize).fill('rgba(0,0,0,0');

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
    for (let row = 0; row < this.backgroundRows; row++) {
      for (let col = 0; col < this.backgroundCols; col++) {
        const color = BACKGROUND_COLORS[(col + row + 1) % 2];
        this.drawRect(
          color,
          col * this.pixelSize,
          row * this.pixelSize,
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

    // convert e event to pixelated pixels
    x = Math.floor(x / this.pixelSize);
    y = Math.floor(y / this.pixelSize);

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
        this.drawRect(pixelColor, col * this.pixelSize, row * this.pixelSize);
      }
    }
  }

  getPixels = () => this.pixels;

  drawRect = (color: Color, x: number, y: number, width: number = this.pixelSize, height: number = this.pixelSize) => {
    this.ctx.fillStyle = color.toString();
    this.ctx.fillRect(x, y, width, height)
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

  setPixelSize = (pixelSize: number) => {
    if (pixelSize !== this.pixelSize) {
      this.pixelSize = pixelSize;
      this.backgroundCols = this.canvas.width / this.pixelSize;
      this.backgroundRows = this.canvas.height / this.pixelSize;
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
