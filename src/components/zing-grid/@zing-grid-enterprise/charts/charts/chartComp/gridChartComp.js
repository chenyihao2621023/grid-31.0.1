var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, ZingDialog, Autowired, CHART_TOOL_PANEL_MENU_OPTIONS, Component, Events, PostConstruct, RefSelector } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { ChartMenu } from "./menu/chartMenu";
import { TitleEdit } from "./chartTitle/titleEdit";
import { ChartController, DEFAULT_THEMES } from "./chartController";
import { ChartDataModel } from "./model/chartDataModel";
import { BarChartProxy } from "./chartProxies/cartesian/barChartProxy";
import { AreaChartProxy } from "./chartProxies/cartesian/areaChartProxy";
import { LineChartProxy } from "./chartProxies/cartesian/lineChartProxy";
import { PieChartProxy } from "./chartProxies/polar/pieChartProxy";
import { ScatterChartProxy } from "./chartProxies/cartesian/scatterChartProxy";
import { HistogramChartProxy } from "./chartProxies/cartesian/histogramChartProxy";
import { ChartOptionsService } from "./services/chartOptionsService";
import { ComboChartProxy } from "./chartProxies/combo/comboChartProxy";
export class GridChartComp extends Component {
  constructor(params) {
    super(GridChartComp.TEMPLATE);
    this.params = params;
  }
  init() {
    const modelParams = {
      chartId: this.params.chartId,
      pivotChart: this.params.pivotChart,
      chartType: this.params.chartType,
      chartThemeName: this.getThemeName(),
      aggFunc: this.params.aggFunc,
      cellRange: this.params.cellRange,
      suppressChartRanges: this.params.suppressChartRanges,
      unlinkChart: this.params.unlinkChart,
      crossFiltering: this.params.crossFiltering,
      seriesChartTypes: this.params.seriesChartTypes
    };
    const isRtl = this.gridOptionsService.get('enableRtl');
    this.addCssClass(isRtl ? 'zing-rtl' : 'zing-ltr');
    const model = this.createBean(new ChartDataModel(modelParams));
    this.chartController = this.createManagedBean(new ChartController(model));
    this.validateCustomThemes();
    this.createChart();
    if (this.params.insideDialog) {
      this.addDialog();
    }
    this.addMenu();
    this.addTitleEditComp();
    this.addManagedListener(this.getGui(), 'focusin', this.setActiveChartCellRange.bind(this));
    this.addManagedListener(this.chartController, ChartController.EVENT_CHART_MODEL_UPDATE, this.update.bind(this));
    this.addManagedPropertyListeners(['chartThemeOverrides', 'chartThemes'], this.reactivePropertyUpdate.bind(this));
    if (this.chartMenu) {
      this.addManagedListener(this.chartMenu, ChartMenu.EVENT_DOWNLOAD_CHART, () => this.downloadChart());
    }
    this.update();
    this.raiseChartCreatedEvent();
  }
  createChart() {
    let chartInstance = undefined;
    if (this.chartProxy) {
      chartInstance = this.chartProxy.destroy({
        keepChartInstance: true
      });
    }
    const crossFilterCallback = (event, reset) => {
      const ctx = this.params.crossFilteringContext;
      ctx.lastSelectedChartId = reset ? '' : this.chartController.getChartId();
      if (reset) {
        this.params.crossFilteringResetCallback();
      }
      this.crossFilterService.filter(event, reset);
    };
    const chartType = this.chartController.getChartType();
    const chartProxyParams = {
      chartType,
      chartInstance,
      getChartThemeName: this.getChartThemeName.bind(this),
      getChartThemes: this.getChartThemes.bind(this),
      customChartThemes: this.gridOptionsService.get('customChartThemes'),
      getGridOptionsChartThemeOverrides: () => this.getGridOptionsChartThemeOverrides(),
      getExtraPaddingDirections: () => {
        var _a, _b;
        return (_b = (_a = this.chartMenu) === null || _a === void 0 ? void 0 : _a.getExtraPaddingDirections()) !== null && _b !== void 0 ? _b : [];
      },
      apiChartThemeOverrides: this.params.chartThemeOverrides,
      crossFiltering: this.params.crossFiltering,
      crossFilterCallback,
      parentElement: this.eChart,
      grouping: this.chartController.isGrouping(),
      chartThemeToRestore: this.params.chartThemeName,
      chartOptionsToRestore: this.params.chartOptionsToRestore,
      chartPaletteToRestore: this.params.chartPaletteToRestore,
      seriesChartTypes: this.chartController.getSeriesChartTypes(),
      translate: (toTranslate, defaultText) => this.chartTranslationService.translate(toTranslate, defaultText)
    };
    this.params.chartOptionsToRestore = undefined;
    this.chartType = chartType;
    this.chartProxy = GridChartComp.createChartProxy(chartProxyParams);
    if (!this.chartProxy) {
      console.warn('ZING Grid: invalid chart type supplied: ', chartProxyParams.chartType);
      return;
    }
    const canvas = this.eChart.querySelector('canvas');
    if (canvas) {
      canvas.classList.add('zing-charts-canvas');
    }
    this.chartController.setChartProxy(this.chartProxy);
    this.chartOptionsService = this.createBean(new ChartOptionsService(this.chartController));
    this.titleEdit && this.titleEdit.refreshTitle(this.chartController, this.chartOptionsService);
  }
  getChartThemeName() {
    return this.chartController.getChartThemeName();
  }
  getChartThemes() {
    return this.chartController.getThemes();
  }
  getGridOptionsChartThemeOverrides() {
    return this.gridOptionsService.get('chartThemeOverrides');
  }
  static createChartProxy(chartProxyParams) {
    switch (chartProxyParams.chartType) {
      case 'column':
      case 'bar':
      case 'groupedColumn':
      case 'stackedColumn':
      case 'normalizedColumn':
      case 'groupedBar':
      case 'stackedBar':
      case 'normalizedBar':
        return new BarChartProxy(chartProxyParams);
      case 'pie':
      case 'doughnut':
        return new PieChartProxy(chartProxyParams);
      case 'area':
      case 'stackedArea':
      case 'normalizedArea':
        return new AreaChartProxy(chartProxyParams);
      case 'line':
        return new LineChartProxy(chartProxyParams);
      case 'scatter':
      case 'bubble':
        return new ScatterChartProxy(chartProxyParams);
      case 'histogram':
        return new HistogramChartProxy(chartProxyParams);
      case 'columnLineCombo':
      case 'areaColumnCombo':
      case 'customCombo':
        return new ComboChartProxy(chartProxyParams);
      default:
        throw `ZING Grid: Unable to create chart as an invalid chartType = '${chartProxyParams.chartType}' was supplied.`;
    }
  }
  addDialog() {
    const title = this.chartTranslationService.translate(this.params.pivotChart ? 'pivotChartTitle' : 'rangeChartTitle');
    const {
      width,
      height
    } = this.getBestDialogSize();
    this.chartDialog = new ZingDialog({
      resizable: true,
      movable: true,
      maximizable: true,
      title,
      width,
      height,
      component: this,
      centered: true,
      closable: true
    });
    this.getContext().createBean(this.chartDialog);
    this.chartDialog.addEventListener(ZingDialog.EVENT_DESTROYED, () => this.destroy());
  }
  getBestDialogSize() {
    const popupParent = this.popupService.getPopupParent();
    const maxWidth = _.getAbsoluteWidth(popupParent) * 0.75;
    const maxHeight = _.getAbsoluteHeight(popupParent) * 0.75;
    const ratio = 0.553;
    const chart = this.chartProxy.getChart();
    let width = this.params.insideDialog ? 850 : chart.width;
    let height = this.params.insideDialog ? 470 : chart.height;
    if (width > maxWidth || height > maxHeight) {
      width = Math.min(width, maxWidth);
      height = Math.round(width * ratio);
      if (height > maxHeight) {
        height = maxHeight;
        width = Math.min(width, Math.round(height / ratio));
      }
    }
    return {
      width,
      height
    };
  }
  addMenu() {
    if (!this.params.crossFiltering) {
      this.chartMenu = this.createBean(new ChartMenu(this.eChartContainer, this.eMenuContainer, this.chartController, this.chartOptionsService));
      this.eChartContainer.appendChild(this.chartMenu.getGui());
    }
  }
  addTitleEditComp() {
    this.titleEdit = this.createBean(new TitleEdit(this.chartMenu));
    this.eTitleEditContainer.appendChild(this.titleEdit.getGui());
    if (this.chartProxy) {
      this.titleEdit.refreshTitle(this.chartController, this.chartOptionsService);
    }
  }
  update(params) {
    if (params === null || params === void 0 ? void 0 : params.chartId) {
      const validUpdate = this.chartController.update(params);
      if (!validUpdate) {
        return;
      }
    }
    const chartTypeChanged = this.chartTypeChanged(params);
    if (chartTypeChanged) this.createChart();
    this.updateChart(params === null || params === void 0 ? void 0 : params.chartThemeOverrides);
    if (params === null || params === void 0 ? void 0 : params.chartId) {
      this.chartProxy.getChart().waitForUpdate().then(() => {
        this.chartController.raiseChartApiUpdateEvent();
      });
    }
  }
  updateChart(updatedOverrides) {
    const {
      chartProxy
    } = this;
    const selectedCols = this.chartController.getSelectedValueColState();
    const fields = selectedCols.map(c => ({
      colId: c.colId,
      displayName: c.displayName
    }));
    const data = this.chartController.getChartData();
    const chartEmpty = this.handleEmptyChart(data, fields);
    if (chartEmpty) {
      return;
    }
    let chartUpdateParams = this.chartController.getChartUpdateParams(updatedOverrides);
    chartProxy.update(chartUpdateParams);
    this.chartProxy.getChart().waitForUpdate().then(() => {
      this.chartController.raiseChartUpdatedEvent();
    });
    this.titleEdit.refreshTitle(this.chartController, this.chartOptionsService);
  }
  chartTypeChanged(updateParams) {
    const [currentType, updatedChartType] = [this.chartController.getChartType(), updateParams === null || updateParams === void 0 ? void 0 : updateParams.chartType];
    return this.chartType !== currentType || !!updatedChartType && this.chartType !== updatedChartType;
  }
  getChartModel() {
    return this.chartController.getChartModel();
  }
  getChartImageDataURL(fileFormat) {
    return this.chartProxy.getChartImageDataURL(fileFormat);
  }
  handleEmptyChart(data, fields) {
    const pivotModeDisabled = this.chartController.isPivotChart() && !this.chartController.isPivotMode();
    let minFieldsRequired = 1;
    if (this.chartController.isActiveXYChart()) {
      minFieldsRequired = this.chartController.getChartType() === 'bubble' ? 3 : 2;
    }
    const isEmptyChart = fields.length < minFieldsRequired || data.length === 0;
    if (this.eChart) {
      const isEmpty = pivotModeDisabled || isEmptyChart;
      _.setDisplayed(this.eChart, !isEmpty);
      _.setDisplayed(this.eEmpty, isEmpty);
    }
    if (pivotModeDisabled) {
      this.eEmpty.innerText = this.chartTranslationService.translate('pivotChartRequiresPivotMode');
      return true;
    }
    if (isEmptyChart) {
      this.eEmpty.innerText = this.chartTranslationService.translate('noDataToChart');
      return true;
    }
    return false;
  }
  downloadChart(dimensions, fileName, fileFormat) {
    this.chartProxy.downloadChart(dimensions, fileName, fileFormat);
  }
  openChartToolPanel(panel) {
    const menuPanel = panel ? CHART_TOOL_PANEL_MENU_OPTIONS[panel] : panel;
    this.chartMenu.showMenu(menuPanel);
  }
  closeChartToolPanel() {
    this.chartMenu.hideMenu();
  }
  getChartId() {
    return this.chartController.getChartId();
  }
  getUnderlyingChart() {
    return this.chartProxy.getChartRef();
  }
  crossFilteringReset() {
    this.chartProxy.crossFilteringReset();
  }
  setActiveChartCellRange(focusEvent) {
    if (this.getGui().contains(focusEvent.relatedTarget)) {
      return;
    }
    this.chartController.setChartRange(true);
    this.gridApi.focusService.clearFocusedCell();
  }
  getThemeName() {
    const availableChartThemes = this.gridOptionsService.get('chartThemes') || DEFAULT_THEMES;
    if (availableChartThemes.length === 0) {
      throw new Error('Cannot create chart: no chart themes available.');
    }
    const {
      chartThemeName
    } = this.params;
    return _.includes(availableChartThemes, chartThemeName) ? chartThemeName : availableChartThemes[0];
  }
  validateCustomThemes() {
    const suppliedThemes = this.getChartThemes();
    const customChartThemes = this.gridOptionsService.get('customChartThemes');
    if (customChartThemes) {
      _.getAllKeysInObjects([customChartThemes]).forEach(customThemeName => {
        if (!_.includes(suppliedThemes, customThemeName)) {
          console.warn("ZING Grid: a custom chart theme with the name '" + customThemeName + "' has been " + "supplied but not added to the 'chartThemes' list");
        }
      });
    }
  }
  reactivePropertyUpdate() {
    this.chartController.setChartThemeName(this.getThemeName(), true);
    const chartId = this.getChartId();
    const modelType = this.chartController.isCrossFilterChart() ? 'crossFilter' : this.getChartModel().modelType;
    const chartThemeOverrides = this.gridOptionsService.get('chartThemeOverrides') || {};
    this.update({
      type: `${modelType}ChartUpdate`,
      chartId,
      chartThemeOverrides
    });
  }
  raiseChartCreatedEvent() {
    const event = {
      type: Events.EVENT_CHART_CREATED,
      chartId: this.chartController.getChartId()
    };
    this.chartProxy.getChart().waitForUpdate().then(() => {
      this.eventService.dispatchEvent(event);
    });
  }
  raiseChartDestroyedEvent() {
    const event = {
      type: Events.EVENT_CHART_DESTROYED,
      chartId: this.chartController.getChartId()
    };
    this.eventService.dispatchEvent(event);
  }
  destroy() {
    var _a;
    super.destroy();
    if (this.chartProxy) {
      this.chartProxy.destroy();
    }
    this.destroyBean(this.chartMenu);
    this.destroyBean(this.titleEdit);
    if (this.chartDialog && this.chartDialog.isAlive()) {
      this.destroyBean(this.chartDialog);
    }
    (_a = this.onDestroyColorSchemeChangeListener) === null || _a === void 0 ? void 0 : _a.call(this);
    const eGui = this.getGui();
    _.clearElement(eGui);
    _.removeFromParent(eGui);
    this.raiseChartDestroyedEvent();
  }
}
GridChartComp.TEMPLATE = `<div class="zing-chart" tabindex="-1">
            <div ref="eChartContainer" tabindex="-1" class="zing-chart-components-wrapper">
                <div ref="eChart" class="zing-chart-canvas-wrapper"></div>
                <div ref="eEmpty" class="zing-chart-empty-text zing-unselectable"></div>
            </div>
            <div ref="eTitleEditContainer"></div>
            <div ref="eMenuContainer" class="zing-chart-docked-container" style="min-width: 0px;"></div>
        </div>`;
__decorate([RefSelector('eChart')], GridChartComp.prototype, "eChart", void 0);
__decorate([RefSelector('eChartContainer')], GridChartComp.prototype, "eChartContainer", void 0);
__decorate([RefSelector('eMenuContainer')], GridChartComp.prototype, "eMenuContainer", void 0);
__decorate([RefSelector('eEmpty')], GridChartComp.prototype, "eEmpty", void 0);
__decorate([RefSelector('eTitleEditContainer')], GridChartComp.prototype, "eTitleEditContainer", void 0);
__decorate([Autowired('chartCrossFilterService')], GridChartComp.prototype, "crossFilterService", void 0);
__decorate([Autowired('chartTranslationService')], GridChartComp.prototype, "chartTranslationService", void 0);
__decorate([Autowired('gridApi')], GridChartComp.prototype, "gridApi", void 0);
__decorate([Autowired('popupService')], GridChartComp.prototype, "popupService", void 0);
__decorate([PostConstruct], GridChartComp.prototype, "init", null);