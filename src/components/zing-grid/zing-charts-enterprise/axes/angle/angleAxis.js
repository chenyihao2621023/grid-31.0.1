var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { AngleCrossLine } from '../polar-crosslines/angleCrossLine';
const { AND, assignJsonApplyConstructedArray, ChartAxisDirection, GREATER_THAN, NUMBER, UNION, ProxyOnWrite, Validate, } = _ModuleSupport;
const { Path, Text } = _Scene;
const { angleBetween, isNumberEqual, toRadians, normalizeAngle360 } = _Util;
class AngleAxisLabel extends _ModuleSupport.AxisLabel {
    constructor() {
        super(...arguments);
        this.orientation = 'fixed';
    }
}
__decorate([
    Validate(UNION(['fixed', 'parallel', 'perpendicular'], 'a label orientation'))
], AngleAxisLabel.prototype, "orientation", void 0);
export class AngleAxis extends _ModuleSupport.PolarAxis {
    constructor(moduleCtx, scale) {
        super(moduleCtx, scale);
        this.startAngle = 0;
        this.endAngle = undefined;
        this.labelData = [];
        this.tickData = [];
        this.radiusLine = this.axisGroup.appendChild(new Path());
        this.computeRange = () => {
            const startAngle = normalizeAngle360(-Math.PI / 2 + toRadians(this.startAngle));
            let endAngle = this.endAngle == null ? startAngle + Math.PI * 2 : -Math.PI / 2 + toRadians(this.endAngle);
            if (endAngle < startAngle) {
                endAngle += 2 * Math.PI;
            }
            this.range = [startAngle, endAngle];
        };
        this.includeInvisibleDomains = true;
    }
    get direction() {
        return ChartAxisDirection.X;
    }
    assignCrossLineArrayConstructor(crossLines) {
        assignJsonApplyConstructedArray(crossLines, AngleCrossLine);
    }
    createLabel() {
        return new AngleAxisLabel();
    }
    update() {
        this.updateScale();
        this.updatePosition();
        this.updateGridLines();
        this.updateTickLines();
        this.updateLabels();
        this.updateRadiusLine();
        this.updateCrossLines();
        return this.tickData.length;
    }
    calculateAvailableRange() {
        const { range, gridLength: radius } = this;
        return angleBetween(range[0], range[1]) * radius;
    }
    updatePosition() {
        const { translation, axisGroup, gridGroup, crossLineGroup } = this;
        const translationX = Math.floor(translation.x);
        const translationY = Math.floor(translation.y);
        axisGroup.translationX = translationX;
        axisGroup.translationY = translationY;
        gridGroup.translationX = translationX;
        gridGroup.translationY = translationY;
        crossLineGroup.translationX = translationX;
        crossLineGroup.translationY = translationY;
    }
    updateRadiusLine() {
        const node = this.radiusLine;
        const { path } = node;
        path.clear({ trackChanges: true });
        const { points, closePath } = this.getAxisLinePoints();
        points.forEach(({ x, y, moveTo, arc, radius = 0, startAngle = 0, endAngle = 0 }) => {
            if (arc) {
                path.arc(x, y, radius, startAngle, endAngle);
            }
            else if (moveTo) {
                path.moveTo(x, y);
            }
            else {
                path.lineTo(x, y);
            }
        });
        if (closePath) {
            path.closePath();
        }
        node.visible = this.line.enabled;
        node.stroke = this.line.color;
        node.strokeWidth = this.line.width;
        node.fill = undefined;
    }
    getAxisLinePoints() {
        var _a;
        const { scale, shape, gridLength: radius } = this;
        const [startAngle, endAngle] = this.range;
        const isFullCircle = isNumberEqual(endAngle - startAngle, 2 * Math.PI);
        const points = [];
        if (shape === 'circle') {
            if (isFullCircle) {
                points.push({ x: radius, y: 0, moveTo: true });
                points.push({
                    x: 0,
                    y: 0,
                    radius,
                    startAngle: 0,
                    endAngle: 2 * Math.PI,
                    arc: true,
                    moveTo: false,
                });
            }
            else {
                points.push({
                    x: radius * Math.cos(startAngle),
                    y: radius * Math.sin(startAngle),
                    moveTo: true,
                });
                points.push({
                    x: 0,
                    y: 0,
                    radius,
                    startAngle: normalizeAngle360(startAngle),
                    endAngle: normalizeAngle360(endAngle),
                    arc: true,
                    moveTo: false,
                });
            }
        }
        else if (shape === 'polygon') {
            const angles = (((_a = scale.ticks) === null || _a === void 0 ? void 0 : _a.call(scale)) || []).map((value) => scale.convert(value));
            if (angles.length > 2) {
                angles.forEach((angle, i) => {
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    const moveTo = i === 0;
                    points.push({ x, y, moveTo });
                });
            }
        }
        return { points, closePath: isFullCircle };
    }
    updateGridLines() {
        const { scale, gridLength: radius, gridLine: { enabled, style, width }, innerRadiusRatio, } = this;
        if (!(style && radius > 0)) {
            return;
        }
        const ticks = this.tickData;
        const innerRadius = radius * innerRadiusRatio;
        const styleCount = style.length;
        const idFn = (datum) => datum.value;
        this.gridLineGroupSelection.update(enabled ? ticks : [], undefined, idFn).each((line, datum, index) => {
            const { value } = datum;
            const { stroke, lineDash } = style[index % styleCount];
            const angle = scale.convert(value);
            line.x1 = innerRadius * Math.cos(angle);
            line.y1 = innerRadius * Math.sin(angle);
            line.x2 = radius * Math.cos(angle);
            line.y2 = radius * Math.sin(angle);
            line.stroke = stroke;
            line.strokeWidth = width;
            line.lineDash = lineDash;
            line.fill = undefined;
        });
        this.gridLineGroupSelection.cleanup();
    }
    updateLabels() {
        const { label, tickLabelGroupSelection } = this;
        const ticks = this.tickData;
        tickLabelGroupSelection.update(label.enabled ? ticks : []).each((node, _, index) => {
            const labelDatum = this.labelData[index];
            if (!labelDatum || labelDatum.hidden) {
                node.visible = false;
                return;
            }
            node.text = labelDatum.text;
            node.setFont(label);
            node.fill = label.color;
            node.x = labelDatum.x;
            node.y = labelDatum.y;
            node.textAlign = labelDatum.textAlign;
            node.textBaseline = labelDatum.textBaseline;
            node.visible = true;
            if (labelDatum.rotation) {
                node.rotation = labelDatum.rotation;
                node.rotationCenterX = labelDatum.x;
                node.rotationCenterY = labelDatum.y;
            }
            else {
                node.rotation = 0;
            }
        });
    }
    updateTickLines() {
        const { scale, gridLength: radius, tick, tickLineGroupSelection } = this;
        const ticks = this.tickData;
        tickLineGroupSelection.update(tick.enabled ? ticks : []).each((line, datum) => {
            const { value } = datum;
            const angle = scale.convert(value);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            line.x1 = radius * cos;
            line.y1 = radius * sin;
            line.x2 = (radius + tick.size) * cos;
            line.y2 = (radius + tick.size) * sin;
            line.stroke = tick.color;
            line.strokeWidth = tick.width;
        });
    }
    createLabelNodeData(ticks, options, seriesRect) {
        const { label, gridLength: radius, scale, tick } = this;
        if (!label.enabled) {
            return [];
        }
        const tempText = new Text();
        const seriesLeft = seriesRect.x - this.translation.x;
        const seriesRight = seriesRect.x + seriesRect.width - this.translation.x;
        const labelData = ticks.map((datum, index) => {
            var _a;
            const { value } = datum;
            const distance = radius + label.padding + tick.size;
            const angle = scale.convert(value);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = distance * cos;
            const y = distance * sin;
            const { textAlign, textBaseline } = this.getLabelAlign(angle);
            // Hide the last tick when it appears over the first
            const isLastTickOverFirst = index === ticks.length - 1 &&
                value !== ticks[0] &&
                isNumberEqual(normalizeAngle360(angle), normalizeAngle360(scale.convert(ticks[0])));
            const rotation = this.getLabelRotation(angle);
            let text = String(value);
            if (label.formatter) {
                const { callbackCache } = this.moduleCtx;
                text = (_a = callbackCache.call(label.formatter, { value, index })) !== null && _a !== void 0 ? _a : '';
            }
            tempText.text = text;
            tempText.x = x;
            tempText.y = y;
            tempText.setFont(label);
            tempText.textAlign = textAlign;
            tempText.textBaseline = textBaseline;
            tempText.rotation = rotation;
            if (rotation) {
                tempText.rotationCenterX = x;
                tempText.rotationCenterY = y;
            }
            let box = rotation ? tempText.computeTransformedBBox() : tempText.computeBBox();
            if (box && options.hideWhenNecessary && !rotation) {
                const overflowLeft = seriesLeft - box.x;
                const overflowRight = box.x + box.width - seriesRight;
                const pixelError = 1;
                if (overflowLeft > pixelError || overflowRight > pixelError) {
                    const availWidth = box.width - Math.max(overflowLeft, overflowRight);
                    ({ text } = Text.wrap(text, availWidth, Infinity, label, 'never'));
                    if (text === '\u2026') {
                        text = '';
                        box = undefined;
                    }
                    tempText.text = text;
                    box = tempText.computeBBox();
                }
            }
            return {
                text,
                x,
                y,
                textAlign,
                textBaseline,
                hidden: text === '' || datum.hidden || isLastTickOverFirst,
                rotation,
                box,
            };
        });
        if (label.avoidCollisions) {
            this.avoidLabelCollisions(labelData);
        }
        return labelData;
    }
    computeLabelsBBox(options, seriesRect) {
        this.tickData = this.generateAngleTicks();
        this.labelData = this.createLabelNodeData(this.tickData, options, seriesRect);
        const textBoxes = this.labelData.map(({ box }) => box).filter((box) => box != null);
        if (!this.label.enabled || textBoxes.length === 0) {
            return null;
        }
        return _Scene.BBox.merge(textBoxes);
    }
    getLabelOrientation() {
        const { label } = this;
        return label instanceof AngleAxisLabel ? label.orientation : 'fixed';
    }
    getLabelRotation(tickAngle) {
        var _a;
        let rotation = toRadians((_a = this.label.rotation) !== null && _a !== void 0 ? _a : 0);
        tickAngle = normalizeAngle360(tickAngle);
        const orientation = this.getLabelOrientation();
        if (orientation === 'parallel') {
            rotation += tickAngle;
            if (tickAngle >= 0 && tickAngle < Math.PI) {
                rotation -= Math.PI / 2;
            }
            else {
                rotation += Math.PI / 2;
            }
        }
        else if (orientation === 'perpendicular') {
            rotation += tickAngle;
            if (tickAngle >= Math.PI / 2 && tickAngle < (3 * Math.PI) / 2) {
                rotation += Math.PI;
            }
        }
        return rotation;
    }
    getLabelAlign(tickAngle) {
        const cos = Math.cos(tickAngle);
        const sin = Math.sin(tickAngle);
        let textAlign;
        let textBaseline;
        const orientation = this.getLabelOrientation();
        const isCos0 = isNumberEqual(cos, 0);
        const isSin0 = isNumberEqual(sin, 0);
        const isCos1 = isNumberEqual(cos, 1);
        const isSinMinus1 = isNumberEqual(sin, -1);
        const isCosPositive = cos > 0 && !isCos0;
        const isSinPositive = sin > 0 && !isSin0;
        if (orientation === 'parallel') {
            textAlign = 'center';
            textBaseline = (isCos1 && isSin0) || isSinPositive ? 'top' : 'bottom';
        }
        else if (orientation === 'perpendicular') {
            textAlign = isSinMinus1 || isCosPositive ? 'left' : 'right';
            textBaseline = 'middle';
        }
        else {
            textAlign = isCos0 ? 'center' : isCosPositive ? 'left' : 'right';
            textBaseline = isSin0 ? 'middle' : isSinPositive ? 'top' : 'bottom';
        }
        return { textAlign, textBaseline };
    }
    updateCrossLines() {
        var _a;
        (_a = this.crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => {
            if (crossLine instanceof AngleCrossLine) {
                const { shape, gridLength: radius, innerRadiusRatio } = this;
                crossLine.shape = shape;
                crossLine.axisOuterRadius = radius;
                crossLine.axisInnerRadius = radius * innerRadiusRatio;
            }
        });
        super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0 });
    }
}
__decorate([
    ProxyOnWrite('rotation'),
    Validate(NUMBER.restrict({ min: 0, max: 360 }))
], AngleAxis.prototype, "startAngle", void 0);
__decorate([
    Validate(AND(NUMBER.restrict({ min: 0, max: 720 }), GREATER_THAN('startAngle')), { optional: true })
], AngleAxis.prototype, "endAngle", void 0);
