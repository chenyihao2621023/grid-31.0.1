var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { RATIO, UNION, Validate } from '../../util/validation';
import { Axis } from './axis';
export const POLAR_AXIS_SHAPE = UNION(['polygon', 'circle'], 'a polar axis shape');
export class PolarAxis extends Axis {
    constructor() {
        super(...arguments);
        this.shape = 'polygon';
        this.innerRadiusRatio = 0;
        this.defaultTickMinSpacing = 20;
    }
    computeLabelsBBox(_options, _seriesRect) {
        return null;
    }
}
__decorate([
    Validate(POLAR_AXIS_SHAPE)
], PolarAxis.prototype, "shape", void 0);
__decorate([
    Validate(RATIO)
], PolarAxis.prototype, "innerRadiusRatio", void 0);
//# sourceMappingURL=polarAxis.js.map