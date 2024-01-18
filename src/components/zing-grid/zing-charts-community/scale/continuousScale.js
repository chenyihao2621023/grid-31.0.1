var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger } from '../util/logger';
import { Invalidating } from './invalidating';
export class ContinuousScale {
    static is(value) {
        return value instanceof ContinuousScale;
    }
    constructor(domain, range) {
        this.invalid = true;
        this.nice = false;
        this.interval = undefined;
        this.tickCount = ContinuousScale.defaultTickCount;
        this.minTickCount = 0;
        this.maxTickCount = Infinity;
        this.niceDomain = [];
        this.defaultClampMode = 'raw';
        this.domain = domain;
        this.range = range;
    }
    transform(x) {
        return x;
    }
    transformInvert(x) {
        return x;
    }
    calcBandwidth(smallestInterval = 1) {
        const domain = this.getDomain();
        const maxRange = Math.max(...this.range);
        const intervals = Math.abs(domain[1] - domain[0]) / smallestInterval + 1;
        // The number of intervals/bands is used to determine the width of individual bands by dividing the available range.
        // Allow a maximum number of bands to ensure the step does not fall below 1 pixel.
        // This means there could be some overlap of the bands in the chart.
        const maxBands = Math.floor(maxRange); // A minimum of 1px per bar/column means the maximum number of bands will equal the available range
        const bands = Math.min(intervals, maxBands);
        return maxRange / Math.max(1, bands);
    }
    fromDomain(d) {
        if (typeof d === 'number') {
            return d;
        }
        else if (d instanceof Date) {
            return d.getTime();
        }
        return NaN;
    }
    getDomain() {
        if (this.nice) {
            this.refresh();
            if (this.niceDomain.length) {
                return this.niceDomain;
            }
        }
        return this.domain;
    }
    convert(x, opts) {
        var _a;
        const clampMode = (_a = opts === null || opts === void 0 ? void 0 : opts.clampMode) !== null && _a !== void 0 ? _a : this.defaultClampMode;
        if (!this.domain || this.domain.length < 2) {
            return NaN;
        }
        this.refresh();
        const domain = this.getDomain().map((d) => this.transform(d));
        const [d0, d1] = domain;
        const { range } = this;
        const [r0, r1] = range;
        x = this.transform(x);
        if (clampMode === 'clamped') {
            const start = Math.min(this.fromDomain(d0), this.fromDomain(d1));
            const stop = Math.max(this.fromDomain(d0), this.fromDomain(d1));
            if (this.fromDomain(x) < start) {
                return r0;
            }
            else if (this.fromDomain(x) > stop) {
                return r1;
            }
        }
        if (d0 === d1) {
            return (r0 + r1) / 2;
        }
        else if (x === d0) {
            return r0;
        }
        else if (x === d1) {
            return r1;
        }
        return (r0 + ((this.fromDomain(x) - this.fromDomain(d0)) / (this.fromDomain(d1) - this.fromDomain(d0))) * (r1 - r0));
    }
    invert(x) {
        this.refresh();
        const domain = this.getDomain().map((d) => this.transform(d));
        const [d0, d1] = domain;
        const { range } = this;
        const [r0, r1] = range;
        const isReversed = r0 > r1;
        const rMin = isReversed ? r1 : r0;
        const rMax = isReversed ? r0 : r1;
        let d;
        if (x < rMin) {
            return isReversed ? d1 : d0;
        }
        else if (x > rMax) {
            return isReversed ? d0 : d1;
        }
        else if (r0 === r1) {
            d = this.toDomain((this.fromDomain(d0) + this.fromDomain(d1)) / 2);
        }
        else {
            d = this.toDomain(this.fromDomain(d0) + ((x - r0) / (r1 - r0)) * (this.fromDomain(d1) - this.fromDomain(d0)));
        }
        return this.transformInvert(d);
    }
    refresh() {
        if (!this.invalid)
            return;
        this.invalid = false;
        this.update();
        if (this.invalid) {
            Logger.warnOnce('Expected update to not invalidate scale');
        }
    }
    getPixelRange() {
        const range = this.range.slice().sort((a, b) => a - b);
        return range[1] - range[0];
    }
    isDenseInterval({ start, stop, interval, count, }) {
        const domain = stop - start;
        const availableRange = this.getPixelRange();
        const step = typeof interval === 'number' ? interval : 1;
        count !== null && count !== void 0 ? count : (count = domain / step);
        if (count >= availableRange) {
            Logger.warn(`the configured interval results in more than 1 item per pixel, ignoring. Supply a larger interval or omit this configuration`);
            return true;
        }
        return false;
    }
}
ContinuousScale.defaultTickCount = 5;
ContinuousScale.defaultMaxTickCount = 6;
__decorate([
    Invalidating
], ContinuousScale.prototype, "domain", void 0);
__decorate([
    Invalidating
], ContinuousScale.prototype, "range", void 0);
__decorate([
    Invalidating
], ContinuousScale.prototype, "nice", void 0);
__decorate([
    Invalidating
], ContinuousScale.prototype, "interval", void 0);
__decorate([
    Invalidating
], ContinuousScale.prototype, "tickCount", void 0);
__decorate([
    Invalidating
], ContinuousScale.prototype, "minTickCount", void 0);
__decorate([
    Invalidating
], ContinuousScale.prototype, "maxTickCount", void 0);
//# sourceMappingURL=continuousScale.js.map