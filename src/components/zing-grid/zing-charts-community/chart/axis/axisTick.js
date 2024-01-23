var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Default } from '../../util/default';
import { TimeInterval } from '../../util/time/interval';
import { isFiniteNumber } from '../../util/type-guards';
import { ARRAY, BOOLEAN, COLOR_STRING, MIN_SPACING, POSITIVE_NUMBER, Validate, predicateWithMessage, } from '../../util/validation';
const TICK_INTERVAL = predicateWithMessage((value) => (isFiniteNumber(value) && value > 0) || value instanceof TimeInterval, `a non-zero positive Number value or, for a time axis, a Time Interval such as 'zingCharts'.time.month'`);
export class AxisTick {
    constructor() {
        this.enabled = true;
        
        this.width = 1;
        
        this.size = 6;
        
        this.color = undefined;
        this.interval = undefined;
        this.values = undefined;
        this.minSpacing = NaN;
    }
}
__decorate([
    Validate(BOOLEAN)
], AxisTick.prototype, "enabled", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], AxisTick.prototype, "width", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], AxisTick.prototype, "size", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], AxisTick.prototype, "color", void 0);
__decorate([
    Validate(TICK_INTERVAL, { optional: true })
], AxisTick.prototype, "interval", void 0);
__decorate([
    Validate(ARRAY, { optional: true })
], AxisTick.prototype, "values", void 0);
__decorate([
    Validate(MIN_SPACING),
    Default(NaN)
], AxisTick.prototype, "minSpacing", void 0);
