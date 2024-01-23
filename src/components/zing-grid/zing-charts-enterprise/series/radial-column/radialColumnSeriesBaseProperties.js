var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
const {
  Label
} = _Scene;
const {
  SeriesProperties,
  SeriesTooltip,
  Validate,
  COLOR_STRING,
  DEGREE,
  FUNCTION,
  LINE_DASH,
  NUMBER,
  OBJECT,
  POSITIVE_NUMBER,
  RATIO,
  STRING
} = _ModuleSupport;
export class RadialColumnSeriesBaseProperties extends SeriesProperties {
  constructor() {
    super(...arguments);
    this.fill = 'black';
    this.fillOpacity = 1;
    this.stroke = 'black';
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.lineDash = [0];
    this.lineDashOffset = 0;
    this.rotation = 0;
    this.label = new Label();
    this.tooltip = new SeriesTooltip();
  }
}
__decorate([Validate(STRING)], RadialColumnSeriesBaseProperties.prototype, "angleKey", void 0);
__decorate([Validate(STRING, {
  optional: true
})], RadialColumnSeriesBaseProperties.prototype, "angleName", void 0);
__decorate([Validate(STRING)], RadialColumnSeriesBaseProperties.prototype, "radiusKey", void 0);
__decorate([Validate(STRING, {
  optional: true
})], RadialColumnSeriesBaseProperties.prototype, "radiusName", void 0);
__decorate([Validate(COLOR_STRING)], RadialColumnSeriesBaseProperties.prototype, "fill", void 0);
__decorate([Validate(RATIO)], RadialColumnSeriesBaseProperties.prototype, "fillOpacity", void 0);
__decorate([Validate(COLOR_STRING)], RadialColumnSeriesBaseProperties.prototype, "stroke", void 0);
__decorate([Validate(POSITIVE_NUMBER)], RadialColumnSeriesBaseProperties.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO)], RadialColumnSeriesBaseProperties.prototype, "strokeOpacity", void 0);
__decorate([Validate(LINE_DASH)], RadialColumnSeriesBaseProperties.prototype, "lineDash", void 0);
__decorate([Validate(POSITIVE_NUMBER)], RadialColumnSeriesBaseProperties.prototype, "lineDashOffset", void 0);
__decorate([Validate(FUNCTION, {
  optional: true
})], RadialColumnSeriesBaseProperties.prototype, "formatter", void 0);
__decorate([Validate(DEGREE)], RadialColumnSeriesBaseProperties.prototype, "rotation", void 0);
__decorate([Validate(STRING, {
  optional: true
})], RadialColumnSeriesBaseProperties.prototype, "stackGroup", void 0);
__decorate([Validate(NUMBER, {
  optional: true
})], RadialColumnSeriesBaseProperties.prototype, "normalizedTo", void 0);
__decorate([Validate(OBJECT)], RadialColumnSeriesBaseProperties.prototype, "label", void 0);
__decorate([Validate(OBJECT)], RadialColumnSeriesBaseProperties.prototype, "tooltip", void 0);