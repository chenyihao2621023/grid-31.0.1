var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DropShadow } from '../../../scene/dropShadow';
import { ARRAY, BOOLEAN, COLOR_STRING, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO, STRING, UNION, Validate, } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
export class HistogramSeriesProperties extends CartesianSeriesProperties {
    constructor() {
        super(...arguments);
        this.fillOpacity = 1;
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.areaPlot = false;
        this.aggregation = 'sum';
        this.shadow = new DropShadow();
        this.label = new Label();
        this.tooltip = new SeriesTooltip();
    }
}
__decorate([
    Validate(STRING)
], HistogramSeriesProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HistogramSeriesProperties.prototype, "yKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HistogramSeriesProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HistogramSeriesProperties.prototype, "yName", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], HistogramSeriesProperties.prototype, "fill", void 0);
__decorate([
    Validate(RATIO)
], HistogramSeriesProperties.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], HistogramSeriesProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], HistogramSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], HistogramSeriesProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], HistogramSeriesProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], HistogramSeriesProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(BOOLEAN)
], HistogramSeriesProperties.prototype, "areaPlot", void 0);
__decorate([
    Validate(ARRAY, { optional: true })
], HistogramSeriesProperties.prototype, "bins", void 0);
__decorate([
    Validate(UNION(['count', 'sum', 'mean'], 'a histogram aggregation'))
], HistogramSeriesProperties.prototype, "aggregation", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], HistogramSeriesProperties.prototype, "binCount", void 0);
__decorate([
    Validate(OBJECT)
], HistogramSeriesProperties.prototype, "shadow", void 0);
__decorate([
    Validate(OBJECT)
], HistogramSeriesProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], HistogramSeriesProperties.prototype, "tooltip", void 0);
//# sourceMappingURL=histogramSeriesProperties.js.map