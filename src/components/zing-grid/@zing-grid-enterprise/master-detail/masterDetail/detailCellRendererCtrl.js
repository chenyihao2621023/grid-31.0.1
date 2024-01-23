var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, BeanStub, Events, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class DetailCellRendererCtrl extends BeanStub {
  constructor() {
    super(...arguments);
    this.loadRowDataVersion = 0;
  }
  init(comp, params) {
    this.params = params;
    this.comp = comp;
    const doNothingBecauseInsidePinnedSection = params.pinned != null;
    if (doNothingBecauseInsidePinnedSection) {
      return;
    }
    this.setAutoHeightClasses();
    this.setupRefreshStrategy();
    this.addThemeToDetailGrid();
    this.createDetailGrid();
    this.loadRowData();
    this.addManagedListener(this.eventService, Events.EVENT_FULL_WIDTH_ROW_FOCUSED, this.onFullWidthRowFocused.bind(this));
  }
  onFullWidthRowFocused(e) {
    const params = this.params;
    const row = {
      rowIndex: params.node.rowIndex,
      rowPinned: params.node.rowPinned
    };
    const eventRow = {
      rowIndex: e.rowIndex,
      rowPinned: e.rowPinned
    };
    const isSameRow = this.rowPositionUtils.sameRow(row, eventRow);
    if (!isSameRow) {
      return;
    }
    this.focusService.focusInto(this.comp.getGui(), e.fromBelow);
  }
  setAutoHeightClasses() {
    const autoHeight = this.gridOptionsService.get('detailRowAutoHeight');
    const parentClass = autoHeight ? 'zing-details-row-auto-height' : 'zing-details-row-fixed-height';
    const detailClass = autoHeight ? 'zing-details-grid-auto-height' : 'zing-details-grid-fixed-height';
    this.comp.addOrRemoveCssClass(parentClass, true);
    this.comp.addOrRemoveDetailGridCssClass(detailClass, true);
  }
  setupRefreshStrategy() {
    const providedStrategy = this.params.refreshStrategy;
    const validSelection = providedStrategy == 'everything' || providedStrategy == 'nothing' || providedStrategy == 'rows';
    if (validSelection) {
      this.refreshStrategy = providedStrategy;
      return;
    }
    if (providedStrategy != null) {
      console.warn("ZING Grid: invalid cellRendererParams.refreshStrategy = '" + providedStrategy + "' supplied, defaulting to refreshStrategy = 'rows'.");
    }
    this.refreshStrategy = 'rows';
  }
  addThemeToDetailGrid() {
    const {
      theme
    } = this.environment.getTheme();
    if (theme) {
      this.comp.addOrRemoveDetailGridCssClass(theme, true);
    }
  }
  createDetailGrid() {
    if (_.missing(this.params.detailGridOptions)) {
      console.warn('ZING Grid: could not find detail grid options for master detail, ' + 'please set gridOptions.detailCellRendererParams.detailGridOptions');
      return;
    }
    const autoHeight = this.gridOptionsService.get('detailRowAutoHeight');
    const gridOptions = Object.assign({}, this.params.detailGridOptions);
    if (autoHeight) {
      gridOptions.domLayout = 'autoHeight';
    }
    this.comp.setDetailGrid(gridOptions);
  }
  registerDetailWithMaster(api, columnApi) {
    const rowId = this.params.node.id;
    const masterGridApi = this.params.api;
    const gridInfo = {
      id: rowId,
      api: api,
      columnApi: columnApi
    };
    const rowNode = this.params.node;
    masterGridApi.addDetailGridInfo(rowId, gridInfo);
    rowNode.detailGridInfo = gridInfo;
    this.addDestroyFunc(() => {
      if (rowNode.detailGridInfo !== gridInfo) {
        return;
      }
      masterGridApi.removeDetailGridInfo(rowId);
      rowNode.detailGridInfo = null;
    });
  }
  loadRowData() {
    this.loadRowDataVersion++;
    const versionThisCall = this.loadRowDataVersion;
    const userFunc = this.params.getDetailRowData;
    if (!userFunc) {
      console.warn('ZING Grid: could not find getDetailRowData for master / detail, ' + 'please set gridOptions.detailCellRendererParams.getDetailRowData');
      return;
    }
    const successCallback = rowData => {
      const mostRecentCall = this.loadRowDataVersion === versionThisCall;
      if (mostRecentCall) {
        this.comp.setRowData(rowData);
      }
    };
    const funcParams = {
      node: this.params.node,
      data: this.params.node.data,
      successCallback: successCallback,
      context: this.gridOptionsService.context
    };
    userFunc(funcParams);
  }
  refresh() {
    const GET_GRID_TO_REFRESH = false;
    const GET_GRID_TO_DO_NOTHING = true;
    switch (this.refreshStrategy) {
      case 'nothing':
        return GET_GRID_TO_DO_NOTHING;
      case 'everything':
        return GET_GRID_TO_REFRESH;
    }
    this.loadRowData();
    return GET_GRID_TO_DO_NOTHING;
  }
}
__decorate([Autowired('rowPositionUtils')], DetailCellRendererCtrl.prototype, "rowPositionUtils", void 0);
__decorate([Autowired('focusService')], DetailCellRendererCtrl.prototype, "focusService", void 0);