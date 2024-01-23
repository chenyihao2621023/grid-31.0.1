var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { POSITION, POSITIVE_NUMBER, Validate } from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { assignJsonApplyConstructedArray } from '../chartOptions';
import { CartesianCrossLine } from '../crossline/cartesianCrossLine';
import { Axis } from './axis';
import { CartesianAxisLabel } from './cartesianAxisLabel';
export class CartesianAxis extends Axis {
  constructor() {
    super(...arguments);
    this.thickness = 0;
    this.position = 'left';
  }
  get direction() {
    return ['top', 'bottom'].includes(this.position) ? ChartAxisDirection.X : ChartAxisDirection.Y;
  }
  updateDirection() {
    switch (this.position) {
      case 'top':
        this.rotation = -90;
        this.label.mirrored = true;
        this.label.parallel = true;
        break;
      case 'right':
        this.rotation = 0;
        this.label.mirrored = true;
        this.label.parallel = false;
        break;
      case 'bottom':
        this.rotation = -90;
        this.label.mirrored = false;
        this.label.parallel = true;
        break;
      case 'left':
        this.rotation = 0;
        this.label.mirrored = false;
        this.label.parallel = false;
        break;
    }
    if (this.axisContext) {
      this.axisContext.position = this.position;
      this.axisContext.direction = this.direction;
    }
  }
  update(primaryTickCount) {
    this.updateDirection();
    return super.update(primaryTickCount);
  }
  calculateLayout(primaryTickCount) {
    this.updateDirection();
    return super.calculateLayout(primaryTickCount);
  }
  createAxisContext() {
    return Object.assign(Object.assign({}, super.createAxisContext()), {
      position: this.position
    });
  }
  assignCrossLineArrayConstructor(crossLines) {
    assignJsonApplyConstructedArray(crossLines, CartesianCrossLine);
  }
  createLabel() {
    return new CartesianAxisLabel();
  }
}
__decorate([Validate(POSITIVE_NUMBER)], CartesianAxis.prototype, "thickness", void 0);
__decorate([Validate(POSITION)], CartesianAxis.prototype, "position", void 0);