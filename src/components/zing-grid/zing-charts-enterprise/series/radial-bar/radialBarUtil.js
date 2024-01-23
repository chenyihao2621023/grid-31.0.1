import { _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
const {
  motion
} = _Scene;
function fixRadialBarAnimationStatus(node, datum, status) {
  if (status === 'updated') {
    if (node.previousDatum == null || isNaN(node.previousDatum.innerRadius) || isNaN(node.previousDatum.outerRadius)) {
      return 'added';
    }
    if (isNaN(datum.innerRadius) || isNaN(datum.outerRadius)) {
      return 'removed';
    }
  }
  if (status === 'added' && node.previousDatum != null) {
    return 'updated';
  }
  return status;
}
export function prepareRadialBarSeriesAnimationFunctions(axisZeroAngle) {
  const fromFn = (sect, datum, status) => {
    status = fixRadialBarAnimationStatus(sect, datum, status);
    let startAngle;
    let endAngle;
    let innerRadius;
    let outerRadius;
    if (status === 'removed' || status === 'updated') {
      startAngle = sect.startAngle;
      endAngle = sect.endAngle;
      innerRadius = sect.innerRadius;
      outerRadius = sect.outerRadius;
    } else {
      startAngle = axisZeroAngle;
      endAngle = axisZeroAngle;
      innerRadius = datum.innerRadius;
      outerRadius = datum.outerRadius;
    }
    const mixin = motion.FROM_TO_MIXINS[status];
    return Object.assign({
      startAngle,
      endAngle,
      innerRadius,
      outerRadius
    }, mixin);
  };
  const toFn = (sect, datum, status) => {
    let startAngle;
    let endAngle;
    let innerRadius;
    let outerRadius;
    if (status === 'removed') {
      startAngle = axisZeroAngle;
      endAngle = axisZeroAngle;
      innerRadius = datum.innerRadius;
      outerRadius = datum.outerRadius;
    } else {
      startAngle = datum.startAngle;
      endAngle = datum.endAngle;
      innerRadius = isNaN(datum.innerRadius) ? sect.innerRadius : datum.innerRadius;
      outerRadius = isNaN(datum.outerRadius) ? sect.outerRadius : datum.outerRadius;
    }
    return {
      startAngle,
      endAngle,
      innerRadius,
      outerRadius
    };
  };
  return {
    toFn,
    fromFn
  };
}
export function resetRadialBarSelectionsFn(_node, datum) {
  return {
    centerX: 0,
    centerY: 0,
    innerRadius: datum.innerRadius,
    outerRadius: datum.outerRadius,
    startAngle: datum.startAngle,
    endAngle: datum.endAngle
  };
}