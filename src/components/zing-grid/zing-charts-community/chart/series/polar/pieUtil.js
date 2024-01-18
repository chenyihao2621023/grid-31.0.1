import { toRadians } from '../../../util/angle';
export function preparePieSeriesAnimationFunctions(initialLoad, rotationDegrees, scaleFn, oldScaleFn) {
    const scale = [scaleFn.convert(0), scaleFn.convert(1)];
    const oldScale = [oldScaleFn.convert(0), oldScaleFn.convert(1)];
    const rotation = Math.PI / -2 + toRadians(rotationDegrees);
    const scaleToNewRadius = ({ radius }) => {
        return { innerRadius: scale[0], outerRadius: scale[0] + (scale[1] - scale[0]) * radius };
    };
    const scaleToOldRadius = ({ radius }) => {
        return { innerRadius: oldScale[0], outerRadius: oldScale[0] + (oldScale[1] - oldScale[0]) * radius };
    };
    const fromFn = (sect, datum, status, { prevFromProps }) => {
        var _a, _b, _c, _d, _e, _f;
        // Default to starting from current state.
        let { startAngle, endAngle, innerRadius, outerRadius } = sect;
        let { fill, stroke } = datum.sectorFormat;
        if (status === 'unknown' || (status === 'added' && !prevFromProps)) {
            // Start of animation (full new data) - sweep in.
            startAngle = rotation;
            endAngle = rotation;
            innerRadius = datum.innerRadius;
            outerRadius = datum.outerRadius;
        }
        else if (status === 'added' && prevFromProps) {
            startAngle = (_a = prevFromProps.endAngle) !== null && _a !== void 0 ? _a : rotation;
            endAngle = (_b = prevFromProps.endAngle) !== null && _b !== void 0 ? _b : rotation;
            innerRadius = (_c = prevFromProps.innerRadius) !== null && _c !== void 0 ? _c : datum.innerRadius;
            outerRadius = (_d = prevFromProps.outerRadius) !== null && _d !== void 0 ? _d : datum.outerRadius;
        }
        if (status === 'added' && !initialLoad) {
            const radii = scaleToOldRadius(datum);
            innerRadius = radii.innerRadius;
            outerRadius = radii.outerRadius;
        }
        if (status === 'updated') {
            fill = (_e = sect.fill) !== null && _e !== void 0 ? _e : fill;
            stroke = (_f = sect.stroke) !== null && _f !== void 0 ? _f : stroke;
        }
        return { startAngle, endAngle, innerRadius, outerRadius, fill, stroke };
    };
    const toFn = (_sect, datum, status, { prevLive }) => {
        var _a, _b;
        // Default to moving to target state.
        let { startAngle, endAngle, innerRadius, outerRadius } = datum;
        const { stroke, fill } = datum.sectorFormat;
        if (status === 'removed' && prevLive) {
            startAngle = (_a = prevLive.datum) === null || _a === void 0 ? void 0 : _a.endAngle;
            endAngle = (_b = prevLive.datum) === null || _b === void 0 ? void 0 : _b.endAngle;
        }
        else if (status === 'removed' && !prevLive) {
            startAngle = rotation;
            endAngle = rotation;
        }
        if (status === 'removed') {
            const radii = scaleToNewRadius(datum);
            innerRadius = radii.innerRadius;
            outerRadius = radii.outerRadius;
        }
        return { startAngle, endAngle, outerRadius, innerRadius, stroke, fill };
    };
    const innerCircle = {
        fromFn: (node, _datum) => {
            var _a, _b, _c;
            return { size: (_c = (_b = (_a = node.previousDatum) === null || _a === void 0 ? void 0 : _a.radius) !== null && _b !== void 0 ? _b : node.size) !== null && _c !== void 0 ? _c : 0 };
        },
        toFn: (_node, datum) => {
            var _a;
            return { size: (_a = datum.radius) !== null && _a !== void 0 ? _a : 0 };
        },
    };
    return { nodes: { toFn, fromFn }, innerCircle };
}
export function resetPieSelectionsFn(_node, datum) {
    return {
        startAngle: datum.startAngle,
        endAngle: datum.endAngle,
        innerRadius: datum.innerRadius,
        outerRadius: datum.outerRadius,
        fill: datum.sectorFormat.fill,
        stroke: datum.sectorFormat.stroke,
    };
}
//# sourceMappingURL=pieUtil.js.map