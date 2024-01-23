var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest = this && this.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
import { ModuleMap } from '../../module/moduleMap';
import { Group } from '../../scene/group';
import { createId } from '../../util/id';
import { jsonDiff } from '../../util/json';
import { Listeners } from '../../util/listeners';
import { mergeDefaults } from '../../util/object';
import { Observable } from '../../util/observable';
import { ActionOnSet } from '../../util/proxy';
import { checkDatum } from '../../util/value';
import { ChartAxisDirection } from '../chartAxisDirection';
import { accumulatedValue, range, trailingAccumulatedValue } from '../data/aggregateFunctions';
import { accumulateGroup } from '../data/processors';
import { Layers } from '../layers';
export var SeriesNodePickMode;
(function (SeriesNodePickMode) {
  SeriesNodePickMode[SeriesNodePickMode["EXACT_SHAPE_MATCH"] = 0] = "EXACT_SHAPE_MATCH";
  SeriesNodePickMode[SeriesNodePickMode["NEAREST_BY_MAIN_AXIS_FIRST"] = 1] = "NEAREST_BY_MAIN_AXIS_FIRST";
  SeriesNodePickMode[SeriesNodePickMode["NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST"] = 2] = "NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST";
  SeriesNodePickMode[SeriesNodePickMode["NEAREST_NODE"] = 3] = "NEAREST_NODE";
})(SeriesNodePickMode || (SeriesNodePickMode = {}));
function basicContinuousCheckDatumValidation(v) {
  return checkDatum(v, true) != null;
}
function basicDiscreteCheckDatumValidation(v) {
  return checkDatum(v, false) != null;
}
export function keyProperty(scope, propName, continuous, opts = {}) {
  const result = Object.assign({
    scopes: [scope.id],
    property: propName,
    type: 'key',
    valueType: continuous ? 'range' : 'category',
    validation: continuous ? basicContinuousCheckDatumValidation : basicDiscreteCheckDatumValidation
  }, opts);
  return result;
}
export function valueProperty(scope, propName, continuous, opts = {}) {
  const result = Object.assign({
    scopes: [scope.id],
    property: propName,
    type: 'value',
    valueType: continuous ? 'range' : 'category',
    validation: continuous ? basicContinuousCheckDatumValidation : basicDiscreteCheckDatumValidation
  }, opts);
  return result;
}
export function rangedValueProperty(scope, propName, opts = {}) {
  const {
      min = -Infinity,
      max = Infinity
    } = opts,
    defOpts = __rest(opts, ["min", "max"]);
  return Object.assign({
    scopes: [scope.id],
    type: 'value',
    property: propName,
    valueType: 'range',
    validation: basicContinuousCheckDatumValidation,
    processor: () => datum => {
      if (typeof datum !== 'number') return datum;
      if (isNaN(datum)) return datum;
      return Math.min(Math.max(datum, min), max);
    }
  }, defOpts);
}
export function trailingValueProperty(scope, propName, continuous, opts = {}) {
  const result = Object.assign(Object.assign({}, valueProperty(scope, propName, continuous, opts)), {
    processor: trailingValue()
  });
  return result;
}
export function trailingValue() {
  return () => {
    let value = 0;
    return datum => {
      const trailingValue = value;
      value = datum;
      return trailingValue;
    };
  };
}
export function accumulativeValueProperty(scope, propName, continuous, opts = {}) {
  const {
      onlyPositive
    } = opts,
    defOpts = __rest(opts, ["onlyPositive"]);
  const result = Object.assign(Object.assign({}, valueProperty(scope, propName, continuous, defOpts)), {
    processor: accumulatedValue(onlyPositive)
  });
  return result;
}
export function trailingAccumulatedValueProperty(scope, propName, continuous, opts = {}) {
  const result = Object.assign(Object.assign({}, valueProperty(scope, propName, continuous, opts)), {
    processor: trailingAccumulatedValue()
  });
  return result;
}
export function groupAccumulativeValueProperty(scope, propName, continuous, mode, sum = 'current', opts) {
  return [valueProperty(scope, propName, continuous, opts), accumulateGroup(scope, opts.groupId, mode, sum, opts.separateNegative), ...(opts.rangeId != null ? [range(scope, opts.rangeId, opts.groupId)] : [])];
}
export class SeriesNodeClickEvent {
  constructor(type, event, {
    datum
  }, series) {
    this.type = type;
    this.event = event;
    this.datum = datum;
    this.seriesId = series.id;
  }
}
var SeriesHighlight;
(function (SeriesHighlight) {
  SeriesHighlight[SeriesHighlight["None"] = 0] = "None";
  SeriesHighlight[SeriesHighlight["This"] = 1] = "This";
  SeriesHighlight[SeriesHighlight["Other"] = 2] = "Other";
})(SeriesHighlight || (SeriesHighlight = {}));
export class Series extends Observable {
  get id() {
    var _a, _b;
    return (_b = (_a = this.properties) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : this.internalId;
  }
  get type() {
    var _a;
    return (_a = this.constructor.type) !== null && _a !== void 0 ? _a : '';
  }
  set data(input) {
    this._data = input;
    this.onDataChange();
  }
  get data() {
    var _a;
    return (_a = this._data) !== null && _a !== void 0 ? _a : this._chartData;
  }
  set visible(value) {
    this.properties.visible = value;
    this.visibleChanged();
  }
  get visible() {
    return this.properties.visible;
  }
  onDataChange() {
    this.nodeDataRefresh = true;
  }
  setChartData(input) {
    this._chartData = input;
    if (this.data === input) {
      this.onDataChange();
    }
  }
  hasData() {
    const {
      data
    } = this;
    return data && (!Array.isArray(data) || data.length > 0);
  }
  onSeriesGroupingChange(prev, next) {
    const {
      internalId,
      type,
      visible,
      rootGroup,
      highlightGroup,
      annotationGroup
    } = this;
    if (prev) {
      this.ctx.seriesStateManager.deregisterSeries({
        id: internalId,
        type
      });
    }
    if (next) {
      this.ctx.seriesStateManager.registerSeries({
        id: internalId,
        type,
        visible,
        seriesGrouping: next
      });
    }
    if (this.rootGroup.parent == null) return;
    this.ctx.seriesLayerManager.changeGroup({
      internalId,
      type,
      rootGroup,
      highlightGroup,
      annotationGroup,
      getGroupZIndexSubOrder: type => this.getGroupZIndexSubOrder(type),
      seriesGrouping: next,
      oldGrouping: prev
    });
  }
  getBandScalePadding() {
    return {
      inner: 1,
      outer: 0
    };
  }
  constructor(seriesOpts) {
    super();
    this.destroyFns = [];
    this.seriesGrouping = undefined;
    this.NodeClickEvent = SeriesNodeClickEvent;
    this.internalId = createId(this);
    this.rootGroup = new Group({
      name: 'seriesRoot',
      isVirtual: true
    });
    this.axes = {
      [ChartAxisDirection.X]: undefined,
      [ChartAxisDirection.Y]: undefined
    };
    this.directions = [ChartAxisDirection.X, ChartAxisDirection.Y];
    this.nodeDataRefresh = true;
    this.moduleMap = new ModuleMap();
    this._declarationOrder = -1;
    this.seriesListeners = new Listeners();
    const {
      moduleCtx,
      useLabelLayer = false,
      pickModes = [SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST],
      directionKeys = {},
      directionNames = {},
      contentGroupVirtual = true,
      canHaveAxes = false
    } = seriesOpts;
    this.ctx = moduleCtx;
    this.directionKeys = directionKeys;
    this.directionNames = directionNames;
    this.canHaveAxes = canHaveAxes;
    this.contentGroup = this.rootGroup.appendChild(new Group({
      name: `${this.internalId}-content`,
      layer: !contentGroupVirtual,
      isVirtual: contentGroupVirtual,
      zIndex: Layers.SERIES_LAYER_ZINDEX,
      zIndexSubOrder: this.getGroupZIndexSubOrder('data')
    }));
    this.highlightGroup = new Group({
      name: `${this.internalId}-highlight`,
      layer: !contentGroupVirtual,
      isVirtual: contentGroupVirtual,
      zIndex: Layers.SERIES_LAYER_ZINDEX,
      zIndexSubOrder: this.getGroupZIndexSubOrder('highlight')
    });
    this.highlightNode = this.highlightGroup.appendChild(new Group({
      name: 'highlightNode',
      zIndex: 0
    }));
    this.highlightLabel = this.highlightGroup.appendChild(new Group({
      name: 'highlightLabel',
      zIndex: 10
    }));
    this.pickModes = pickModes;
    this.labelGroup = this.rootGroup.appendChild(new Group({
      name: `${this.internalId}-series-labels`,
      layer: useLabelLayer,
      zIndex: Layers.SERIES_LABEL_ZINDEX
    }));
    this.annotationGroup = new Group({
      name: `${this.id}-annotation`,
      layer: !contentGroupVirtual,
      isVirtual: contentGroupVirtual,
      zIndex: Layers.SERIES_LAYER_ZINDEX,
      zIndexSubOrder: this.getGroupZIndexSubOrder('annotation')
    });
  }
  getGroupZIndexSubOrder(type, subIndex = 0) {
    let mainAdjust = 0;
    switch (type) {
      case 'data':
      case 'paths':
        break;
      case 'labels':
        mainAdjust += 20000;
        break;
      case 'marker':
        mainAdjust += 10000;
        break;
      case 'highlight':
        subIndex += 15000;
        break;
      case 'annotation':
        mainAdjust += 15000;
        break;
    }
    const main = () => this._declarationOrder + mainAdjust;
    return [main, subIndex];
  }
  addListener(type, listener) {
    return this.seriesListeners.addListener(type, listener);
  }
  dispatch(type, event) {
    this.seriesListeners.dispatch(type, event);
  }
  addChartEventListeners() {
    return;
  }
  destroy() {
    this.destroyFns.forEach(f => f());
    this.ctx.seriesStateManager.deregisterSeries(this);
    this.ctx.seriesLayerManager.releaseGroup(this);
  }
  getDirectionValues(direction, properties) {
    const resolvedDirection = this.resolveKeyDirection(direction);
    const keys = properties === null || properties === void 0 ? void 0 : properties[resolvedDirection];
    const values = [];
    if (!keys) return values;
    const addValues = (...items) => {
      for (const value of items) {
        if (Array.isArray(value)) {
          addValues(...value);
        } else if (typeof value === 'object') {
          addValues(...Object.values(value));
        } else {
          values.push(value);
        }
      }
    };
    addValues(...keys.map(key => this.properties[key]));
    return values;
  }
  getKeys(direction) {
    return this.getDirectionValues(direction, this.directionKeys);
  }
  getNames(direction) {
    return this.getDirectionValues(direction, this.directionNames);
  }
  resolveKeyDirection(direction) {
    return direction;
  }
  getDomain(direction) {
    const seriesDomain = this.getSeriesDomain(direction);
    const moduleDomains = this.moduleMap.mapValues(module => module.getDomain(direction));
    return seriesDomain.concat(moduleDomains.flat());
  }
  markNodeDataDirty() {
    this.nodeDataRefresh = true;
  }
  visibleChanged() {
    this.ctx.seriesStateManager.registerSeries(this);
  }
  getOpacity() {
    const defaultOpacity = 1;
    const {
      dimOpacity = 1,
      enabled = true
    } = this.properties.highlightStyle.series;
    if (!enabled || dimOpacity === defaultOpacity) {
      return defaultOpacity;
    }
    switch (this.isItemIdHighlighted()) {
      case SeriesHighlight.None:
      case SeriesHighlight.This:
        return defaultOpacity;
      case SeriesHighlight.Other:
      default:
        return dimOpacity;
    }
  }
  getStrokeWidth(defaultStrokeWidth) {
    const {
      strokeWidth,
      enabled = true
    } = this.properties.highlightStyle.series;
    if (!enabled || strokeWidth === undefined) {
      return defaultStrokeWidth;
    }
    switch (this.isItemIdHighlighted()) {
      case SeriesHighlight.This:
        return strokeWidth;
      case SeriesHighlight.None:
      case SeriesHighlight.Other:
        return defaultStrokeWidth;
    }
  }
  isItemIdHighlighted() {
    var _a, _b;
    const {
      series
    } = (_b = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight()) !== null && _b !== void 0 ? _b : {};
    if (series == null) {
      return SeriesHighlight.None;
    }
    if (series !== this) {
      return SeriesHighlight.Other;
    }
    return SeriesHighlight.This;
  }
  getModuleTooltipParams() {
    const params = this.moduleMap.mapValues(module => module.getTooltipParams());
    return params.reduce((total, current) => Object.assign(Object.assign({}, current), total), {});
  }
  pickNode(point, limitPickModes) {
    const {
      pickModes,
      visible,
      rootGroup
    } = this;
    if (!visible || !rootGroup.visible) {
      return;
    }
    for (const pickMode of pickModes) {
      if (limitPickModes && !limitPickModes.includes(pickMode)) {
        continue;
      }
      let match;
      switch (pickMode) {
        case SeriesNodePickMode.EXACT_SHAPE_MATCH:
          match = this.pickNodeExactShape(point);
          break;
        case SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST:
        case SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST:
          match = this.pickNodeMainAxisFirst(point, pickMode === SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST);
          break;
        case SeriesNodePickMode.NEAREST_NODE:
          match = this.pickNodeClosestDatum(point);
          break;
      }
      if (match) {
        return {
          pickMode,
          match: match.datum,
          distance: match.distance
        };
      }
    }
  }
  pickNodeExactShape(point) {
    const match = this.contentGroup.pickNode(point.x, point.y);
    return match && {
      datum: match.datum,
      distance: 0
    };
  }
  pickNodeClosestDatum(_point) {
    throw new Error('ZING Charts - Series.pickNodeClosestDatum() not implemented');
  }
  pickNodeMainAxisFirst(_point, _requireCategoryAxis) {
    throw new Error('ZING Charts - Series.pickNodeMainAxisFirst() not implemented');
  }
  fireNodeClickEvent(event, datum) {
    this.fireEvent(new this.NodeClickEvent('nodeClick', event, datum, this));
  }
  fireNodeDoubleClickEvent(event, datum) {
    this.fireEvent(new this.NodeClickEvent('nodeDoubleClick', event, datum, this));
  }
  toggleSeriesItem(itemId, enabled) {
    this.visible = enabled;
    this.nodeDataRefresh = true;
    this.dispatch('visibility-changed', {
      itemId,
      enabled
    });
  }
  isEnabled() {
    return this.visible;
  }
  getModuleMap() {
    return this.moduleMap;
  }
  createModuleContext() {
    return Object.assign(Object.assign({}, this.ctx), {
      series: this
    });
  }
  getLabelText(label, params, defaultFormatter = String) {
    var _a;
    if (label.formatter) {
      return (_a = this.ctx.callbackCache.call(label.formatter, Object.assign({
        seriesId: this.id
      }, params))) !== null && _a !== void 0 ? _a : defaultFormatter(params.value);
    }
    return defaultFormatter(params.value);
  }
  getMarkerStyle(marker, params, defaultStyle = marker.getStyle()) {
    var _a, _b;
    const defaultSize = {
      size: (_b = (_a = params.datum.point) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0
    };
    const markerStyle = mergeDefaults(defaultSize, defaultStyle);
    if (marker.formatter) {
      const style = this.ctx.callbackCache.call(marker.formatter, Object.assign(Object.assign(Object.assign({
        seriesId: this.id
      }, markerStyle), params), {
        datum: params.datum.datum
      }));
      return mergeDefaults(style, markerStyle);
    }
    return markerStyle;
  }
  updateMarkerStyle(markerNode, marker, params, defaultStyle = marker.getStyle(), {
    applyTranslation = true
  } = {}) {
    const {
      point
    } = params.datum;
    const activeStyle = this.getMarkerStyle(marker, params, defaultStyle);
    const visible = this.visible && activeStyle.size > 0 && point && !isNaN(point.x) && !isNaN(point.y);
    if (applyTranslation) {
      markerNode.setProperties(Object.assign(Object.assign({
        visible
      }, activeStyle), {
        translationX: point === null || point === void 0 ? void 0 : point.x,
        translationY: point === null || point === void 0 ? void 0 : point.y
      }));
    } else {
      markerNode.setProperties(Object.assign({
        visible
      }, activeStyle));
    }
    if (typeof marker.shape === 'function' && !markerNode.dirtyPath) {
      markerNode.path.clear({
        trackChanges: true
      });
      markerNode.updatePath();
      markerNode.checkPathDirty();
    }
  }
  getMinRect() {
    return undefined;
  }
  get nodeDataDependencies() {
    var _a;
    return (_a = this._nodeDataDependencies) !== null && _a !== void 0 ? _a : {
      seriesRectWidth: NaN,
      seriesRectHeight: NaN
    };
  }
  checkResize(newSeriesRect) {
    const {
      width: seriesRectWidth,
      height: seriesRectHeight
    } = newSeriesRect !== null && newSeriesRect !== void 0 ? newSeriesRect : {
      width: NaN,
      height: NaN
    };
    const newNodeDataDependencies = newSeriesRect ? {
      seriesRectWidth,
      seriesRectHeight
    } : undefined;
    const resize = jsonDiff(this.nodeDataDependencies, newNodeDataDependencies) != null;
    if (resize) {
      this._nodeDataDependencies = newNodeDataDependencies;
      this.markNodeDataDirty();
    }
    return resize;
  }
}
Series.highlightedZIndex = 1000000000000;
__decorate([ActionOnSet({
  changeValue: function (newVal, oldVal) {
    this.onSeriesGroupingChange(oldVal, newVal);
  }
})], Series.prototype, "seriesGrouping", void 0);