var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
import { RadarSeriesProperties } from '../radar/radarSeriesProperties';
const {
  RATIO,
  COLOR_STRING,
  Validate
} = _ModuleSupport;
export class RadarAreaSeriesProperties extends RadarSeriesProperties {
  constructor() {
    super(...arguments);
    this.fill = 'black';
    this.fillOpacity = 1;
  }
}
__decorate([Validate(COLOR_STRING)], RadarAreaSeriesProperties.prototype, "fill", void 0);
__decorate([Validate(RATIO)], RadarAreaSeriesProperties.prototype, "fillOpacity", void 0);