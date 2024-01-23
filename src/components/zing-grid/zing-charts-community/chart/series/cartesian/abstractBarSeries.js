var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DIRECTION, Validate } from '../../../util/validation';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { CartesianSeries, CartesianSeriesProperties } from './cartesianSeries';
export class AbstractBarSeriesProperties extends CartesianSeriesProperties {
  constructor() {
    super(...arguments);
    this.direction = 'vertical';
  }
}
__decorate([Validate(DIRECTION)], AbstractBarSeriesProperties.prototype, "direction", void 0);
export class AbstractBarSeries extends CartesianSeries {
  getBandScalePadding() {
    return {
      inner: 0.2,
      outer: 0.1
    };
  }
  shouldFlipXY() {
    return !this.isVertical();
  }
  isVertical() {
    return this.properties.direction === 'vertical';
  }
  getBarDirection() {
    return this.shouldFlipXY() ? ChartAxisDirection.X : ChartAxisDirection.Y;
  }
  getCategoryDirection() {
    return this.shouldFlipXY() ? ChartAxisDirection.Y : ChartAxisDirection.X;
  }
  getValueAxis() {
    const direction = this.getBarDirection();
    return this.axes[direction];
  }
  getCategoryAxis() {
    const direction = this.getCategoryDirection();
    return this.axes[direction];
  }
}