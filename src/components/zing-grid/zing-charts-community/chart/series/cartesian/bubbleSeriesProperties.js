var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { RedrawType, SceneChangeDetection } from '../../../scene/changeDetectable';
import { COLOR_STRING_ARRAY, NUMBER_ARRAY, OBJECT, POSITIVE_NUMBER, STRING, Validate } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
class BubbleSeriesMarker extends SeriesMarker {
    constructor() {
        super(...arguments);
        
        this.maxSize = 30;
    }
}
__decorate([
    Validate(POSITIVE_NUMBER),
    SceneChangeDetection({ redraw: RedrawType.MAJOR })
], BubbleSeriesMarker.prototype, "maxSize", void 0);
__decorate([
    Validate(NUMBER_ARRAY, { optional: true }),
    SceneChangeDetection({ redraw: RedrawType.MAJOR })
], BubbleSeriesMarker.prototype, "domain", void 0);
export class BubbleSeriesProperties extends CartesianSeriesProperties {
    constructor() {
        super(...arguments);
        this.colorRange = ['#ffff00', '#00ff00', '#0000ff'];
        this.marker = new BubbleSeriesMarker();
        this.label = new Label();
        this.tooltip = new SeriesTooltip();
    }
}
__decorate([
    Validate(STRING)
], BubbleSeriesProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING)
], BubbleSeriesProperties.prototype, "yKey", void 0);
__decorate([
    Validate(STRING)
], BubbleSeriesProperties.prototype, "sizeKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BubbleSeriesProperties.prototype, "labelKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BubbleSeriesProperties.prototype, "colorKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BubbleSeriesProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BubbleSeriesProperties.prototype, "yName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BubbleSeriesProperties.prototype, "sizeName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BubbleSeriesProperties.prototype, "labelName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BubbleSeriesProperties.prototype, "colorName", void 0);
__decorate([
    Validate(NUMBER_ARRAY, { optional: true })
], BubbleSeriesProperties.prototype, "colorDomain", void 0);
__decorate([
    Validate(COLOR_STRING_ARRAY)
], BubbleSeriesProperties.prototype, "colorRange", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BubbleSeriesProperties.prototype, "title", void 0);
__decorate([
    Validate(OBJECT)
], BubbleSeriesProperties.prototype, "marker", void 0);
__decorate([
    Validate(OBJECT)
], BubbleSeriesProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], BubbleSeriesProperties.prototype, "tooltip", void 0);
