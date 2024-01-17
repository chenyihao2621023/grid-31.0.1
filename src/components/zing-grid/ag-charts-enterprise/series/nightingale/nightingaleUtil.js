import { _Scene } from '@/components/zing-grid/ag-charts-community/main.js';
import { createAngleMotionCalculator, fixRadialColumnAnimationStatus } from '../radial-column/radialColumnUtil';
const { motion } = _Scene;
export function prepareNightingaleAnimationFunctions(axisZeroRadius) {
    const angles = createAngleMotionCalculator();
    const fromFn = (sect, datum, status) => {
        status = fixRadialColumnAnimationStatus(sect, datum, status);
        angles.calculate(sect, datum, status);
        const { startAngle, endAngle } = angles.from(datum);
        let innerRadius;
        let outerRadius;
        if (status === 'removed' || status === 'updated') {
            innerRadius = sect.innerRadius;
            outerRadius = sect.outerRadius;
        }
        else {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
        }
        const mixin = motion.FROM_TO_MIXINS[status];
        return Object.assign({ innerRadius, outerRadius, startAngle, endAngle }, mixin);
    };
    const toFn = (_sect, datum, status) => {
        const { startAngle, endAngle } = angles.to(datum);
        let innerRadius;
        let outerRadius;
        if (status === 'removed') {
            innerRadius = axisZeroRadius;
            outerRadius = axisZeroRadius;
        }
        else {
            innerRadius = isNaN(datum.innerRadius) ? axisZeroRadius : datum.innerRadius;
            outerRadius = isNaN(datum.outerRadius) ? axisZeroRadius : datum.outerRadius;
        }
        return { innerRadius, outerRadius, startAngle, endAngle };
    };
    return { toFn, fromFn };
}
export function resetNightingaleSelectionFn(_sect, { innerRadius, outerRadius, startAngle, endAngle }) {
    return { innerRadius, outerRadius, startAngle, endAngle };
}
//# sourceMappingURL=nightingaleUtil.js.map