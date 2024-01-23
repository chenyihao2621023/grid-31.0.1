var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DropShadow } from '../../../scene/dropShadow';
import { BaseProperties, PropertiesArray } from '../../../util/properties';
import { BOOLEAN, COLOR_STRING, COLOR_STRING_ARRAY, DEGREE, FUNCTION, LINE_DASH, NUMBER, OBJECT, OBJECT_ARRAY, POSITIVE_NUMBER, RATIO, STRING, Validate, } from '../../../util/validation';
import { Caption } from '../../caption';
import { Label } from '../../label';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';
export class PieTitle extends Caption {
    constructor() {
        super(...arguments);
        this.showInLegend = false;
    }
}
__decorate([
    Validate(BOOLEAN)
], PieTitle.prototype, "showInLegend", void 0);
export class DoughnutInnerLabel extends Label {
    constructor() {
        super(...arguments);
        this.margin = 2;
    }
    set(properties, _reset) {
        return super.set(properties);
    }
}
__decorate([
    Validate(STRING)
], DoughnutInnerLabel.prototype, "text", void 0);
__decorate([
    Validate(NUMBER)
], DoughnutInnerLabel.prototype, "margin", void 0);
export class DoughnutInnerCircle extends BaseProperties {
    constructor() {
        super(...arguments);
        this.fill = 'transparent';
        this.fillOpacity = 1;
    }
}
__decorate([
    Validate(COLOR_STRING)
], DoughnutInnerCircle.prototype, "fill", void 0);
__decorate([
    Validate(RATIO)
], DoughnutInnerCircle.prototype, "fillOpacity", void 0);
class PieSeriesCalloutLabel extends Label {
    constructor() {
        super(...arguments);
        this.offset = 3; // from the callout line
        this.minAngle = 0;
        this.minSpacing = 4;
        this.maxCollisionOffset = 50;
        this.avoidCollisions = true;
    }
}
__decorate([
    Validate(POSITIVE_NUMBER)
], PieSeriesCalloutLabel.prototype, "offset", void 0);
__decorate([
    Validate(DEGREE)
], PieSeriesCalloutLabel.prototype, "minAngle", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PieSeriesCalloutLabel.prototype, "minSpacing", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PieSeriesCalloutLabel.prototype, "maxCollisionOffset", void 0);
__decorate([
    Validate(BOOLEAN)
], PieSeriesCalloutLabel.prototype, "avoidCollisions", void 0);
class PieSeriesSectorLabel extends Label {
    constructor() {
        super(...arguments);
        this.positionOffset = 0;
        this.positionRatio = 0.5;
    }
}
__decorate([
    Validate(NUMBER)
], PieSeriesSectorLabel.prototype, "positionOffset", void 0);
__decorate([
    Validate(RATIO)
], PieSeriesSectorLabel.prototype, "positionRatio", void 0);
class PieSeriesCalloutLine extends BaseProperties {
    constructor() {
        super(...arguments);
        this.length = 10;
        this.strokeWidth = 1;
    }
}
__decorate([
    Validate(COLOR_STRING_ARRAY, { optional: true })
], PieSeriesCalloutLine.prototype, "colors", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PieSeriesCalloutLine.prototype, "length", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PieSeriesCalloutLine.prototype, "strokeWidth", void 0);
export class PieSeriesProperties extends SeriesProperties {
    constructor() {
        super(...arguments);
        this.fills = Object.values(DEFAULT_FILLS);
        this.strokes = Object.values(DEFAULT_STROKES);
        this.fillOpacity = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.rotation = 0;
        this.outerRadiusOffset = 0;
        this.outerRadiusRatio = 1;
        this.innerRadiusOffset = 0;
        this.innerRadiusRatio = 1;
        this.strokeWidth = 1;
        // @todo(ZING-10275) remove optionality, set default
        this.sectorSpacing = undefined;
        this.innerLabels = new PropertiesArray(DoughnutInnerLabel);
        this.title = new PieTitle();
        this.innerCircle = new DoughnutInnerCircle();
        this.shadow = new DropShadow();
        this.calloutLabel = new PieSeriesCalloutLabel();
        this.sectorLabel = new PieSeriesSectorLabel();
        this.calloutLine = new PieSeriesCalloutLine();
        this.tooltip = new SeriesTooltip();
        // @todo(ZING-10275) Remove this
        this.__BACKGROUND_COLOR_DO_NOT_USE = undefined;
    }
}
__decorate([
    Validate(STRING)
], PieSeriesProperties.prototype, "angleKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PieSeriesProperties.prototype, "angleName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PieSeriesProperties.prototype, "radiusKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PieSeriesProperties.prototype, "radiusName", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], PieSeriesProperties.prototype, "radiusMin", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], PieSeriesProperties.prototype, "radiusMax", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PieSeriesProperties.prototype, "calloutLabelKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PieSeriesProperties.prototype, "calloutLabelName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PieSeriesProperties.prototype, "sectorLabelKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PieSeriesProperties.prototype, "sectorLabelName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PieSeriesProperties.prototype, "legendItemKey", void 0);
__decorate([
    Validate(COLOR_STRING_ARRAY)
], PieSeriesProperties.prototype, "fills", void 0);
__decorate([
    Validate(COLOR_STRING_ARRAY)
], PieSeriesProperties.prototype, "strokes", void 0);
__decorate([
    Validate(RATIO)
], PieSeriesProperties.prototype, "fillOpacity", void 0);
__decorate([
    Validate(RATIO)
], PieSeriesProperties.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], PieSeriesProperties.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PieSeriesProperties.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], PieSeriesProperties.prototype, "formatter", void 0);
__decorate([
    Validate(DEGREE)
], PieSeriesProperties.prototype, "rotation", void 0);
__decorate([
    Validate(NUMBER)
], PieSeriesProperties.prototype, "outerRadiusOffset", void 0);
__decorate([
    Validate(RATIO)
], PieSeriesProperties.prototype, "outerRadiusRatio", void 0);
__decorate([
    Validate(NUMBER)
], PieSeriesProperties.prototype, "innerRadiusOffset", void 0);
__decorate([
    Validate(RATIO)
], PieSeriesProperties.prototype, "innerRadiusRatio", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PieSeriesProperties.prototype, "strokeWidth", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], PieSeriesProperties.prototype, "sectorSpacing", void 0);
__decorate([
    Validate(OBJECT_ARRAY)
], PieSeriesProperties.prototype, "innerLabels", void 0);
__decorate([
    Validate(OBJECT)
], PieSeriesProperties.prototype, "title", void 0);
__decorate([
    Validate(OBJECT)
], PieSeriesProperties.prototype, "innerCircle", void 0);
__decorate([
    Validate(OBJECT)
], PieSeriesProperties.prototype, "shadow", void 0);
__decorate([
    Validate(OBJECT)
], PieSeriesProperties.prototype, "calloutLabel", void 0);
__decorate([
    Validate(OBJECT)
], PieSeriesProperties.prototype, "sectorLabel", void 0);
__decorate([
    Validate(OBJECT)
], PieSeriesProperties.prototype, "calloutLine", void 0);
__decorate([
    Validate(OBJECT)
], PieSeriesProperties.prototype, "tooltip", void 0);
__decorate([
    Validate(STRING, { optional: true })
], PieSeriesProperties.prototype, "__BACKGROUND_COLOR_DO_NOT_USE", void 0);
