var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
import { toRadians } from '../util/angle';
import { Logger } from '../util/logger';
import { CategoryAxis } from './axis/categoryAxis';
import { GroupedCategoryAxis } from './axis/groupedCategoryAxis';
import { Chart } from './chart';
import { ChartAxisDirection } from './chartAxisDirection';
import { CartesianSeries } from './series/cartesian/cartesianSeries';
const directions = ['top', 'right', 'bottom', 'left'];
export class CartesianChart extends Chart {
  constructor(specialOverrides, resources) {
    super(specialOverrides, resources);
    this.paired = true;
    this._lastCrossLineIds = undefined;
    this._lastAxisWidths = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };
    this._lastVisibility = {
      crossLines: true,
      series: true
    };
  }
  performLayout() {
    const _super = Object.create(null, {
      performLayout: {
        get: () => super.performLayout
      }
    });
    return __awaiter(this, void 0, void 0, function* () {
      const shrinkRect = yield _super.performLayout.call(this);
      const {
        animationRect,
        seriesRect,
        visibility,
        clipSeries
      } = this.updateAxes(shrinkRect);
      this.seriesRoot.visible = visibility.series;
      this.seriesRect = seriesRect;
      this.animationRect = animationRect;
      this.seriesRoot.translationX = Math.floor(seriesRect.x);
      this.seriesRoot.translationY = Math.floor(seriesRect.y);
      const {
        seriesArea: {
          padding
        }
      } = this;
      const seriesPaddedRect = seriesRect.clone().grow({
        top: padding.top,
        right: padding.right,
        bottom: padding.bottom,
        left: padding.left
      });
      this.hoverRect = seriesPaddedRect;
      this.layoutService.dispatchLayoutComplete({
        type: 'layout-complete',
        chart: {
          width: this.scene.width,
          height: this.scene.height
        },
        clipSeries,
        series: {
          rect: seriesRect,
          paddedRect: seriesPaddedRect,
          visible: visibility.series,
          shouldFlipXY: this.shouldFlipXY()
        },
        axes: this.axes.map(axis => Object.assign({
          id: axis.id
        }, axis.getLayoutState()))
      });
      return shrinkRect;
    });
  }
  updateAxes(inputShrinkRect) {
    var _a;
    const crossLineIds = this.axes.flatMap(axis => {
      var _a;
      return (_a = axis.crossLines) !== null && _a !== void 0 ? _a : [];
    }).map(crossLine => crossLine.id);
    const axesValid = this._lastCrossLineIds != null && this._lastCrossLineIds.length === crossLineIds.length && this._lastCrossLineIds.every((id, index) => crossLineIds[index] === id);
    let axisWidths;
    let visibility;
    if (axesValid) {
      axisWidths = Object.assign({}, this._lastAxisWidths);
      visibility = Object.assign({}, this._lastVisibility);
    } else {
      axisWidths = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      };
      visibility = {
        crossLines: true,
        series: true
      };
      this._lastCrossLineIds = crossLineIds;
    }
    const liveAxisWidths = new Set(this._axes.map(a => a.position));
    for (const position of Object.keys(axisWidths)) {
      if (!liveAxisWidths.has(position)) {
        delete axisWidths[position];
      }
    }
    const stableOutputs = (otherAxisWidths, otherVisibility) => {
      if (Object.keys(otherAxisWidths).some(k => axisWidths[k] == null)) {
        return false;
      }
      return visibility.crossLines === otherVisibility.crossLines && visibility.series === otherVisibility.series && Object.entries(axisWidths).every(([p, w]) => {
        const otherW = otherAxisWidths[p];
        if (w != null || otherW != null) {
          return w === otherW;
        }
        return true;
      });
    };
    const ceilValues = records => {
      return Object.entries(records).reduce((out, [key, value]) => {
        if (value && Math.abs(value) === Infinity) {
          value = 0;
        }
        out[key] = value != null ? Math.ceil(value) : value;
        return out;
      }, {});
    };
    let lastPassAxisWidths = {};
    let lastPassVisibility = {};
    let clipSeries = false;
    let seriesRect = (_a = this.seriesRect) === null || _a === void 0 ? void 0 : _a.clone();
    let count = 0;
    let primaryTickCounts = {};
    do {
      Object.assign(axisWidths, lastPassAxisWidths);
      Object.assign(visibility, lastPassVisibility);
      const result = this.updateAxesPass(axisWidths, inputShrinkRect.clone(), seriesRect);
      lastPassAxisWidths = ceilValues(result.axisWidths);
      lastPassVisibility = result.visibility;
      clipSeries = result.clipSeries;
      seriesRect = result.seriesRect;
      primaryTickCounts = result.primaryTickCounts;
      if (count++ > 10) {
        Logger.warn('unable to find stable axis layout.');
        break;
      }
    } while (!stableOutputs(lastPassAxisWidths, lastPassVisibility));
    this.axes.forEach(axis => {
      const {
        direction
      } = axis;
      const primaryTickCount = primaryTickCounts[direction];
      axis.update(primaryTickCount);
    });
    const clipRectPadding = 5;
    this.axes.forEach(axis => {
      axis.setCrossLinesVisible(visibility.crossLines);
      if (!seriesRect) {
        return;
      }
      axis.clipGrid(seriesRect.x, seriesRect.y, seriesRect.width + clipRectPadding, seriesRect.height + clipRectPadding);
      switch (axis.position) {
        case 'left':
        case 'right':
          axis.clipTickLines(inputShrinkRect.x, seriesRect.y, inputShrinkRect.width + clipRectPadding, seriesRect.height + clipRectPadding);
          break;
        case 'top':
        case 'bottom':
          axis.clipTickLines(seriesRect.x, inputShrinkRect.y, seriesRect.width + clipRectPadding, inputShrinkRect.height + clipRectPadding);
          break;
      }
    });
    this._lastAxisWidths = axisWidths;
    this._lastVisibility = visibility;
    return {
      seriesRect,
      animationRect: inputShrinkRect,
      visibility,
      clipSeries
    };
  }
  updateAxesPass(axisWidths, bounds, lastPassSeriesRect) {
    const {
      axes
    } = this;
    const visited = {};
    const newAxisWidths = {};
    const visibility = {
      series: true,
      crossLines: true
    };
    let clipSeries = false;
    const primaryTickCounts = {};
    const paddedBounds = this.applySeriesPadding(bounds);
    const crossLinePadding = lastPassSeriesRect ? this.buildCrossLinePadding(axisWidths) : {};
    const axisBound = this.buildAxisBound(paddedBounds, axisWidths, crossLinePadding, visibility);
    const seriesRect = this.buildSeriesRect(axisBound, axisWidths);
    axes.forEach(axis => {
      var _a, _b;
      const {
        position = 'left'
      } = axis;
      const {
        clipSeries: newClipSeries,
        axisThickness,
        axisOffset
      } = this.calculateAxisDimensions({
        axis,
        seriesRect,
        paddedBounds,
        axisWidths,
        newAxisWidths,
        primaryTickCounts,
        clipSeries,
        addInterAxisPadding: ((_a = visited[position]) !== null && _a !== void 0 ? _a : 0) > 0
      });
      visited[position] = ((_b = visited[position]) !== null && _b !== void 0 ? _b : 0) + 1;
      clipSeries = clipSeries || newClipSeries;
      this.positionAxis({
        axis,
        axisBound,
        axisOffset,
        axisThickness,
        axisWidths,
        primaryTickCounts,
        seriesRect
      });
    });
    return {
      clipSeries,
      seriesRect,
      axisWidths: newAxisWidths,
      visibility,
      primaryTickCounts
    };
  }
  buildCrossLinePadding(axisWidths) {
    var _a;
    const crossLinePadding = {};
    this.axes.forEach(axis => {
      if (axis.crossLines) {
        axis.crossLines.forEach(crossLine => {
          crossLine.calculatePadding(crossLinePadding);
        });
      }
    });
    for (const [side, padding = 0] of Object.entries(crossLinePadding)) {
      crossLinePadding[side] = Math.max(padding - ((_a = axisWidths[side]) !== null && _a !== void 0 ? _a : 0), 0);
    }
    return crossLinePadding;
  }
  applySeriesPadding(bounds) {
    const paddedRect = bounds.clone();
    const reversedAxes = this.axes.slice().reverse();
    directions.forEach(dir => {
      const padding = this.seriesArea.padding[dir];
      const axis = reversedAxes.find(axis => axis.position === dir);
      if (axis) {
        axis.seriesAreaPadding = padding;
      } else {
        paddedRect.shrink(padding, dir);
      }
    });
    return paddedRect;
  }
  buildAxisBound(bounds, axisWidths, crossLinePadding, visibility) {
    var _a, _b, _c, _d;
    const result = bounds.clone();
    const {
      top = 0,
      right = 0,
      bottom = 0,
      left = 0
    } = crossLinePadding;
    const horizontalPadding = left + right;
    const verticalPadding = top + bottom;
    const totalWidth = ((_a = axisWidths.left) !== null && _a !== void 0 ? _a : 0) + ((_b = axisWidths.right) !== null && _b !== void 0 ? _b : 0) + horizontalPadding;
    const totalHeight = ((_c = axisWidths.top) !== null && _c !== void 0 ? _c : 0) + ((_d = axisWidths.bottom) !== null && _d !== void 0 ? _d : 0) + verticalPadding;
    if (result.width <= totalWidth || result.height <= totalHeight) {
      visibility.crossLines = false;
      visibility.series = false;
      return result;
    }
    result.x += left;
    result.y += top;
    result.width -= horizontalPadding;
    result.height -= verticalPadding;
    return result;
  }
  buildSeriesRect(axisBound, axisWidths) {
    const result = axisBound.clone();
    const {
      top,
      bottom,
      left,
      right
    } = axisWidths;
    result.x += left !== null && left !== void 0 ? left : 0;
    result.y += top !== null && top !== void 0 ? top : 0;
    result.width -= (left !== null && left !== void 0 ? left : 0) + (right !== null && right !== void 0 ? right : 0);
    result.height -= (top !== null && top !== void 0 ? top : 0) + (bottom !== null && bottom !== void 0 ? bottom : 0);
    result.width = Math.max(0, result.width);
    result.height = Math.max(0, result.height);
    return result;
  }
  clampToOutsideSeriesRect(seriesRect, value, dimension, direction) {
    const {
      x,
      y,
      width,
      height
    } = seriesRect;
    const clampBounds = [x, y, x + width, y + height];
    const fn = direction === 1 ? Math.min : Math.max;
    const compareTo = clampBounds[(dimension === 'x' ? 0 : 1) + (direction === 1 ? 0 : 2)];
    return fn(value, compareTo);
  }
  calculateAxisDimensions(opts) {
    var _a, _b, _c, _d, _e;
    const {
      axis,
      seriesRect,
      paddedBounds,
      axisWidths,
      newAxisWidths,
      primaryTickCounts,
      addInterAxisPadding
    } = opts;
    let {
      clipSeries
    } = opts;
    const {
      position = 'left',
      direction
    } = axis;
    const axisLeftRightRange = axis => {
      if (axis instanceof CategoryAxis || axis instanceof GroupedCategoryAxis) {
        return [0, seriesRect.height];
      }
      return [seriesRect.height, 0];
    };
    const axisOffset = (_a = newAxisWidths[position]) !== null && _a !== void 0 ? _a : 0;
    switch (position) {
      case 'top':
      case 'bottom':
        axis.range = [0, seriesRect.width];
        axis.gridLength = seriesRect.height;
        break;
      case 'right':
      case 'left':
        axis.range = axisLeftRightRange(axis);
        axis.gridLength = seriesRect.width;
        break;
    }
    const zoom = this.zoomManager.getAxisZoom(axis.id);
    const {
      min = 0,
      max = 1
    } = zoom !== null && zoom !== void 0 ? zoom : {};
    axis.visibleRange = [min, max];
    const rangeClipped = axis.dataDomain.clipped || axis.visibleRange[0] > 0 || axis.visibleRange[1] < 1;
    clipSeries || (clipSeries = rangeClipped);
    let primaryTickCount = axis.nice ? primaryTickCounts[direction] : undefined;
    const paddedBoundsCoefficient = 0.3;
    if (axis.thickness != null && axis.thickness > 0) {
      axis.maxThickness = axis.thickness;
    } else if (direction === ChartAxisDirection.Y) {
      axis.maxThickness = paddedBounds.width * paddedBoundsCoefficient;
    } else {
      axis.maxThickness = paddedBounds.height * paddedBoundsCoefficient;
    }
    const layout = axis.calculateLayout(primaryTickCount);
    primaryTickCount = layout.primaryTickCount;
    primaryTickCounts[direction] = (_b = primaryTickCounts[direction]) !== null && _b !== void 0 ? _b : primaryTickCount;
    let axisThickness = 0;
    if (axis.thickness != null && axis.thickness > 0) {
      axisThickness = axis.thickness;
    } else {
      const {
        bbox
      } = layout;
      axisThickness = direction === ChartAxisDirection.X ? bbox.height : bbox.width;
    }
    const axisPadding = 15;
    if (addInterAxisPadding) {
      axisThickness += axisPadding;
    }
    axisThickness = Math.ceil(axisThickness);
    newAxisWidths[position] = ((_c = newAxisWidths[position]) !== null && _c !== void 0 ? _c : 0) + axisThickness;
    axis.gridPadding = ((_d = axisWidths[position]) !== null && _d !== void 0 ? _d : 0) - ((_e = newAxisWidths[position]) !== null && _e !== void 0 ? _e : 0);
    return {
      clipSeries,
      axisThickness,
      axisOffset,
      primaryTickCount
    };
  }
  positionAxis(opts) {
    var _a, _b, _c, _d;
    const {
      axis,
      axisBound,
      axisWidths,
      seriesRect,
      axisOffset,
      axisThickness
    } = opts;
    const {
      position
    } = axis;
    switch (position) {
      case 'top':
        axis.translation.x = axisBound.x + ((_a = axisWidths.left) !== null && _a !== void 0 ? _a : 0);
        axis.translation.y = this.clampToOutsideSeriesRect(seriesRect, axisBound.y + 1 + axisOffset + axisThickness, 'y', 1);
        break;
      case 'bottom':
        axis.translation.x = axisBound.x + ((_b = axisWidths.left) !== null && _b !== void 0 ? _b : 0);
        axis.translation.y = this.clampToOutsideSeriesRect(seriesRect, axisBound.y + axisBound.height + 1 - axisThickness - axisOffset, 'y', -1);
        break;
      case 'left':
        axis.translation.y = axisBound.y + ((_c = axisWidths.top) !== null && _c !== void 0 ? _c : 0);
        axis.translation.x = this.clampToOutsideSeriesRect(seriesRect, axisBound.x + axisOffset + axisThickness, 'x', 1);
        break;
      case 'right':
        axis.translation.y = axisBound.y + ((_d = axisWidths.top) !== null && _d !== void 0 ? _d : 0);
        axis.translation.x = this.clampToOutsideSeriesRect(seriesRect, axisBound.x + axisBound.width - axisThickness - axisOffset, 'x', -1);
        break;
    }
    axis.updatePosition({
      rotation: toRadians(axis.rotation),
      sideFlag: axis.label.getSideFlag()
    });
  }
  shouldFlipXY() {
    return !this.series.some(series => !(series instanceof CartesianSeries && series.shouldFlipXY()));
  }
}
CartesianChart.className = 'CartesianChart';
CartesianChart.type = 'cartesian';