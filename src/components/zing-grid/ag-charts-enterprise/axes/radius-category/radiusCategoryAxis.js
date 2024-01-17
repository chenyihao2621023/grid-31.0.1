var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scale } from '@/components/zing-grid/ag-charts-community/main.js';
import { RadiusAxis } from '../radius/radiusAxis';
const { RATIO, ProxyPropertyOnWrite, Validate } = _ModuleSupport;
const { BandScale } = _Scale;
export class RadiusCategoryAxis extends RadiusAxis {
    constructor(moduleCtx) {
        super(moduleCtx, new BandScale());
        this.shape = 'circle';
        this.groupPaddingInner = 0;
        this.paddingInner = 0;
        this.paddingOuter = 0;
    }
    prepareTickData(data) {
        return data.slice().reverse();
    }
    getTickRadius(tickDatum) {
        const { scale } = this;
        const maxRadius = scale.range[0];
        const minRadius = maxRadius * this.innerRadiusRatio;
        const tickRange = (maxRadius - minRadius) / scale.domain.length;
        return maxRadius - tickDatum.translationY + minRadius - tickRange / 2;
    }
}
RadiusCategoryAxis.className = 'RadiusCategoryAxis';
RadiusCategoryAxis.type = 'radius-category';
__decorate([
    Validate(RATIO)
], RadiusCategoryAxis.prototype, "groupPaddingInner", void 0);
__decorate([
    ProxyPropertyOnWrite('scale', 'paddingInner'),
    Validate(RATIO)
], RadiusCategoryAxis.prototype, "paddingInner", void 0);
__decorate([
    ProxyPropertyOnWrite('scale', 'paddingOuter'),
    Validate(RATIO)
], RadiusCategoryAxis.prototype, "paddingOuter", void 0);
//# sourceMappingURL=radiusCategoryAxis.js.map