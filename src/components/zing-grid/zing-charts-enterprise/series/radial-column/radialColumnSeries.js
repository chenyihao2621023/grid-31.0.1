import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import { RadialColumnSeriesProperties } from './radialColumnSeriesProperties';
import { RadialColumnShape, getRadialColumnWidth } from './radialColumnShape';
import { prepareRadialColumnAnimationFunctions, resetRadialColumnSelectionFn } from './radialColumnUtil';
const {
  ChartAxisDirection,
  PolarAxis
} = _ModuleSupport;
export class RadialColumnSeries extends RadialColumnSeriesBase {
  constructor(moduleCtx) {
    super(moduleCtx, {
      animationResetFns: {
        item: resetRadialColumnSelectionFn
      }
    });
    this.properties = new RadialColumnSeriesProperties();
  }
  getStackId() {
    var _a, _b;
    const groupIndex = (_b = (_a = this.seriesGrouping) === null || _a === void 0 ? void 0 : _a.groupIndex) !== null && _b !== void 0 ? _b : this.id;
    return `radarColumn-stack-${groupIndex}-yValues`;
  }
  nodeFactory() {
    return new RadialColumnShape();
  }
  getColumnTransitionFunctions() {
    const axisZeroRadius = this.isRadiusAxisReversed() ? this.radius : this.getAxisInnerRadius();
    return prepareRadialColumnAnimationFunctions(axisZeroRadius);
  }
  isRadiusAxisCircle() {
    const radiusAxis = this.axes[ChartAxisDirection.Y];
    return radiusAxis instanceof PolarAxis ? radiusAxis.shape === 'circle' : false;
  }
  updateItemPath(node, datum, highlight) {
    node.isBeveled = this.isRadiusAxisCircle();
    node.isRadiusAxisReversed = this.isRadiusAxisReversed();
    if (highlight) {
      node.innerRadius = datum.innerRadius;
      node.outerRadius = datum.outerRadius;
      node.startAngle = datum.startAngle;
      node.endAngle = datum.endAngle;
      node.columnWidth = datum.columnWidth;
      node.axisInnerRadius = datum.axisInnerRadius;
      node.axisOuterRadius = datum.axisOuterRadius;
    }
  }
  getColumnWidth(startAngle, endAngle) {
    const {
      columnWidthRatio = 0.5,
      maxColumnWidthRatio = 0.5
    } = this.properties;
    return getRadialColumnWidth(startAngle, endAngle, this.radius, columnWidthRatio, maxColumnWidthRatio);
  }
}
RadialColumnSeries.className = 'RadialColumnSeries';
RadialColumnSeries.type = 'radial-column';