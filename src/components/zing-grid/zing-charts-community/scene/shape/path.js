var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { RedrawType, SceneChangeDetection } from '../node';
import { Path2D } from '../path2D';
import { Shape } from './shape';
export function ScenePathChangeDetection(opts) {
    const { redraw = RedrawType.MAJOR, changeCb, convertor } = opts !== null && opts !== void 0 ? opts : {};
    return SceneChangeDetection({ redraw, type: 'path', convertor, changeCb });
}
export class Path extends Shape {
    constructor() {
        super(...arguments);
        
        this.path = new Path2D();
        this.clipScalingX = 1;
        this.clipScalingY = 1;
        
        this._dirtyPath = true;
    }
    set dirtyPath(value) {
        if (this._dirtyPath !== value) {
            this._dirtyPath = value;
            if (value) {
                this.markDirty(this, RedrawType.MAJOR);
            }
        }
    }
    get dirtyPath() {
        return this._dirtyPath;
    }
    checkPathDirty() {
        var _a, _b, _c, _d;
        if (this._dirtyPath) {
            return;
        }
        this.dirtyPath =
            this.path.isDirty() || ((_b = (_a = this.fillShadow) === null || _a === void 0 ? void 0 : _a.isDirty()) !== null && _b !== void 0 ? _b : false) || ((_d = (_c = this.clipPath) === null || _c === void 0 ? void 0 : _c.isDirty()) !== null && _d !== void 0 ? _d : false);
    }
    isPointInPath(x, y) {
        const point = this.transformPoint(x, y);
        return this.path.closedPath && this.path.isPointInPath(point.x, point.y);
    }
    isDirtyPath() {
        // Override point for more expensive dirty checks.
        return false;
    }
    updatePath() {
        // Override point for subclasses.
    }
    clip(ctx, op) {
        const transform = ctx.getTransform();
        const clipScale = this.clipScalingX !== 1 || this.clipScalingY !== 1;
        if (clipScale) {
            ctx.scale(this.clipScalingX, this.clipScalingY);
        }
        op();
        if (clipScale) {
            ctx.setTransform(transform);
        }
    }
    render(renderCtx) {
        var _a;
        const { ctx, forceRender, stats } = renderCtx;
        if (this.dirty === RedrawType.NONE && !forceRender) {
            if (stats)
                stats.nodesSkipped += this.nodeCount.count;
            return;
        }
        this.computeTransformMatrix();
        this.matrix.toContext(ctx);
        if (this.dirtyPath || this.isDirtyPath()) {
            this.updatePath();
            this.dirtyPath = false;
        }
        if (this.clipPath && this.clipMode != null) {
            ctx.save();
            if (this.clipMode === 'normal') {
                this.clip(ctx, () => {
                    var _a;
                    // Bound the shape rendered to the clipping path.
                    (_a = this.clipPath) === null || _a === void 0 ? void 0 : _a.draw(ctx);
                    ctx.clip();
                });
            }
            if (this.clipScalingX > 0 && this.clipScalingY > 0) {
                this.path.draw(ctx);
                this.fillStroke(ctx);
            }
            if (this.clipMode === 'punch-out') {
                this.clip(ctx, () => {
                    var _a, _b;
                    // Bound the shape rendered to the clipping path.
                    (_a = this.clipPath) === null || _a === void 0 ? void 0 : _a.draw(ctx);
                    ctx.clip();
                    // Fallback values, but practically these should never be used.
                    const { x = -10000, y = -10000, width = 20000, height = 20000 } = (_b = this.computeBBox()) !== null && _b !== void 0 ? _b : {};
                    ctx.clearRect(x, y, width, height);
                });
            }
            ctx.restore();
        }
        else {
            this.path.draw(ctx);
            this.fillStroke(ctx);
        }
        (_a = this.fillShadow) === null || _a === void 0 ? void 0 : _a.markClean();
        super.render(renderCtx);
    }
}
Path.className = 'Path';
__decorate([
    ScenePathChangeDetection()
], Path.prototype, "clipPath", void 0);
__decorate([
    ScenePathChangeDetection()
], Path.prototype, "clipMode", void 0);
__decorate([
    ScenePathChangeDetection()
], Path.prototype, "clipScalingX", void 0);
__decorate([
    ScenePathChangeDetection()
], Path.prototype, "clipScalingY", void 0);
