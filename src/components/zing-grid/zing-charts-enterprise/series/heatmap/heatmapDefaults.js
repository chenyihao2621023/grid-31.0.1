import { _Theme } from '@/components/zing-grid/zing-charts-community/main.js';
const {
  CARTESIAN_AXIS_TYPES,
  CARTESIAN_AXIS_POSITIONS
} = _Theme;
export const HEATMAP_DEFAULTS = {
  axes: [{
    type: CARTESIAN_AXIS_TYPES.CATEGORY,
    position: CARTESIAN_AXIS_POSITIONS.LEFT
  }, {
    type: CARTESIAN_AXIS_TYPES.CATEGORY,
    position: CARTESIAN_AXIS_POSITIONS.BOTTOM
  }],
  gradientLegend: {
    enabled: true
  }
};