import * as Color from 'color';

const makeElement = (type: string = 'div', opts = {}) => {
  const el = document.createElement(type);
  Object.keys(opts).forEach(key => {
    el[key] = opts[key];
  });
  return el;
};

const BACKGROUND_COLORS: Color[] = [
  Color.rgb(...Array(3).fill(255-0)),
  Color.rgb(...Array(3).fill(255-35)),
];
const PAINT_COLOR: Color = Color.rgb(...Array(3).fill(0));

interface IPoint {
  x: number;
  y: number;
}

// function distanceBetween(point1: IPoint, point2: IPoint) {
//   return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
// }
// function angleBetween(point1: IPoint, point2: IPoint) {
//   return Math.atan2( point2.x - point1.x, point2.y - point1.y );
// }
function midPointBtw(p1: IPoint, p2: IPoint) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2
  };
}

interface IProps {
  // rows?: number;
  // cols?: number;
  width?: number;
  height?: number;
  brushSize?: number;
  pixelSize?: number;
}

class Canvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shadowCanvas: HTMLCanvasElement;
  private shadowCtx: CanvasRenderingContext2D;
  private mouseIsDown: boolean = false;
  private backgroundRows: number;
  private backgroundCols: number;
  private pixels: number[];
  private pixelSize: number = 20;
  // private pixelW:number;
  // private pixelH:number;
  private width: number = 160;
  private height: number = 160;
  private brushSize: number = 20;
  // private lastPoint: IPoint;
  private points: IPoint[] = [];
  private callbacks: {
    [index: string]: Function;
  } = {};
  // private lastE:MouseEvent;

  constructor(props: IProps = {}) {
    // if (props.rows) {
    //   this.backgroundRows = props.rows;
    // }
    // if (props.cols) {
    //   this.backgroundCols = props.cols;
    // }
    if (props.width) {
      this.width = props.width;
    }
    if (props.height) {
      this.height = props.height;
    }
    if (props.brushSize) {
      this.brushSize = props.brushSize;
    }
    if (props.pixelSize) {
      this.pixelSize = props.pixelSize;
    }

    this.canvas = makeElement('canvas', {
      height: this.height,
      width: this.width,
    }) as HTMLCanvasElement;
    this.shadowCanvas = makeElement('canvas', {
      height: this.height,
      width: this.width,
    }) as HTMLCanvasElement;

    this.backgroundCols = this.canvas.width / this.pixelSize;
    this.backgroundRows = this.canvas.height / this.pixelSize;

    this.pixels = Array(this.backgroundRows * this.backgroundCols).fill(PAINT_COLOR.negate().red());

    const ctx = this.canvas.getContext('2d');
    const shadowCtx = this.shadowCanvas.getContext('2d');

    if (ctx === null || shadowCtx === null) {
      throw new Error('Context is null; your browser does not support canvas');
    }
    this.ctx = ctx;
    this.shadowCtx = shadowCtx;

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

  getCanvasData = (ctx: CanvasRenderingContext2D) => ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  updateCanvasData = (data: ImageData, ctx: CanvasRenderingContext2D = this.ctx, width: number = this.canvas.width, height: number = this.canvas.height) => ctx.putImageData(data, 0, 0, 0, 0, width, height);

  drawPixel = (x: number, y: number, color:Color = PAINT_COLOR) => {
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

        const index = (row * this.backgroundCols) + col;
        this.pixels[index] = this.pixels[index] + (pixelColor.grayscale().red() * pixelColor.alpha());
        if (this.pixels[index] > 255) { this.pixels[index] = 255; }
        this.drawRect(pixelColor, col * this.pixelSize, row * this.pixelSize);
      }
    }
  }

  getPixels = () => this.pixels;

  drawRect = (color: Color, x: number, y: number, width: number = this.pixelSize, height: number = this.pixelSize) => {
    this.ctx.fillStyle = color.toString();
    this.ctx.fillRect(x, y, width, height)
  }

  reset = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.shadowCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
  }

  setBrushSize = (brushSize: number) => this.brushSize = brushSize;
  setPixelSize = (pixelSize: number) => {
    if (pixelSize !== this.pixelSize) {
      this.pixelSize = pixelSize;
      this.backgroundCols = this.canvas.width / this.pixelSize;
      this.backgroundRows = this.canvas.height / this.pixelSize;
      this.drawPixels();
    }
  };

  getPosition = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.x - rect.left,
      y: e.y - rect.top,
    };
  }

  _onMouseDown = (e: MouseEvent) => {
    this.mouseIsDown = true;
    const currentPoint = this.getPosition(e);
    // this.lastPoint = currentPoint;
    this.points.push(currentPoint);
    // this.lastE = e;
    // this.drawPixel(e.x, e.y);
    if (this.callbacks.onMouseDown) {
      this.callbacks.onMouseDown(e);
    }
  }

  _onMouseUp = (e: MouseEvent) => {
    this.mouseIsDown = false;
    this.points = [];
    if (this.callbacks.onMouseUp) {
      this.callbacks.onMouseUp(e);
    }
  }

  _onMouseMove = (e: MouseEvent) => {
    if (this.ctx && this.mouseIsDown) {
      // this.lastE = e;
      // console.log('lasts and current');
      // console.log(this.lastE.x, this.lastE.y, e.x, e.y);
      // this.drawPixel(e.x, e.y);
      if (this.callbacks.onMouseMove) {
        this.callbacks.onMouseMove(e);
      }

      const currentPoint = this.getPosition(e);
      this.points.push(currentPoint);

      let p1 = this.points[0];
      let p2 = this.points[1];

      this.shadowCtx.lineWidth = this.brushSize;
      this.shadowCtx.lineJoin = this.ctx.lineCap = 'round';
      this.shadowCtx.fillStyle = PAINT_COLOR.toString();
      this.shadowCtx.strokeStyle = PAINT_COLOR.toString();
      this.shadowCtx.beginPath();
      this.shadowCtx.moveTo(p1.x, p1.y);


      for (let i = 1, len = this.points.length; i < len; i++) {
        // we pick the point between pi+1 & pi+2 as the
        // end point and p1 as our control point
        const midPoint = midPointBtw(p1, p2);
        this.shadowCtx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);

        // const radgrad = this.ctx.createRadialGradient(p1.x,p1.y,10,p1.x,p1.y,20);

        // radgrad.addColorStop(0, '#000');
        // radgrad.addColorStop(0.5, 'rgba(0,0,0,0.5)');
        // radgrad.addColorStop(1, 'rgba(0,0,0,0)');

        // this.ctx.fillStyle = radgrad;
        // this.ctx.fillRect(p1.x-20, p1.y-20, 40, 40);

        p1 = this.points[i];
        p2 = this.points[i+1];
      }
      // Draw last line as a straight line while
      // we wait for the next point to be able to calculate
      // the bezier control point
      this.shadowCtx.lineTo(p1.x, p1.y);

      // const radgrad = this.ctx.createRadialGradient(p1.x,p1.y,10,p1.x,p1.y,20);

      // radgrad.addColorStop(0, PAINT_COLOR.toString());
      // radgrad.addColorStop(0.5, PAINT_COLOR.fade(0.5).toString());
      // radgrad.addColorStop(1.0, PAINT_COLOR.fade(1.0).toString());

      // this.ctx.fillStyle = radgrad;
      // this.ctx.fillRect(p1.x-20, p1.y-20, 40, 40);
      this.shadowCtx.stroke();

      // const dist = distanceBetween(this.lastPoint, currentPoint);
      // const angle = angleBetween(this.lastPoint, currentPoint);

      // for (let i = 0; i < dist; i+=5) {

      //   const x = this.lastPoint.x + (Math.sin(angle) * i);
      //   const y = this.lastPoint.y + (Math.cos(angle) * i);

      //   const radgrad = this.ctx.createRadialGradient(x,y,10,x,y,20);

      //   radgrad.addColorStop(0, PAINT_COLOR.toString());
      //   radgrad.addColorStop(0.5, PAINT_COLOR.fade(0.5).toString());
      //   radgrad.addColorStop(1.0, PAINT_COLOR.fade(1.0).toString());

      //   this.ctx.fillStyle = radgrad;
      //   this.ctx.fillRect(x-20, y-20, 40, 40);
      // }

      // this.lastPoint = currentPoint;
      this.drawPixels();
    }
  }

  drawPixels = () => {
    this.drawBackground();
    const data = this.getCanvasData(this.ctx);
    const shadowData = this.getCanvasData(this.shadowCtx);
    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    // console.log('*******');
    // console.log(shadowData.data);

    // const pixels: any[] = [];

    const rowLength = this.canvas.width;
    // let rows = new Uint8ClampedArray(this.pixelSize * this.pixelSize);
    for (let rowI = 0; rowI < this.backgroundRows; rowI++) {
      const startingRow = rowI * this.pixelSize * rowLength * 4;
      for (let colI = 0; colI < this.backgroundCols; colI++) {
        const d = new Uint8ClampedArray(this.pixelSize * this.pixelSize * 4);
        for (let row = 0; row < this.pixelSize; row++) {
          const currentRow = startingRow + (row * rowLength * 4);
          const start = currentRow + (colI * this.pixelSize * 4);
          const end = start + this.pixelSize * 4;
          const index = (this.pixelSize * 4) * row;
          d.set(shadowData.data.slice(start, end), index);
        }
        console.log(d);

        let red = 0;
        let green = 0;
        let blue = 0;
        let alpha = 0;

        const denom = d.length / 4;
        for (let i = 0; i < d.length; i += 4) {
          red += d[i + 0] / denom;
          green += d[i + 1] / denom;
          blue += d[i + 2] / denom;
          alpha += d[i + 3] / denom;
        }

        this.drawRect(
          Color.rgb(red, green, blue).alpha(alpha / 255),
          colI * this.pixelSize,
          rowI * this.pixelSize,
        );

        // const rowLength = this.canvas.width;
        // const startingCol = colI * this.pixelSize * 4;
        // const startingRow = rowI * this.pixelSize * rowLength * 4;
        // if (alpha !== 0) {
        //   console.log(rowI, colI);
        //   for (let row = 0; row < this.pixelSize * 4; row++) {
        //     const currentRow = startingRow + (row * rowLength * 4);
        //     // if (rowI === 1 && colI === 1) {
        //     //   console.log('currentRow', currentRow);
        //     // }
        //     for (let col = 0; col < this.pixelSize * 4; col += 4) {
        //       const currentCol = startingCol + col;
        //       const i = currentRow + currentCol;
        //       // if (rowI === 1 && colI === 1) {
        //       //   console.log(i);
        //       // }
        //       // const i = currentRow + (colI * this.pixelSize * 4);
        //       data.data[i + 0] = data.data[i + 0] * (red * alpha);
        //       data.data[i + 1] = data.data[i + 1] * (green * alpha);
        //       data.data[i + 2] = data.data[i + 2] * (blue * alpha);
        //     }
        //   }
        // }
      }
    }

    // for (let rowI = 0; rowI < this.backgroundRows; rowI++) {
    //   for (let colI = 0; colI < this.backgroundCols; colI++) {
    //     const currentRow = rowI * this.canvas.width * 4;
    //     const currentCol = colI * 4;
    //     const start = currentRow + currentCol;
    //     // const currentRow = row * this.canvas.width * 4;
    //     // const start = currentRow + (colI * this.pixelSize * 4);
    //     const alpha = shadowData.data[i + 3];
    //     if (alpha !== 0) {
    //       data.data[i + 0] = data.data[i + 0] * (shadowData.data[i + 0] * alpha);
    //       data.data[i + 1] = data.data[i + 1] * (shadowData.data[i + 1] * alpha);
    //       data.data[i + 2] = data.data[i + 2] * (shadowData.data[i + 2] * alpha);
    //     }
    //   }
    // }
    // this.updateCanvasData(data);
  }

  drawPixelsExact = () => {
    this.drawBackground();
    const data = this.getCanvasData(this.ctx);
    const shadowData = this.getCanvasData(this.shadowCtx);
    for (let i = 0; i < data.data.length; i+= 4) {
      const alpha = shadowData.data[i + 3];
      if (alpha !== 0) {
        data.data[i + 0] = data.data[i + 0] * (shadowData.data[i + 0] * alpha);
        data.data[i + 1] = data.data[i + 1] * (shadowData.data[i + 1] * alpha);
        data.data[i + 2] = data.data[i + 2] * (shadowData.data[i + 2] * alpha);
      }
    }
    this.updateCanvasData(data);
  }

  render(target: HTMLElement) {
    target.appendChild(this.canvas);
    target.appendChild(this.shadowCanvas);
  }
}

export default Canvas;


