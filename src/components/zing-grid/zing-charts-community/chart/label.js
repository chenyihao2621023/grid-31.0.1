var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BBox } from '../scene/bbox';
import { getFont } from '../scene/shape/text';
import { normalizeAngle360, toRadians } from '../util/angle';
import { BaseProperties } from '../util/properties';
import { BOOLEAN, COLOR_STRING, FONT_STYLE, FONT_WEIGHT, FUNCTION, POSITIVE_NUMBER, STRING, Validate } from '../util/validation';
export class Label extends BaseProperties {
  constructor() {
    super(...arguments);
    this.enabled = true;
    this.color = '#464646';
    this.fontSize = 12;
    this.fontFamily = 'Verdana, sans-serif';
  }
  getFont() {
    return getFont(this);
  }
}
__decorate([Validate(BOOLEAN)], Label.prototype, "enabled", void 0);
__decorate([Validate(COLOR_STRING)], Label.prototype, "color", void 0);
__decorate([Validate(FONT_STYLE, {
  optional: true
})], Label.prototype, "fontStyle", void 0);
__decorate([Validate(FONT_WEIGHT, {
  optional: true
})], Label.prototype, "fontWeight", void 0);
__decorate([Validate(POSITIVE_NUMBER)], Label.prototype, "fontSize", void 0);
__decorate([Validate(STRING)], Label.prototype, "fontFamily", void 0);
__decorate([Validate(FUNCTION, {
  optional: true
})], Label.prototype, "formatter", void 0);
export function calculateLabelRotation(opts) {
  const {
    parallelFlipRotation = 0,
    regularFlipRotation = 0
  } = opts;
  const configuredRotation = opts.rotation ? normalizeAngle360(toRadians(opts.rotation)) : 0;
  const parallelFlipFlag = !configuredRotation && parallelFlipRotation >= 0 && parallelFlipRotation <= Math.PI ? -1 : 1;
  const regularFlipFlag = !configuredRotation && regularFlipRotation >= 0 && regularFlipRotation <= Math.PI ? -1 : 1;
  let defaultRotation = 0;
  if (opts.parallel) {
    defaultRotation = parallelFlipFlag * Math.PI / 2;
  } else if (regularFlipFlag === -1) {
    defaultRotation = Math.PI;
  }
  return {
    configuredRotation,
    defaultRotation,
    parallelFlipFlag,
    regularFlipFlag
  };
}
export function getLabelSpacing(minSpacing, rotated) {
  if (!isNaN(minSpacing)) {
    return minSpacing;
  }
  return rotated ? 0 : 10;
}
export function getTextBaseline(parallel, labelRotation, sideFlag, parallelFlipFlag) {
  if (parallel && !labelRotation) {
    return sideFlag * parallelFlipFlag === -1 ? 'hanging' : 'bottom';
  }
  return 'middle';
}
export function getTextAlign(parallel, labelRotation, labelAutoRotation, sideFlag, regularFlipFlag) {
  const labelRotated = labelRotation > 0 && labelRotation <= Math.PI;
  const labelAutoRotated = labelAutoRotation > 0 && labelAutoRotation <= Math.PI;
  const alignFlag = labelRotated || labelAutoRotated ? -1 : 1;
  if (parallel) {
    if (labelRotation || labelAutoRotation) {
      if (sideFlag * alignFlag === -1) {
        return 'end';
      }
    } else {
      return 'center';
    }
  } else if (sideFlag * regularFlipFlag === -1) {
    return 'end';
  }
  return 'start';
}
export function calculateLabelBBox(text, bbox, labelX, labelY, labelMatrix) {
  const {
    width,
    height
  } = bbox;
  const translatedBBox = new BBox(labelX, labelY, 0, 0);
  labelMatrix.transformBBox(translatedBBox, bbox);
  const {
    x = 0,
    y = 0
  } = bbox;
  bbox.width = width;
  bbox.height = height;
  return {
    point: {
      x,
      y,
      size: 0
    },
    label: {
      width,
      height,
      text
    }
  };
}