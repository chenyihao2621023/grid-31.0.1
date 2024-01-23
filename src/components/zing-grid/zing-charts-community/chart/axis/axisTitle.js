var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BOOLEAN, COLOR_STRING, FONT_STYLE, FONT_WEIGHT, FUNCTION, POSITIVE_NUMBER, STRING, TEXT_WRAP, Validate, } from '../../util/validation';
import { Caption } from '../caption';
export class AxisTitle {
    constructor() {
        this.enabled = false;
        this.spacing = Caption.SMALL_PADDING;
        this.fontSize = 10;
        this.fontFamily = 'sans-serif';
        this.wrapping = 'always';
    }
}
__decorate([
    Validate(BOOLEAN)
], AxisTitle.prototype, "enabled", void 0);
__decorate([
    Validate(STRING, { optional: true })
], AxisTitle.prototype, "text", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], AxisTitle.prototype, "spacing", void 0);
__decorate([
    Validate(FONT_STYLE, { optional: true })
], AxisTitle.prototype, "fontStyle", void 0);
__decorate([
    Validate(FONT_WEIGHT, { optional: true })
], AxisTitle.prototype, "fontWeight", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], AxisTitle.prototype, "fontSize", void 0);
__decorate([
    Validate(STRING)
], AxisTitle.prototype, "fontFamily", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], AxisTitle.prototype, "color", void 0);
__decorate([
    Validate(TEXT_WRAP)
], AxisTitle.prototype, "wrapping", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], AxisTitle.prototype, "formatter", void 0);
