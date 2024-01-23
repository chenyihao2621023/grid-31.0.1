var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scale, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { RadiusAxis } from '../radius/radiusAxis';
const {
  AND,
  Default,
  GREATER_THAN,
  LESS_THAN,
  NUMBER_OR_NAN,
  Validate
} = _ModuleSupport;
const {
  LinearScale
} = _Scale;
const {
  normalisedExtentWithMetadata
} = _Util;
export class RadiusNumberAxis extends RadiusAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new LinearScale());
    this.shape = 'polygon';
    this.min = NaN;
    this.max = NaN;
  }
  prepareTickData(data) {
    var _a;
    const {
      scale
    } = this;
    const domainTop = (_a = scale.getDomain) === null || _a === void 0 ? void 0 : _a.call(scale)[1];
    return data.filter(({
      tick
    }) => tick !== domainTop).sort((a, b) => b.tick - a.tick);
  }
  getTickRadius(tickDatum) {
    const {
      scale
    } = this;
    const maxRadius = scale.range[0];
    const minRadius = maxRadius * this.innerRadiusRatio;
    return maxRadius - tickDatum.translationY + minRadius;
  }
  normaliseDataDomain(d) {
    const {
      min,
      max
    } = this;
    const {
      extent,
      clipped
    } = normalisedExtentWithMetadata(d, min, max);
    return {
      domain: extent,
      clipped
    };
  }
}
RadiusNumberAxis.className = 'RadiusNumberAxis';
RadiusNumberAxis.type = 'radius-number';
__decorate([Validate(AND(NUMBER_OR_NAN, LESS_THAN('max'))), Default(NaN)], RadiusNumberAxis.prototype, "min", void 0);
__decorate([Validate(AND(NUMBER_OR_NAN, GREATER_THAN('min'))), Default(NaN)], RadiusNumberAxis.prototype, "max", void 0);