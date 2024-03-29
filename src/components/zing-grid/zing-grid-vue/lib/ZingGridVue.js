var __extends = this && this.__extends || function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    };
    return extendStatics(d, b);
  };
  return function (d, b) {
    if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Bean, ComponentUtil, Events, createGrid } from '@/components/zing-grid/zing-grid-community/main.js';
import { VueFrameworkComponentWrapper } from './VueFrameworkComponentWrapper';
import { getZingGridProperties } from './Utils';
import { VueFrameworkOverrides } from './VueFrameworkOverrides';
var _a = getZingGridProperties(),
  props = _a[0],
  computed = _a[1],
  watch = _a[2],
  model = _a[3];
var ZingGridVue = function (_super) {
  __extends(ZingGridVue, _super);
  function ZingGridVue() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.gridCreated = false;
    _this.isDestroyed = false;
    _this.gridReadyFired = false;
    _this.api = undefined;
    _this.emitRowModel = null;
    return _this;
  }
  ZingGridVue_1 = ZingGridVue;
  ZingGridVue.kebabProperty = function (property) {
    return property.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  };
  ZingGridVue.prototype.render = function (h) {
    return h('div');
  };
  ZingGridVue.prototype.globalEventListenerFactory = function (restrictToSyncOnly) {
    var _this = this;
    return function (eventType, event) {
      if (_this.isDestroyed) {
        return;
      }
      if (eventType === 'gridReady') {
        _this.gridReadyFired = true;
      }
      var alwaysSync = ZingGridVue_1.ALWAYS_SYNC_GLOBAL_EVENTS.has(eventType);
      if (alwaysSync && !restrictToSyncOnly || !alwaysSync && restrictToSyncOnly) {
        return;
      }
      _this.updateModelIfUsed(eventType);
      var kebabName = ZingGridVue_1.kebabProperty(eventType);
      if (_this.$listeners[kebabName]) {
        _this.$emit(kebabName, event);
      } else if (_this.$listeners[eventType]) {
        _this.$emit(eventType, event);
      }
    };
  };
  ZingGridVue.prototype.mounted = function () {
    var _this = this;
    this.emitRowModel = this.debounce(function () {
      _this.$emit('data-model-changed', Object.freeze(_this.getRowData()));
    }, 20);
    var frameworkComponentWrapper = new VueFrameworkComponentWrapper(this);
    var gridOptions = ComponentUtil.combineAttributesAndGridOptions(this.gridOptions, this);
    this.checkForBindingConflicts();
    var rowData = this.getRowDataBasedOnBindings();
    if (rowData !== ComponentUtil.VUE_OMITTED_PROPERTY) {
      gridOptions.rowData = rowData;
    }
    var gridParams = {
      globalEventListener: this.globalEventListenerFactory().bind(this),
      globalSyncEventListener: this.globalEventListenerFactory(true).bind(this),
      frameworkOverrides: new VueFrameworkOverrides(this),
      providedBeanInstances: {
        frameworkComponentWrapper: frameworkComponentWrapper
      },
      modules: this.modules
    };
    this.api = createGrid(this.$el, gridOptions, gridParams);
    this.gridCreated = true;
  };
  ZingGridVue.prototype.destroyed = function () {
    var _a;
    if (this.gridCreated) {
      (_a = this.api) === null || _a === void 0 ? void 0 : _a.destroy();
      this.isDestroyed = true;
    }
  };
  ZingGridVue.prototype.checkForBindingConflicts = function () {
    var thisAsAny = this;
    if ((thisAsAny.rowData || this.gridOptions.rowData) && thisAsAny.rowDataModel) {
      console.warn('ZING Grid: Using both rowData and rowDataModel. rowData will be ignored.');
    }
  };
  ZingGridVue.prototype.getRowData = function () {
    var _a;
    var rowData = [];
    (_a = this.api) === null || _a === void 0 ? void 0 : _a.forEachNode(function (rowNode) {
      rowData.push(rowNode.data);
    });
    return rowData;
  };
  ZingGridVue.prototype.updateModelIfUsed = function (eventType) {
    if (this.gridReadyFired && this.$listeners['data-model-changed'] && ZingGridVue_1.ROW_DATA_EVENTS.has(eventType)) {
      if (this.emitRowModel) {
        this.emitRowModel();
      }
    }
  };
  ZingGridVue.prototype.getRowDataBasedOnBindings = function () {
    var thisAsAny = this;
    var rowDataModel = thisAsAny.rowDataModel;
    return rowDataModel ? rowDataModel : thisAsAny.rowData ? thisAsAny.rowData : thisAsAny.gridOptions.rowData;
  };
  ZingGridVue.prototype.debounce = function (func, delay) {
    var timeout;
    return function () {
      var later = function () {
        func();
      };
      window.clearTimeout(timeout);
      timeout = window.setTimeout(later, delay);
    };
  };
  var ZingGridVue_1;
  ZingGridVue.ROW_DATA_EVENTS = new Set(['rowDataUpdated', 'cellValueChanged', 'rowValueChanged']);
  ZingGridVue.ALWAYS_SYNC_GLOBAL_EVENTS = new Set([Events.EVENT_GRID_PRE_DESTROYED]);
  __decorate([Prop(Boolean)], ZingGridVue.prototype, "autoParamsRefresh", void 0);
  __decorate([Prop({
    default: function () {
      return [];
    }
  })], ZingGridVue.prototype, "componentDependencies", void 0);
  __decorate([Prop({
    default: function () {
      return [];
    }
  })], ZingGridVue.prototype, "modules", void 0);
  ZingGridVue = ZingGridVue_1 = __decorate([Bean('zingGridVue'), Component({
    props: props,
    computed: computed,
    watch: watch,
    model: model
  })], ZingGridVue);
  return ZingGridVue;
}(Vue);
export { ZingGridVue };