import { _Theme } from '@/components/zing-grid/zing-charts-community/main.js';
const {
  CARTESIAN_AXIS_TYPES,
  CARTESIAN_AXIS_POSITIONS
} = _Theme;
export const RANGE_BAR_DEFAULTS = {
  axes: [{
    type: CARTESIAN_AXIS_TYPES.CATEGORY,
    position: CARTESIAN_AXIS_POSITIONS.BOTTOM
  }, {
    type: CARTESIAN_AXIS_TYPES.NUMBER,
    position: CARTESIAN_AXIS_POSITIONS.LEFT,
    crosshair: {
      enabled: true,
      snap: false
    }
  }]
};