
export class TooltipManager {
    constructor(tooltip, interactionManager) {
        this.states = {};
        this.exclusiveAreas = {};
        this.destroyFns = [];
        this.tooltip = tooltip;
        this.destroyFns.push(interactionManager.addListener('hover', (e) => this.checkExclusiveRects(e)));
    }
    getRange() {
        return this.tooltip.range;
    }
    updateTooltip(callerId, meta, content) {
        var _a;
        if (content == null) {
            content = (_a = this.states[callerId]) === null || _a === void 0 ? void 0 : _a.content;
        }
        this.states[callerId] = { content, meta };
        this.applyStates();
    }
    updateExclusiveRect(callerId, area) {
        if (area) {
            this.exclusiveAreas[callerId] = area;
        }
        else {
            delete this.exclusiveAreas[callerId];
        }
    }
    removeTooltip(callerId) {
        delete this.states[callerId];
        this.applyStates();
    }
    getTooltipMeta(callerId) {
        var _a;
        return (_a = this.states[callerId]) === null || _a === void 0 ? void 0 : _a.meta;
    }
    destroy() {
        for (const destroyFn of this.destroyFns) {
            destroyFn();
        }
    }
    checkExclusiveRects(e) {
        let newAppliedExclusiveArea;
        for (const [entryId, area] of Object.entries(this.exclusiveAreas)) {
            if (!area.containsPoint(e.offsetX, e.offsetY)) {
                continue;
            }
            newAppliedExclusiveArea = entryId;
            break;
        }
        if (newAppliedExclusiveArea === this.appliedExclusiveArea) {
            return;
        }
        this.appliedExclusiveArea = newAppliedExclusiveArea;
        this.applyStates();
    }
    applyStates() {
        var _a;
        const ids = this.appliedExclusiveArea ? [this.appliedExclusiveArea] : Object.keys(this.states);
        let contentToApply;
        let metaToApply;
        // Last added entry wins.
        ids.reverse();
        ids.slice(0, 1).forEach((id) => {
            var _a;
            const { content, meta } = (_a = this.states[id]) !== null && _a !== void 0 ? _a : {};
            contentToApply = content;
            metaToApply = meta;
        });
        if (metaToApply === undefined || contentToApply === undefined) {
            this.appliedState = undefined;
            this.tooltip.toggle(false);
            return;
        }
        if (((_a = this.appliedState) === null || _a === void 0 ? void 0 : _a.content) === contentToApply) {
            const renderInstantly = this.tooltip.isVisible();
            this.tooltip.show(metaToApply, undefined, renderInstantly);
        }
        else {
            this.tooltip.show(metaToApply, contentToApply);
        }
        this.appliedState = { content: contentToApply, meta: metaToApply };
    }
    static makeTooltipMeta(event, canvas, datum, window) {
        var _a, _b, _c, _d;
        const { pageX, pageY, offsetX, offsetY } = event;
        const { tooltip } = datum.series.properties;
        const position = {
            xOffset: tooltip.position.xOffset,
            yOffset: tooltip.position.yOffset,
        };
        const meta = {
            pageX,
            pageY,
            offsetX,
            offsetY,
            event: event,
            showArrow: tooltip.showArrow,
            position,
        };
        // On line and scatter series, the tooltip covers the top of errorbars when using
        // datum.midPoint. Using datum.yBar.upperPoint renders the tooltip higher up.
        const refPoint = (_b = (_a = datum.yBar) === null || _a === void 0 ? void 0 : _a.upperPoint) !== null && _b !== void 0 ? _b : datum.midPoint;
        if (tooltip.position.type === 'node' && refPoint) {
            const { x, y } = refPoint;
            const point = datum.series.contentGroup.inverseTransformPoint(x, y);
            const canvasRect = canvas.element.getBoundingClientRect();
            return Object.assign(Object.assign({}, meta), { pageX: Math.round(canvasRect.left + window.scrollX + point.x), pageY: Math.round(canvasRect.top + window.scrollY + point.y), offsetX: Math.round(point.x), offsetY: Math.round(point.y) });
        }
        meta.enableInteraction = (_d = (_c = tooltip.interaction) === null || _c === void 0 ? void 0 : _c.enabled) !== null && _d !== void 0 ? _d : false;
        return meta;
    }
}
