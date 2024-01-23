var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
const {
  BaseProperties,
  AbstractBarSeriesProperties,
  PropertiesArray,
  SeriesTooltip,
  Validate,
  ARRAY,
  COLOR_STRING,
  LINE_DASH,
  OBJECT,
  POSITIVE_NUMBER,
  RATIO,
  STRING
} = _ModuleSupport;
class TargetStyle extends BaseProperties {
  constructor() {
    super(...arguments);
    this.fill = 'black';
    this.fillOpacity = 1;
    this.stroke = 'black';
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.lengthRatio = 0.75;
  }
}
__decorate([Validate(COLOR_STRING)], TargetStyle.prototype, "fill", void 0);
__decorate([Validate(RATIO)], TargetStyle.prototype, "fillOpacity", void 0);
__decorate([Validate(COLOR_STRING)], TargetStyle.prototype, "stroke", void 0);
__decorate([Validate(POSITIVE_NUMBER)], TargetStyle.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO)], TargetStyle.prototype, "strokeOpacity", void 0);
__decorate([Validate(LINE_DASH)], TargetStyle.prototype, "lineDash", void 0);
__decorate([Validate(POSITIVE_NUMBER)], TargetStyle.prototype, "lineDashOffset", void 0);
__decorate([Validate(RATIO)], TargetStyle.prototype, "lengthRatio", void 0);
class BulletScale extends BaseProperties {}
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], BulletScale.prototype, "max", void 0);
export class BulletColorRange extends BaseProperties {
  constructor() {
    super(...arguments);
    this.color = 'lightgrey';
  }
}
__decorate([Validate(COLOR_STRING)], BulletColorRange.prototype, "color", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], BulletColorRange.prototype, "stop", void 0);
export class BulletSeriesProperties extends AbstractBarSeriesProperties {
  constructor() {
    super(...arguments);
    this.fill = 'black';
    this.fillOpacity = 1;
    this.stroke = 'black';
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.widthRatio = 0.5;
    this.colorRanges = new PropertiesArray(BulletColorRange, {});
    this.target = new TargetStyle();
    this.scale = new BulletScale();
    this.tooltip = new SeriesTooltip();
  }
}
__decorate([Validate(STRING)], BulletSeriesProperties.prototype, "valueKey", void 0);
__decorate([Validate(STRING, {
  optional: true
})], BulletSeriesProperties.prototype, "valueName", void 0);
__decorate([Validate(STRING, {
  optional: true
})], BulletSeriesProperties.prototype, "targetKey", void 0);
__decorate([Validate(STRING, {
  optional: true
})], BulletSeriesProperties.prototype, "targetName", void 0);
__decorate([Validate(COLOR_STRING)], BulletSeriesProperties.prototype, "fill", void 0);
__decorate([Validate(RATIO)], BulletSeriesProperties.prototype, "fillOpacity", void 0);
__decorate([Validate(COLOR_STRING)], BulletSeriesProperties.prototype, "stroke", void 0);
__decorate([Validate(POSITIVE_NUMBER)], BulletSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO)], BulletSeriesProperties.prototype, "strokeOpacity", void 0);
__decorate([Validate(LINE_DASH)], BulletSeriesProperties.prototype, "lineDash", void 0);
__decorate([Validate(POSITIVE_NUMBER)], BulletSeriesProperties.prototype, "lineDashOffset", void 0);
__decorate([Validate(RATIO)], BulletSeriesProperties.prototype, "widthRatio", void 0);
__decorate([Validate(ARRAY.restrict({
  minLength: 1
}))], BulletSeriesProperties.prototype, "colorRanges", void 0);
__decorate([Validate(OBJECT)], BulletSeriesProperties.prototype, "target", void 0);
__decorate([Validate(OBJECT)], BulletSeriesProperties.prototype, "scale", void 0);
__decorate([Validate(OBJECT)], BulletSeriesProperties.prototype, "tooltip", void 0);