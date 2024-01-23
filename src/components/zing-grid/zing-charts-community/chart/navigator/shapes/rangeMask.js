var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BBox } from '../../../scene/bbox';
import { Path } from '../../../scene/shape/path';
import { clamp } from '../../../util/number';
import { ActionOnSet } from '../../../util/proxy';
import { NUMBER, POSITIVE_NUMBER, Validate } from '../../../util/validation';
function markDirtyOnChange(newValue, oldValue) {
    if (newValue !== oldValue) {
        this.dirtyPath = true;
    }
}
export class RangeMask extends Path {
    constructor() {
        super(...arguments);
        this.x = 0;
        this.y = 0;
        this.width = 200;
        this.height = 30;
        this.minRange = 0.05;
        this._min = 0;
        this._max = 1;
    }
    set min(value) {
        var _a;
        value = clamp(0, value, this.max - this.minRange);
        if (this._min !== value && !isNaN(value)) {
            this._min = value;
            this.dirtyPath = true;
            (_a = this.onRangeChange) === null || _a === void 0 ? void 0 : _a.call(this);
        }
    }
    get min() {
        return this._min;
    }
    set max(value) {
        var _a;
        value = clamp(this.min + this.minRange, value, 1);
        if (this._max !== value && !isNaN(value)) {
            this._max = value;
            this.dirtyPath = true;
            (_a = this.onRangeChange) === null || _a === void 0 ? void 0 : _a.call(this);
        }
    }
    get max() {
        return this._max;
    }
    computeBBox() {
        const { x, y, width, height } = this;
        return new BBox(x, y, width, height);
    }
    computeVisibleRangeBBox() {
        const { x, y, width, height, min, max } = this;
        const minX = x + width * min;
        const maxX = x + width * max;
        return new BBox(minX, y, maxX - minX, height);
    }
    updatePath() {
        const { path, x, y, width, height, min, max } = this;
        path.clear();
        const ax = this.align(x);
        const ay = this.align(y);
        const axw = ax + this.align(x, width);
        const ayh = ay + this.align(y, height);
        // Whole range.
        path.moveTo(ax, ay);
        path.lineTo(axw, ay);
        path.lineTo(axw, ayh);
        path.lineTo(ax, ayh);
        path.lineTo(ax, ay);
        const minX = this.align(x + width * min);
        const maxX = this.align(x + width * max);
        // Visible range.
        path.moveTo(minX, ay);
        path.lineTo(minX, ayh);
        path.lineTo(maxX, ayh);
        path.lineTo(maxX, ay);
        path.lineTo(minX, ay);
    }
}
RangeMask.className = 'RangeMask';
__decorate([
    ActionOnSet({ changeValue: markDirtyOnChange }),
    Validate(POSITIVE_NUMBER)
], RangeMask.prototype, "x", void 0);
__decorate([
    ActionOnSet({ changeValue: markDirtyOnChange }),
    Validate(POSITIVE_NUMBER)
], RangeMask.prototype, "y", void 0);
__decorate([
    ActionOnSet({ changeValue: markDirtyOnChange }),
    Validate(POSITIVE_NUMBER)
], RangeMask.prototype, "width", void 0);
__decorate([
    ActionOnSet({ changeValue: markDirtyOnChange }),
    Validate(POSITIVE_NUMBER)
], RangeMask.prototype, "height", void 0);
__decorate([
    Validate(NUMBER)
], RangeMask.prototype, "_min", void 0);
__decorate([
    Validate(NUMBER)
], RangeMask.prototype, "_max", void 0);
