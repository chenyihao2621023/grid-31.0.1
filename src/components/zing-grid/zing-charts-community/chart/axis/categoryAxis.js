var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BandScale } from '../../scale/bandScale';
import { RATIO, Validate } from '../../util/validation';
import { CartesianAxis } from './cartesianAxis';
export class CategoryAxis extends CartesianAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new BandScale());
    this._paddingOverrideEnabled = false;
    this.groupPaddingInner = 0.1;
    this.includeInvisibleDomains = true;
  }
  set paddingInner(value) {
    this._paddingOverrideEnabled = true;
    this.scale.paddingInner = value;
  }
  get paddingInner() {
    this._paddingOverrideEnabled = true;
    return this.scale.paddingInner;
  }
  set paddingOuter(value) {
    this.scale.paddingOuter = value;
  }
  get paddingOuter() {
    return this.scale.paddingOuter;
  }
  normaliseDataDomain(d) {
    const domain = [];
    const uniqueValues = new Set();
    for (const v of d) {
      const key = v instanceof Date ? v.getTime() : v;
      if (!uniqueValues.has(key)) {
        uniqueValues.add(key);
        domain.push(v);
      }
    }
    return {
      domain,
      clipped: false
    };
  }
  calculateDomain() {
    if (!this._paddingOverrideEnabled) {
      const paddings = this.boundSeries.map(s => {
        var _a;
        return (_a = s.getBandScalePadding) === null || _a === void 0 ? void 0 : _a.call(s);
      }).filter(p => p != null);
      if (paddings.length > 0) {
        this.scale.paddingInner = Math.min(...paddings.map(p => p.inner));
        this.scale.paddingOuter = Math.max(...paddings.map(p => p.outer));
      }
    }
    return super.calculateDomain();
  }
}
CategoryAxis.className = 'CategoryAxis';
CategoryAxis.type = 'category';
__decorate([Validate(RATIO)], CategoryAxis.prototype, "groupPaddingInner", void 0);