var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LinearGradient } from '../gradient/linearGradient';
import { Node, RedrawType, SceneChangeDetection } from '../node';
const LINEAR_GRADIENT_REGEXP = /^linear-gradient\((.*?)deg,\s*(.*?)\s*\)$/i;
export class Shape extends Node {
    constructor() {
        super(...arguments);
        this.fillOpacity = 1;
        this.strokeOpacity = 1;
        this.fill = Shape.defaultStyles.fill;
        /**
         * Note that `strokeStyle = null` means invisible stroke,
         * while `lineWidth = 0` means no stroke, and sometimes this can mean different things.
         * For example, a rect shape with an invisible stroke may not align to the pixel grid
         * properly because the stroke affects the rules of alignment, and arc shapes forming
         * a pie chart will have a gap between them if they have an invisible stroke, whereas
         * there would be not gap if there was no stroke at all.
         * The preferred way of making the stroke invisible is setting the `lineWidth` to zero,
         * unless specific looks that is achieved by having an invisible stroke is desired.
         */
        this.stroke = Shape.defaultStyles.stroke;
        this.strokeWidth = Shape.defaultStyles.strokeWidth;
        this.lineDash = Shape.defaultStyles.lineDash;
        this.lineDashOffset = Shape.defaultStyles.lineDashOffset;
        this.lineCap = Shape.defaultStyles.lineCap;
        this.lineJoin = Shape.defaultStyles.lineJoin;
        this.opacity = Shape.defaultStyles.opacity;
        this.fillShadow = Shape.defaultStyles.fillShadow;
    }
    /**
     * Restores the default styles introduced by this subclass.
     */
    restoreOwnStyles() {
        const styles = this.constructor.defaultStyles;
        const keys = Object.getOwnPropertyNames(styles);
        // getOwnPropertyNames is about 2.5 times faster than
        // for..in with the hasOwnProperty check and in this
        // case, where most properties are inherited, can be
        // more than an order of magnitude faster.
        for (let i = 0, n = keys.length; i < n; i++) {
            const key = keys[i];
            this[key] = styles[key];
        }
    }
    updateGradient() {
        const { fill } = this;
        let linearGradientMatch;
        if ((fill === null || fill === void 0 ? void 0 : fill.startsWith('linear-gradient')) && (linearGradientMatch = LINEAR_GRADIENT_REGEXP.exec(fill))) {
            const angle = parseFloat(linearGradientMatch[1]);
            const colors = [];
            const colorsPart = linearGradientMatch[2];
            const colorRegex = /(#[0-9a-f]+)|(rgba?\(.+?\))|([a-z]+)/gi;
            let c;
            while ((c = colorRegex.exec(colorsPart))) {
                colors.push(c[0]);
            }
            this.gradient = new LinearGradient();
            this.gradient.angle = angle;
            this.gradient.stops = colors.map((color, index) => {
                const offset = index / (colors.length - 1);
                return { offset, color };
            });
        }
        else {
            this.gradient = undefined;
        }
    }
    /**
     * Returns a device-pixel aligned coordinate (or length if length is supplied).
     *
     * NOTE: Not suitable for strokes, since the stroke needs to be offset to the middle
     * of a device pixel.
     */
    align(start, length) {
        var _a, _b, _c;
        const pixelRatio = (_c = (_b = (_a = this.layerManager) === null || _a === void 0 ? void 0 : _a.canvas) === null || _b === void 0 ? void 0 : _b.pixelRatio) !== null && _c !== void 0 ? _c : 1;
        const alignedStart = Math.round(start * pixelRatio) / pixelRatio;
        if (length == undefined) {
            return alignedStart;
        }
        if (length === 0) {
            return 0;
        }
        if (length < 1) {
            // Avoid hiding crisp shapes
            return Math.ceil(length * pixelRatio) / pixelRatio;
        }
        // Account for the rounding of alignedStart by increasing length to compensate before
        // alignment.
        return Math.round((length + start) * pixelRatio) / pixelRatio - alignedStart;
    }
    fillStroke(ctx) {
        this.renderFill(ctx);
        this.renderStroke(ctx);
    }
    renderFill(ctx) {
        if (this.fill) {
            const { globalAlpha } = ctx;
            this.applyFill(ctx);
            this.applyFillAlpha(ctx);
            this.applyShadow(ctx);
            ctx.fill();
            ctx.globalAlpha = globalAlpha;
        }
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
    }
    applyFill(ctx) {
        if (this.gradient) {
            ctx.fillStyle = this.gradient.createGradient(ctx, this.computeBBox());
        }
        else {
            ctx.fillStyle = this.fill;
        }
    }
    applyFillAlpha(ctx) {
        const { globalAlpha } = ctx;
        ctx.globalAlpha = globalAlpha * this.opacity * this.fillOpacity;
    }
    applyShadow(ctx) {
        var _a, _b;
        // The canvas context scaling (depends on the device's pixel ratio)
        // has no effect on shadows, so we have to account for the pixel ratio
        // manually here.
        const pixelRatio = (_b = (_a = this.layerManager) === null || _a === void 0 ? void 0 : _a.canvas.pixelRatio) !== null && _b !== void 0 ? _b : 1;
        const fillShadow = this.fillShadow;
        if (fillShadow === null || fillShadow === void 0 ? void 0 : fillShadow.enabled) {
            ctx.shadowColor = fillShadow.color;
            ctx.shadowOffsetX = fillShadow.xOffset * pixelRatio;
            ctx.shadowOffsetY = fillShadow.yOffset * pixelRatio;
            ctx.shadowBlur = fillShadow.blur * pixelRatio;
        }
    }
    renderStroke(ctx) {
        if (this.stroke && this.strokeWidth) {
            const { globalAlpha } = ctx;
            ctx.strokeStyle = this.stroke;
            ctx.globalAlpha = globalAlpha * this.opacity * this.strokeOpacity;
            ctx.lineWidth = this.strokeWidth;
            if (this.lineDash) {
                ctx.setLineDash(this.lineDash);
            }
            if (this.lineDashOffset) {
                ctx.lineDashOffset = this.lineDashOffset;
            }
            if (this.lineCap) {
                ctx.lineCap = this.lineCap;
            }
            if (this.lineJoin) {
                ctx.lineJoin = this.lineJoin;
            }
            ctx.stroke();
            ctx.globalAlpha = globalAlpha;
        }
    }
    containsPoint(x, y) {
        return this.isPointInPath(x, y);
    }
}
/**
 * Defaults for style properties. Note that properties that affect the position
 * and shape of the node are not considered style properties, for example:
 * `x`, `y`, `width`, `height`, `radius`, `rotation`, etc.
 * Can be used to reset to the original styling after some custom styling
 * has been applied (using the `restoreOwnStyles` method).
 * These static defaults are meant to be inherited by subclasses.
 */
Shape.defaultStyles = Object.assign({}, {
    fill: 'black',
    stroke: undefined,
    strokeWidth: 0,
    lineDash: undefined,
    lineDashOffset: 0,
    lineCap: undefined,
    lineJoin: undefined,
    opacity: 1,
    fillShadow: undefined,
});
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR })
], Shape.prototype, "fillOpacity", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR })
], Shape.prototype, "strokeOpacity", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR, changeCb: (s) => s.updateGradient() })
], Shape.prototype, "fill", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR })
], Shape.prototype, "stroke", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR })
], Shape.prototype, "strokeWidth", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR })
], Shape.prototype, "lineDash", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR })
], Shape.prototype, "lineDashOffset", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR })
], Shape.prototype, "lineCap", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR })
], Shape.prototype, "lineJoin", void 0);
__decorate([
    SceneChangeDetection({
        redraw: RedrawType.MINOR,
        convertor: (v) => Math.min(1, Math.max(0, v)),
    })
], Shape.prototype, "opacity", void 0);
__decorate([
    SceneChangeDetection({ redraw: RedrawType.MINOR, checkDirtyOnAssignment: true })
], Shape.prototype, "fillShadow", void 0);
//# sourceMappingURL=shape.js.map