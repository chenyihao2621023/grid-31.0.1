var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { getFont } from '../../scene/shape/text';
import { Default } from '../../util/default';
import { BOOLEAN, COLOR_STRING, DEGREE, FONT_STYLE, FONT_WEIGHT, NUMBER, NUMBER_OR_NAN, POSITIVE_NUMBER, STRING, Validate } from '../../util/validation';
export class AxisLabel {
  constructor() {
    this.enabled = true;
    this.autoWrap = false;
    this.maxWidth = undefined;
    this.maxHeight = undefined;
    this.fontStyle = undefined;
    this.fontWeight = undefined;
    this.fontSize = 12;
    this.fontFamily = 'Verdana, sans-serif';
    this.padding = 5;
    this.minSpacing = NaN;
    this.color = 'rgba(87, 87, 87, 1)';
    this.rotation = undefined;
    this.avoidCollisions = true;
    this.mirrored = false;
    this.parallel = false;
    this.formatter = undefined;
  }
  getSideFlag() {
    return this.mirrored ? 1 : -1;
  }
  getFont() {
    return getFont(this);
  }
}
__decorate([Validate(BOOLEAN)], AxisLabel.prototype, "enabled", void 0);
__decorate([Validate(BOOLEAN, {
  optional: true
})], AxisLabel.prototype, "autoWrap", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], AxisLabel.prototype, "maxWidth", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], AxisLabel.prototype, "maxHeight", void 0);
__decorate([Validate(FONT_STYLE, {
  optional: true
})], AxisLabel.prototype, "fontStyle", void 0);
__decorate([Validate(FONT_WEIGHT, {
  optional: true
})], AxisLabel.prototype, "fontWeight", void 0);
__decorate([Validate(NUMBER.restrict({
  min: 1
}))], AxisLabel.prototype, "fontSize", void 0);
__decorate([Validate(STRING)], AxisLabel.prototype, "fontFamily", void 0);
__decorate([Validate(POSITIVE_NUMBER)], AxisLabel.prototype, "padding", void 0);
__decorate([Validate(NUMBER_OR_NAN), Default(NaN)], AxisLabel.prototype, "minSpacing", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
})], AxisLabel.prototype, "color", void 0);
__decorate([Validate(DEGREE, {
  optional: true
})], AxisLabel.prototype, "rotation", void 0);
__decorate([Validate(BOOLEAN)], AxisLabel.prototype, "avoidCollisions", void 0);
__decorate([Validate(BOOLEAN)], AxisLabel.prototype, "mirrored", void 0);
__decorate([Validate(BOOLEAN)], AxisLabel.prototype, "parallel", void 0);
__decorate([Validate(STRING, {
  optional: true
})], AxisLabel.prototype, "format", void 0);