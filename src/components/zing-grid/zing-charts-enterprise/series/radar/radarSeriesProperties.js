var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
const { Label } = _Scene;
const { SeriesMarker, SeriesProperties, SeriesTooltip, Validate, BOOLEAN, COLOR_STRING, DEGREE, FUNCTION, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO, STRING, } = _ModuleSupport;
export class RadarSeriesProperties extends SeriesProperties {
    constructor() {
        super(...arguments);
        this.stroke = 'black';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.rotation = 0;
        this.marker = new SeriesMarker();
        this.label = new Label();
        this.tooltip = new SeriesTooltip();
        this.connectMissingData = false;
    }
}
__decorate([
    Validate(STRING)
], RadarSeriesProperties.prototype, "angleKey", void 0);
__decorate([
    Validate(STRING)
], RadarSeriesProperties.prototype, "radiusKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RadarSeriesProperties.prototype, "angleName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], RadarSeriesProperties.prototype, "radiusName", void 0);
__decorate([
    Validate(COLOR_STRING)
], RadarSeriesProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], RadarSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], RadarSeriesProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], RadarSeriesProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], RadarSeriesProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], RadarSeriesProperties.prototype, "formatter", void 0);
__decorate([
    Validate(DEGREE)
], RadarSeriesProperties.prototype, "rotation", void 0);
__decorate([
    Validate(OBJECT)
], RadarSeriesProperties.prototype, "marker", void 0);
__decorate([
    Validate(OBJECT)
], RadarSeriesProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], RadarSeriesProperties.prototype, "tooltip", void 0);
__decorate([
    Validate(BOOLEAN)
], RadarSeriesProperties.prototype, "connectMissingData", void 0);
//# sourceMappingURL=radarSeriesProperties.js.map