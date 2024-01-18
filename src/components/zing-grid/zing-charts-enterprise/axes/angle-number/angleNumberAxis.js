var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { AngleAxis } from '../angle/angleAxis';
import { LinearAngleScale } from './linearAngleScale';
const { AND, Default, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, MIN_SPACING, Validate } = _ModuleSupport;
const { angleBetween, isNumberEqual, normalisedExtentWithMetadata } = _Util;
class AngleNumberAxisTick extends _ModuleSupport.AxisTick {
    constructor() {
        super(...arguments);
        this.maxSpacing = NaN;
    }
}
__decorate([
    Validate(MIN_SPACING),
    Default(NaN)
], AngleNumberAxisTick.prototype, "maxSpacing", void 0);
export class AngleNumberAxis extends AngleAxis {
    constructor(moduleCtx) {
        super(moduleCtx, new LinearAngleScale());
        this.shape = 'circle';
        this.min = NaN;
        this.max = NaN;
    }
    normaliseDataDomain(d) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);
        return { domain: extent, clipped };
    }
    createTick() {
        return new AngleNumberAxisTick();
    }
    getRangeArcLength() {
        const { range: requestedRange } = this;
        const min = Math.min(...requestedRange);
        const max = Math.max(...requestedRange);
        const rotation = angleBetween(min, max) || 2 * Math.PI;
        const radius = this.gridLength;
        return rotation * radius;
    }
    generateAngleTicks() {
        var _a;
        const arcLength = this.getRangeArcLength();
        const { scale, tick, range: requestedRange } = this;
        const { minSpacing = NaN, maxSpacing = NaN } = tick;
        const minTicksCount = maxSpacing ? Math.floor(arcLength / maxSpacing) : 1;
        const maxTicksCount = minSpacing ? Math.floor(arcLength / minSpacing) : Infinity;
        const preferredTicksCount = Math.floor((4 / Math.PI) * Math.abs(requestedRange[0] - requestedRange[1]));
        scale.tickCount = Math.max(minTicksCount, Math.min(maxTicksCount, preferredTicksCount));
        scale.minTickCount = minTicksCount;
        scale.maxTickCount = maxTicksCount;
        scale.arcLength = arcLength;
        const ticks = (_a = tick.values) !== null && _a !== void 0 ? _a : scale.ticks();
        return ticks.map((value) => {
            return { value, visible: true };
        });
    }
    avoidLabelCollisions(labelData) {
        let { minSpacing } = this.label;
        if (!Number.isFinite(minSpacing)) {
            minSpacing = 0;
        }
        const labelsCollide = (prev, next) => {
            if (prev.hidden || next.hidden) {
                return false;
            }
            const prevBox = prev.box.clone().grow(minSpacing / 2);
            const nextBox = next.box.clone().grow(minSpacing / 2);
            return prevBox.collidesBBox(nextBox);
        };
        const firstLabel = labelData[0];
        const lastLabel = labelData[labelData.length - 1];
        if (firstLabel !== lastLabel &&
            isNumberEqual(firstLabel.x, lastLabel.x) &&
            isNumberEqual(firstLabel.y, lastLabel.y)) {
            lastLabel.hidden = true;
        }
        for (let step = 1; step < labelData.length; step *= 2) {
            let collisionDetected = false;
            for (let i = step; i < labelData.length; i += step) {
                const next = labelData[i];
                const prev = labelData[i - step];
                if (labelsCollide(prev, next)) {
                    collisionDetected = true;
                    break;
                }
            }
            if (!collisionDetected) {
                labelData.forEach((datum, i) => {
                    if (i % step > 0) {
                        datum.hidden = true;
                        datum.box = undefined;
                    }
                });
                return;
            }
        }
        labelData.forEach((datum, i) => {
            if (i > 0) {
                datum.hidden = true;
                datum.box = undefined;
            }
        });
    }
}
AngleNumberAxis.className = 'AngleNumberAxis';
AngleNumberAxis.type = 'angle-number';
__decorate([
    Validate(AND(NUMBER_OR_NAN, LESS_THAN('max'))),
    Default(NaN)
], AngleNumberAxis.prototype, "min", void 0);
__decorate([
    Validate(AND(NUMBER_OR_NAN, GREATER_THAN('min'))),
    Default(NaN)
], AngleNumberAxis.prototype, "max", void 0);
//# sourceMappingURL=angleNumberAxis.js.map