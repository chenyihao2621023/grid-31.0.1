var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
import { RadialColumnSeriesBaseProperties } from './radialColumnSeriesBaseProperties';
const { Validate, RATIO } = _ModuleSupport;
export class RadialColumnSeriesProperties extends RadialColumnSeriesBaseProperties {
}
__decorate([
    Validate(RATIO, { optional: true })
], RadialColumnSeriesProperties.prototype, "columnWidthRatio", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], RadialColumnSeriesProperties.prototype, "maxColumnWidthRatio", void 0);
//# sourceMappingURL=radialColumnSeriesProperties.js.map