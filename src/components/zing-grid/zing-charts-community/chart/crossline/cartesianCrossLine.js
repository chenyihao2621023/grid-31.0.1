var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BandScale } from '../../scale/bandScale';
import { ContinuousScale } from '../../scale/continuousScale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { PointerEvents } from '../../scene/node';
import { Range } from '../../scene/shape/range';
import { Text } from '../../scene/shape/text';
import { createId } from '../../util/id';
import { clampArray } from '../../util/number';
import { AND, ARRAY, BOOLEAN, COLOR_STRING, DEGREE, FONT_STYLE, FONT_WEIGHT, LINE_DASH, NUMBER, POSITIVE_NUMBER, RATIO, STRING, UNION, Validate, } from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelRotation } from '../label';
import { Layers } from '../layers';
import { MATCHING_CROSSLINE_TYPE, validateCrossLineValues } from './crossLine';
import { POSITION_TOP_COORDINATES, calculateLabelChartPadding, calculateLabelTranslation, labelDirectionHandling, } from './crossLineLabelPosition';
const CROSSLINE_LABEL_POSITION = UNION([
    'top',
    'left',
    'right',
    'bottom',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
    'inside',
    'insideLeft',
    'insideRight',
    'insideTop',
    'insideBottom',
    'insideTopLeft',
    'insideBottomLeft',
    'insideTopRight',
    'insideBottomRight',
], 'crossLine label position');
class CartesianCrossLineLabel {
    constructor() {
        this.enabled = undefined;
        this.text = undefined;
        this.fontStyle = undefined;
        this.fontWeight = undefined;
        this.fontSize = 14;
        this.fontFamily = 'Verdana, sans-serif';
        /**
         * The padding between the label and the line.
         */
        this.padding = 5;
        /**
         * The color of the labels.
         */
        this.color = 'rgba(87, 87, 87, 1)';
        this.position = undefined;
        this.rotation = undefined;
        this.parallel = undefined;
    }
}
__decorate([
    Validate(BOOLEAN, { optional: true })
], CartesianCrossLineLabel.prototype, "enabled", void 0);
__decorate([
    Validate(STRING, { optional: true })
], CartesianCrossLineLabel.prototype, "text", void 0);
__decorate([
    Validate(FONT_STYLE, { optional: true })
], CartesianCrossLineLabel.prototype, "fontStyle", void 0);
__decorate([
    Validate(FONT_WEIGHT, { optional: true })
], CartesianCrossLineLabel.prototype, "fontWeight", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], CartesianCrossLineLabel.prototype, "fontSize", void 0);
__decorate([
    Validate(STRING)
], CartesianCrossLineLabel.prototype, "fontFamily", void 0);
__decorate([
    Validate(NUMBER)
], CartesianCrossLineLabel.prototype, "padding", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], CartesianCrossLineLabel.prototype, "color", void 0);
__decorate([
    Validate(CROSSLINE_LABEL_POSITION, { optional: true })
], CartesianCrossLineLabel.prototype, "position", void 0);
__decorate([
    Validate(DEGREE, { optional: true })
], CartesianCrossLineLabel.prototype, "rotation", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], CartesianCrossLineLabel.prototype, "parallel", void 0);
export class CartesianCrossLine {
    constructor() {
        this.id = createId(this);
        this.enabled = undefined;
        this.type = undefined;
        this.range = undefined;
        this.value = undefined;
        this.fill = undefined;
        this.fillOpacity = undefined;
        this.stroke = undefined;
        this.strokeWidth = undefined;
        this.strokeOpacity = undefined;
        this.lineDash = undefined;
        this.label = new CartesianCrossLineLabel();
        this.scale = undefined;
        this.clippedRange = [-Infinity, Infinity];
        this.gridLength = 0;
        this.sideFlag = -1;
        this.parallelFlipRotation = 0;
        this.regularFlipRotation = 0;
        this.direction = ChartAxisDirection.X;
        this.group = new Group({ name: `${this.id}`, layer: true, zIndex: CartesianCrossLine.LINE_LAYER_ZINDEX });
        this.labelGroup = new Group({ name: `${this.id}`, layer: true, zIndex: CartesianCrossLine.LABEL_LAYER_ZINDEX });
        this.crossLineRange = new Range();
        this.crossLineLabel = new Text();
        this.labelPoint = undefined;
        this.data = [];
        this.startLine = false;
        this.endLine = false;
        this.isRange = false;
        const { group, labelGroup, crossLineRange, crossLineLabel } = this;
        group.append(crossLineRange);
        labelGroup.append(crossLineLabel);
        crossLineRange.pointerEvents = PointerEvents.None;
    }
    update(visible) {
        const { enabled, data, type, value, range, scale } = this;
        if (!type ||
            !scale ||
            !enabled ||
            !visible ||
            !validateCrossLineValues(type, value, range, scale) ||
            data.length === 0) {
            this.group.visible = false;
            this.labelGroup.visible = false;
            return;
        }
        this.group.visible = visible;
        this.labelGroup.visible = visible;
        this.group.zIndex = this.getZIndex(this.isRange);
        this.updateNodes();
    }
    calculateLayout(visible, reversedAxis) {
        if (!visible) {
            return;
        }
        const dataCreated = this.createNodeData(reversedAxis);
        if (!dataCreated) {
            return;
        }
        const { sideFlag, gridLength, data } = this;
        const boxes = [];
        const x1 = 0;
        const x2 = sideFlag * gridLength;
        const y1 = data[0];
        const y2 = data[1];
        const crossLineBox = new BBox(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x1 - x2), Math.abs(y1 - y2));
        boxes.push(crossLineBox);
        const labelBox = this.computeLabelBBox();
        if (labelBox) {
            boxes.push(labelBox);
        }
        return BBox.merge(boxes);
    }
    updateNodes() {
        this.updateRangeNode();
        if (this.label.enabled) {
            this.updateLabel();
            this.positionLabel();
        }
    }
    createNodeData(reversedAxis) {
        var _a, _b, _c;
        const { scale, gridLength, sideFlag, direction, label: { position = 'top' }, clippedRange, strokeWidth = 0, } = this;
        this.data = [];
        if (!scale) {
            return false;
        }
        const bandwidth = (_a = scale.bandwidth) !== null && _a !== void 0 ? _a : 0;
        const step = (_b = scale.step) !== null && _b !== void 0 ? _b : 0;
        const padding = (reversedAxis ? -1 : 1) * (scale instanceof BandScale ? (step - bandwidth) / 2 : 0);
        const [xStart, xEnd] = [0, sideFlag * gridLength];
        let [yStart, yEnd] = this.getRange();
        let [clampedYStart, clampedYEnd] = [
            Number(scale.convert(yStart, { clampMode: 'clamped' })) - padding,
            scale.convert(yEnd, { clampMode: 'clamped' }) + bandwidth + padding,
        ];
        clampedYStart = clampArray(clampedYStart, clippedRange);
        clampedYEnd = clampArray(clampedYEnd, clippedRange);
        [yStart, yEnd] = [Number(scale.convert(yStart)), scale.convert(yEnd) + bandwidth];
        const validRange = (yStart === clampedYStart || yEnd === clampedYEnd || clampedYStart !== clampedYEnd) &&
            Math.abs(clampedYEnd - clampedYStart) > 0;
        if (validRange && clampedYStart > clampedYEnd) {
            [clampedYStart, clampedYEnd] = [clampedYEnd, clampedYStart];
            [yStart, yEnd] = [yEnd, yStart];
        }
        if (yStart - padding >= clampedYStart)
            yStart -= padding;
        if (yEnd + padding <= clampedYEnd)
            yEnd += padding;
        this.isRange = validRange;
        this.startLine = strokeWidth > 0 && yStart >= clampedYStart && yStart <= clampedYStart + padding;
        this.endLine = strokeWidth > 0 && yEnd >= clampedYEnd - bandwidth - padding && yEnd <= clampedYEnd;
        if (!validRange && !this.startLine && !this.endLine) {
            return false;
        }
        this.data = [clampedYStart, clampedYEnd];
        if (this.label.enabled) {
            const yDirection = direction === ChartAxisDirection.Y;
            const { c = POSITION_TOP_COORDINATES } = (_c = labelDirectionHandling[position]) !== null && _c !== void 0 ? _c : {};
            const { x: labelX, y: labelY } = c({
                yDirection,
                xStart,
                xEnd,
                yStart: clampedYStart,
                yEnd: clampedYEnd,
            });
            this.labelPoint = {
                x: labelX,
                y: labelY,
            };
        }
        return true;
    }
    updateRangeNode() {
        var _a;
        const { crossLineRange, sideFlag, gridLength, data, startLine, endLine, isRange, fill, fillOpacity, stroke, strokeWidth, lineDash, } = this;
        crossLineRange.x1 = 0;
        crossLineRange.x2 = sideFlag * gridLength;
        crossLineRange.y1 = data[0];
        crossLineRange.y2 = data[1];
        crossLineRange.startLine = startLine;
        crossLineRange.endLine = endLine;
        crossLineRange.isRange = isRange;
        crossLineRange.fill = fill;
        crossLineRange.fillOpacity = fillOpacity !== null && fillOpacity !== void 0 ? fillOpacity : 1;
        crossLineRange.stroke = stroke;
        crossLineRange.strokeWidth = strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 1;
        crossLineRange.strokeOpacity = (_a = this.strokeOpacity) !== null && _a !== void 0 ? _a : 1;
        crossLineRange.lineDash = lineDash;
    }
    updateLabel() {
        const { crossLineLabel, label } = this;
        if (!label.text) {
            return;
        }
        crossLineLabel.fontStyle = label.fontStyle;
        crossLineLabel.fontWeight = label.fontWeight;
        crossLineLabel.fontSize = label.fontSize;
        crossLineLabel.fontFamily = label.fontFamily;
        crossLineLabel.fill = label.color;
        crossLineLabel.text = label.text;
    }
    positionLabel() {
        const { crossLineLabel, labelPoint: { x = undefined, y = undefined } = {}, label: { parallel, rotation, position = 'top', padding = 0 }, direction, parallelFlipRotation, regularFlipRotation, } = this;
        if (x === undefined || y === undefined) {
            return;
        }
        const { defaultRotation, configuredRotation } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });
        crossLineLabel.rotation = defaultRotation + configuredRotation;
        crossLineLabel.textBaseline = 'middle';
        crossLineLabel.textAlign = 'center';
        const bbox = crossLineLabel.computeTransformedBBox();
        if (!bbox) {
            return;
        }
        const yDirection = direction === ChartAxisDirection.Y;
        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection,
            padding,
            position,
            bbox,
        });
        crossLineLabel.translationX = x + xTranslation;
        crossLineLabel.translationY = y + yTranslation;
    }
    getZIndex(isRange = false) {
        if (isRange) {
            return CartesianCrossLine.RANGE_LAYER_ZINDEX;
        }
        return CartesianCrossLine.LINE_LAYER_ZINDEX;
    }
    getRange() {
        var _a;
        const { value, range, scale } = this;
        const isContinuous = ContinuousScale.is(scale);
        const start = (_a = range === null || range === void 0 ? void 0 : range[0]) !== null && _a !== void 0 ? _a : value;
        let end = range === null || range === void 0 ? void 0 : range[1];
        if (!isContinuous && end === undefined) {
            end = start;
        }
        if (isContinuous && start === end) {
            end = undefined;
        }
        return [start, end];
    }
    computeLabelBBox() {
        const { label } = this;
        if (!label.enabled) {
            return undefined;
        }
        const tempText = new Text();
        tempText.fontFamily = label.fontFamily;
        tempText.fontSize = label.fontSize;
        tempText.fontStyle = label.fontStyle;
        tempText.fontWeight = label.fontWeight;
        tempText.text = label.text;
        const { labelPoint: { x = undefined, y = undefined } = {}, label: { parallel, rotation, position = 'top', padding = 0 }, direction, parallelFlipRotation, regularFlipRotation, } = this;
        if (x === undefined || y === undefined) {
            return undefined;
        }
        const { configuredRotation } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });
        tempText.rotation = configuredRotation;
        tempText.textBaseline = 'middle';
        tempText.textAlign = 'center';
        const bbox = tempText.computeTransformedBBox();
        if (!bbox) {
            return undefined;
        }
        const yDirection = direction === ChartAxisDirection.Y;
        const { xTranslation, yTranslation } = calculateLabelTranslation({
            yDirection,
            padding,
            position,
            bbox,
        });
        tempText.translationX = x + xTranslation;
        tempText.translationY = y + yTranslation;
        return tempText.computeTransformedBBox();
    }
    calculatePadding(padding) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const { isRange, startLine, endLine, direction, label: { padding: labelPadding = 0, position = 'top' }, } = this;
        if (!isRange && !startLine && !endLine) {
            return;
        }
        const crossLineLabelBBox = this.computeLabelBBox();
        const labelX = crossLineLabelBBox === null || crossLineLabelBBox === void 0 ? void 0 : crossLineLabelBBox.x;
        const labelY = crossLineLabelBBox === null || crossLineLabelBBox === void 0 ? void 0 : crossLineLabelBBox.y;
        if (!crossLineLabelBBox || labelX == undefined || labelY == undefined) {
            return;
        }
        const chartPadding = calculateLabelChartPadding({
            yDirection: direction === ChartAxisDirection.Y,
            padding: labelPadding,
            position,
            bbox: crossLineLabelBBox,
        });
        padding.left = Math.max((_a = padding.left) !== null && _a !== void 0 ? _a : 0, (_b = chartPadding.left) !== null && _b !== void 0 ? _b : 0);
        padding.right = Math.max((_c = padding.right) !== null && _c !== void 0 ? _c : 0, (_d = chartPadding.right) !== null && _d !== void 0 ? _d : 0);
        padding.top = Math.max((_e = padding.top) !== null && _e !== void 0 ? _e : 0, (_f = chartPadding.top) !== null && _f !== void 0 ? _f : 0);
        padding.bottom = Math.max((_g = padding.bottom) !== null && _g !== void 0 ? _g : 0, (_h = chartPadding.bottom) !== null && _h !== void 0 ? _h : 0);
    }
}
CartesianCrossLine.LINE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_LINE_ZINDEX;
CartesianCrossLine.RANGE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_RANGE_ZINDEX;
CartesianCrossLine.LABEL_LAYER_ZINDEX = Layers.SERIES_LABEL_ZINDEX;
CartesianCrossLine.className = 'CrossLine';
__decorate([
    Validate(BOOLEAN, { optional: true })
], CartesianCrossLine.prototype, "enabled", void 0);
__decorate([
    Validate(UNION(['range', 'line'], 'a crossLine type'), { optional: true })
], CartesianCrossLine.prototype, "type", void 0);
__decorate([
    Validate(AND(MATCHING_CROSSLINE_TYPE('range'), ARRAY.restrict({ length: 2 })), {
        optional: true,
    })
], CartesianCrossLine.prototype, "range", void 0);
__decorate([
    Validate(MATCHING_CROSSLINE_TYPE('value'), { optional: true })
], CartesianCrossLine.prototype, "value", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], CartesianCrossLine.prototype, "fill", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], CartesianCrossLine.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], CartesianCrossLine.prototype, "stroke", void 0);
__decorate([
    Validate(NUMBER, { optional: true })
], CartesianCrossLine.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], CartesianCrossLine.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH, { optional: true })
], CartesianCrossLine.prototype, "lineDash", void 0);
//# sourceMappingURL=cartesianCrossLine.js.map