var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
import { AutoSizeableSecondaryLabel, AutoSizedLabel } from '../util/labelFormatter';
const {
  Label
} = _Scene;
const {
  BaseProperties,
  HierarchySeriesProperties,
  HighlightStyle,
  SeriesTooltip,
  Validate,
  BOOLEAN,
  COLOR_STRING,
  FUNCTION,
  NUMBER,
  OBJECT,
  POSITIVE_NUMBER,
  RATIO,
  STRING,
  STRING_ARRAY,
  TEXT_ALIGN,
  VERTICAL_ALIGN
} = _ModuleSupport;
class TreemapGroupLabel extends Label {
  constructor() {
    super(...arguments);
    this.spacing = 0;
  }
}
__decorate([Validate(NUMBER)], TreemapGroupLabel.prototype, "spacing", void 0);
class TreemapSeriesGroup extends BaseProperties {
  constructor() {
    super(...arguments);
    this.fillOpacity = 1;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.textAlign = 'center';
    this.gap = 0;
    this.padding = 0;
    this.interactive = true;
    this.label = new TreemapGroupLabel();
  }
}
__decorate([Validate(STRING, {
  optional: true
})], TreemapSeriesGroup.prototype, "fill", void 0);
__decorate([Validate(RATIO)], TreemapSeriesGroup.prototype, "fillOpacity", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
})], TreemapSeriesGroup.prototype, "stroke", void 0);
__decorate([Validate(POSITIVE_NUMBER)], TreemapSeriesGroup.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO)], TreemapSeriesGroup.prototype, "strokeOpacity", void 0);
__decorate([Validate(TEXT_ALIGN)], TreemapSeriesGroup.prototype, "textAlign", void 0);
__decorate([Validate(POSITIVE_NUMBER)], TreemapSeriesGroup.prototype, "gap", void 0);
__decorate([Validate(POSITIVE_NUMBER)], TreemapSeriesGroup.prototype, "padding", void 0);
__decorate([Validate(BOOLEAN)], TreemapSeriesGroup.prototype, "interactive", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesGroup.prototype, "label", void 0);
class TreemapSeriesTile extends BaseProperties {
  constructor() {
    super(...arguments);
    this.fillOpacity = 1;
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
    this.textAlign = 'center';
    this.verticalAlign = 'middle';
    this.gap = 0;
    this.padding = 0;
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
  }
}
__decorate([Validate(STRING, {
  optional: true
})], TreemapSeriesTile.prototype, "fill", void 0);
__decorate([Validate(RATIO)], TreemapSeriesTile.prototype, "fillOpacity", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
})], TreemapSeriesTile.prototype, "stroke", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], TreemapSeriesTile.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO)], TreemapSeriesTile.prototype, "strokeOpacity", void 0);
__decorate([Validate(TEXT_ALIGN)], TreemapSeriesTile.prototype, "textAlign", void 0);
__decorate([Validate(VERTICAL_ALIGN)], TreemapSeriesTile.prototype, "verticalAlign", void 0);
__decorate([Validate(POSITIVE_NUMBER)], TreemapSeriesTile.prototype, "gap", void 0);
__decorate([Validate(POSITIVE_NUMBER)], TreemapSeriesTile.prototype, "padding", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesTile.prototype, "label", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesTile.prototype, "secondaryLabel", void 0);
class TreemapSeriesGroupHighlightStyle extends BaseProperties {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
  }
}
__decorate([Validate(STRING, {
  optional: true
})], TreemapSeriesGroupHighlightStyle.prototype, "fill", void 0);
__decorate([Validate(RATIO, {
  optional: true
})], TreemapSeriesGroupHighlightStyle.prototype, "fillOpacity", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
})], TreemapSeriesGroupHighlightStyle.prototype, "stroke", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], TreemapSeriesGroupHighlightStyle.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO, {
  optional: true
})], TreemapSeriesGroupHighlightStyle.prototype, "strokeOpacity", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesGroupHighlightStyle.prototype, "label", void 0);
class TreemapSeriesTileHighlightStyle extends BaseProperties {
  constructor() {
    super(...arguments);
    this.label = new AutoSizedLabel();
    this.secondaryLabel = new AutoSizeableSecondaryLabel();
  }
}
__decorate([Validate(STRING, {
  optional: true
})], TreemapSeriesTileHighlightStyle.prototype, "fill", void 0);
__decorate([Validate(RATIO, {
  optional: true
})], TreemapSeriesTileHighlightStyle.prototype, "fillOpacity", void 0);
__decorate([Validate(COLOR_STRING, {
  optional: true
})], TreemapSeriesTileHighlightStyle.prototype, "stroke", void 0);
__decorate([Validate(POSITIVE_NUMBER, {
  optional: true
})], TreemapSeriesTileHighlightStyle.prototype, "strokeWidth", void 0);
__decorate([Validate(RATIO, {
  optional: true
})], TreemapSeriesTileHighlightStyle.prototype, "strokeOpacity", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesTileHighlightStyle.prototype, "label", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesTileHighlightStyle.prototype, "secondaryLabel", void 0);
class TreemapSeriesHighlightStyle extends HighlightStyle {
  constructor() {
    super(...arguments);
    this.group = new TreemapSeriesGroupHighlightStyle();
    this.tile = new TreemapSeriesTileHighlightStyle();
  }
}
__decorate([Validate(OBJECT)], TreemapSeriesHighlightStyle.prototype, "group", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesHighlightStyle.prototype, "tile", void 0);
export class TreemapSeriesProperties extends HierarchySeriesProperties {
  constructor() {
    super(...arguments);
    this.highlightStyle = new TreemapSeriesHighlightStyle();
    this.tooltip = new SeriesTooltip();
    this.group = new TreemapSeriesGroup();
    this.tile = new TreemapSeriesTile();
    this.undocumentedGroupFills = [];
    this.undocumentedGroupStrokes = [];
  }
}
__decorate([Validate(STRING, {
  optional: true
})], TreemapSeriesProperties.prototype, "sizeName", void 0);
__decorate([Validate(STRING, {
  optional: true
})], TreemapSeriesProperties.prototype, "labelKey", void 0);
__decorate([Validate(STRING, {
  optional: true
})], TreemapSeriesProperties.prototype, "secondaryLabelKey", void 0);
__decorate([Validate(FUNCTION, {
  optional: true
})], TreemapSeriesProperties.prototype, "formatter", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesProperties.prototype, "highlightStyle", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesProperties.prototype, "tooltip", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesProperties.prototype, "group", void 0);
__decorate([Validate(OBJECT)], TreemapSeriesProperties.prototype, "tile", void 0);
__decorate([Validate(STRING_ARRAY)], TreemapSeriesProperties.prototype, "undocumentedGroupFills", void 0);
__decorate([Validate(STRING_ARRAY)], TreemapSeriesProperties.prototype, "undocumentedGroupStrokes", void 0);