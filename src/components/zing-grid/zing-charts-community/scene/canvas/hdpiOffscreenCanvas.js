import { hasConstrainedCanvasMemory } from '../../util/userAgent';
import { HdpiCanvas } from './hdpiCanvas';

export class HdpiOffscreenCanvas {
    static isSupported() {
        return typeof OffscreenCanvas !== 'undefined' && OffscreenCanvas.prototype.transferToImageBitmap != null;
    }
    // The width/height attributes of the Canvas element default to
    // 300/150 according to w3.org.
    constructor({ width = 600, height = 300, overrideDevicePixelRatio }) {
        this.enabled = true;
        // `NaN` is deliberate here, so that overrides are always applied
        // and the `resetTransform` inside the `resize` method works in IE11.
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
        // Workaround memory allocation quirks in iOS Safari by resizing to 0x0 and clearing.
        // See https://bugs.webkit.org/show_bug.cgi?id=195325.
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
            // Mobile browsers have stricter memory limits, we reduce rendering resolution to
            // improve stability on mobile browsers. iOS Safari 12->16 are pain-points since they
            // have memory allocation quirks - see https://bugs.webkit.org/show_bug.cgi?id=195325.
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
        const { canvas, context, pixelRatio } = this;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.resetTransform();
        this._width = width;
        this._height = height;
    }
}
