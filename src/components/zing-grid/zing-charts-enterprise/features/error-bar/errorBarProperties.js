var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
const { BaseProperties, Validate, BOOLEAN, COLOR_STRING, FUNCTION, LINE_DASH, NUMBER, OBJECT, POSITIVE_NUMBER, RATIO, STRING, } = _ModuleSupport;
class ErrorBarCap extends BaseProperties {
}
__decorate([
    Validate(BOOLEAN, { optional: true })
], ErrorBarCap.prototype, "visible", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], ErrorBarCap.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], ErrorBarCap.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], ErrorBarCap.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH, { optional: true })
], ErrorBarCap.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], ErrorBarCap.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(NUMBER, { optional: true })
], ErrorBarCap.prototype, "length", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], ErrorBarCap.prototype, "lengthRatio", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], ErrorBarCap.prototype, "formatter", void 0);
export class ErrorBarProperties extends BaseProperties {
    constructor() {
        super(...arguments);
        this.visible = true;
        this.stroke = 'black';
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
        this.cap = new ErrorBarCap();
    }
}
__decorate([
    Validate(STRING, { optional: true })
], ErrorBarProperties.prototype, "yLowerKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ErrorBarProperties.prototype, "yLowerName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ErrorBarProperties.prototype, "yUpperKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ErrorBarProperties.prototype, "yUpperName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ErrorBarProperties.prototype, "xLowerKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ErrorBarProperties.prototype, "xLowerName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ErrorBarProperties.prototype, "xUpperKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], ErrorBarProperties.prototype, "xUpperName", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], ErrorBarProperties.prototype, "visible", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], ErrorBarProperties.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], ErrorBarProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], ErrorBarProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH, { optional: true })
], ErrorBarProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], ErrorBarProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], ErrorBarProperties.prototype, "formatter", void 0);
__decorate([
    Validate(OBJECT)
], ErrorBarProperties.prototype, "cap", void 0);
//# sourceMappingURL=errorBarProperties.js.map