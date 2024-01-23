var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { TimeScale } from '../../scale/timeScale';
import { extent } from '../../util/array';
import { Default } from '../../util/default';
import { AND, DATE_OR_DATETIME_MS, GREATER_THAN, LESS_THAN, NAN, NUMBER, OR, Validate } from '../../util/validation';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';
const MAX_SPACING = OR(AND(NUMBER.restrict({ min: 1 }), GREATER_THAN('minSpacing')), NAN);
class TimeAxisTick extends AxisTick {
    constructor() {
        super(...arguments);
        this.maxSpacing = NaN;
    }
}
__decorate([
    Validate(MAX_SPACING),
    Default(NaN)
], TimeAxisTick.prototype, "maxSpacing", void 0);
export class TimeAxis extends CartesianAxis {
    constructor(moduleCtx) {
        super(moduleCtx, new TimeScale());
        this.datumFormat = '%m/%d/%y, %H:%M:%S';
        this.min = undefined;
        this.max = undefined;
        const { scale } = this;
        this.refreshScale();
        this.datumFormatter = scale.tickFormat({
            specifier: this.datumFormat,
        });
    }
    normaliseDataDomain(d) {
        var _a;
        let { min, max } = this;
        let clipped = false;
        if (typeof min === 'number') {
            min = new Date(min);
        }
        if (typeof max === 'number') {
            max = new Date(max);
        }
        if (d.length > 2) {
            d = ((_a = extent(d)) !== null && _a !== void 0 ? _a : [0, 1000]).map((x) => new Date(x));
        }
        if (min instanceof Date) {
            clipped || (clipped = min > d[0]);
            d = [min, d[1]];
        }
        if (max instanceof Date) {
            clipped || (clipped = max < d[1]);
            d = [d[0], max];
        }
        if (d[0] > d[1]) {
            d = [];
        }
        return { domain: d, clipped };
    }
    createTick() {
        return new TimeAxisTick();
    }
    onLabelFormatChange(ticks, format) {
        if (format) {
            super.onLabelFormatChange(ticks, format);
        }
        else {
            // For time axis labels to look nice, even if date format wasn't set.
            this.labelFormatter = this.scale.tickFormat({ ticks });
        }
    }
    formatDatum(datum) {
        var _a;
        return (_a = this.moduleCtx.callbackCache.call(this.datumFormatter, datum)) !== null && _a !== void 0 ? _a : String(datum);
    }
    calculatePadding(_min, _max, reverse) {
        // numbers in domain correspond to Unix timestamps
        // automatically expand domain by 1 in forward direction
        return reverse ? [1, 0] : [0, 1];
    }
}
TimeAxis.className = 'TimeAxis';
TimeAxis.type = 'time';
__decorate([
    Validate(AND(DATE_OR_DATETIME_MS, LESS_THAN('max')), { optional: true })
], TimeAxis.prototype, "min", void 0);
__decorate([
    Validate(AND(DATE_OR_DATETIME_MS, GREATER_THAN('min')), { optional: true })
], TimeAxis.prototype, "max", void 0);
