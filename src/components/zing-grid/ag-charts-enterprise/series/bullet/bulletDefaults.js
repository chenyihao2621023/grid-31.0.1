import { _Theme } from '@/components/zing-grid/ag-charts-community/main.js';
const { CARTESIAN_AXIS_TYPES, CARTESIAN_AXIS_POSITIONS } = _Theme;
export const BULLET_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS.LEFT,
            nice: false,
            max: undefined,
            crosshair: { enabled: false },
        },
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
        },
    ],
};
//# sourceMappingURL=bulletDefaults.js.map