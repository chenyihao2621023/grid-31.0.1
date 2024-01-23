var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
const { DropShadow, Label } = _Scene;
const { CartesianSeriesProperties, SeriesMarker, SeriesTooltip, Validate, BOOLEAN, COLOR_STRING, LINE_DASH, OBJECT, PLACEMENT, POSITIVE_NUMBER, RATIO, STRING, } = _ModuleSupport;
class RangeAreaSeriesLabel extends Label {
    constructor() {
        super(...arguments);
        this.placement = 'outside';
        this.padding = 6;
    }
}
__decorate([
    Validate(PLACEMENT)
], RangeAreaSeriesLabel.prototype, "placement", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], RangeAreaSeriesLabel.prototype, "padding", void 0);
export class RangeAreaProperties extends CartesianSeriesProperties {
    constructor() {
        super(...arguments);
        this.fill = '#99CCFF';
        this.fillOpacity = 1;
        this.stroke = '#99CCFF';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.shadow = new DropShadow().set({ enabled: false });
        this.marker = new SeriesMarker();
        this.label = new RangeAreaSeriesLabel();
        this.tooltip = new SeriesTooltip();
        this.connectMissingData = false;
    }
}
__decorate([
    Validate(STRING)
], RangeAreaProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING)
], RangeAreaProperties.prototype, "yLowKey", void 0);
__decorate([
    Validate(STRING)
], RangeAreaProperties.prototype, "yHighKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RangeAreaProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RangeAreaProperties.prototype, "yName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RangeAreaProperties.prototype, "yLowName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RangeAreaProperties.prototype, "yHighName", void 0);
__decorate([
    Validate(COLOR_STRING)
], RangeAreaProperties.prototype, "fill", void 0);
__decorate([
    Validate(RATIO)
], RangeAreaProperties.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING)
], RangeAreaProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], RangeAreaProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], RangeAreaProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], RangeAreaProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], RangeAreaProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(OBJECT)
], RangeAreaProperties.prototype, "shadow", void 0);
__decorate([
    Validate(OBJECT)
], RangeAreaProperties.prototype, "marker", void 0);
__decorate([
    Validate(OBJECT)
], RangeAreaProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], RangeAreaProperties.prototype, "tooltip", void 0);
__decorate([
    Validate(BOOLEAN)
], RangeAreaProperties.prototype, "connectMissingData", void 0);
