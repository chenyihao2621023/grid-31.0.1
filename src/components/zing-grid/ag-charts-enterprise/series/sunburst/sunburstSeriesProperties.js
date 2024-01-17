var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/ag-charts-community/main.js';
import { AutoSizeableSecondaryLabel, AutoSizedLabel } from '../util/labelFormatter';
const { HierarchySeriesProperties, HighlightStyle, SeriesTooltip, Validate, COLOR_STRING, FUNCTION, NUMBER, OBJECT, POSITIVE_NUMBER, RATIO, STRING, } = _ModuleSupport;
class SunburstSeriesTileHighlightStyle extends HighlightStyle {
    constructor() {
        super(...arguments);
        this.label = new AutoSizedLabel();
        this.secondaryLabel = new AutoSizedLabel();
    }
}
__decorate([
    Validate(STRING, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fill", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], SunburstSeriesTileHighlightStyle.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(OBJECT)
], SunburstSeriesTileHighlightStyle.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], SunburstSeriesTileHighlightStyle.prototype, "secondaryLabel", void 0);
export class SunburstSeriesProperties extends HierarchySeriesProperties {
    constructor() {
        super(...arguments);
        this.fillOpacity = 1;
        this.strokeWidth = 0;
        this.strokeOpacity = 1;
        this.highlightStyle = new SunburstSeriesTileHighlightStyle();
        this.label = new AutoSizedLabel();
        this.secondaryLabel = new AutoSizeableSecondaryLabel();
        this.tooltip = new SeriesTooltip();
    }
}
__decorate([
    Validate(STRING, { optional: true })
], SunburstSeriesProperties.prototype, "sizeName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], SunburstSeriesProperties.prototype, "labelKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], SunburstSeriesProperties.prototype, "secondaryLabelKey", void 0);
__decorate([
    Validate(RATIO)
], SunburstSeriesProperties.prototype, "fillOpacity", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], SunburstSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], SunburstSeriesProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(NUMBER, { optional: true })
], SunburstSeriesProperties.prototype, "sectorSpacing", void 0);
__decorate([
    Validate(NUMBER, { optional: true })
], SunburstSeriesProperties.prototype, "padding", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], SunburstSeriesProperties.prototype, "formatter", void 0);
__decorate([
    Validate(OBJECT)
], SunburstSeriesProperties.prototype, "highlightStyle", void 0);
__decorate([
    Validate(OBJECT)
], SunburstSeriesProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], SunburstSeriesProperties.prototype, "secondaryLabel", void 0);
__decorate([
    Validate(OBJECT)
], SunburstSeriesProperties.prototype, "tooltip", void 0);
//# sourceMappingURL=sunburstSeriesProperties.js.map