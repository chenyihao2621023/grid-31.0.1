var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BBox } from '../bbox';
import { RedrawType, SceneChangeDetection } from '../node';
import { Shape } from './shape';
export class Line extends Shape {
    constructor(opts = {}) {
        super(opts);
        this.x1 = 0;
        this.y1 = 0;
        this.x2 = 0;
        this.y2 = 0;
        this.restoreOwnStyles();
    }
    set x(value) {
        this.x1 = value;
        this.x2 = value;
    }
    set y(value) {
        this.y1 = value;
        this.y2 = value;
    }
    computeBBox() {
        return new BBox(Math.min(this.x1, this.x2), Math.min(this.y1, this.y2), Math.abs(this.x2 - this.x1), Math.abs(this.y2 - this.y1));
    }
    isPointInPath(px, py) {
        if (this.x1 === this.x2 || this.y1 === this.y2) {
            const { x, y } = this.transformPoint(px, py);
            return this.computeBBox()
                .grow(this.strokeWidth / 2)
                .containsPoint(x, y);
        }
        return false;
    }
    render(renderCtx) {
        var _a;
        const { ctx, forceRender, stats, devicePixelRatio } = renderCtx;
        if (this.dirty === RedrawType.NONE && !forceRender) {
            if (stats)
                stats.nodesSkipped += this.nodeCount.count;
            return;
        }
        this.computeTransformMatrix();
        this.matrix.toContext(ctx);
        let { x1, y1, x2, y2 } = this;
        // Align to the pixel grid if the line is strictly vertical
        // or horizontal (but not both, i.e. a dot).
        if (x1 === x2) {
            const { strokeWidth } = this;
            const x = Math.round(x1 * devicePixelRatio) / devicePixelRatio +
                (Math.trunc(strokeWidth * devicePixelRatio) % 2) / (devicePixelRatio * 2);
            x1 = x;
            x2 = x;
        }
        else if (y1 === y2) {
            const { strokeWidth } = this;
            const y = Math.round(y1 * devicePixelRatio) / devicePixelRatio +
                (Math.trunc(strokeWidth * devicePixelRatio) % 2) / (devicePixelRatio * 2);
            y1 = y;
            y2 = y;
        }
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        this.fillStroke(ctx);
        (_a = this.fillShadow) === null || _a === void 0 ? void 0 : _a.markClean();
        super.render(renderCtx);
    }
}
Line.className = 'Line';
Line.defaultStyles = Object.assign({}, Shape.defaultStyles, {
    fill: undefined,
    strokeWidth: 1,
});
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MAJOR })
], Line.prototype, "x1", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MAJOR })
], Line.prototype, "y1", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MAJOR })
], Line.prototype, "x2", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MAJOR })
], Line.prototype, "y2", void 0);
//# sourceMappingURL=line.js.map