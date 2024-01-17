var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/ag-charts-community/main.js';
const { BaseProperties, AbstractBarSeriesProperties, SeriesTooltip, Validate, COLOR_STRING, FUNCTION, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO, STRING, } = _ModuleSupport;
class BoxPlotSeriesCap extends BaseProperties {
    constructor() {
        super(...arguments);
        this.lengthRatio = 0.5;
    }
}
__decorate([
    Validate(RATIO)
], BoxPlotSeriesCap.prototype, "lengthRatio", void 0);
class BoxPlotSeriesWhisker extends BaseProperties {
}
__decorate([
    Validate(COLOR_STRING, { optional: true })
], BoxPlotSeriesWhisker.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], BoxPlotSeriesWhisker.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], BoxPlotSeriesWhisker.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH, { optional: true })
], BoxPlotSeriesWhisker.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], BoxPlotSeriesWhisker.prototype, "lineDashOffset", void 0);
export class BoxPlotSeriesProperties extends AbstractBarSeriesProperties {
    constructor() {
        super(...arguments);
        this.fill = '#c16068';
        this.fillOpacity = 1;
        this.stroke = '#333';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.cap = new BoxPlotSeriesCap();
        this.whisker = new BoxPlotSeriesWhisker();
        this.tooltip = new SeriesTooltip();
    }
}
__decorate([
    Validate(STRING)
], BoxPlotSeriesProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING)
], BoxPlotSeriesProperties.prototype, "minKey", void 0);
__decorate([
    Validate(STRING)
], BoxPlotSeriesProperties.prototype, "q1Key", void 0);
__decorate([
    Validate(STRING)
], BoxPlotSeriesProperties.prototype, "medianKey", void 0);
__decorate([
    Validate(STRING)
], BoxPlotSeriesProperties.prototype, "q3Key", void 0);
__decorate([
    Validate(STRING)
], BoxPlotSeriesProperties.prototype, "maxKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BoxPlotSeriesProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BoxPlotSeriesProperties.prototype, "yName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BoxPlotSeriesProperties.prototype, "minName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BoxPlotSeriesProperties.prototype, "q1Name", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BoxPlotSeriesProperties.prototype, "medianName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BoxPlotSeriesProperties.prototype, "q3Name", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BoxPlotSeriesProperties.prototype, "maxName", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], BoxPlotSeriesProperties.prototype, "fill", void 0);
__decorate([
    Validate(RATIO)
], BoxPlotSeriesProperties.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING)
], BoxPlotSeriesProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], BoxPlotSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], BoxPlotSeriesProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], BoxPlotSeriesProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], BoxPlotSeriesProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], BoxPlotSeriesProperties.prototype, "formatter", void 0);
__decorate([
    Validate(OBJECT)
], BoxPlotSeriesProperties.prototype, "cap", void 0);
__decorate([
    Validate(OBJECT)
], BoxPlotSeriesProperties.prototype, "whisker", void 0);
__decorate([
    Validate(OBJECT)
], BoxPlotSeriesProperties.prototype, "tooltip", void 0);
//# sourceMappingURL=boxPlotSeriesProperties.js.map