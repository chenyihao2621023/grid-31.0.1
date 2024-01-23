var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DropShadow } from '../../../scene/dropShadow';
import { COLOR_STRING, FUNCTION, LINE_DASH, NUMBER, OBJECT, PLACEMENT, POSITIVE_NUMBER, RATIO, STRING, Validate, } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesTooltip } from '../seriesTooltip';
import { AbstractBarSeriesProperties } from './abstractBarSeries';
class BarSeriesLabel extends Label {
    constructor() {
        super(...arguments);
        this.placement = 'inside';
    }
}
__decorate([
    Validate(PLACEMENT)
], BarSeriesLabel.prototype, "placement", void 0);
export class BarSeriesProperties extends AbstractBarSeriesProperties {
    constructor() {
        super(...arguments);
        this.fill = '#c16068';
        this.fillOpacity = 1;
        this.stroke = '#874349';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.cornerRadius = 0;
        this.shadow = new DropShadow();
        this.label = new BarSeriesLabel();
        this.tooltip = new SeriesTooltip();
    }
}
__decorate([
    Validate(STRING)
], BarSeriesProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BarSeriesProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING)
], BarSeriesProperties.prototype, "yKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BarSeriesProperties.prototype, "yName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], BarSeriesProperties.prototype, "stackGroup", void 0);
__decorate([
    Validate(NUMBER, { optional: true })
], BarSeriesProperties.prototype, "normalizedTo", void 0);
__decorate([
    Validate(COLOR_STRING)
], BarSeriesProperties.prototype, "fill", void 0);
__decorate([
    Validate(RATIO)
], BarSeriesProperties.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING)
], BarSeriesProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], BarSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], BarSeriesProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], BarSeriesProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], BarSeriesProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], BarSeriesProperties.prototype, "cornerRadius", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], BarSeriesProperties.prototype, "formatter", void 0);
__decorate([
    Validate(OBJECT, { optional: true })
], BarSeriesProperties.prototype, "shadow", void 0);
__decorate([
    Validate(OBJECT)
], BarSeriesProperties.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], BarSeriesProperties.prototype, "tooltip", void 0);
