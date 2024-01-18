var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BOOLEAN, COLOR_STRING, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO, STRING, Validate, } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
export class LineSeriesProperties extends CartesianSeriesProperties {
    constructor() {
        super(...arguments);
        this.stroke = '#874349';
        this.strokeWidth = 2;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.marker = new SeriesMarker();
        this.label = new Label();
        this.tooltip = new SeriesTooltip();
        this.connectMissingData = false;
    }
}
__decorate([
    Validate(STRING)
], LineSeriesProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING)
], LineSeriesProperties.prototype, "yKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], LineSeriesProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], LineSeriesProperties.prototype, "yName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], LineSeriesProperties.prototype, "title", void 0);
__decorate([
    Validate(COLOR_STRING)
], LineSeriesProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], LineSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], LineSeriesProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], LineSeriesProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], LineSeriesProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(OBJECT)
], LineSeriesProperties.prototype, "marker", void 0);
__decorate([
    Validate(OBJECT)
], LineSeriesProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], LineSeriesProperties.prototype, "tooltip", void 0);
__decorate([
    Validate(BOOLEAN)
], LineSeriesProperties.prototype, "connectMissingData", void 0);
//# sourceMappingURL=lineSeriesProperties.js.map