var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseModuleInstance } from '../../module/module';
import { BBox } from '../../scene/bbox';
import { ActionOnSet } from '../../util/proxy';
import { BOOLEAN, POSITIVE_NUMBER, Validate } from '../../util/validation';
import { NavigatorHandle } from './navigatorHandle';
import { NavigatorMask } from './navigatorMask';
import { RangeSelector } from './shapes/rangeSelector';
export class Navigator extends BaseModuleInstance {
    set width(value) {
        this.rs.width = value;
    }
    get width() {
        return this.rs.width;
    }
    set height(value) {
        this.rs.height = value;
    }
    get height() {
        return this.rs.height;
    }
    set min(value) {
        this.rs.min = value;
    }
    get min() {
        return this.rs.min;
    }
    set max(value) {
        this.rs.max = value;
    }
    get max() {
        return this.rs.max;
    }
    set visible(value) {
        this._visible = value;
        this.updateGroupVisibility();
    }
    get visible() {
        return this._visible;
    }
    updateGroupVisibility() {
        const visible = this.enabled && this.visible;
        this.rs.visible = visible;
        if (visible) {
            this.ctx.zoomManager.updateZoom('navigator', {
                x: { min: this.rs.min, max: this.rs.max },
                y: { min: 0, max: 1 },
            });
        }
        else {
            this.ctx.zoomManager.updateZoom('navigator');
        }
    }
    constructor(ctx) {
        var _a;
        super();
        this.ctx = ctx;
        this.rs = new RangeSelector();
        // Wrappers to allow option application to the scene graph nodes.
        this.mask = new NavigatorMask(this.rs.mask);
        this.minHandle = new NavigatorHandle(this.rs.minHandle);
        this.maxHandle = new NavigatorHandle(this.rs.maxHandle);
        this.minHandleDragging = false;
        this.maxHandleDragging = false;
        this.panHandleOffset = NaN;
        this.enabled = false;
        this.margin = 10;
        this._visible = true;
        this.rs.onRangeChange = () => ctx.zoomManager.updateZoom('navigator', {
            x: { min: this.rs.min, max: this.rs.max },
            y: { min: 0, max: 1 },
        });
        (_a = ctx.scene.root) === null || _a === void 0 ? void 0 : _a.appendChild(this.rs);
        const interactionOpts = { bypassPause: ['animation'] };
        this.destroyFns.push(ctx.interactionManager.addListener('drag-start', (event) => this.onDragStart(event), interactionOpts), ctx.interactionManager.addListener('drag', (event) => this.onDrag(event), interactionOpts), ctx.interactionManager.addListener('hover', (event) => this.onDrag(event), interactionOpts), ctx.interactionManager.addListener('drag-end', () => this.onDragStop(), interactionOpts), ctx.layoutService.addListener('before-series', (event) => this.layout(event)), ctx.layoutService.addListener('layout-complete', (event) => this.layoutComplete(event)), () => { var _a; return (_a = ctx.scene.root) === null || _a === void 0 ? void 0 : _a.removeChild(this.rs); }, () => this.ctx.zoomManager.updateZoom('navigator'));
        this.updateGroupVisibility();
    }
    layout({ shrinkRect }) {
        if (this.enabled) {
            const navigatorTotalHeight = this.rs.height + this.margin;
            shrinkRect.shrink(navigatorTotalHeight, 'bottom');
            this.rs.y = shrinkRect.y + shrinkRect.height + this.margin;
        }
        return { shrinkRect };
    }
    layoutComplete({ series: { rect, visible } }) {
        if (this.enabled && visible) {
            this.rs.x = rect.x;
            this.rs.width = rect.width;
        }
        this.visible = visible;
    }
    onDragStart(offset) {
        if (!this.enabled) {
            return;
        }
        const { offsetX, offsetY } = offset;
        const { rs } = this;
        const { minHandle, maxHandle, x, width, min } = rs;
        const visibleRange = rs.computeVisibleRangeBBox();
        if (!(this.minHandleDragging || this.maxHandleDragging)) {
            if (minHandle.containsPoint(offsetX, offsetY)) {
                this.minHandleDragging = true;
            }
            else if (maxHandle.containsPoint(offsetX, offsetY)) {
                this.maxHandleDragging = true;
            }
            else if (visibleRange.containsPoint(offsetX, offsetY)) {
                this.panHandleOffset = (offsetX - x) / width - min;
            }
        }
    }
    onDrag(offset) {
        if (!this.enabled) {
            return;
        }
        const { rs, panHandleOffset } = this;
        const { x, y, width, height, minHandle, maxHandle } = rs;
        const { offsetX, offsetY } = offset;
        const minX = x + width * rs.min;
        const maxX = x + width * rs.max;
        const visibleRange = new BBox(minX, y, maxX - minX, height);
        const getRatio = () => Math.min(Math.max((offsetX - x) / width, 0), 1);
        if (minHandle.containsPoint(offsetX, offsetY) || maxHandle.containsPoint(offsetX, offsetY)) {
            this.ctx.cursorManager.updateCursor('navigator', 'ew-resize');
        }
        else if (visibleRange.containsPoint(offsetX, offsetY)) {
            this.ctx.cursorManager.updateCursor('navigator', 'grab');
        }
        else {
            this.ctx.cursorManager.updateCursor('navigator');
        }
        if (this.minHandleDragging) {
            rs.min = getRatio();
        }
        else if (this.maxHandleDragging) {
            rs.max = getRatio();
        }
        else if (!isNaN(panHandleOffset)) {
            const span = rs.max - rs.min;
            const min = Math.min(getRatio() - panHandleOffset, 1 - span);
            if (min <= rs.min) {
                // pan left
                rs.min = min;
                rs.max = rs.min + span;
            }
            else {
                // pan right
                rs.max = min + span;
                rs.min = rs.max - span;
            }
        }
    }
    onDragStop() {
        this.stopHandleDragging();
    }
    stopHandleDragging() {
        this.minHandleDragging = this.maxHandleDragging = false;
        this.panHandleOffset = NaN;
    }
}
__decorate([
    ActionOnSet({
        changeValue(newValue) {
            if (newValue) {
                this.min = 0;
                this.max = 1;
            }
            this.updateGroupVisibility();
        },
    }),
    Validate(BOOLEAN)
], Navigator.prototype, "enabled", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], Navigator.prototype, "margin", void 0);
//# sourceMappingURL=navigator.js.map