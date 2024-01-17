var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/ag-charts-community/main.js';
const { DropShadow, Label } = _Scene;
const { AbstractBarSeriesProperties, SeriesTooltip, Validate, COLOR_STRING, FUNCTION, LINE_DASH, OBJECT, PLACEMENT, POSITIVE_NUMBER, RATIO, STRING, } = _ModuleSupport;
class RangeBarSeriesLabel extends Label {
    constructor() {
        super(...arguments);
        this.placement = 'inside';
        this.padding = 6;
    }
}
__decorate([
    Validate(PLACEMENT)
], RangeBarSeriesLabel.prototype, "placement", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], RangeBarSeriesLabel.prototype, "padding", void 0);
export class RangeBarProperties extends AbstractBarSeriesProperties {
    constructor() {
        super(...arguments);
        this.fill = '#99CCFF';
        this.fillOpacity = 1;
        this.stroke = '#99CCFF';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.cornerRadius = 0;
        this.shadow = new DropShadow().set({ enabled: false });
        this.label = new RangeBarSeriesLabel();
        this.tooltip = new SeriesTooltip();
    }
}
__decorate([
    Validate(STRING)
], RangeBarProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING)
], RangeBarProperties.prototype, "yLowKey", void 0);
__decorate([
    Validate(STRING)
], RangeBarProperties.prototype, "yHighKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RangeBarProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RangeBarProperties.prototype, "yName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RangeBarProperties.prototype, "yLowName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RangeBarProperties.prototype, "yHighName", void 0);
__decorate([
    Validate(COLOR_STRING)
], RangeBarProperties.prototype, "fill", void 0);
__decorate([
    Validate(RATIO)
], RangeBarProperties.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING)
], RangeBarProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], RangeBarProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], RangeBarProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], RangeBarProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], RangeBarProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], RangeBarProperties.prototype, "cornerRadius", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], RangeBarProperties.prototype, "formatter", void 0);
__decorate([
    Validate(OBJECT)
], RangeBarProperties.prototype, "shadow", void 0);
__decorate([
    Validate(OBJECT)
], RangeBarProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], RangeBarProperties.prototype, "tooltip", void 0);
//# sourceMappingURL=rangeBarProperties.js.map