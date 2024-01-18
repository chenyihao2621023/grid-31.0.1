var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
const { ChartAxisDirection, Layers, ARRAY, BOOLEAN, COLOR_STRING, FONT_STYLE, FONT_WEIGHT, LINE_DASH, NUMBER, POSITIVE_NUMBER, RATIO, STRING, UNION, AND, Validate, MATCHING_CROSSLINE_TYPE, } = _ModuleSupport;
const { Group } = _Scene;
const { createId } = _Util;
export class PolarCrossLineLabel {
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
        this.parallel = undefined;
    }
}
__decorate([
    Validate(BOOLEAN, { optional: true })
], PolarCrossLineLabel.prototype, "enabled", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PolarCrossLineLabel.prototype, "text", void 0);
__decorate([
    Validate(FONT_STYLE, { optional: true })
], PolarCrossLineLabel.prototype, "fontStyle", void 0);
__decorate([
    Validate(FONT_WEIGHT, { optional: true })
], PolarCrossLineLabel.prototype, "fontWeight", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PolarCrossLineLabel.prototype, "fontSize", void 0);
__decorate([
    Validate(STRING)
], PolarCrossLineLabel.prototype, "fontFamily", void 0);
__decorate([
    Validate(NUMBER)
], PolarCrossLineLabel.prototype, "padding", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], PolarCrossLineLabel.prototype, "color", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], PolarCrossLineLabel.prototype, "parallel", void 0);
export class PolarCrossLine {
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
        this.shape = 'polygon';
        this.label = new PolarCrossLineLabel();
        this.scale = undefined;
        this.clippedRange = [-Infinity, Infinity];
        this.gridLength = 0;
        this.sideFlag = -1;
        this.parallelFlipRotation = 0;
        this.regularFlipRotation = 0;
        this.direction = ChartAxisDirection.X;
        this.axisInnerRadius = 0;
        this.axisOuterRadius = 0;
        this.group = new Group({ name: `${this.id}`, layer: true, zIndex: PolarCrossLine.LINE_LAYER_ZINDEX });
        this.labelGroup = new Group({ name: `${this.id}`, layer: true, zIndex: PolarCrossLine.LABEL_LAYER_ZINDEX });
    }
    calculatePadding() { }
    setSectorNodeProps(node) {
        var _a, _b, _c;
        node.fill = this.fill;
        node.fillOpacity = (_a = this.fillOpacity) !== null && _a !== void 0 ? _a : 1;
        node.stroke = this.stroke;
        node.strokeOpacity = (_b = this.strokeOpacity) !== null && _b !== void 0 ? _b : 1;
        node.strokeWidth = (_c = this.strokeWidth) !== null && _c !== void 0 ? _c : 1;
        node.lineDash = this.lineDash;
    }
    setLabelNodeProps(node, x, y, baseline, rotation) {
        const { label } = this;
        node.x = x;
        node.y = y;
        node.text = label.text;
        node.textAlign = 'center';
        node.textBaseline = baseline;
        node.rotation = rotation;
        node.rotationCenterX = x;
        node.rotationCenterY = y;
        node.fill = label.color;
        node.fontFamily = label.fontFamily;
        node.fontSize = label.fontSize;
        node.fontStyle = label.fontStyle;
        node.visible = true;
    }
    calculateLayout(_visible) {
        return undefined;
    }
}
PolarCrossLine.LINE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_LINE_ZINDEX;
PolarCrossLine.RANGE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_RANGE_ZINDEX;
PolarCrossLine.LABEL_LAYER_ZINDEX = Layers.SERIES_LABEL_ZINDEX;
__decorate([
    Validate(BOOLEAN, { optional: true })
], PolarCrossLine.prototype, "enabled", void 0);
__decorate([
    Validate(UNION(['range', 'line'], 'a crossLine type'), { optional: true })
], PolarCrossLine.prototype, "type", void 0);
__decorate([
    Validate(AND(MATCHING_CROSSLINE_TYPE('range'), ARRAY.restrict({ length: 2 })), {
        optional: true,
    })
], PolarCrossLine.prototype, "range", void 0);
__decorate([
    Validate(MATCHING_CROSSLINE_TYPE('value'), { optional: true })
], PolarCrossLine.prototype, "value", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], PolarCrossLine.prototype, "fill", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], PolarCrossLine.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], PolarCrossLine.prototype, "stroke", void 0);
__decorate([
    Validate(NUMBER, { optional: true })
], PolarCrossLine.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], PolarCrossLine.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH, { optional: true })
], PolarCrossLine.prototype, "lineDash", void 0);
//# sourceMappingURL=polarCrossLine.js.map