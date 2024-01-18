var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { COLOR_STRING_ARRAY, NUMBER_ARRAY, OBJECT, STRING, Validate } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
export class ScatterSeriesProperties extends CartesianSeriesProperties {
    constructor() {
        super(...arguments);
        this.colorRange = ['#ffff00', '#00ff00', '#0000ff'];
        this.marker = new SeriesMarker();
        this.label = new Label();
        this.tooltip = new SeriesTooltip();
    }
}
__decorate([
    Validate(STRING)
], ScatterSeriesProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING)
], ScatterSeriesProperties.prototype, "yKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ScatterSeriesProperties.prototype, "labelKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ScatterSeriesProperties.prototype, "colorKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ScatterSeriesProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ScatterSeriesProperties.prototype, "yName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ScatterSeriesProperties.prototype, "labelName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ScatterSeriesProperties.prototype, "colorName", void 0);
__decorate([
    Validate(NUMBER_ARRAY, { optional: true })
], ScatterSeriesProperties.prototype, "colorDomain", void 0);
__decorate([
    Validate(COLOR_STRING_ARRAY)
], ScatterSeriesProperties.prototype, "colorRange", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ScatterSeriesProperties.prototype, "title", void 0);
__decorate([
    Validate(OBJECT)
], ScatterSeriesProperties.prototype, "marker", void 0);
__decorate([
    Validate(OBJECT)
], ScatterSeriesProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], ScatterSeriesProperties.prototype, "tooltip", void 0);
//# sourceMappingURL=scatterSeriesProperties.js.map