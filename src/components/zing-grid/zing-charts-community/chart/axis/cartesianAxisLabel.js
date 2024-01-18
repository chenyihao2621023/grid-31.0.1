var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BOOLEAN, DEGREE, Validate } from '../../util/validation';
import { AxisLabel } from './axisLabel';
export class CartesianAxisLabel extends AxisLabel {
    constructor() {
        super(...arguments);
        /**
         * Rotation angle to use when autoRotate is applied.
         */
        this.autoRotateAngle = 335;
    }
}
__decorate([
    Validate(BOOLEAN, { optional: true })
], CartesianAxisLabel.prototype, "autoRotate", void 0);
__decorate([
    Validate(DEGREE)
], CartesianAxisLabel.prototype, "autoRotateAngle", void 0);
//# sourceMappingURL=cartesianAxisLabel.js.map