import { LABEL_PHASE } from '../../../motion/animation';
import { staticFromToMotion } from '../../../motion/fromToMotion';
import { Path2D } from '../../../scene/path2D';
import { toReal } from '../../../util/number';
export function minMax(nodeData) {
    return nodeData.reduce(({ min, max }, node) => {
        if (min == null || min.point.x > node.point.x) {
            min = node;
        }
        if (max == null || max.point.x < node.point.x) {
            max = node;
        }
        return { min, max };
    }, {});
}
function intersectionOnLine(a, b, targetX) {
    const m = (b.y - a.y) / (b.x - a.x);
    // Find a point a distance along the line from `a` and `b`
    const y = (targetX - a.x) * m + a.y;
    return { x: targetX, y };
}
function backfillPathPoint(results, process, skip, processFn) {
    let prevMarkerIdx = -1, nextMarkerIdx = 0;
    const toProcess = [];
    while (nextMarkerIdx < results.length) {
        if (results[nextMarkerIdx].change === process) {
            toProcess.push(results[nextMarkerIdx]);
            nextMarkerIdx++;
            continue;
        }
        if (results[nextMarkerIdx].change === skip) {
            nextMarkerIdx++;
            continue;
        }
        if (toProcess.length > 0) {
            processFn(toProcess, prevMarkerIdx, nextMarkerIdx);
            toProcess.length = 0;
        }
        prevMarkerIdx = nextMarkerIdx;
        nextMarkerIdx++;
    }
    if (toProcess.length > 0) {
        processFn(toProcess, prevMarkerIdx, nextMarkerIdx);
    }
}
export function backfillPathPointData(result, splitMode) {
    backfillPathPoint(result, 'out', 'in', (toProcess, sIdx, eIdx) => {
        var _a, _b;
        if (sIdx === -1 && result[eIdx]) {
            toProcess.forEach((d) => (d.to = result[eIdx].from));
        }
        else if (eIdx === result.length && result[sIdx]) {
            toProcess.forEach((d) => (d.to = result[sIdx].from));
        }
        else if (splitMode === 'intersect' && ((_a = result[sIdx]) === null || _a === void 0 ? void 0 : _a.from) && ((_b = result[eIdx]) === null || _b === void 0 ? void 0 : _b.from)) {
            toProcess.forEach((d) => (d.to = intersectionOnLine(result[sIdx].from, result[eIdx].from, d.from.x)));
        }
        else {
            toProcess.forEach((d) => (d.to = d.from));
        }
    });
    backfillPathPoint(result, 'in', 'out', (toProcess, sIdx, eIdx) => {
        var _a, _b;
        if (sIdx === -1 && result[eIdx]) {
            toProcess.forEach((d) => (d.from = result[eIdx].to));
        }
        else if (eIdx === result.length && result[sIdx]) {
            toProcess.forEach((d) => (d.from = result[sIdx].to));
        }
        else if (splitMode === 'intersect' && ((_a = result[sIdx]) === null || _a === void 0 ? void 0 : _a.to) && ((_b = result[eIdx]) === null || _b === void 0 ? void 0 : _b.to)) {
            toProcess.forEach((d) => (d.from = intersectionOnLine(result[sIdx].to, result[eIdx].to, d.to.x)));
        }
        else {
            toProcess.forEach((d) => (d.from = d.to));
        }
    });
}
function calculatePoint(from, to, ratio) {
    const x1 = isNaN(from.x) ? to.x : from.x;
    const y1 = isNaN(from.y) ? to.y : from.y;
    const xd = to.x - from.x;
    const yd = to.y - from.y;
    const xr = isNaN(xd) ? 0 : xd * ratio;
    const yr = isNaN(yd) ? 0 : yd * ratio;
    return {
        x: x1 + xr,
        y: y1 + yr,
    };
}
export function renderPartialPath(pairData, ratios, path) {
    const { path: linePath } = path;
    let previousTo;
    for (const data of pairData) {
        const ratio = ratios[data.change];
        if (ratio == null)
            continue;
        const { from, to } = data;
        if (from == null || to == null)
            continue;
        const { x, y } = calculatePoint(from, to, ratio);
        if (data.moveTo === false) {
            linePath.lineTo(x, y);
        }
        else if (data.moveTo === true || !previousTo) {
            linePath.moveTo(x, y);
        }
        else if (previousTo) {
            const moveToRatio = data.moveTo === 'in' ? ratio : 1 - ratio;
            const { x: midPointX, y: midPointY } = calculatePoint(previousTo, { x, y }, moveToRatio);
            linePath.lineTo(midPointX, midPointY);
            linePath.moveTo(x, y);
        }
        previousTo = { x, y };
    }
}
export function pathSwipeInAnimation({ id, visible }, animationManager, paths) {
    staticFromToMotion(id, 'path_properties', animationManager, paths, { clipScalingX: 0 }, { clipScalingX: 1 }, {
        start: { clipMode: 'normal', visible },
        finish: { clipMode: undefined, visible },
    });
}
export function pathFadeInAnimation({ id }, subId, animationManager, selection) {
    staticFromToMotion(id, subId, animationManager, selection, { opacity: 0 }, { opacity: 1 }, LABEL_PHASE);
}
export function pathFadeOutAnimation({ id }, subId, animationManager, selection) {
    staticFromToMotion(id, subId, animationManager, selection, { opacity: 1 }, { opacity: 0 }, LABEL_PHASE);
}
export function buildResetPathFn(opts) {
    return (_node) => {
        return { opacity: opts.getOpacity(), clipScalingX: 1, clipMode: undefined };
    };
}
export function updateClipPath({ nodeDataDependencies }, path) {
    var _a, _b;
    const { seriesRectHeight: height, seriesRectWidth: width } = nodeDataDependencies;
    if (path.clipPath == null) {
        path.clipPath = new Path2D();
        path.clipScalingX = 1;
        path.clipScalingY = 1;
    }
    (_a = path.clipPath) === null || _a === void 0 ? void 0 : _a.clear({ trackChanges: true });
    (_b = path.clipPath) === null || _b === void 0 ? void 0 : _b.rect(-25, -25, toReal(width) + 50, toReal(height) + 50);
}
