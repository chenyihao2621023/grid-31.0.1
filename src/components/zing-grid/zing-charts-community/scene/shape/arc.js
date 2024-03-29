var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { normalizeAngle360 } from '../../util/angle';
import { isEqual } from '../../util/number';
import { BBox } from '../bbox';
import { Path, ScenePathChangeDetection } from './path';
import { Shape } from './shape';
var ArcType;
(function (ArcType) {
  ArcType[ArcType["Open"] = 0] = "Open";
  ArcType[ArcType["Chord"] = 1] = "Chord";
  ArcType[ArcType["Round"] = 2] = "Round";
})(ArcType || (ArcType = {}));
export class Arc extends Path {
  constructor() {
    super();
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 10;
    this.startAngle = 0;
    this.endAngle = Math.PI * 2;
    this.counterClockwise = false;
    this.type = ArcType.Open;
    this.restoreOwnStyles();
  }
  get fullPie() {
    return isEqual(normalizeAngle360(this.startAngle), normalizeAngle360(this.endAngle));
  }
  updatePath() {
    const path = this.path;
    path.clear();
    path.arc(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle, this.counterClockwise);
    if (this.type === ArcType.Chord) {
      path.closePath();
    } else if (this.type === ArcType.Round && !this.fullPie) {
      path.lineTo(this.centerX, this.centerY);
      path.closePath();
    }
  }
  computeBBox() {
    return new BBox(this.centerX - this.radius, this.centerY - this.radius, this.radius * 2, this.radius * 2);
  }
  isPointInPath(x, y) {
    const point = this.transformPoint(x, y);
    const bbox = this.computeBBox();
    return this.type !== ArcType.Open && bbox.containsPoint(point.x, point.y) && this.path.isPointInPath(point.x, point.y);
  }
}
Arc.className = 'Arc';
Arc.defaultStyles = Object.assign({}, Shape.defaultStyles, {
  lineWidth: 1,
  fillStyle: null
});
__decorate([ScenePathChangeDetection()], Arc.prototype, "centerX", void 0);
__decorate([ScenePathChangeDetection()], Arc.prototype, "centerY", void 0);
__decorate([ScenePathChangeDetection()], Arc.prototype, "radius", void 0);
__decorate([ScenePathChangeDetection()], Arc.prototype, "startAngle", void 0);
__decorate([ScenePathChangeDetection()], Arc.prototype, "endAngle", void 0);
__decorate([ScenePathChangeDetection()], Arc.prototype, "counterClockwise", void 0);
__decorate([ScenePathChangeDetection()], Arc.prototype, "type", void 0);