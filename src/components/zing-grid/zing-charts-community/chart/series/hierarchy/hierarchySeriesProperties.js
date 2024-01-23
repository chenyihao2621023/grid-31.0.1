var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { COLOR_STRING_ARRAY, STRING, Validate } from '../../../util/validation';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';
export class HierarchySeriesProperties extends SeriesProperties {
    constructor() {
        super(...arguments);
        this.childrenKey = 'children';
        this.fills = Object.values(DEFAULT_FILLS);
        this.strokes = Object.values(DEFAULT_STROKES);
    }
}
__decorate([
    Validate(STRING)
], HierarchySeriesProperties.prototype, "childrenKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HierarchySeriesProperties.prototype, "sizeKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HierarchySeriesProperties.prototype, "colorKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], HierarchySeriesProperties.prototype, "colorName", void 0);
__decorate([
    Validate(COLOR_STRING_ARRAY)
], HierarchySeriesProperties.prototype, "fills", void 0);
__decorate([
    Validate(COLOR_STRING_ARRAY)
], HierarchySeriesProperties.prototype, "strokes", void 0);
__decorate([
    Validate(COLOR_STRING_ARRAY, { optional: true })
], HierarchySeriesProperties.prototype, "colorRange", void 0);
