var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
import { AutoSizedLabel } from '../util/labelFormatter';
const { SeriesProperties, SeriesTooltip, Validate, AND, ARRAY, COLOR_STRING, COLOR_STRING_ARRAY, FUNCTION, OBJECT, POSITIVE_NUMBER, STRING, TEXT_ALIGN, VERTICAL_ALIGN, } = _ModuleSupport;
export class HeatmapSeriesProperties extends SeriesProperties {
    constructor() {
        super(...arguments);
        this.colorRange = ['black', 'black'];
        this.stroke = 'black';
        this.strokeWidth = 0;
        this.textAlign = 'center';
        this.verticalAlign = 'middle';
        this.itemPadding = 0;
        this.label = new AutoSizedLabel();
        this.tooltip = new SeriesTooltip();
    }
}
__decorate([
    Validate(STRING, { optional: true })
], HeatmapSeriesProperties.prototype, "title", void 0);
__decorate([
    Validate(STRING)
], HeatmapSeriesProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING)
], HeatmapSeriesProperties.prototype, "yKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HeatmapSeriesProperties.prototype, "colorKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HeatmapSeriesProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HeatmapSeriesProperties.prototype, "yName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HeatmapSeriesProperties.prototype, "colorName", void 0);
__decorate([
    Validate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })))
], HeatmapSeriesProperties.prototype, "colorRange", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], HeatmapSeriesProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], HeatmapSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(TEXT_ALIGN)
], HeatmapSeriesProperties.prototype, "textAlign", void 0);
__decorate([
    Validate(VERTICAL_ALIGN)
], HeatmapSeriesProperties.prototype, "verticalAlign", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], HeatmapSeriesProperties.prototype, "itemPadding", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], HeatmapSeriesProperties.prototype, "formatter", void 0);
__decorate([
    Validate(OBJECT)
], HeatmapSeriesProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], HeatmapSeriesProperties.prototype, "tooltip", void 0);
//# sourceMappingURL=heatmapSeriesProperties.js.map