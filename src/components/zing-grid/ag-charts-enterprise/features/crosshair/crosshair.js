var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/ag-charts-community/main.js';
import { CrosshairLabel } from './crosshairLabel';
const { Group, Line, BBox } = _Scene;
const { Validate, POSITIVE_NUMBER, RATIO, BOOLEAN, COLOR_STRING, LINE_DASH, Layers } = _ModuleSupport;
export class Crosshair extends _ModuleSupport.BaseModuleInstance {
    constructor(ctx) {
        var _a, _b;
        super();
        this.ctx = ctx;
        this.enabled = false;
        this.stroke = 'rgb(195, 195, 195)';
        this.lineDash = [6, 3];
        this.lineDashOffset = 0;
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.snap = true;
        this.seriesRect = new BBox(0, 0, 0, 0);
        this.hoverRect = new BBox(0, 0, 0, 0);
        this.bounds = new BBox(0, 0, 0, 0);
        this.visible = false;
        this.crosshairGroup = new Group({ layer: true, zIndex: Layers.SERIES_CROSSHAIR_ZINDEX });
        this.lineNode = this.crosshairGroup.appendChild(new Line());
        this.activeHighlight = undefined;
        (_a = ctx.scene.root) === null || _a === void 0 ? void 0 : _a.appendChild(this.crosshairGroup);
        this.axisCtx = ctx.parent;
        this.crosshairGroup.visible = false;
        this.label = new CrosshairLabel(ctx.document, (_b = ctx.scene.canvas.container) !== null && _b !== void 0 ? _b : ctx.document.body);
        this.destroyFns.push(ctx.interactionManager.addListener('hover', (event) => this.onMouseMove(event)), ctx.interactionManager.addListener('leave', () => this.onMouseOut()), ctx.highlightManager.addListener('highlight-change', (event) => this.onHighlightChange(event)), ctx.layoutService.addListener('layout-complete', (event) => this.layout(event)), () => { var _a; return (_a = ctx.scene.root) === null || _a === void 0 ? void 0 : _a.removeChild(this.crosshairGroup); }, () => this.label.destroy());
    }
    layout({ series: { rect, paddedRect, visible }, axes }) {
        var _a;
        this.hideCrosshair();
        if (!(visible && axes && this.enabled)) {
            this.visible = false;
            return;
        }
        this.visible = true;
        this.seriesRect = rect;
        this.hoverRect = paddedRect;
        const { position: axisPosition = 'left', axisId } = this.axisCtx;
        const axisLayout = axes.find((a) => a.id === axisId);
        if (!axisLayout) {
            return;
        }
        this.axisLayout = axisLayout;
        const padding = axisLayout.gridPadding + axisLayout.seriesAreaPadding;
        this.bounds = this.buildBounds(rect, axisPosition, padding);
        const { crosshairGroup, bounds } = this;
        crosshairGroup.translationX = Math.round(bounds.x);
        crosshairGroup.translationY = Math.round(axisPosition === 'top' || axisPosition === 'bottom' ? bounds.y + bounds.height : bounds.y);
        const rotation = axisPosition === 'top' || axisPosition === 'bottom' ? -Math.PI / 2 : 0;
        crosshairGroup.rotation = rotation;
        this.updateLine();
        const format = (_a = this.label.format) !== null && _a !== void 0 ? _a : axisLayout.label.format;
        this.labelFormatter = format ? this.axisCtx.scaleValueFormatter(format) : undefined;
    }
    buildBounds(rect, axisPosition, padding) {
        const bounds = rect.clone();
        bounds.x += axisPosition === 'left' ? -padding : 0;
        bounds.y += axisPosition === 'top' ? -padding : 0;
        bounds.width += axisPosition === 'left' || axisPosition === 'right' ? padding : 0;
        bounds.height += axisPosition === 'top' || axisPosition === 'bottom' ? padding : 0;
        return bounds;
    }
    updateLine() {
        const { lineNode: line, bounds, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, axisCtx, axisLayout, } = this;
        if (!axisLayout) {
            return;
        }
        line.stroke = stroke;
        line.strokeWidth = strokeWidth;
        line.strokeOpacity = strokeOpacity;
        line.lineDash = lineDash;
        line.lineDashOffset = lineDashOffset;
        line.y1 = line.y2 = 0;
        line.x1 = 0;
        line.x2 = axisCtx.direction === 'x' ? bounds.height : bounds.width;
    }
    formatValue(val) {
        var _a;
        const { labelFormatter, axisLayout, ctx: { callbackCache }, } = this;
        if (labelFormatter) {
            const result = callbackCache.call(labelFormatter, val);
            if (result !== undefined)
                return result;
        }
        const isInteger = val % 1 === 0;
        const fractionDigits = ((_a = axisLayout === null || axisLayout === void 0 ? void 0 : axisLayout.label.fractionDigits) !== null && _a !== void 0 ? _a : 0) + (isInteger ? 0 : 1);
        return typeof val === 'number' ? val.toFixed(fractionDigits) : String(val);
    }
    onMouseMove(event) {
        const { crosshairGroup, snap, seriesRect, hoverRect, axisCtx, visible, activeHighlight } = this;
        if (snap || !this.enabled) {
            return;
        }
        const { offsetX, offsetY } = event;
        if (visible && hoverRect.containsPoint(offsetX, offsetY)) {
            crosshairGroup.visible = true;
            const highlight = activeHighlight ? this.getActiveHighlight(activeHighlight) : undefined;
            let value;
            let clampedX = 0;
            let clampedY = 0;
            if (axisCtx.direction === 'x') {
                clampedX = Math.max(Math.min(seriesRect.x + seriesRect.width, offsetX), seriesRect.x);
                crosshairGroup.translationX = Math.round(clampedX);
                value = axisCtx.continuous ? axisCtx.scaleInvert(offsetX - seriesRect.x) : highlight === null || highlight === void 0 ? void 0 : highlight.value;
            }
            else {
                clampedY = Math.max(Math.min(seriesRect.y + seriesRect.height, offsetY), seriesRect.y);
                crosshairGroup.translationY = Math.round(clampedY);
                value = axisCtx.continuous ? axisCtx.scaleInvert(offsetY - seriesRect.y) : highlight === null || highlight === void 0 ? void 0 : highlight.value;
            }
            if (value && this.label.enabled) {
                this.showLabel(clampedX, clampedY, value);
            }
            else {
                this.hideLabel();
            }
        }
        else {
            this.hideCrosshair();
        }
    }
    onMouseOut() {
        this.hideCrosshair();
    }
    onHighlightChange(event) {
        var _a, _b;
        const { enabled, crosshairGroup, snap, seriesRect, axisCtx, visible } = this;
        if (!enabled) {
            return;
        }
        const { currentHighlight } = event;
        const hasCrosshair = (currentHighlight === null || currentHighlight === void 0 ? void 0 : currentHighlight.datum) &&
            (((_a = currentHighlight.series.axes.x) === null || _a === void 0 ? void 0 : _a.id) === axisCtx.axisId ||
                ((_b = currentHighlight.series.axes.y) === null || _b === void 0 ? void 0 : _b.id) === axisCtx.axisId);
        if (!hasCrosshair) {
            this.activeHighlight = undefined;
        }
        else {
            this.activeHighlight = currentHighlight;
        }
        if (!snap) {
            return;
        }
        if (visible && this.activeHighlight) {
            crosshairGroup.visible = true;
            const { value, position } = this.getActiveHighlight(this.activeHighlight);
            let x = 0;
            let y = 0;
            if (axisCtx.direction === 'x') {
                x = position;
                crosshairGroup.translationX = Math.round(x + seriesRect.x);
            }
            else {
                y = position;
                crosshairGroup.translationY = Math.round(y + seriesRect.y);
            }
            if (this.label.enabled) {
                this.showLabel(x + seriesRect.x, y + seriesRect.y, value);
            }
            else {
                this.hideLabel();
            }
        }
        else {
            this.hideCrosshair();
        }
    }
    getActiveHighlight(activeHighlight) {
        var _a, _b;
        const { axisCtx } = this;
        const { datum, xKey = '', yKey = '', aggregatedValue, series, cumulativeValue, midPoint } = activeHighlight;
        const halfBandwidth = axisCtx.scaleBandwidth() / 2;
        if (aggregatedValue !== undefined && ((_a = series.axes.y) === null || _a === void 0 ? void 0 : _a.id) === axisCtx.axisId) {
            return { value: aggregatedValue, position: axisCtx.scaleConvert(aggregatedValue) + halfBandwidth };
        }
        const isYValue = axisCtx.keys().indexOf(yKey) >= 0;
        if (cumulativeValue !== undefined && isYValue) {
            return { value: cumulativeValue, position: axisCtx.scaleConvert(cumulativeValue) + halfBandwidth };
        }
        const key = isYValue ? yKey : xKey;
        const position = (_b = (axisCtx.direction === 'x' ? midPoint === null || midPoint === void 0 ? void 0 : midPoint.x : midPoint === null || midPoint === void 0 ? void 0 : midPoint.y)) !== null && _b !== void 0 ? _b : 0;
        const value = axisCtx.continuous ? axisCtx.scaleInvert(position) : datum[key];
        return { value, position };
    }
    getLabelHtml(value) {
        const { label, axisLayout: { label: { fractionDigits = 0 } = {} } = {} } = this;
        const { renderer: labelRenderer } = label;
        const defaults = {
            text: this.formatValue(value),
        };
        if (labelRenderer) {
            const params = {
                value,
                fractionDigits,
            };
            return label.toLabelHtml(labelRenderer(params), defaults);
        }
        return label.toLabelHtml(defaults);
    }
    showLabel(x, y, value) {
        const { axisCtx, bounds, label, axisLayout } = this;
        if (!axisLayout) {
            return;
        }
        const { label: { padding: labelPadding }, tickSize, } = axisLayout;
        const padding = labelPadding + tickSize;
        const html = this.getLabelHtml(value);
        label.setLabelHtml(html);
        const labelBBox = label.computeBBox();
        let labelMeta;
        if (axisCtx.direction === 'x') {
            const xOffset = -labelBBox.width / 2;
            const yOffset = axisCtx.position === 'bottom' ? 0 : -labelBBox.height;
            const fixedY = axisCtx.position === 'bottom' ? bounds.y + bounds.height + padding : bounds.y - padding;
            labelMeta = {
                x: x + xOffset,
                y: fixedY + yOffset,
            };
        }
        else {
            const yOffset = -labelBBox.height / 2;
            const xOffset = axisCtx.position === 'right' ? 0 : -labelBBox.width;
            const fixedX = axisCtx.position === 'right' ? bounds.x + bounds.width + padding : bounds.x - padding;
            labelMeta = {
                x: fixedX + xOffset,
                y: y + yOffset,
            };
        }
        label.show(labelMeta);
    }
    hideCrosshair() {
        this.crosshairGroup.visible = false;
        this.hideLabel();
    }
    hideLabel() {
        this.label.toggle(false);
    }
}
__decorate([
    Validate(BOOLEAN)
], Crosshair.prototype, "enabled", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], Crosshair.prototype, "stroke", void 0);
__decorate([
    Validate(LINE_DASH, { optional: true })
], Crosshair.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], Crosshair.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], Crosshair.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], Crosshair.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(BOOLEAN)
], Crosshair.prototype, "snap", void 0);
//# sourceMappingURL=crosshair.js.map