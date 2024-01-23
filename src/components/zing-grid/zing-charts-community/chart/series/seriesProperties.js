var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseProperties } from '../../util/properties';
import { BOOLEAN, COLOR_STRING, INTERACTION_RANGE, LINE_DASH, OBJECT, POSITIVE_NUMBER, RATIO, STRING, Validate } from '../../util/validation';
export class SeriesItemHighlightStyle extends BaseProperties {
  constructor() {
    super(...arguments);
    this.fill = 'rgba(255,255,255, 0.33)';
    this.stroke = `rgba(0, 0, 0, 0.4)`;
    this.strokeWidth = 2;
  }
}
__decorate([Validate(COLOR_STRING, {
  optional: true
})], SeriesItemHighlightStyle.prototype, "fill", void 0);
__decorate([Validate(RATIO, {
  optional: true
})], SeriesItemHighlightStyle.prototype, "fillOpacity", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
})], SeriesItemHighlightStyle.prototype, "stroke", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], SeriesItemHighlightStyle.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO, {
  optional: true
})], SeriesItemHighlightStyle.prototype, "strokeOpacity", void 0);
__decorate([Validate(LINE_DASH, {
  optional: true
})], SeriesItemHighlightStyle.prototype, "lineDash", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], SeriesItemHighlightStyle.prototype, "lineDashOffset", void 0);
class SeriesHighlightStyle extends BaseProperties {}
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], SeriesHighlightStyle.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO, {
  optional: true
})], SeriesHighlightStyle.prototype, "dimOpacity", void 0);
__decorate([Validate(BOOLEAN, {
  optional: true
})], SeriesHighlightStyle.prototype, "enabled", void 0);
class TextHighlightStyle extends BaseProperties {
  constructor() {
    super(...arguments);
    this.color = 'black';
  }
}
__decorate([Validate(COLOR_STRING, {
  optional: true
})], TextHighlightStyle.prototype, "color", void 0);
export class HighlightStyle extends BaseProperties {
  constructor() {
    super(...arguments);
    this.item = new SeriesItemHighlightStyle();
    this.series = new SeriesHighlightStyle();
    this.text = new TextHighlightStyle();
  }
}
__decorate([Validate(OBJECT)], HighlightStyle.prototype, "item", void 0);
__decorate([Validate(OBJECT)], HighlightStyle.prototype, "series", void 0);
__decorate([Validate(OBJECT)], HighlightStyle.prototype, "text", void 0);
export class SeriesProperties extends BaseProperties {
  constructor() {
    super(...arguments);
    this.visible = true;
    this.showInLegend = true;
    this.cursor = 'default';
    this.nodeClickRange = 'exact';
    this.highlightStyle = new HighlightStyle();
  }
}
__decorate([Validate(STRING, {
  optional: true
})], SeriesProperties.prototype, "id", void 0);
__decorate([Validate(BOOLEAN)], SeriesProperties.prototype, "visible", void 0);
__decorate([Validate(BOOLEAN)], SeriesProperties.prototype, "showInLegend", void 0);
__decorate([Validate(STRING)], SeriesProperties.prototype, "cursor", void 0);
__decorate([Validate(INTERACTION_RANGE)], SeriesProperties.prototype, "nodeClickRange", void 0);
__decorate([Validate(OBJECT)], SeriesProperties.prototype, "highlightStyle", void 0);