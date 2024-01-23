var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { RedrawType, SceneChangeDetection } from '../../scene/changeDetectable';
import { BaseProperties } from '../../util/properties';
import { BOOLEAN, COLOR_STRING, FUNCTION, POSITIVE_NUMBER, RATIO, Validate, predicateWithMessage } from '../../util/validation';
import { Circle } from '../marker/circle';
import { Marker } from '../marker/marker';
import { isMarkerShape } from '../marker/util';
const MARKER_SHAPE = predicateWithMessage(value => isMarkerShape(value) || Object.getPrototypeOf(value) === Marker, `a marker shape keyword such as 'circle', 'diamond' or 'square' or an object extending the Marker class`);
export class SeriesMarker extends BaseProperties {
  constructor() {
    super(...arguments);
    this.enabled = true;
    this.shape = Circle;
    this.size = 6;
    this.fillOpacity = 1;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
  }
  getStyle() {
    const {
      size,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity
    } = this;
    return {
      size,
      fill,
      fillOpacity,
      stroke,
      strokeWidth,
      strokeOpacity
    };
  }
  getDiameter() {
    return this.size + this.strokeWidth;
  }
}
__decorate([Validate(BOOLEAN), SceneChangeDetection({
  redraw: RedrawType.MAJOR
})], SeriesMarker.prototype, "enabled", void 0);
__decorate([Validate(MARKER_SHAPE), SceneChangeDetection({
  redraw: RedrawType.MAJOR
})], SeriesMarker.prototype, "shape", void 0);
__decorate([Validate(POSITIVE_NUMBER), SceneChangeDetection({
  redraw: RedrawType.MAJOR
})], SeriesMarker.prototype, "size", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
}), SceneChangeDetection({
  redraw: RedrawType.MAJOR
})], SeriesMarker.prototype, "fill", void 0);
__decorate([Validate(RATIO), SceneChangeDetection({
  redraw: RedrawType.MAJOR
})], SeriesMarker.prototype, "fillOpacity", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
}), SceneChangeDetection({
  redraw: RedrawType.MAJOR
})], SeriesMarker.prototype, "stroke", void 0);
__decorate([Validate(POSITIVE_NUMBER), SceneChangeDetection({
  redraw: RedrawType.MAJOR
})], SeriesMarker.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO), SceneChangeDetection({
  redraw: RedrawType.MAJOR
})], SeriesMarker.prototype, "strokeOpacity", void 0);
__decorate([Validate(FUNCTION, {
  optional: true
}), SceneChangeDetection({
  redraw: RedrawType.MAJOR
})], SeriesMarker.prototype, "formatter", void 0);