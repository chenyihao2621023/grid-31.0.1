var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { FROM_TO_MIXINS } from '../../../motion/fromToMotion';
import { ContinuousScale } from '../../../scale/continuousScale';
import { isNegative } from '../../../util/number';
import { mergeDefaults } from '../../../util/object';
import { ChartAxisDirection } from '../../chartAxisDirection';
export function updateRect({ rect, config }) {
    const { crisp = true, fill, stroke, strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset, fillShadow, cornerRadius = 0, topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius, cornerRadiusBbox, visible = true, } = config;
    rect.crisp = crisp;
    rect.fill = fill;
    rect.stroke = stroke;
    rect.strokeWidth = strokeWidth;
    rect.fillOpacity = fillOpacity;
    rect.strokeOpacity = strokeOpacity;
    rect.lineDash = lineDash;
    rect.lineDashOffset = lineDashOffset;
    rect.fillShadow = fillShadow;
    rect.topLeftCornerRadius = topLeftCornerRadius ? cornerRadius : 0;
    rect.topRightCornerRadius = topRightCornerRadius ? cornerRadius : 0;
    rect.bottomRightCornerRadius = bottomRightCornerRadius ? cornerRadius : 0;
    rect.bottomLeftCornerRadius = bottomLeftCornerRadius ? cornerRadius : 0;
    rect.cornerRadiusBbox = cornerRadiusBbox;
    rect.visible = visible;
}
export function getRectConfig(_a) {
    var _b, _c, _d, _e, _f, _g;
    var { datum, isHighlighted, style, highlightStyle, formatter, seriesId, ctx: { callbackCache } } = _a, opts = __rest(_a, ["datum", "isHighlighted", "style", "highlightStyle", "formatter", "seriesId", "ctx"]);
    const { fill, fillOpacity, stroke, strokeWidth } = mergeDefaults(isHighlighted && highlightStyle, style);
    const { strokeOpacity, fillShadow, lineDash, lineDashOffset, cornerRadius = 0, topLeftCornerRadius = true, topRightCornerRadius = true, bottomRightCornerRadius = true, bottomLeftCornerRadius = true, cornerRadiusBbox, } = style;
    let format;
    if (formatter) {
        format = callbackCache.call(formatter, Object.assign({ datum: datum.datum, xKey: datum.xKey, fill,
            stroke,
            strokeWidth,
            cornerRadius, highlighted: isHighlighted, seriesId }, opts));
    }
    return {
        fill: (_b = format === null || format === void 0 ? void 0 : format.fill) !== null && _b !== void 0 ? _b : fill,
        stroke: (_c = format === null || format === void 0 ? void 0 : format.stroke) !== null && _c !== void 0 ? _c : stroke,
        strokeWidth: (_d = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _d !== void 0 ? _d : strokeWidth,
        fillOpacity: (_e = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _e !== void 0 ? _e : fillOpacity,
        strokeOpacity: (_f = format === null || format === void 0 ? void 0 : format.strokeOpacity) !== null && _f !== void 0 ? _f : strokeOpacity,
        lineDash,
        lineDashOffset,
        fillShadow,
        // @ts-expect-error Remove once corner radius is officially added
        cornerRadius: (_g = format === null || format === void 0 ? void 0 : format.cornerRadius) !== null && _g !== void 0 ? _g : cornerRadius,
        topLeftCornerRadius,
        topRightCornerRadius,
        bottomRightCornerRadius,
        bottomLeftCornerRadius,
        cornerRadiusBbox,
    };
}
export function checkCrisp(visibleRange = []) {
    const [visibleMin, visibleMax] = visibleRange;
    const isZoomed = visibleMin !== 0 || visibleMax !== 1;
    return !isZoomed;
}
export function collapsedStartingBarPosition(isVertical, axes) {
    const { startingX, startingY } = getStartingValues(isVertical, axes);
    const isDatumNegative = (datum) => {
        var _a;
        return isNegative((_a = datum['yValue']) !== null && _a !== void 0 ? _a : 0);
    };
    const calculate = (datum, prevDatum) => {
        let x = isVertical ? datum.x : startingX;
        let y = isVertical ? startingY : datum.y;
        let width = isVertical ? datum.width : 0;
        let height = isVertical ? 0 : datum.height;
        if (prevDatum && (isNaN(x) || isNaN(y))) {
            // Fallback
            ({ x, y } = prevDatum);
            width = isVertical ? prevDatum.width : 0;
            height = isVertical ? 0 : prevDatum.height;
            if (isVertical && !isDatumNegative(prevDatum)) {
                y += prevDatum.height;
            }
            else if (!isVertical && isDatumNegative(prevDatum)) {
                x += prevDatum.width;
            }
        }
        return { x, y, width, height };
    };
    return { isVertical, calculate };
}
export function midpointStartingBarPosition(isVertical) {
    return {
        isVertical,
        calculate: (datum) => {
            return {
                x: isVertical ? datum.x : datum.x + datum.width / 2,
                y: isVertical ? datum.y + datum.height / 2 : datum.y,
                width: isVertical ? datum.width : 0,
                height: isVertical ? 0 : datum.height,
            };
        },
    };
}
export function prepareBarAnimationFunctions(initPos) {
    const isRemoved = (datum) => datum == null || isNaN(datum.x) || isNaN(datum.y);
    const fromFn = (rect, datum, status) => {
        if (status === 'updated' && isRemoved(datum)) {
            status = 'removed';
        }
        else if (status === 'updated' && isRemoved(rect.previousDatum)) {
            status = 'added';
        }
        // Continue from current rendering location.
        let source = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        if (status === 'unknown' || status === 'added') {
            source = initPos.calculate(datum, rect.previousDatum);
        }
        return Object.assign(Object.assign({}, source), FROM_TO_MIXINS[status]);
    };
    const toFn = (rect, datum, status) => {
        if (status === 'removed' || isRemoved(datum)) {
            return initPos.calculate(datum, rect.previousDatum);
        }
        return { x: datum.x, y: datum.y, width: datum.width, height: datum.height };
    };
    return { toFn, fromFn };
}
function getStartingValues(isVertical, axes) {
    const axis = axes[isVertical ? ChartAxisDirection.Y : ChartAxisDirection.X];
    let startingX = Infinity;
    let startingY = 0;
    if (!axis) {
        return { startingX, startingY };
    }
    if (isVertical) {
        startingY = axis.scale.convert(ContinuousScale.is(axis.scale) ? 0 : Math.max(...axis.range));
    }
    else {
        startingX = axis.scale.convert(ContinuousScale.is(axis.scale) ? 0 : Math.min(...axis.range));
    }
    return { startingX, startingY };
}
export function resetBarSelectionsFn(_node, { x, y, width, height }) {
    return { x, y, width, height };
}
//# sourceMappingURL=barUtil.js.map