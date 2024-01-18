var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _Scale, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
const { LinearScale, Invalidating } = _Scale;
const { isNumberEqual, range } = _Util;
export class LinearAngleScale extends LinearScale {
    constructor() {
        super(...arguments);
        this.arcLength = 0;
        this.niceTickStep = 0;
    }
    ticks() {
        if (!this.domain || this.domain.length < 2 || this.domain.some((d) => !isFinite(d))) {
            return [];
        }
        this.refresh();
        const [d0, d1] = this.getDomain();
        const { interval } = this;
        if (interval) {
            const step = Math.abs(interval);
            if (!this.isDenseInterval({ start: d0, stop: d1, interval: step })) {
                return range(d0, d1, step);
            }
        }
        const step = this.nice && this.niceTickStep ? this.niceTickStep : this.getTickStep(d0, d1);
        return range(d0, d1, step);
    }
    hasNiceRange() {
        const range = this.range.slice().sort((a, b) => a - b);
        const niceRanges = [Math.PI, 2 * Math.PI];
        return niceRanges.some((r) => isNumberEqual(r, range[1] - range[0]));
    }
    getNiceStepAndTickCount() {
        const [start, stop] = this.niceDomain;
        let step = this.getTickStep(start, stop);
        const maxTickCount = isNaN(this.maxTickCount) ? Infinity : this.maxTickCount;
        const expectedTickCount = Math.abs(stop - start) / step;
        let niceTickCount = Math.pow(2, Math.ceil(Math.log(expectedTickCount) / Math.log(2)));
        if (niceTickCount > maxTickCount) {
            niceTickCount /= 2;
            step *= 2;
        }
        return {
            count: niceTickCount,
            step,
        };
    }
    updateNiceDomain() {
        super.updateNiceDomain();
        if (!this.hasNiceRange()) {
            return;
        }
        const reversed = this.niceDomain[0] > this.niceDomain[1];
        const start = reversed ? this.niceDomain[1] : this.niceDomain[0];
        const { step, count } = this.getNiceStepAndTickCount();
        const s = 1 / step; // Prevent floating point error
        const stop = step >= 1 ? Math.ceil(start / step + count) * step : Math.ceil((start + count * step) * s) / s;
        this.niceDomain = reversed ? [stop, start] : [start, stop];
        this.niceTickStep = step;
    }
    getPixelRange() {
        return this.arcLength;
    }
}
__decorate([
    Invalidating
], LinearAngleScale.prototype, "arcLength", void 0);
//# sourceMappingURL=linearAngleScale.js.map