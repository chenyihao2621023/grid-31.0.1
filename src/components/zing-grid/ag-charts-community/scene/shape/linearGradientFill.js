var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ColorScale } from '../../scale/colorScale';
import { RedrawType, SceneChangeDetection } from '../node';
import { Shape } from './shape';
export class LinearGradientFill extends Shape {
    constructor() {
        super(...arguments);
        this.direction = 'to-right';
        this.stops = undefined;
        this._mask = undefined;
    }
    get mask() {
        return this._mask;
    }
    set mask(newMask) {
        if (this._mask != null) {
            this.removeChild(this._mask);
        }
        if (newMask != null) {
            this.appendChild(newMask);
        }
        this._mask = newMask;
    }
    isPointInPath(x, y) {
        var _a, _b;
        return (_b = (_a = this.mask) === null || _a === void 0 ? void 0 : _a.isPointInPath(x, y)) !== null && _b !== void 0 ? _b : false;
    }
    computeBBox() {
        var _a;
        return (_a = this.mask) === null || _a === void 0 ? void 0 : _a.computeBBox();
    }
    render(renderCtx) {
        const { mask, stops } = this;
        const { ctx, devicePixelRatio } = renderCtx;
        const pixelLength = 1 / devicePixelRatio;
        const maskBbox = mask === null || mask === void 0 ? void 0 : mask.computeTransformedBBox();
        if (mask == null || stops == null || maskBbox == null)
            return;
        if (mask.dirtyPath) {
            mask.updatePath();
            mask.dirtyPath = false;
        }
        ctx.save();
        ctx.beginPath();
        mask.path.draw(ctx);
        ctx.clip();
        ctx.resetTransform();
        const x0 = Math.floor(maskBbox.x);
        const x1 = Math.ceil(maskBbox.x + maskBbox.width);
        const y0 = Math.floor(maskBbox.y);
        const y1 = Math.ceil(maskBbox.y + maskBbox.height);
        const colorScale = new ColorScale();
        const [i0, i1] = this.direction === 'to-right' ? [x0, x1] : [y0, y1];
        colorScale.domain = stops.map((_, index) => {
            return i0 + ((i1 - i0) * index) / (stops.length - 1);
        });
        colorScale.range = stops;
        colorScale.update();
        if (this.direction === 'to-right') {
            const height = y1 - y0;
            for (let x = x0; x <= x1; x += pixelLength) {
                ctx.fillStyle = colorScale.convert(x);
                ctx.fillRect(x, y0, pixelLength, height);
            }
        }
        else {
            const width = x1 - x0;
            for (let y = y0; y <= y1; y += pixelLength) {
                ctx.fillStyle = colorScale.convert(y);
                ctx.fillRect(x0, y, width, pixelLength);
            }
        }
        ctx.restore();
    }
}
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MAJOR })
], LinearGradientFill.prototype, "direction", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MAJOR })
], LinearGradientFill.prototype, "stops", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MAJOR })
], LinearGradientFill.prototype, "_mask", void 0);
//# sourceMappingURL=linearGradientFill.js.map