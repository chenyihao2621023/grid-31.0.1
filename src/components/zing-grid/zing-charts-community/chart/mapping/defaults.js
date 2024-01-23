import { MODULE_CONFLICTS } from '../../module/module';
import { Logger } from '../../util/logger';
import { CARTESIAN_AXIS_POSITIONS, CARTESIAN_AXIS_TYPES } from '../themes/constants';
import { isZingCartesianChartOptions } from './types';
export const DEFAULT_CARTESIAN_CHART_OVERRIDES = {
  axes: [{
    type: CARTESIAN_AXIS_TYPES.NUMBER,
    position: CARTESIAN_AXIS_POSITIONS.LEFT
  }, {
    type: CARTESIAN_AXIS_TYPES.CATEGORY,
    position: CARTESIAN_AXIS_POSITIONS.BOTTOM
  }]
};
export function swapAxes(opts) {
  var _a;
  if (!isZingCartesianChartOptions(opts)) {
    return opts;
  }
  const [axis0, axis1] = (_a = opts.axes) !== null && _a !== void 0 ? _a : [];
  return Object.assign(Object.assign({}, opts), {
    axes: [Object.assign(Object.assign({}, axis0), {
      position: axis1.position
    }), Object.assign(Object.assign({}, axis1), {
      position: axis0.position
    })]
  });
}
export function resolveModuleConflicts(opts) {
  var _a, _b, _c, _d;
  const conflictOverrides = {};
  for (const [source, conflicts] of MODULE_CONFLICTS.entries()) {
    if (opts[source] == null || !conflicts.length) {
      continue;
    }
    (_a = conflictOverrides[source]) !== null && _a !== void 0 ? _a : conflictOverrides[source] = {};
    for (const conflict of conflicts) {
      if (((_b = opts[source]) === null || _b === void 0 ? void 0 : _b.enabled) && ((_c = opts[conflict]) === null || _c === void 0 ? void 0 : _c.enabled)) {
        Logger.warnOnce(`the [${source}] module can not be used at the same time as [${conflict}], it will be disabled.`);
        conflictOverrides[source].enabled = false;
      } else {
        conflictOverrides[source].enabled = (_d = opts[source]) === null || _d === void 0 ? void 0 : _d.enabled;
      }
    }
  }
  return conflictOverrides;
}