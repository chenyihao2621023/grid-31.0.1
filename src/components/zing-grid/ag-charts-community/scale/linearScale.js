import { tickFormat } from '../util/numberFormat';
import ticks, { range, singleTickDomain, tickStep } from '../util/ticks';
import { ContinuousScale } from './continuousScale';
/**
 * Maps continuous domain to a continuous range.
 */
export class LinearScale extends ContinuousScale {
    constructor() {
        super([0, 1], [0, 1]);
        this.type = 'linear';
    }
    toDomain(d) {
        return d;
    }
    ticks() {
        var _a;
        const count = (_a = this.tickCount) !== null && _a !== void 0 ? _a : ContinuousScale.defaultTickCount;
        if (!this.domain || this.domain.length < 2 || count < 1 || this.domain.some((d) => !isFinite(d))) {
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
        return ticks(d0, d1, count, this.minTickCount, this.maxTickCount);
    }
    update() {
        if (!this.domain || this.domain.length < 2) {
            return;
        }
        if (this.nice) {
            this.updateNiceDomain();
        }
    }
    getTickStep(start, stop) {
        var _a, _b;
        const count = (_a = this.tickCount) !== null && _a !== void 0 ? _a : ContinuousScale.defaultTickCount;
        return (_b = this.interval) !== null && _b !== void 0 ? _b : tickStep(start, stop, count, this.minTickCount, this.maxTickCount);
    }
    /**
     * Extends the domain so that it starts and ends on nice round values.
     */
    updateNiceDomain() {
        var _a;
        const count = (_a = this.tickCount) !== null && _a !== void 0 ? _a : ContinuousScale.defaultTickCount;
        if (count < 1) {
            this.niceDomain = [...this.domain];
            return;
        }
        let [start, stop] = this.domain;
        if (count === 1) {
            [start, stop] = singleTickDomain(start, stop);
        }
        else {
            const roundStart = start > stop ? Math.ceil : Math.floor;
            const roundStop = stop < start ? Math.floor : Math.ceil;
            const maxAttempts = 4;
            for (let i = 0; i < maxAttempts; i++) {
                const prev0 = start;
                const prev1 = stop;
                const step = this.getTickStep(start, stop);
                const [d0, d1] = this.domain;
                if (step >= 1) {
                    start = roundStart(d0 / step) * step;
                    stop = roundStop(d1 / step) * step;
                }
                else {
                    // Prevent floating point error
                    const s = 1 / step;
                    start = roundStart(d0 * s) / s;
                    stop = roundStop(d1 * s) / s;
                }
                if (start === prev0 && stop === prev1) {
                    break;
                }
            }
        }
        this.niceDomain = [start, stop];
    }
    tickFormat({ ticks, specifier }) {
        return tickFormat(ticks !== null && ticks !== void 0 ? ticks : this.ticks(), specifier);
    }
}
//# sourceMappingURL=linearScale.js.map