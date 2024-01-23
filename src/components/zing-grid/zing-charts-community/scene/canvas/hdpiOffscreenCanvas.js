import { hasConstrainedCanvasMemory } from '../../util/userAgent';
import { HdpiCanvas } from './hdpiCanvas';
export class HdpiOffscreenCanvas {
  static isSupported() {
    return typeof OffscreenCanvas !== 'undefined' && OffscreenCanvas.prototype.transferToImageBitmap != null;
  }
  constructor({
    width = 600,
    height = 300,
    overrideDevicePixelRatio
  }) {
    this.enabled = true;
    this._pixelRatio = NaN;
    this._width = 0;
    this._height = 0;
    this.canvas = new OffscreenCanvas(width, height);
    this.realContext = this.canvas.getContext('2d');
    this.imageSource = this.canvas.transferToImageBitmap();
    this.context = this.setPixelRatio(overrideDevicePixelRatio);
    this.resize(width, height);
  }
  snapshot() {
    this.imageSource.close();
    this.imageSource = this.canvas.transferToImageBitmap();
  }
  destroy() {
    this.imageSource.close();
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.context.clearRect(0, 0, 0, 0);
  }
  clear() {
    this.context.save();
    this.context.resetTransform();
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.restore();
  }
  get pixelRatio() {
    return this._pixelRatio;
  }
  setPixelRatio(ratio) {
    let pixelRatio = ratio !== null && ratio !== void 0 ? ratio : window.devicePixelRatio;
    if (hasConstrainedCanvasMemory()) {
      pixelRatio = 1;
    }
    this._pixelRatio = pixelRatio;
    return HdpiCanvas.overrideScale(this.realContext, pixelRatio);
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  resize(width, height) {
    if (!(width > 0 && height > 0)) {
      return;
    }
    const {
      canvas,
      context,
      pixelRatio
    } = this;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.resetTransform();
    this._width = width;
    this._height = height;
  }
}