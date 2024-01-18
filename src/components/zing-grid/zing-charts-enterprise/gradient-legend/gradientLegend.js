var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scale, _Scene, _Util, } from '@/components/zing-grid/zing-charts-community/main.js';
const { BOOLEAN, Layers, POSITION, Validate, Default, MIN_SPACING, POSITIVE_NUMBER, ProxyProperty, DeprecatedAndRenamedTo, } = _ModuleSupport;
const { BBox, Group, Rect, LinearGradientFill, Triangle } = _Scene;
const { createId, Logger } = _Util;
class GradientBar {
    constructor() {
        this.thickness = 16;
        this.preferredLength = 100;
    }
}
__decorate([
    Validate(POSITIVE_NUMBER)
], GradientBar.prototype, "thickness", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], GradientBar.prototype, "preferredLength", void 0);
class GradientLegendAxisTick extends _ModuleSupport.AxisTick {
    constructor() {
        super(...arguments);
        this.enabled = false;
        this.size = 0;
        this.maxSpacing = NaN;
    }
}
__decorate([
    Validate(MIN_SPACING),
    Default(NaN)
], GradientLegendAxisTick.prototype, "maxSpacing", void 0);
class GradientLegendAxis extends _ModuleSupport.CartesianAxis {
    constructor(ctx) {
        super(ctx, new _Scale.LinearScale());
        this.colorDomain = [];
        this.nice = false;
        this.line.enabled = false;
    }
    calculateDomain() {
        this.dataDomain = this.normaliseDataDomain(this.colorDomain);
    }
    formatDatum(datum) {
        if (typeof datum === 'number') {
            return datum.toFixed(2);
        }
        else {
            Logger.warnOnce('data contains Date objects which are being plotted against a number axis, please only use a number axis for numbers.');
            return String(datum);
        }
    }
    createTick() {
        return new GradientLegendAxisTick();
    }
}
class GradientLegendLabel {
    constructor(label) {
        this.label = label;
    }
}
__decorate([
    ProxyProperty('label', 'fontStyle')
], GradientLegendLabel.prototype, "fontStyle", void 0);
__decorate([
    ProxyProperty('label', 'fontWeight')
], GradientLegendLabel.prototype, "fontWeight", void 0);
__decorate([
    ProxyProperty('label', 'fontSize')
], GradientLegendLabel.prototype, "fontSize", void 0);
__decorate([
    ProxyProperty('label', 'fontFamily')
], GradientLegendLabel.prototype, "fontFamily", void 0);
__decorate([
    ProxyProperty('label', 'color')
], GradientLegendLabel.prototype, "color", void 0);
__decorate([
    ProxyProperty('label', 'format')
], GradientLegendLabel.prototype, "format", void 0);
__decorate([
    ProxyProperty('label', 'formatter')
], GradientLegendLabel.prototype, "formatter", void 0);
class GradientLegendInterval {
    constructor(tick) {
        this.tick = tick;
    }
}
__decorate([
    ProxyProperty('tick', 'values')
], GradientLegendInterval.prototype, "values", void 0);
__decorate([
    ProxyProperty('tick', 'minSpacing')
], GradientLegendInterval.prototype, "minSpacing", void 0);
__decorate([
    ProxyProperty('tick', 'maxSpacing')
], GradientLegendInterval.prototype, "maxSpacing", void 0);
__decorate([
    ProxyProperty('tick', 'interval')
], GradientLegendInterval.prototype, "step", void 0);
class GradientLegendScale {
    constructor(axis) {
        this.axis = axis;
        this.label = new GradientLegendLabel(axis.label);
        this.interval = new GradientLegendInterval(axis.tick);
    }
}
__decorate([
    ProxyProperty('axis', 'seriesAreaPadding')
], GradientLegendScale.prototype, "padding", void 0);
export class GradientLegend {
    getOrientation() {
        switch (this.position) {
            case 'right':
            case 'left':
                return 'vertical';
            case 'bottom':
            case 'top':
                return 'horizontal';
        }
    }
    constructor(ctx) {
        this.ctx = ctx;
        this.id = createId(this);
        this.group = new Group({ name: 'legend', layer: true, zIndex: Layers.LEGEND_ZINDEX });
        this.gradient = new GradientBar();
        this.destroyFns = [];
        this.enabled = false;
        this.position = 'bottom';
        this.reverseOrder = undefined;
        // Placeholder
        this.pagination = undefined;
        /**
         * Spacing between the legend and the edge of the chart's element.
         */
        this.spacing = 20;
        this.data = [];
        this.listeners = {};
        this.latestGradientBox = undefined;
        this.layoutService = ctx.layoutService;
        this.destroyFns.push(this.layoutService.addListener('start-layout', (e) => this.update(e.shrinkRect)));
        this.highlightManager = ctx.highlightManager;
        this.destroyFns.push(this.highlightManager.addListener('highlight-change', () => this.onChartHoverChange()));
        this.gradientRect = new Rect();
        this.gradientFill = new LinearGradientFill();
        this.gradientFill.mask = this.gradientRect;
        this.group.append(this.gradientFill);
        this.arrow = new Triangle();
        this.group.append(this.arrow);
        this.axisGridGroup = new Group({ name: 'legend-axis-grid-group' });
        this.group.append(this.axisGridGroup);
        this.axisGroup = new Group({ name: 'legend-axis-group' });
        this.group.append(this.axisGroup);
        this.axis = new GradientLegendAxis(ctx);
        this.axis.attachAxis(this.axisGroup, this.axisGridGroup);
        this.scale = new GradientLegendScale(this.axis);
        this.stop = this.scale;
        this.destroyFns.push(() => this.detachLegend());
    }
    destroy() {
        this.destroyFns.forEach((f) => f());
    }
    attachLegend(node) {
        node.append(this.group);
    }
    detachLegend() {
        var _a;
        (_a = this.group.parent) === null || _a === void 0 ? void 0 : _a.removeChild(this.group);
    }
    update(shrinkRect) {
        const data = this.data[0];
        if (!this.enabled || !data || !data.enabled) {
            this.group.visible = false;
            return { shrinkRect: shrinkRect.clone() };
        }
        const { colorRange } = this.normalizeColorArrays(data);
        const gradientBox = this.updateGradientRect(shrinkRect, colorRange);
        const axisBox = this.updateAxis(data, gradientBox);
        const { newShrinkRect, translateX, translateY } = this.getMeasurements(shrinkRect, gradientBox, axisBox);
        this.updateArrow(gradientBox);
        this.group.visible = true;
        this.group.translationX = translateX;
        this.group.translationY = translateY;
        this.latestGradientBox = gradientBox;
        return { shrinkRect: newShrinkRect };
    }
    normalizeColorArrays(data) {
        let colorDomain = data.colorDomain.slice();
        const colorRange = data.colorRange.slice();
        if (colorDomain.length === colorRange.length) {
            return { colorDomain, colorRange };
        }
        if (colorDomain.length > colorRange.length) {
            colorRange.splice(colorDomain.length);
        }
        const count = colorRange.length;
        colorDomain = colorRange.map((_, i) => {
            const [d0, d1] = colorDomain;
            if (i === 0)
                return d0;
            if (i === count - 1)
                return d1;
            return d0 + ((d1 - d0) * i) / (count - 1);
        });
        return { colorDomain, colorRange };
    }
    updateGradientRect(shrinkRect, colorRange) {
        const { preferredLength: gradientLength, thickness } = this.gradient;
        const gradientBox = new BBox(0, 0, 0, 0);
        const vertical = this.getOrientation() === 'vertical';
        if (vertical) {
            const maxHeight = shrinkRect.height;
            const preferredHeight = gradientLength;
            gradientBox.x = 0;
            gradientBox.y = 0;
            gradientBox.width = thickness;
            gradientBox.height = Math.min(maxHeight, preferredHeight);
        }
        else {
            const maxWidth = shrinkRect.width;
            const preferredWidth = gradientLength;
            gradientBox.x = 0;
            gradientBox.y = 0;
            gradientBox.width = Math.min(maxWidth, preferredWidth);
            gradientBox.height = thickness;
        }
        if (this.reverseOrder) {
            colorRange = colorRange.slice().reverse();
        }
        this.gradientFill.stops = colorRange;
        this.gradientFill.direction = vertical ? 'to-bottom' : 'to-right';
        this.gradientRect.x = gradientBox.x;
        this.gradientRect.y = gradientBox.y;
        this.gradientRect.width = gradientBox.width;
        this.gradientRect.height = gradientBox.height;
        return gradientBox;
    }
    updateAxis(data, gradientBox) {
        const { reverseOrder, axis } = this;
        const vertical = this.getOrientation() === 'vertical';
        axis.position = vertical ? 'right' : 'bottom';
        axis.colorDomain = reverseOrder ? data.colorDomain.slice().reverse() : data.colorDomain;
        axis.calculateDomain();
        axis.range = vertical ? [0, gradientBox.height] : [0, gradientBox.width];
        axis.gridLength = 0;
        axis.translation.x = gradientBox.x + (vertical ? gradientBox.width : 0);
        axis.translation.y = gradientBox.y + (vertical ? 0 : gradientBox.height);
        const axisBox = axis.calculateLayout().bbox;
        axis.update();
        return axisBox;
    }
    updateArrow(gradientBox) {
        var _a;
        const { arrow, axis: { label, scale }, } = this;
        const highlighted = this.highlightManager.getActiveHighlight();
        const colorValue = highlighted === null || highlighted === void 0 ? void 0 : highlighted.colorValue;
        if (highlighted == null || colorValue == null) {
            arrow.visible = false;
            return;
        }
        const vertical = this.getOrientation() === 'vertical';
        const size = (_a = label.fontSize) !== null && _a !== void 0 ? _a : 0;
        const t = scale.convert(colorValue);
        let x;
        let y;
        let rotation;
        if (vertical) {
            x = gradientBox.x - size / 2;
            y = gradientBox.y + t;
            rotation = Math.PI / 2;
        }
        else {
            x = gradientBox.x + t;
            y = gradientBox.y - size / 2;
            rotation = Math.PI;
        }
        arrow.fill = label.color;
        arrow.size = size;
        arrow.translationX = x;
        arrow.translationY = y;
        arrow.rotation = rotation;
        arrow.visible = true;
    }
    getMeasurements(shrinkRect, gradientBox, axisBox) {
        let width;
        let height;
        const vertical = this.getOrientation() === 'vertical';
        if (vertical) {
            width = gradientBox.width + axisBox.width;
            height = gradientBox.height;
        }
        else {
            width = gradientBox.width;
            height = gradientBox.height + axisBox.height;
        }
        const { spacing } = this;
        const newShrinkRect = shrinkRect.clone();
        let left;
        let top;
        if (this.position === 'left') {
            left = shrinkRect.x;
            top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
            newShrinkRect.shrink(width + spacing, 'left');
        }
        else if (this.position === 'right') {
            left = shrinkRect.x + shrinkRect.width - width;
            top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
            newShrinkRect.shrink(width + spacing, 'right');
        }
        else if (this.position === 'top') {
            left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
            top = shrinkRect.y;
            newShrinkRect.shrink(height + spacing, 'top');
        }
        else {
            left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
            top = shrinkRect.y + shrinkRect.height - height;
            newShrinkRect.shrink(height + spacing, 'bottom');
        }
        return {
            translateX: left,
            translateY: top,
            gradientBox,
            newShrinkRect,
        };
    }
    computeBBox() {
        return this.group.computeBBox();
    }
    onChartHoverChange() {
        if (this.enabled && this.latestGradientBox != null) {
            this.updateArrow(this.latestGradientBox);
        }
    }
}
GradientLegend.className = 'GradientLegend';
__decorate([
    Validate(BOOLEAN)
], GradientLegend.prototype, "enabled", void 0);
__decorate([
    Validate(POSITION)
], GradientLegend.prototype, "position", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], GradientLegend.prototype, "reverseOrder", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], GradientLegend.prototype, "spacing", void 0);
__decorate([
    DeprecatedAndRenamedTo('scale')
], GradientLegend.prototype, "stop", void 0);
//# sourceMappingURL=gradientLegend.js.map