import { FROM_TO_MIXINS } from '../../../motion/fromToMotion';
import { prepareMarkerAnimation } from './markerUtil';
import { backfillPathPointData, minMax, renderPartialPath } from './pathUtil';
import { areScalingEqual } from './scaling';
function scale(val, scaling) {
    if (!scaling)
        return NaN;
    if (val instanceof Date) {
        val = val.getTime();
    }
    if (scaling.type === 'continuous' && typeof val === 'number') {
        const domainRatio = (val - scaling.domain[0]) / (scaling.domain[1] - scaling.domain[0]);
        return domainRatio * (scaling.range[1] - scaling.range[0]) + scaling.range[0];
    }
    if (scaling.type === 'log' && typeof val === 'number') {
        return scaling.convert(val);
    }
    // Category axis case.
    const matchingIndex = scaling.domain.findIndex((d) => d === val);
    if (matchingIndex >= 0) {
        return scaling.range[matchingIndex];
    }
    // We failed to convert using the scale.
    return NaN;
}
function scalesChanged(newData, oldData) {
    return !areScalingEqual(newData.scales.x, oldData.scales.x) || !areScalingEqual(newData.scales.y, oldData.scales.y);
}
function closeMatch(a, b) {
    const an = Number(a);
    const bn = Number(b);
    if (!isNaN(an) && !isNaN(bn)) {
        return Math.abs(bn - an) < 0.25;
    }
    return a === b;
}
function calculateMoveTo(from = false, to = false) {
    if (from === to) {
        return !!from;
    }
    return from ? 'in' : 'out';
}
export function pairContinuousData(newData, oldData, opts = {}) {
    var _a, _b, _c, _d;
    const { backfillSplitMode = 'intersect' } = opts;
    const toNewScale = (oldDatum) => {
        var _a, _b;
        return {
            x: scale((_a = oldDatum.xValue) !== null && _a !== void 0 ? _a : NaN, newData.scales.x),
            y: scale((_b = oldDatum.yValue) !== null && _b !== void 0 ? _b : NaN, newData.scales.y),
        };
    };
    const toOldScale = (newDatum) => {
        var _a, _b;
        return {
            x: scale((_a = newDatum.xValue) !== null && _a !== void 0 ? _a : NaN, oldData.scales.x),
            y: scale((_b = newDatum.yValue) !== null && _b !== void 0 ? _b : NaN, oldData.scales.y),
        };
    };
    const result = [];
    const resultMap = {
        added: {},
        moved: {},
        removed: {},
    };
    const pairUp = (from, to, xValue, change = 'move') => {
        if (from && (isNaN(from.point.x) || isNaN(from.point.y))) {
            // Default to 'to' position if 'from' is invalid.
            from = to;
        }
        const resultPoint = {
            from: from === null || from === void 0 ? void 0 : from.point,
            to: to === null || to === void 0 ? void 0 : to.point,
            moveTo: calculateMoveTo(from === null || from === void 0 ? void 0 : from.point.moveTo, to === null || to === void 0 ? void 0 : to.point.moveTo),
            change,
        };
        if (change === 'move') {
            resultMap.moved[xValue] = resultPoint;
            oldIdx++;
            newIdx++;
        }
        else if (change === 'in') {
            resultMap.added[xValue] = resultPoint;
            newIdx++;
        }
        else if (change === 'out') {
            resultMap.removed[xValue] = resultPoint;
            oldIdx++;
        }
        result.push(resultPoint);
    };
    const { min: minFromNode, max: maxFromNode } = minMax(oldData.nodeData);
    const { min: minToNode, max: maxToNode } = minMax(newData.nodeData);
    let oldIdx = 0;
    let newIdx = 0;
    while (oldIdx < oldData.nodeData.length || newIdx < newData.nodeData.length) {
        const from = oldData.nodeData[oldIdx];
        const to = newData.nodeData[newIdx];
        const fromShifted = from ? toNewScale(from) : undefined;
        const toUnshifted = to ? toOldScale(to) : undefined;
        const NA = undefined;
        if (fromShifted && closeMatch(fromShifted.x, to === null || to === void 0 ? void 0 : to.point.x)) {
            pairUp(from, to, to.xValue, 'move');
        }
        else if (fromShifted && fromShifted.x < ((_a = minToNode === null || minToNode === void 0 ? void 0 : minToNode.point.x) !== null && _a !== void 0 ? _a : -Infinity)) {
            pairUp(from, NA, from.xValue, 'out');
        }
        else if (fromShifted && fromShifted.x > ((_b = maxToNode === null || maxToNode === void 0 ? void 0 : maxToNode.point.x) !== null && _b !== void 0 ? _b : Infinity)) {
            pairUp(from, NA, from.xValue, 'out');
        }
        else if (toUnshifted && toUnshifted.x < ((_c = minFromNode === null || minFromNode === void 0 ? void 0 : minFromNode.point.x) !== null && _c !== void 0 ? _c : -Infinity)) {
            pairUp(NA, to, to.xValue, 'in');
        }
        else if (toUnshifted && toUnshifted.x > ((_d = maxFromNode === null || maxFromNode === void 0 ? void 0 : maxFromNode.point.x) !== null && _d !== void 0 ? _d : Infinity)) {
            pairUp(NA, to, to.xValue, 'in');
        }
        else if (fromShifted && fromShifted.x < (to === null || to === void 0 ? void 0 : to.point.x)) {
            pairUp(from, NA, from.xValue, 'out');
        }
        else if (toUnshifted && toUnshifted.x < (from === null || from === void 0 ? void 0 : from.point.x)) {
            pairUp(NA, to, to.xValue, 'in');
        }
        else if (from) {
            pairUp(from, NA, from.xValue, 'out');
        }
        else if (to) {
            pairUp(NA, to, to.xValue, 'in');
        }
        else {
            throw new Error('Unable to process points');
        }
    }
    backfillPathPointData(result, backfillSplitMode);
    return { result, resultMap };
}
export function pairCategoryData(newData, oldData, diff, opts = {}) {
    var _a, _b, _c;
    const { backfillSplitMode = 'intersect', multiDatum = false } = opts;
    const result = [];
    const resultMapSingle = {
        added: {},
        moved: {},
        removed: {},
    };
    const resultMapMulti = {
        added: {},
        moved: {},
        removed: {},
    };
    let previousResultPoint = undefined;
    let previousXValue = undefined;
    const addToResultMap = (xValue, result) => {
        var _a;
        var _b;
        const type = result.change === 'move' ? 'moved' : result.change === 'in' ? 'added' : 'removed';
        if (multiDatum) {
            (_a = (_b = resultMapMulti[type])[xValue]) !== null && _a !== void 0 ? _a : (_b[xValue] = []);
            resultMapMulti[type][xValue].push(result);
        }
        else {
            resultMapSingle[type][xValue] = result;
        }
        previousResultPoint = result;
        previousXValue = xValue;
    };
    let oldIndex = 0;
    let newIndex = 0;
    let isXUnordered = false;
    while (oldIndex < oldData.nodeData.length || newIndex < newData.nodeData.length) {
        const before = oldData.nodeData[oldIndex];
        const after = newData.nodeData[newIndex];
        let resultPoint;
        if ((before === null || before === void 0 ? void 0 : before.xValue) === (after === null || after === void 0 ? void 0 : after.xValue)) {
            resultPoint = {
                change: 'move',
                moveTo: calculateMoveTo((_a = before.point.moveTo) !== null && _a !== void 0 ? _a : false, after.point.moveTo),
                from: before.point,
                to: after.point,
            };
            addToResultMap(before.xValue, resultPoint);
            oldIndex++;
            newIndex++;
        }
        else if (diff !== undefined && diff.removed.indexOf(before === null || before === void 0 ? void 0 : before.xValue) >= 0) {
            resultPoint = {
                change: 'out',
                moveTo: (_b = before.point.moveTo) !== null && _b !== void 0 ? _b : false,
                from: before.point,
            };
            addToResultMap(before.xValue, resultPoint);
            oldIndex++;
        }
        else if (diff !== undefined && diff.added.indexOf(after === null || after === void 0 ? void 0 : after.xValue) >= 0) {
            resultPoint = {
                change: 'in',
                moveTo: (_c = after.point.moveTo) !== null && _c !== void 0 ? _c : false,
                to: after.point,
            };
            addToResultMap(after.xValue, resultPoint);
            newIndex++;
        }
        else if (multiDatum && previousResultPoint && previousXValue === (before === null || before === void 0 ? void 0 : before.xValue)) {
            resultPoint = Object.assign({}, previousResultPoint);
            addToResultMap(before.xValue, resultPoint);
            oldIndex++;
        }
        else if (multiDatum && previousResultPoint && previousXValue === (after === null || after === void 0 ? void 0 : after.xValue)) {
            resultPoint = Object.assign({}, previousResultPoint);
            addToResultMap(after.xValue, resultPoint);
            newIndex++;
        }
        else {
            isXUnordered = true;
            break;
        }
        result.push(resultPoint);
    }
    let previousX = -Infinity;
    isXUnordered || (isXUnordered = result.some((pathPoint) => {
        const { change: marker, to: { x = -Infinity } = {} } = pathPoint;
        if (marker === 'out')
            return;
        const result = x < previousX;
        previousX = x;
        return result;
    }));
    if (isXUnordered) {
        return { result: undefined, resultMap: undefined };
    }
    backfillPathPointData(result, backfillSplitMode);
    if (multiDatum) {
        return { result, resultMap: resultMapMulti };
    }
    return { result, resultMap: resultMapSingle };
}
export function determinePathStatus(newData, oldData) {
    let status = 'updated';
    const visible = (data) => {
        return data.visible;
    };
    if (!visible(oldData) && visible(newData)) {
        status = 'added';
    }
    else if (visible(oldData) && !visible(newData)) {
        status = 'removed';
    }
    return status;
}
function prepareLinePathPropertyAnimation(status, visibleToggleMode) {
    const phase = visibleToggleMode === 'none' ? 'updated' : status;
    const result = {
        fromFn: (_path) => {
            let mixin;
            if (status === 'removed') {
                mixin = { finish: { visible: false } };
            }
            else if (status === 'added') {
                mixin = { start: { visible: true } };
            }
            else {
                mixin = {};
            }
            return Object.assign(Object.assign({}, FROM_TO_MIXINS[phase]), mixin);
        },
        toFn: (_path) => {
            return Object.assign({}, FROM_TO_MIXINS[phase]);
        },
    };
    if (visibleToggleMode === 'fade') {
        return {
            fromFn: (path) => {
                const opacity = status === 'added' ? 0 : path.opacity;
                return Object.assign({ opacity }, result.fromFn(path));
            },
            toFn: (path) => {
                const opacity = status === 'removed' ? 0 : 1;
                return Object.assign({ opacity }, result.toFn(path));
            },
        };
    }
    return result;
}
export function prepareLinePathAnimationFns(newData, oldData, pairData, visibleToggleMode, render) {
    const status = determinePathStatus(newData, oldData);
    const removePhaseFn = (ratio, path) => {
        render(pairData, { move: 0, out: ratio }, path);
    };
    const updatePhaseFn = (ratio, path) => {
        render(pairData, { move: ratio }, path);
    };
    const addPhaseFn = (ratio, path) => {
        render(pairData, { move: 1, in: ratio }, path);
    };
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode);
    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}
export function prepareLinePathAnimation(newData, oldData, diff) {
    var _a, _b;
    const isCategoryBased = ((_a = newData.scales.x) === null || _a === void 0 ? void 0 : _a.type) === 'category';
    const { result: pairData, resultMap: pairMap } = isCategoryBased
        ? pairCategoryData(newData, oldData, diff)
        : pairContinuousData(newData, oldData);
    let status = 'updated';
    if (oldData.visible && !newData.visible) {
        status = 'removed';
    }
    else if (!oldData.visible && newData.visible) {
        status = 'added';
    }
    if (pairData === undefined || pairMap === undefined) {
        return;
    }
    const hasMotion = ((_b = diff === null || diff === void 0 ? void 0 : diff.changed) !== null && _b !== void 0 ? _b : true) || scalesChanged(newData, oldData);
    const pathFns = prepareLinePathAnimationFns(newData, oldData, pairData, 'fade', renderPartialPath);
    const marker = prepareMarkerAnimation(pairMap, status);
    return Object.assign(Object.assign({}, pathFns), { marker, hasMotion });
}
//# sourceMappingURL=lineUtil.js.map