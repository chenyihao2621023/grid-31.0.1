export const UNIT = { min: 0, max: 1 };
const constrain = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export function unitZoomState() {
    return { x: Object.assign({}, UNIT), y: Object.assign({}, UNIT) };
}
export function definedZoomState(zoom) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return {
        x: { min: (_b = (_a = zoom === null || zoom === void 0 ? void 0 : zoom.x) === null || _a === void 0 ? void 0 : _a.min) !== null && _b !== void 0 ? _b : UNIT.min, max: (_d = (_c = zoom === null || zoom === void 0 ? void 0 : zoom.x) === null || _c === void 0 ? void 0 : _c.max) !== null && _d !== void 0 ? _d : UNIT.max },
        y: { min: (_f = (_e = zoom === null || zoom === void 0 ? void 0 : zoom.y) === null || _e === void 0 ? void 0 : _e.min) !== null && _f !== void 0 ? _f : UNIT.min, max: (_h = (_g = zoom === null || zoom === void 0 ? void 0 : zoom.y) === null || _g === void 0 ? void 0 : _g.max) !== null && _h !== void 0 ? _h : UNIT.max },
    };
}
/**
 * Calculate the position on the series rect as a ratio from the top left corner. Invert the ratio on the y-axis to
 * cater for conflicting direction between screen and chart axis systems. Constrains the point to the series
 * rect so the zoom is pinned to the edges if the point is over the legends, axes, etc.
 */
export function pointToRatio(bbox, x, y) {
    if (!bbox)
        return { x: 0, y: 0 };
    const constrainedX = constrain(x - bbox.x, 0, bbox.x + bbox.width);
    const constrainedY = constrain(y - bbox.y, 0, bbox.y + bbox.height);
    const rx = (1 / bbox.width) * constrainedX;
    const ry = 1 - (1 / bbox.height) * constrainedY;
    return { x: constrain(rx), y: constrain(ry) };
}
/**
 * Translate a zoom bounding box by shifting all points by the given x & y amounts.
 */
export function translateZoom(zoom, x, y) {
    return {
        x: { min: zoom.x.min + x, max: zoom.x.max + x },
        y: { min: zoom.y.min + y, max: zoom.y.max + y },
    };
}
/**
 * Scale a zoom bounding box from the top left corner.
 */
export function scaleZoom(zoom, sx, sy) {
    const dx = zoom.x.max - zoom.x.min;
    const dy = zoom.y.max - zoom.y.min;
    return {
        x: { min: zoom.x.min, max: zoom.x.min + dx * sx },
        y: { min: zoom.y.min, max: zoom.y.min + dy * sy },
    };
}
/**
 * Scale a zoom bounding box from the center.
 */
export function scaleZoomCenter(zoom, sx, sy) {
    const dx = zoom.x.max - zoom.x.min;
    const dy = zoom.y.max - zoom.y.min;
    const cx = zoom.x.min + dx / 2;
    const cy = zoom.y.min + dy / 2;
    return {
        x: { min: cx - (dx * sx) / 2, max: cx + (dx * sx) / 2 },
        y: { min: cy - (dy * sy) / 2, max: cy + (dy * sy) / 2 },
    };
}
/**
 * Scale a single zoom axis about its anchor.
 */
export function scaleZoomAxisWithAnchor(newState, oldState, anchor, origin) {
    let { min, max } = oldState;
    const center = min + (max - min) / 2;
    const diff = newState.max - newState.min;
    if (anchor === 'start') {
        max = oldState.min + diff;
    }
    else if (anchor === 'end') {
        min = oldState.max - diff;
    }
    else if (anchor === 'middle') {
        min = center - diff / 2;
        max = center + diff / 2;
    }
    else if (anchor === 'pointer') {
        const point = scaleZoomAxisWithPoint(newState, oldState, origin !== null && origin !== void 0 ? origin : center);
        min = point.min;
        max = point.max;
    }
    return { min, max };
}
export function scaleZoomAxisWithPoint(newState, oldState, origin) {
    const scaledOrigin = origin * (1 - (oldState.max - oldState.min - (newState.max - newState.min)));
    const translation = origin - scaledOrigin;
    const min = newState.min + translation;
    const max = newState.max + translation;
    return { min, max };
}
/**
 * Constrain a zoom bounding box such that no corner exceeds an edge while maintaining the same width and height.
 */
export function constrainZoom(zoom) {
    const after = unitZoomState();
    after.x = constrainAxis(zoom.x);
    after.y = constrainAxis(zoom.y);
    return after;
}
function constrainAxis(axis) {
    const size = axis.max - axis.min;
    let min = axis.max > UNIT.max ? UNIT.max - size : axis.min;
    let max = axis.min < UNIT.min ? size : axis.max;
    min = Math.max(UNIT.min, min);
    max = Math.min(UNIT.max, max);
    return { min, max };
}
//# sourceMappingURL=zoomTransformers.js.map