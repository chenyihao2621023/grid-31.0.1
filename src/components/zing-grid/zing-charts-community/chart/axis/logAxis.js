var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LogScale } from '../../scale/logScale';
import { normalisedExtentWithMetadata } from '../../util/array';
import { Default } from '../../util/default';
import { Logger } from '../../util/logger';
import { isNumber } from '../../util/type-guards';
import { AND, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, Validate, predicateWithMessage } from '../../util/validation';
import { NumberAxis } from './numberAxis';
// Cannot be 0
const NON_ZERO_NUMBER = predicateWithMessage((value) => isNumber(value) && value !== 0, 'a non-zero number');
export class LogAxis extends NumberAxis {
    normaliseDataDomain(d) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);
        const isInverted = extent[0] > extent[1];
        const crossesZero = extent[0] < 0 && extent[1] > 0;
        const hasZeroExtent = extent[0] === 0 && extent[1] === 0;
        const invalidDomain = isInverted || crossesZero || hasZeroExtent;
        if (invalidDomain) {
            d = [];
            if (crossesZero) {
                Logger.warn(`the data domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.`);
            }
            else if (hasZeroExtent) {
                Logger.warn(`the data domain has 0 extent, no data is rendered.`);
            }
        }
        if (extent[0] === 0) {
            extent[0] = 1;
        }
        if (extent[1] === 0) {
            extent[1] = -1;
        }
        return { domain: extent, clipped };
    }
    set base(value) {
        this.scale.base = value;
    }
    get base() {
        return this.scale.base;
    }
    constructor(moduleCtx) {
        super(moduleCtx, new LogScale());
        this.min = NaN;
        this.max = NaN;
    }
}
LogAxis.className = 'LogAxis';
LogAxis.type = 'log';
__decorate([
    Validate(AND(NUMBER_OR_NAN, NON_ZERO_NUMBER, LESS_THAN('max'))),
    Default(NaN)
], LogAxis.prototype, "min", void 0);
__decorate([
    Validate(AND(NUMBER_OR_NAN, NON_ZERO_NUMBER, GREATER_THAN('min'))),
    Default(NaN)
], LogAxis.prototype, "max", void 0);
//# sourceMappingURL=logAxis.js.map