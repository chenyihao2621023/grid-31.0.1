var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { isObject } from '../../util/type-guards';
import { ARRAY_OF, BOOLEAN, POSITIVE_NUMBER, Validate } from '../../util/validation';
const GRID_STYLE_KEYS = ['stroke', 'lineDash'];
export const GRID_STYLE = ARRAY_OF((value) => isObject(value) && Object.keys(value).every((key) => GRID_STYLE_KEYS.includes(key)), "objects with gridline style properties such as 'stroke' or 'lineDash'");
export class AxisGridLine {
    constructor() {
        this.enabled = true;
        this.width = 1;
        this.style = [
            {
                stroke: undefined,
                lineDash: [],
            },
        ];
    }
}
__decorate([
    Validate(BOOLEAN)
], AxisGridLine.prototype, "enabled", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], AxisGridLine.prototype, "width", void 0);
__decorate([
    Validate(GRID_STYLE)
], AxisGridLine.prototype, "style", void 0);
//# sourceMappingURL=axisGridLine.js.map