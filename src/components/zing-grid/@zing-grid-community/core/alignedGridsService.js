var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = this && this.__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
import { Events } from "./events";
import { Bean } from "./context/context";
import { Qualifier } from "./context/context";
import { Autowired } from "./context/context";
import { PostConstruct } from "./context/context";
import { BeanStub } from "./context/beanStub";
import { GridApi } from "./gridApi";
import { errorOnce } from "./utils/function";
let AlignedGridsService = class AlignedGridsService extends BeanStub {
  constructor() {
    super(...arguments);
    this.consuming = false;
  }
  setBeans(loggerFactory) {
    this.logger = loggerFactory.create('AlignedGridsService');
  }
  getAlignedGridApis() {
    var _a;
    let alignedGrids = (_a = this.gridOptionsService.get('alignedGrids')) !== null && _a !== void 0 ? _a : [];
    const isCallbackConfig = typeof alignedGrids === 'function';
    if (typeof alignedGrids === 'function') {
      alignedGrids = alignedGrids();
    }
    const seeUrl = () => `See ${this.getFrameworkOverrides().getDocLink('aligned-grids')}`;
    const apis = alignedGrids.map(alignedGrid => {
      var _a;
      if (!alignedGrid) {
        errorOnce(`alignedGrids contains an undefined option.`);
        if (!isCallbackConfig) {
          errorOnce(`You may want to configure via a callback to avoid setup race conditions:
                     "alignedGrids: () => [linkedGrid]"`);
        }
        errorOnce(seeUrl());
        return;
      }
      if (alignedGrid instanceof GridApi) {
        return alignedGrid;
      }
      const refOrComp = alignedGrid;
      if ('current' in refOrComp) {
        return (_a = refOrComp.current) === null || _a === void 0 ? void 0 : _a.api;
      } else {
        if (!refOrComp.api) {
          errorOnce(`alignedGrids - No api found on the linked grid. If you are passing gridOptions to alignedGrids since v31 this is no longer valid. ${seeUrl()}`);
        }
        return refOrComp.api;
      }
    }).filter(api => !!api && !api.isDestroyed());
    return apis;
  }
  init() {
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_MOVED, this.fireColumnEvent.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VISIBLE, this.fireColumnEvent.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PINNED, this.fireColumnEvent.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_GROUP_OPENED, this.fireColumnEvent.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_RESIZED, this.fireColumnEvent.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_BODY_SCROLL, this.fireScrollEvent.bind(this));
  }
  fireEvent(callback) {
    if (this.consuming) {
      return;
    }
    this.getAlignedGridApis().forEach(api => {
      const alignedGridService = api.__getAlignedGridService();
      callback(alignedGridService);
    });
  }
  onEvent(callback) {
    this.consuming = true;
    callback();
    this.consuming = false;
  }
  fireColumnEvent(event) {
    this.fireEvent(alignedGridsService => {
      alignedGridsService.onColumnEvent(event);
    });
  }
  fireScrollEvent(event) {
    if (event.direction !== 'horizontal') {
      return;
    }
    this.fireEvent(alignedGridsService => {
      alignedGridsService.onScrollEvent(event);
    });
  }
  onScrollEvent(event) {
    this.onEvent(() => {
      const gridBodyCon = this.ctrlsService.getGridBodyCtrl();
      gridBodyCon.getScrollFeature().setHorizontalScrollPosition(event.left, true);
    });
  }
  getMasterColumns(event) {
    const result = [];
    if (event.columns) {
      event.columns.forEach(column => {
        result.push(column);
      });
    } else if (event.column) {
      result.push(event.column);
    }
    return result;
  }
  getColumnIds(event) {
    const result = [];
    if (event.columns) {
      event.columns.forEach(column => {
        result.push(column.getColId());
      });
    } else if (event.column) {
      result.push(event.column.getColId());
    }
    return result;
  }
  onColumnEvent(event) {
    this.onEvent(() => {
      switch (event.type) {
        case Events.EVENT_COLUMN_MOVED:
        case Events.EVENT_COLUMN_VISIBLE:
        case Events.EVENT_COLUMN_PINNED:
        case Events.EVENT_COLUMN_RESIZED:
          const colEvent = event;
          this.processColumnEvent(colEvent);
          break;
        case Events.EVENT_COLUMN_GROUP_OPENED:
          const groupOpenedEvent = event;
          this.processGroupOpenedEvent(groupOpenedEvent);
          break;
        case Events.EVENT_COLUMN_PIVOT_CHANGED:
          console.warn('ZING Grid: pivoting is not supported with aligned grids. ' + 'You can only use one of these features at a time in a grid.');
          break;
      }
    });
  }
  processGroupOpenedEvent(groupOpenedEvent) {
    groupOpenedEvent.columnGroups.forEach(masterGroup => {
      let otherColumnGroup = null;
      if (masterGroup) {
        const groupId = masterGroup.getGroupId();
        otherColumnGroup = this.columnModel.getProvidedColumnGroup(groupId);
      }
      if (masterGroup && !otherColumnGroup) {
        return;
      }
      this.logger.log('onColumnEvent-> processing ' + groupOpenedEvent + ' expanded = ' + masterGroup.isExpanded());
      this.columnModel.setColumnGroupOpened(otherColumnGroup, masterGroup.isExpanded(), "alignedGridChanged");
    });
  }
  processColumnEvent(colEvent) {
    var _a;
    const masterColumn = colEvent.column;
    let otherColumn = null;
    if (masterColumn) {
      otherColumn = this.columnModel.getPrimaryColumn(masterColumn.getColId());
    }
    if (masterColumn && !otherColumn) {
      return;
    }
    const masterColumns = this.getMasterColumns(colEvent);
    switch (colEvent.type) {
      case Events.EVENT_COLUMN_MOVED:
        {
          const movedEvent = colEvent;
          const srcColState = colEvent.api.getColumnState();
          const destColState = srcColState.map(s => ({
            colId: s.colId
          }));
          this.columnModel.applyColumnState({
            state: destColState,
            applyOrder: true
          }, "alignedGridChanged");
          this.logger.log(`onColumnEvent-> processing ${colEvent.type} toIndex = ${movedEvent.toIndex}`);
        }
        break;
      case Events.EVENT_COLUMN_VISIBLE:
        {
          const visibleEvent = colEvent;
          const srcColState = colEvent.api.getColumnState();
          const destColState = srcColState.map(s => ({
            colId: s.colId,
            hide: s.hide
          }));
          this.columnModel.applyColumnState({
            state: destColState
          }, "alignedGridChanged");
          this.logger.log(`onColumnEvent-> processing ${colEvent.type} visible = ${visibleEvent.visible}`);
        }
        break;
      case Events.EVENT_COLUMN_PINNED:
        {
          const pinnedEvent = colEvent;
          const srcColState = colEvent.api.getColumnState();
          const destColState = srcColState.map(s => ({
            colId: s.colId,
            pinned: s.pinned
          }));
          this.columnModel.applyColumnState({
            state: destColState
          }, "alignedGridChanged");
          this.logger.log(`onColumnEvent-> processing ${colEvent.type} pinned = ${pinnedEvent.pinned}`);
        }
        break;
      case Events.EVENT_COLUMN_RESIZED:
        const resizedEvent = colEvent;
        const columnWidths = {};
        masterColumns.forEach(column => {
          this.logger.log(`onColumnEvent-> processing ${colEvent.type} actualWidth = ${column.getActualWidth()}`);
          columnWidths[column.getId()] = {
            key: column.getColId(),
            newWidth: column.getActualWidth()
          };
        });
        (_a = resizedEvent.flexColumns) === null || _a === void 0 ? void 0 : _a.forEach(col => {
          if (columnWidths[col.getId()]) {
            delete columnWidths[col.getId()];
          }
        });
        this.columnModel.setColumnWidths(Object.values(columnWidths), false, resizedEvent.finished, "alignedGridChanged");
        break;
    }
    const gridBodyCon = this.ctrlsService.getGridBodyCtrl();
    const isVerticalScrollShowing = gridBodyCon.isVerticalScrollShowing();
    this.getAlignedGridApis().forEach(api => {
      api.setGridOption('alwaysShowVerticalScroll', isVerticalScrollShowing);
    });
  }
};
__decorate([Autowired('columnModel')], AlignedGridsService.prototype, "columnModel", void 0);
__decorate([Autowired('ctrlsService')], AlignedGridsService.prototype, "ctrlsService", void 0);
__decorate([__param(0, Qualifier('loggerFactory'))], AlignedGridsService.prototype, "setBeans", null);
__decorate([PostConstruct], AlignedGridsService.prototype, "init", null);
AlignedGridsService = __decorate([Bean('alignedGridsService')], AlignedGridsService);
export { AlignedGridsService };