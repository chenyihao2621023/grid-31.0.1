var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DropShadow } from '../../../scene/dropShadow';
import { BOOLEAN, COLOR_STRING, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO, STRING, Validate, } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
export class AreaSeriesProperties extends CartesianSeriesProperties {
    constructor() {
        super(...arguments);
        this.xName = undefined;
        this.fill = '#c16068';
        this.fillOpacity = 1;
        this.stroke = '#874349';
        this.strokeWidth = 2;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.shadow = new DropShadow();
        this.marker = new SeriesMarker();
        this.label = new Label();
        this.tooltip = new SeriesTooltip();
        this.connectMissingData = false;
    }
}
__decorate([
    Validate(STRING)
], AreaSeriesProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], AreaSeriesProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING)
], AreaSeriesProperties.prototype, "yKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], AreaSeriesProperties.prototype, "yName", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], AreaSeriesProperties.prototype, "normalizedTo", void 0);
__decorate([
    Validate(COLOR_STRING)
], AreaSeriesProperties.prototype, "fill", void 0);
__decorate([
    Validate(RATIO)
], AreaSeriesProperties.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING)
], AreaSeriesProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], AreaSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], AreaSeriesProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], AreaSeriesProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], AreaSeriesProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(OBJECT)
], AreaSeriesProperties.prototype, "shadow", void 0);
__decorate([
    Validate(OBJECT)
], AreaSeriesProperties.prototype, "marker", void 0);
__decorate([
    Validate(OBJECT)
], AreaSeriesProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], AreaSeriesProperties.prototype, "tooltip", void 0);
__decorate([
    Validate(BOOLEAN)
], AreaSeriesProperties.prototype, "connectMissingData", void 0);
//# sourceMappingURL=areaSeriesProperties.js.map