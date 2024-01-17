var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scale, _Util } from '@/components/zing-grid/ag-charts-community/main.js';
import { loopSymmetrically } from '../../utils/polar';
import { AngleAxis } from '../angle/angleAxis';
const { RATIO, Validate } = _ModuleSupport;
const { BandScale } = _Scale;
const { isNumberEqual } = _Util;
export class AngleCategoryAxis extends AngleAxis {
    constructor(moduleCtx) {
        super(moduleCtx, new BandScale());
        this.groupPaddingInner = 0;
        this.paddingInner = 0;
    }
    generateAngleTicks() {
        var _a, _b;
        const { scale, tick, gridLength: radius } = this;
        const ticks = (_b = (_a = tick.values) !== null && _a !== void 0 ? _a : scale.ticks()) !== null && _b !== void 0 ? _b : [];
        if (ticks.length < 2 || isNaN(tick.minSpacing)) {
            return ticks.map((value) => {
                return { value, visible: true };
            });
        }
        const startTick = ticks[0];
        const startAngle = scale.convert(startTick);
        const startX = radius * Math.cos(startAngle);
        const startY = radius * Math.sin(startAngle);
        for (let step = 1; step < ticks.length - 1; step++) {
            const nextTick = ticks[step];
            const nextAngle = scale.convert(nextTick);
            if (nextAngle - startAngle > Math.PI) {
                // The tick spacing will not grow on the next step
                break;
            }
            const nextX = radius * Math.cos(nextAngle);
            const nextY = radius * Math.sin(nextAngle);
            const spacing = Math.sqrt(Math.pow((nextX - startX), 2) + Math.pow((nextY - startY), 2));
            if (spacing > tick.minSpacing) {
                // Filter ticks by step
                const visibleTicks = new Set([startTick]);
                loopSymmetrically(ticks, step, (_, next) => {
                    visibleTicks.add(next);
                });
                return ticks.map((value) => {
                    const visible = visibleTicks.has(value);
                    return { value, visible };
                });
            }
        }
        // If there is no matching step, return a single tick
        return [{ value: startTick, visible: true }];
    }
    avoidLabelCollisions(labelData) {
        let { minSpacing } = this.label;
        if (!Number.isFinite(minSpacing)) {
            minSpacing = 0;
        }
        if (labelData.length < 3) {
            return;
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
        const visibleLabels = new Set([firstLabel]);
        const lastLabelIsOverFirst = isNumberEqual(firstLabel.x, lastLabel.x) && isNumberEqual(firstLabel.y, lastLabel.y);
        const maxStep = Math.floor(labelData.length / 2);
        for (let step = 1; step <= maxStep; step++) {
            const labels = lastLabelIsOverFirst ? labelData.slice(0, -1) : labelData;
            const collisionDetected = loopSymmetrically(labels, step, labelsCollide);
            if (!collisionDetected) {
                loopSymmetrically(labels, step, (_, next) => {
                    visibleLabels.add(next);
                });
                break;
            }
        }
        labelData.forEach((datum) => {
            if (!visibleLabels.has(datum)) {
                datum.hidden = true;
                datum.box = undefined;
            }
        });
    }
}
AngleCategoryAxis.className = 'AngleCategoryAxis';
AngleCategoryAxis.type = 'angle-category';
__decorate([
    Validate(RATIO)
], AngleCategoryAxis.prototype, "groupPaddingInner", void 0);
__decorate([
    Validate(RATIO)
], AngleCategoryAxis.prototype, "paddingInner", void 0);
//# sourceMappingURL=angleCategoryAxis.js.map