import { _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
const { motion } = _Scene;
export function createAngleMotionCalculator() {
    const angles = {
        startAngle: new Map(),
        endAngle: new Map(),
    };
    const angleKeys = ['startAngle', 'endAngle'];
    const calculate = (node, datum, status) => {
        angleKeys.forEach((key) => {
            var _a, _b;
            const map = angles[key];
            let from = (status === 'removed' || status === 'updated' ? node : datum)[key];
            let to = (status === 'removed' ? node : datum)[key];
            if (isNaN(to)) {
                to = (_b = (_a = node.previousDatum) === null || _a === void 0 ? void 0 : _a[key]) !== null && _b !== void 0 ? _b : NaN;
            }
            const diff = from - to;
            if (Math.abs(diff) > Math.PI) {
                from -= Math.sign(diff) * 2 * Math.PI;
            }
            map.set(datum, { from, to });
        });
    };
    const getAngles = (datum, fromToKey) => {
        return {
            startAngle: angles.startAngle.get(datum)[fromToKey],
            endAngle: angles.endAngle.get(datum)[fromToKey],
        };
    };
    const from = (datum) => getAngles(datum, 'from');
    const to = (datum) => getAngles(datum, 'to');
    return { calculate, from, to };
}
export function fixRadialColumnAnimationStatus(node, datum, status) {
    if (status === 'updated') {
        if (node.previousDatum == null || isNaN(node.previousDatum.startAngle) || isNaN(node.previousDatum.endAngle)) {
            return 'added';
        }
        if (isNaN(datum.startAngle) || isNaN(datum.endAngle)) {
            return 'removed';
        }
    }
    if (status === 'added' && node.previousDatum != null) {
        return 'updated';
    }
    return status;
}
export function prepareRadialColumnAnimationFunctions(axisZeroRadius) {
    const angles = createAngleMotionCalculator();
    const fromFn = (node, datum, status) => {
        status = fixRadialColumnAnimationStatus(node, datum, status);
        angles.calculate(node, datum, status);
        const { startAngle, endAngle } = angles.from(datum);
        let innerRadius;
        let outerRadius;
        let columnWidth;
        let axisInnerRadius;
        let axisOuterRadius;
        if (status === 'removed' || status === 'updated') {
            innerRadius = node.innerRadius;
            outerRadius = node.outerRadius;
            columnWidth = node.columnWidth;
            axisInnerRadius = node.axisInnerRadius;
            axisOuterRadius = node.axisOuterRadius;
        }
        else {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
            columnWidth = datum.columnWidth;
            axisInnerRadius = datum.axisInnerRadius;
            axisOuterRadius = datum.axisOuterRadius;
        }
        const mixin = motion.FROM_TO_MIXINS[status];
        return Object.assign({ innerRadius,
            outerRadius,
            columnWidth,
            axisInnerRadius,
            axisOuterRadius,
            startAngle,
            endAngle }, mixin);
    };
    const toFn = (node, datum, status) => {
        const { startAngle, endAngle } = angles.to(datum);
        let innerRadius;
        let outerRadius;
        let columnWidth;
        let axisInnerRadius;
        let axisOuterRadius;
        if (status === 'removed') {
            innerRadius = node.innerRadius;
            outerRadius = node.innerRadius;
            columnWidth = node.columnWidth;
            axisInnerRadius = node.axisInnerRadius;
            axisOuterRadius = node.axisOuterRadius;
        }
        else {
            innerRadius = isNaN(datum.innerRadius) ? axisZeroRadius : datum.innerRadius;
            outerRadius = isNaN(datum.outerRadius) ? axisZeroRadius : datum.outerRadius;
            columnWidth = isNaN(datum.columnWidth) ? node.columnWidth : datum.columnWidth;
            axisInnerRadius = datum.axisInnerRadius;
            axisOuterRadius = datum.axisOuterRadius;
        }
        return { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle };
    };
    return { toFn, fromFn };
}
export function resetRadialColumnSelectionFn(_node, { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle, }) {
    return { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle };
}
