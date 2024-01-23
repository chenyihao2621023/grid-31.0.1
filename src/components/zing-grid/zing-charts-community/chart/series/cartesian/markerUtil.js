import { QUICK_TRANSITION } from '../../../motion/animation';
import { FROM_TO_MIXINS, fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import { Debug } from '../../../util/debug';
import { clamp } from '../../../util/number';
import * as easing from './../../../motion/easing';
export function markerFadeInAnimation({ id }, animationManager, markerSelections, status = 'unknown') {
    const params = Object.assign({}, FROM_TO_MIXINS[status]);
    staticFromToMotion(id, 'markers', animationManager, markerSelections, { opacity: 0 }, { opacity: 1 }, params);
    markerSelections.forEach((s) => s.cleanup());
}
export function markerScaleInAnimation({ id }, animationManager, markerSelections) {
    staticFromToMotion(id, 'markers', animationManager, markerSelections, { scalingX: 0, scalingY: 0 }, { scalingX: 1, scalingY: 1 });
    markerSelections.forEach((s) => s.cleanup());
}
export function markerSwipeScaleInAnimation({ id, nodeDataDependencies }, animationManager, markerSelections) {
    const seriesWidth = nodeDataDependencies.seriesRectWidth;
    const fromFn = (_, datum) => {
        var _a, _b;
        const x = (_b = (_a = datum.midPoint) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : seriesWidth;
        // Calculate a delay that depends on the X position of the datum, so that nodes appear
        // gradually from left to right.
        //
        // Parallel swipe animations use the function x = easeOut(time). But in this case, we
        // know the x value and need to calculate the time delay. So use the inverse function:
        const delay = clamp(0, easing.inverseEaseOut(x / seriesWidth), 1);
        const animationDuration = Debug.check('animationImmediateMarkerSwipeScaleIn') ? 0 : QUICK_TRANSITION;
        return { scalingX: 0, scalingY: 0, animationDelay: delay, animationDuration };
    };
    const toFn = () => {
        return { scalingX: 1, scalingY: 1 };
    };
    fromToMotion(id, 'markers', animationManager, markerSelections, { fromFn, toFn });
}
export function resetMarkerFn(_node) {
    return { opacity: 1, scalingX: 1, scalingY: 1 };
}
export function resetMarkerPositionFn(_node, datum) {
    var _a, _b, _c, _d;
    return {
        translationX: (_b = (_a = datum.point) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : NaN,
        translationY: (_d = (_c = datum.point) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : NaN,
    };
}
export function prepareMarkerAnimation(pairMap, parentStatus) {
    const readFirstPair = (xValue, type) => {
        const val = pairMap[type][xValue];
        return Array.isArray(val) ? val[0] : val;
    };
    const markerStatus = (datum) => {
        const { xValue } = datum;
        if (pairMap.moved[xValue]) {
            return { point: readFirstPair(xValue, 'moved'), status: 'updated' };
        }
        else if (pairMap.removed[xValue]) {
            return { point: readFirstPair(xValue, 'removed'), status: 'removed' };
        }
        else if (pairMap.added[xValue]) {
            return { point: readFirstPair(xValue, 'added'), status: 'added' };
        }
        return { status: 'unknown' };
    };
    const fromFn = (marker, datum) => {
        var _a, _b, _c, _d, _e, _f;
        const { status, point } = markerStatus(datum);
        if (status === 'unknown')
            return { opacity: 0 };
        const defaults = Object.assign({ translationX: (_b = (_a = point === null || point === void 0 ? void 0 : point.from) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : marker.translationX, translationY: (_d = (_c = point === null || point === void 0 ? void 0 : point.from) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : marker.translationY, opacity: marker.opacity }, FROM_TO_MIXINS[status]);
        if (parentStatus === 'added') {
            return Object.assign(Object.assign(Object.assign({}, defaults), { opacity: 0, translationX: (_e = point === null || point === void 0 ? void 0 : point.to) === null || _e === void 0 ? void 0 : _e.x, translationY: (_f = point === null || point === void 0 ? void 0 : point.to) === null || _f === void 0 ? void 0 : _f.y }), FROM_TO_MIXINS['added']);
        }
        if (status === 'added') {
            defaults.opacity = 0;
        }
        return defaults;
    };
    const toFn = (_marker, datum) => {
        var _a, _b;
        const { status, point } = markerStatus(datum);
        if (status === 'unknown')
            return { opacity: 0 };
        const defaults = Object.assign({ translationX: datum.point.x, translationY: datum.point.y, opacity: 1 }, FROM_TO_MIXINS[status]);
        if (status === 'removed' || parentStatus === 'removed') {
            return Object.assign(Object.assign(Object.assign({}, defaults), { translationX: (_a = point === null || point === void 0 ? void 0 : point.to) === null || _a === void 0 ? void 0 : _a.x, translationY: (_b = point === null || point === void 0 ? void 0 : point.to) === null || _b === void 0 ? void 0 : _b.y, opacity: 0 }), FROM_TO_MIXINS['removed']);
        }
        return defaults;
    };
    return { fromFn, toFn };
}
