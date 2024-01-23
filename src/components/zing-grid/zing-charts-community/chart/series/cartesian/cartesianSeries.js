var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __rest = this && this.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
import { ContinuousScale } from '../../../integrated-charts-scene';
import { resetMotion } from '../../../motion/resetMotion';
import { StateMachine } from '../../../motion/states';
import { LogScale } from '../../../scale/logScale';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { Selection } from '../../../scene/selection';
import { Path } from '../../../scene/shape/path';
import { Text } from '../../../scene/shape/text';
import { Debug } from '../../../util/debug';
import { STRING, Validate } from '../../../util/validation';
import { CategoryAxis } from '../../axis/categoryAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { Layers } from '../../layers';
import { getMarker } from '../../marker/util';
import { DataModelSeries } from '../dataModelSeries';
import { SeriesNodeClickEvent } from '../series';
import { SeriesProperties } from '../seriesProperties';
const DEFAULT_DIRECTION_KEYS = {
  [ChartAxisDirection.X]: ['xKey'],
  [ChartAxisDirection.Y]: ['yKey']
};
const DEFAULT_DIRECTION_NAMES = {
  [ChartAxisDirection.X]: ['xName'],
  [ChartAxisDirection.Y]: ['yName']
};
export class CartesianSeriesNodeClickEvent extends SeriesNodeClickEvent {
  constructor(type, nativeEvent, datum, series) {
    super(type, nativeEvent, datum, series);
    this.xKey = series.properties.xKey;
    this.yKey = series.properties.yKey;
  }
}
export class CartesianSeriesProperties extends SeriesProperties {}
__decorate([Validate(STRING, {
  optional: true
})], CartesianSeriesProperties.prototype, "legendItemName", void 0);
export class CartesianSeries extends DataModelSeries {
  get contextNodeData() {
    return this._contextNodeData.slice();
  }
  constructor(_a) {
    var {
        pathsPerSeries = 1,
        hasMarkers = false,
        hasHighlightedLabels = false,
        pathsZIndexSubOrderOffset = [],
        directionKeys = DEFAULT_DIRECTION_KEYS,
        directionNames = DEFAULT_DIRECTION_NAMES,
        datumSelectionGarbageCollection = true,
        markerSelectionGarbageCollection = true,
        animationResetFns
      } = _a,
      otherOpts = __rest(_a, ["pathsPerSeries", "hasMarkers", "hasHighlightedLabels", "pathsZIndexSubOrderOffset", "directionKeys", "directionNames", "datumSelectionGarbageCollection", "markerSelectionGarbageCollection", "animationResetFns"]);
    super(Object.assign({
      directionKeys,
      directionNames,
      useSeriesGroupLayer: true,
      canHaveAxes: true
    }, otherOpts));
    this._contextNodeData = [];
    this.NodeClickEvent = CartesianSeriesNodeClickEvent;
    this.highlightSelection = Selection.select(this.highlightNode, () => this.opts.hasMarkers ? this.markerFactory() : this.nodeFactory());
    this.highlightLabelSelection = Selection.select(this.highlightLabel, Text);
    this.annotationSelections = new Set();
    this.subGroups = [];
    this.subGroupId = 0;
    this.debug = Debug.create();
    this.opts = {
      pathsPerSeries,
      hasMarkers,
      hasHighlightedLabels,
      pathsZIndexSubOrderOffset,
      directionKeys,
      directionNames,
      animationResetFns,
      datumSelectionGarbageCollection,
      markerSelectionGarbageCollection
    };
    this.animationState = new StateMachine('empty', {
      empty: {
        update: {
          target: 'ready',
          action: data => this.animateEmptyUpdateReady(data)
        }
      },
      ready: {
        updateData: 'waiting',
        clear: 'clearing',
        highlight: data => this.animateReadyHighlight(data),
        highlightMarkers: data => this.animateReadyHighlightMarkers(data),
        resize: data => this.animateReadyResize(data)
      },
      waiting: {
        update: {
          target: 'ready',
          action: data => this.animateWaitingUpdateReady(data)
        }
      },
      clearing: {
        update: {
          target: 'empty',
          action: data => this.animateClearingUpdateEmpty(data)
        }
      }
    }, () => this.checkProcessedDataAnimatable());
  }
  addChartEventListeners() {
    this.destroyFns.push(this.ctx.chartEventManager.addListener('legend-item-click', event => this.onLegendItemClick(event)), this.ctx.chartEventManager.addListener('legend-item-double-click', event => this.onLegendItemDoubleClick(event)));
  }
  destroy() {
    super.destroy();
    this._contextNodeData.splice(0, this._contextNodeData.length);
    this.subGroups.splice(0, this.subGroups.length);
  }
  update({
    seriesRect
  }) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
      const {
        visible,
        _contextNodeData: previousContextData
      } = this;
      const {
        series
      } = (_b = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight()) !== null && _b !== void 0 ? _b : {};
      const seriesHighlighted = series ? series === this : undefined;
      const resize = this.checkResize(seriesRect);
      const highlightItems = yield this.updateHighlightSelection(seriesHighlighted);
      yield this.updateSelections(visible);
      yield this.updateNodes(highlightItems, seriesHighlighted, visible);
      const animationData = this.getAnimationData(seriesRect, previousContextData);
      if (resize) {
        this.animationState.transition('resize', animationData);
      }
      this.animationState.transition('update', animationData);
    });
  }
  updateSelections(anySeriesItemEnabled) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!anySeriesItemEnabled && this.ctx.animationManager.isSkipped()) {
        return;
      }
      if (!this.nodeDataRefresh && !this.isPathOrSelectionDirty()) {
        return;
      }
      if (this.nodeDataRefresh) {
        this.nodeDataRefresh = false;
        this.debug(`CartesianSeries.updateSelections() - calling createNodeData() for`, this.id);
        this._contextNodeData = yield this.createNodeData();
        const animationValid = this.isProcessedDataAnimatable();
        this._contextNodeData.forEach(nodeData => {
          var _a;
          (_a = nodeData.animationValid) !== null && _a !== void 0 ? _a : nodeData.animationValid = animationValid;
        });
        yield this.updateSeriesGroups();
        const {
          dataModel,
          processedData
        } = this;
        if (dataModel !== undefined && processedData !== undefined) {
          this.dispatch('data-update', {
            dataModel,
            processedData
          });
        }
      }
      yield Promise.all(this.subGroups.map((g, i) => this.updateSeriesGroupSelections(g, i)));
    });
  }
  updateSeriesGroupSelections(subGroup, seriesIdx, seriesHighlighted) {
    return __awaiter(this, void 0, void 0, function* () {
      const {
        datumSelection,
        labelSelection,
        markerSelection,
        paths
      } = subGroup;
      const contextData = this._contextNodeData[seriesIdx];
      const {
        nodeData,
        labelData,
        itemId
      } = contextData;
      yield this.updatePaths({
        seriesHighlighted,
        itemId,
        contextData,
        paths,
        seriesIdx
      });
      subGroup.datumSelection = yield this.updateDatumSelection({
        nodeData,
        datumSelection,
        seriesIdx
      });
      subGroup.labelSelection = yield this.updateLabelSelection({
        labelData,
        labelSelection,
        seriesIdx
      });
      if (markerSelection) {
        subGroup.markerSelection = yield this.updateMarkerSelection({
          nodeData,
          markerSelection,
          seriesIdx
        });
      }
    });
  }
  markerFactory() {
    const MarkerShape = getMarker();
    return new MarkerShape();
  }
  updateSeriesGroups() {
    return __awaiter(this, void 0, void 0, function* () {
      const {
        _contextNodeData: contextNodeData,
        contentGroup,
        subGroups,
        opts: {
          pathsPerSeries,
          hasMarkers,
          datumSelectionGarbageCollection,
          markerSelectionGarbageCollection
        }
      } = this;
      if (contextNodeData.length === subGroups.length) {
        return;
      }
      if (contextNodeData.length < subGroups.length) {
        subGroups.splice(contextNodeData.length).forEach(({
          dataNodeGroup,
          markerGroup,
          labelGroup,
          paths
        }) => {
          contentGroup.removeChild(dataNodeGroup);
          if (markerGroup) {
            contentGroup.removeChild(markerGroup);
          }
          if (labelGroup) {
            contentGroup.removeChild(labelGroup);
          }
          for (const path of paths) {
            contentGroup.removeChild(path);
          }
        });
      }
      const totalGroups = contextNodeData.length;
      while (totalGroups > subGroups.length) {
        const layer = false;
        const subGroupId = this.subGroupId++;
        const dataNodeGroup = new Group({
          name: `${this.id}-series-sub${subGroupId}-dataNodes`,
          layer,
          zIndex: Layers.SERIES_LAYER_ZINDEX,
          zIndexSubOrder: this.getGroupZIndexSubOrder('data', subGroupId)
        });
        const markerGroup = hasMarkers ? new Group({
          name: `${this.id}-series-sub${this.subGroupId++}-markers`,
          layer,
          zIndex: Layers.SERIES_LAYER_ZINDEX,
          zIndexSubOrder: this.getGroupZIndexSubOrder('marker', subGroupId)
        }) : undefined;
        const labelGroup = new Group({
          name: `${this.id}-series-sub${this.subGroupId++}-labels`,
          layer,
          zIndex: Layers.SERIES_LABEL_ZINDEX,
          zIndexSubOrder: this.getGroupZIndexSubOrder('labels', subGroupId)
        });
        contentGroup.appendChild(dataNodeGroup);
        contentGroup.appendChild(labelGroup);
        if (markerGroup) {
          contentGroup.appendChild(markerGroup);
        }
        const paths = [];
        for (let index = 0; index < pathsPerSeries; index++) {
          paths[index] = new Path();
          paths[index].zIndex = Layers.SERIES_LAYER_ZINDEX;
          paths[index].zIndexSubOrder = this.getGroupZIndexSubOrder('paths', index);
          contentGroup.appendChild(paths[index]);
        }
        subGroups.push({
          paths,
          dataNodeGroup,
          markerGroup,
          labelGroup,
          labelSelection: Selection.select(labelGroup, Text),
          datumSelection: Selection.select(dataNodeGroup, () => this.nodeFactory(), datumSelectionGarbageCollection),
          markerSelection: markerGroup ? Selection.select(markerGroup, () => this.markerFactory(), markerSelectionGarbageCollection) : undefined
        });
      }
    });
  }
  getGroupZIndexSubOrder(type, subIndex = 0) {
    var _a;
    const result = super.getGroupZIndexSubOrder(type, subIndex);
    if (type === 'paths') {
      const pathOffset = (_a = this.opts.pathsZIndexSubOrderOffset[subIndex]) !== null && _a !== void 0 ? _a : 0;
      const superFn = result[0];
      if (typeof superFn === 'function') {
        result[0] = () => +superFn() + pathOffset;
      } else {
        result[0] = +superFn + pathOffset;
      }
    }
    return result;
  }
  updateNodes(highlightedItems, seriesHighlighted, anySeriesItemEnabled) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
      const {
        highlightSelection,
        highlightLabelSelection,
        opts: {
          hasMarkers,
          hasHighlightedLabels
        }
      } = this;
      const animationEnabled = !this.ctx.animationManager.isSkipped();
      const visible = this.visible && ((_a = this._contextNodeData) === null || _a === void 0 ? void 0 : _a.length) > 0 && anySeriesItemEnabled;
      this.rootGroup.visible = animationEnabled || visible;
      this.contentGroup.visible = animationEnabled || visible;
      this.highlightGroup.visible = (animationEnabled || visible) && !!seriesHighlighted;
      const subGroupOpacity = this.getOpacity();
      if (hasMarkers) {
        yield this.updateMarkerNodes({
          markerSelection: highlightSelection,
          isHighlight: true,
          seriesIdx: -1
        });
        this.animationState.transition('highlightMarkers', highlightSelection);
      } else {
        yield this.updateDatumNodes({
          datumSelection: highlightSelection,
          isHighlight: true,
          seriesIdx: -1
        });
        this.animationState.transition('highlight', highlightSelection);
      }
      if (hasHighlightedLabels) {
        yield this.updateLabelNodes({
          labelSelection: highlightLabelSelection,
          seriesIdx: -1
        });
      }
      yield Promise.all(this.subGroups.map((subGroup, seriesIdx) => __awaiter(this, void 0, void 0, function* () {
        const {
          dataNodeGroup,
          markerGroup,
          datumSelection,
          labelSelection,
          markerSelection,
          paths,
          labelGroup
        } = subGroup;
        const {
          itemId
        } = this.contextNodeData[seriesIdx];
        const subGroupVisible = visible;
        dataNodeGroup.opacity = subGroupOpacity;
        dataNodeGroup.visible = animationEnabled || subGroupVisible;
        labelGroup.visible = subGroupVisible;
        if (markerGroup) {
          markerGroup.opacity = subGroupOpacity;
          markerGroup.zIndex = dataNodeGroup.zIndex >= Layers.SERIES_LAYER_ZINDEX ? dataNodeGroup.zIndex : dataNodeGroup.zIndex + 1;
          markerGroup.visible = subGroupVisible;
        }
        if (labelGroup) {
          labelGroup.opacity = subGroupOpacity;
        }
        yield this.updatePathNodes({
          seriesHighlighted,
          itemId,
          paths,
          seriesIdx,
          opacity: subGroupOpacity,
          visible: subGroupVisible,
          animationEnabled
        });
        if (!dataNodeGroup.visible) {
          return;
        }
        yield this.updateDatumNodes({
          datumSelection,
          highlightedItems,
          isHighlight: false,
          seriesIdx
        });
        yield this.updateLabelNodes({
          labelSelection,
          seriesIdx
        });
        if (hasMarkers && markerSelection) {
          yield this.updateMarkerNodes({
            markerSelection,
            isHighlight: false,
            seriesIdx
          });
        }
      })));
    });
  }
  getHighlightLabelData(labelData, highlightedItem) {
    const labelItems = labelData.filter(ld => ld.datum === highlightedItem.datum && ld.itemId === highlightedItem.itemId);
    return labelItems.length !== 0 ? labelItems : undefined;
  }
  getHighlightData(_nodeData, highlightedItem) {
    return highlightedItem ? [highlightedItem] : undefined;
  }
  updateHighlightSelection(seriesHighlighted) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
      const {
        highlightSelection,
        highlightLabelSelection,
        _contextNodeData: contextNodeData
      } = this;
      const highlightedDatum = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight();
      const item = seriesHighlighted && (highlightedDatum === null || highlightedDatum === void 0 ? void 0 : highlightedDatum.datum) ? highlightedDatum : undefined;
      let labelItems;
      let highlightItems;
      if (item != null) {
        const labelsEnabled = this.isLabelEnabled();
        for (const {
          labelData,
          nodeData
        } of contextNodeData) {
          highlightItems = this.getHighlightData(nodeData, item);
          labelItems = labelsEnabled ? this.getHighlightLabelData(labelData, item) : undefined;
          if ((!labelsEnabled || labelItems != null) && highlightItems != null) {
            break;
          }
        }
      }
      this.highlightSelection = yield this.updateHighlightSelectionItem({
        items: highlightItems,
        highlightSelection
      });
      this.highlightLabelSelection = yield this.updateHighlightSelectionLabel({
        items: labelItems,
        highlightLabelSelection
      });
      return highlightItems;
    });
  }
  pickNodeExactShape(point) {
    var _a;
    const result = super.pickNodeExactShape(point);
    if (result) {
      return result;
    }
    const {
      x,
      y
    } = point;
    const {
      opts: {
        hasMarkers
      }
    } = this;
    let match;
    for (const {
      dataNodeGroup,
      markerGroup
    } of this.subGroups) {
      let match = dataNodeGroup.pickNode(x, y);
      if (!match && hasMarkers) {
        match = markerGroup === null || markerGroup === void 0 ? void 0 : markerGroup.pickNode(x, y);
      }
      if (match) {
        break;
      }
    }
    if (match) {
      return {
        datum: match.datum,
        distance: 0
      };
    } else {
      for (const mod of this.moduleMap.modules) {
        const {
          datum
        } = (_a = mod.pickNodeExact(point)) !== null && _a !== void 0 ? _a : {};
        if (datum !== undefined) {
          return {
            datum,
            distance: 0
          };
        }
      }
    }
  }
  pickNodeClosestDatum(point) {
    var _a, _b;
    const {
      x,
      y
    } = point;
    const {
      axes,
      rootGroup,
      _contextNodeData: contextNodeData
    } = this;
    const xAxis = axes[ChartAxisDirection.X];
    const yAxis = axes[ChartAxisDirection.Y];
    const hitPoint = rootGroup.transformPoint(x, y);
    let minDistance = Infinity;
    let closestDatum;
    for (const context of contextNodeData) {
      for (const datum of context.nodeData) {
        const {
          point: {
            x: datumX = NaN,
            y: datumY = NaN
          } = {}
        } = datum;
        if (isNaN(datumX) || isNaN(datumY)) {
          continue;
        }
        const isInRange = (xAxis === null || xAxis === void 0 ? void 0 : xAxis.inRange(datumX)) && (yAxis === null || yAxis === void 0 ? void 0 : yAxis.inRange(datumY));
        if (!isInRange) {
          continue;
        }
        const distance = Math.max(Math.pow(hitPoint.x - datumX, 2) + Math.pow(hitPoint.y - datumY, 2), 0);
        if (distance < minDistance) {
          minDistance = distance;
          closestDatum = datum;
        }
      }
    }
    for (const mod of this.moduleMap.modules) {
      const modPick = mod.pickNodeNearest(point);
      if (modPick !== undefined && modPick.distanceSquared < minDistance) {
        minDistance = modPick.distanceSquared;
        closestDatum = modPick.datum;
        break;
      }
    }
    if (closestDatum) {
      const distance = Math.max(Math.sqrt(minDistance) - ((_b = (_a = closestDatum.point) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0), 0);
      return {
        datum: closestDatum,
        distance
      };
    }
  }
  pickNodeMainAxisFirst(point, requireCategoryAxis) {
    var _a, _b;
    const {
      x,
      y
    } = point;
    const {
      axes,
      rootGroup,
      _contextNodeData: contextNodeData
    } = this;
    const xAxis = axes[ChartAxisDirection.X];
    const yAxis = axes[ChartAxisDirection.Y];
    const directions = [xAxis, yAxis].filter(a => a instanceof CategoryAxis).map(a => a.direction);
    if (requireCategoryAxis && directions.length === 0) {
      return;
    }
    const [primaryDirection = ChartAxisDirection.X] = directions;
    const hitPoint = rootGroup.transformPoint(x, y);
    const hitPointCoords = primaryDirection === ChartAxisDirection.X ? [hitPoint.x, hitPoint.y] : [hitPoint.y, hitPoint.x];
    const minDistance = [Infinity, Infinity];
    let closestDatum;
    for (const context of contextNodeData) {
      for (const datum of context.nodeData) {
        const {
          point: {
            x: datumX = NaN,
            y: datumY = NaN
          } = {}
        } = datum;
        if (isNaN(datumX) || isNaN(datumY)) {
          continue;
        }
        const isInRange = (xAxis === null || xAxis === void 0 ? void 0 : xAxis.inRange(datumX)) && (yAxis === null || yAxis === void 0 ? void 0 : yAxis.inRange(datumY));
        if (!isInRange) {
          continue;
        }
        const point = primaryDirection === ChartAxisDirection.X ? [datumX, datumY] : [datumY, datumX];
        let newMinDistance = true;
        for (let i = 0; i < point.length; i++) {
          const dist = Math.abs(point[i] - hitPointCoords[i]);
          if (dist > minDistance[i]) {
            newMinDistance = false;
            break;
          }
          if (dist < minDistance[i]) {
            minDistance[i] = dist;
            minDistance.fill(Infinity, i + 1, minDistance.length);
          }
        }
        if (newMinDistance) {
          closestDatum = datum;
        }
      }
    }
    if (closestDatum) {
      let closestDistanceSquared = Math.max(Math.pow(minDistance[0], 2) + Math.pow(minDistance[1], 2) - ((_b = (_a = closestDatum.point) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0), 0);
      for (const mod of this.moduleMap.modules) {
        const modPick = mod.pickNodeMainAxisFirst(point);
        if (modPick !== undefined && modPick.distanceSquared < closestDistanceSquared) {
          closestDatum = modPick.datum;
          closestDistanceSquared = modPick.distanceSquared;
          break;
        }
      }
      return {
        datum: closestDatum,
        distance: Math.sqrt(closestDistanceSquared)
      };
    }
  }
  onLegendItemClick(event) {
    const {
      legendItemName
    } = this.properties;
    const {
      enabled,
      itemId,
      series
    } = event;
    const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
    if (series.id === this.id || matchedLegendItemName) {
      this.toggleSeriesItem(itemId, enabled);
    }
  }
  onLegendItemDoubleClick(event) {
    const {
      enabled,
      itemId,
      series,
      numVisibleItems
    } = event;
    const {
      legendItemName
    } = this.properties;
    const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
    if (series.id === this.id || matchedLegendItemName) {
      this.toggleSeriesItem(itemId, true);
    } else if (enabled && numVisibleItems === 1) {
      this.toggleSeriesItem(itemId, true);
    } else {
      this.toggleSeriesItem(itemId, false);
    }
  }
  isPathOrSelectionDirty() {
    return false;
  }
  getLabelData() {
    return [];
  }
  shouldFlipXY() {
    return false;
  }
  getMinRect() {
    const [context] = this._contextNodeData;
    if (!(context === null || context === void 0 ? void 0 : context.nodeData.length)) {
      return;
    }
    const width = context.nodeData.map(({
      midPoint
    }) => {
      var _a;
      return (_a = midPoint === null || midPoint === void 0 ? void 0 : midPoint.x) !== null && _a !== void 0 ? _a : 0;
    }).sort((a, b) => a - b).reduce((max, x, i, array) => i > 0 ? Math.max(max, x - array[i - 1]) : max, 0);
    const height = context.nodeData.map(({
      midPoint
    }) => {
      var _a;
      return (_a = midPoint === null || midPoint === void 0 ? void 0 : midPoint.y) !== null && _a !== void 0 ? _a : 0;
    }).sort((a, b) => a - b).reduce((max, y, i, array) => i > 0 ? Math.max(max, y - array[i - 1]) : max, 0);
    return new BBox(0, 0, width, height);
  }
  updateHighlightSelectionItem(opts) {
    return __awaiter(this, void 0, void 0, function* () {
      const {
        opts: {
          hasMarkers
        }
      } = this;
      const {
        items,
        highlightSelection
      } = opts;
      const nodeData = items !== null && items !== void 0 ? items : [];
      if (hasMarkers) {
        const markerSelection = highlightSelection;
        return this.updateMarkerSelection({
          nodeData,
          markerSelection,
          seriesIdx: -1
        });
      } else {
        return this.updateDatumSelection({
          nodeData,
          datumSelection: highlightSelection,
          seriesIdx: -1
        });
      }
    });
  }
  updateHighlightSelectionLabel(opts) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
      return this.updateLabelSelection({
        labelData: (_a = opts.items) !== null && _a !== void 0 ? _a : [],
        labelSelection: opts.highlightLabelSelection,
        seriesIdx: -1
      });
    });
  }
  updateDatumSelection(opts) {
    return __awaiter(this, void 0, void 0, function* () {
      return opts.datumSelection;
    });
  }
  updateDatumNodes(_opts) {
    return __awaiter(this, void 0, void 0, function* () {});
  }
  updateMarkerSelection(opts) {
    return __awaiter(this, void 0, void 0, function* () {
      return opts.markerSelection;
    });
  }
  updateMarkerNodes(_opts) {
    return __awaiter(this, void 0, void 0, function* () {});
  }
  updatePaths(opts) {
    return __awaiter(this, void 0, void 0, function* () {
      opts.paths.forEach(p => p.visible = false);
    });
  }
  updatePathNodes(opts) {
    return __awaiter(this, void 0, void 0, function* () {
      const {
        paths,
        opacity,
        visible
      } = opts;
      for (const path of paths) {
        path.opacity = opacity;
        path.visible = visible;
      }
    });
  }
  resetAllAnimation(data) {
    var _a, _b;
    const {
      path,
      datum,
      label,
      marker
    } = (_b = (_a = this.opts) === null || _a === void 0 ? void 0 : _a.animationResetFns) !== null && _b !== void 0 ? _b : {};
    this.ctx.animationManager.stopByAnimationGroupId(this.id);
    if (path) {
      data.paths.forEach(paths => {
        resetMotion(paths, path);
      });
    }
    if (datum) {
      resetMotion(data.datumSelections, datum);
    }
    if (label) {
      resetMotion(data.labelSelections, label);
    }
    if (marker) {
      resetMotion(data.markerSelections, marker);
    }
    if (data.contextData.some(d => d.animationValid === false)) {
      this.ctx.animationManager.skipCurrentBatch();
    }
  }
  animateEmptyUpdateReady(data) {
    this.ctx.animationManager.skipCurrentBatch();
    this.resetAllAnimation(data);
  }
  animateWaitingUpdateReady(data) {
    this.ctx.animationManager.skipCurrentBatch();
    this.resetAllAnimation(data);
  }
  animateReadyHighlight(data) {
    var _a, _b;
    const {
      datum
    } = (_b = (_a = this.opts) === null || _a === void 0 ? void 0 : _a.animationResetFns) !== null && _b !== void 0 ? _b : {};
    if (datum) {
      resetMotion([data], datum);
    }
  }
  animateReadyHighlightMarkers(data) {
    var _a, _b;
    const {
      marker
    } = (_b = (_a = this.opts) === null || _a === void 0 ? void 0 : _a.animationResetFns) !== null && _b !== void 0 ? _b : {};
    if (marker) {
      resetMotion([data], marker);
    }
  }
  animateReadyResize(data) {
    this.resetAllAnimation(data);
  }
  animateClearingUpdateEmpty(data) {
    this.ctx.animationManager.skipCurrentBatch();
    this.resetAllAnimation(data);
  }
  animationTransitionClear() {
    this.animationState.transition('clear', this.getAnimationData());
  }
  getAnimationData(seriesRect, previousContextData) {
    const animationData = {
      datumSelections: this.subGroups.map(({
        datumSelection
      }) => datumSelection),
      markerSelections: this.subGroups.filter(({
        markerSelection
      }) => markerSelection !== undefined).map(({
        markerSelection
      }) => markerSelection),
      labelSelections: this.subGroups.map(({
        labelSelection
      }) => labelSelection),
      annotationSelections: [...this.annotationSelections],
      contextData: this._contextNodeData,
      previousContextData,
      paths: this.subGroups.map(({
        paths
      }) => paths),
      seriesRect
    };
    return animationData;
  }
  calculateScaling() {
    const result = {};
    const addScale = direction => {
      const axis = this.axes[direction];
      if (!axis) return;
      if (axis.scale instanceof LogScale) {
        const {
          range,
          domain
        } = axis.scale;
        result[direction] = {
          type: 'log',
          convert: domain => axis.scale.convert(domain),
          domain: [domain[0], domain[1]],
          range: [range[0], range[1]]
        };
      } else if (axis.scale instanceof ContinuousScale) {
        const {
          range
        } = axis.scale;
        const domain = axis.scale.getDomain();
        result[direction] = {
          type: 'continuous',
          domain: [domain[0], domain[1]],
          range: [range[0], range[1]]
        };
      } else if (axis.scale) {
        const {
          domain
        } = axis.scale;
        result[direction] = {
          type: 'category',
          domain,
          range: domain.map(d => axis.scale.convert(d))
        };
      }
    };
    addScale(ChartAxisDirection.X);
    addScale(ChartAxisDirection.Y);
    return result;
  }
}