var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, BeanStub, Optional, PreDestroy } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { VERSION as CHARTS_VERSION } from "@/components/zing-grid/zing-charts-community/main.js";
import { GridChartComp } from "./chartComp/gridChartComp";
import { upgradeChartModel } from "./chartModelMigration";
import { VERSION as GRID_VERSION } from "../version";
let ChartService = class ChartService extends BeanStub {
  constructor() {
    super(...arguments);
    this.activeCharts = new Set();
    this.activeChartComps = new Set();
    this.crossFilteringContext = {
      lastSelectedChartId: ''
    };
  }
  updateChart(params) {
    if (this.activeChartComps.size === 0) {
      console.warn(`ZING Grid - No active charts to update.`);
      return;
    }
    const chartComp = [...this.activeChartComps].find(chartComp => chartComp.getChartId() === params.chartId);
    if (!chartComp) {
      console.warn(`ZING Grid - Unable to update chart. No active chart found with ID: ${params.chartId}.`);
      return;
    }
    chartComp.update(params);
  }
  getChartModels() {
    const models = [];
    const versionedModel = c => {
      return Object.assign(Object.assign({}, c), {
        version: GRID_VERSION
      });
    };
    this.activeChartComps.forEach(c => models.push(versionedModel(c.getChartModel())));
    return models;
  }
  getChartRef(chartId) {
    let chartRef;
    this.activeCharts.forEach(cr => {
      if (cr.chartId === chartId) {
        chartRef = cr;
      }
    });
    return chartRef;
  }
  getChartComp(chartId) {
    let chartComp;
    this.activeChartComps.forEach(comp => {
      if (comp.getChartId() === chartId) {
        chartComp = comp;
      }
    });
    return chartComp;
  }
  getChartImageDataURL(params) {
    let url;
    this.activeChartComps.forEach(c => {
      if (c.getChartId() === params.chartId) {
        url = c.getChartImageDataURL(params.fileFormat);
      }
    });
    return url;
  }
  downloadChart(params) {
    const chartComp = Array.from(this.activeChartComps).find(c => c.getChartId() === params.chartId);
    chartComp === null || chartComp === void 0 ? void 0 : chartComp.downloadChart(params.dimensions, params.fileName, params.fileFormat);
  }
  openChartToolPanel(params) {
    const chartComp = Array.from(this.activeChartComps).find(c => c.getChartId() === params.chartId);
    chartComp === null || chartComp === void 0 ? void 0 : chartComp.openChartToolPanel(params.panel);
  }
  closeChartToolPanel(chartId) {
    const chartComp = Array.from(this.activeChartComps).find(c => c.getChartId() === chartId);
    chartComp === null || chartComp === void 0 ? void 0 : chartComp.closeChartToolPanel();
  }
  createChartFromCurrentRange(chartType = 'groupedColumn') {
    const selectedRange = this.getSelectedRange();
    return this.createChart(selectedRange, chartType);
  }
  restoreChart(model, chartContainer) {
    if (!model) {
      console.warn("ZING Grid - unable to restore chart as no chart model is provided");
      return;
    }
    if (model.version !== GRID_VERSION) {
      model = upgradeChartModel(model);
    }
    const params = {
      cellRange: model.cellRange,
      chartType: model.chartType,
      chartThemeName: model.chartThemeName,
      chartContainer: chartContainer,
      suppressChartRanges: model.suppressChartRanges,
      aggFunc: model.aggFunc,
      unlinkChart: model.unlinkChart,
      seriesChartTypes: model.seriesChartTypes
    };
    const getCellRange = cellRangeParams => {
      return this.rangeService ? this.rangeService.createCellRangeFromCellRangeParams(cellRangeParams) : undefined;
    };
    if (model.modelType === 'pivot') {
      this.gridOptionsService.updateGridOptions({
        options: {
          pivotMode: true
        },
        source: 'pivotChart'
      });
      const columns = this.columnModel.getAllDisplayedColumns().map(col => col.getColId());
      const chartAllRangeParams = {
        rowStartIndex: null,
        rowStartPinned: undefined,
        rowEndIndex: null,
        rowEndPinned: undefined,
        columns
      };
      const cellRange = getCellRange(chartAllRangeParams);
      if (!cellRange) {
        console.warn("ZING Grid - unable to create chart as there are no columns in the grid.");
        return;
      }
      return this.createChart(cellRange, params.chartType, params.chartThemeName, true, true, params.chartContainer, undefined, undefined, params.unlinkChart, false, model.chartOptions);
    }
    const cellRange = getCellRange(params.cellRange);
    if (!cellRange) {
      console.warn("ZING Grid - unable to create chart as no range is selected");
      return;
    }
    return this.createChart(cellRange, params.chartType, params.chartThemeName, false, params.suppressChartRanges, params.chartContainer, params.aggFunc, undefined, params.unlinkChart, false, model.chartOptions, model.chartPalette, params.seriesChartTypes);
  }
  createRangeChart(params) {
    var _a;
    const cellRange = (_a = this.rangeService) === null || _a === void 0 ? void 0 : _a.createCellRangeFromCellRangeParams(params.cellRange);
    if (!cellRange) {
      console.warn("ZING Grid - unable to create chart as no range is selected");
      return;
    }
    return this.createChart(cellRange, params.chartType, params.chartThemeName, false, params.suppressChartRanges, params.chartContainer, params.aggFunc, params.chartThemeOverrides, params.unlinkChart, undefined, undefined, undefined, params.seriesChartTypes);
  }
  createPivotChart(params) {
    this.gridOptionsService.updateGridOptions({
      options: {
        pivotMode: true
      },
      source: 'pivotChart'
    });
    const chartAllRangeParams = {
      rowStartIndex: null,
      rowStartPinned: undefined,
      rowEndIndex: null,
      rowEndPinned: undefined,
      columns: this.columnModel.getAllDisplayedColumns().map(col => col.getColId())
    };
    const cellRange = this.rangeService ? this.rangeService.createCellRangeFromCellRangeParams(chartAllRangeParams) : undefined;
    if (!cellRange) {
      console.warn("ZING Grid - unable to create chart as there are no columns in the grid.");
      return;
    }
    return this.createChart(cellRange, params.chartType, params.chartThemeName, true, true, params.chartContainer, undefined, params.chartThemeOverrides, params.unlinkChart);
  }
  createCrossFilterChart(params) {
    var _a;
    const cellRange = (_a = this.rangeService) === null || _a === void 0 ? void 0 : _a.createCellRangeFromCellRangeParams(params.cellRange);
    if (!cellRange) {
      console.warn("ZING Grid - unable to create chart as no range is selected");
      return;
    }
    const crossFiltering = true;
    const suppressChartRangesSupplied = typeof params.suppressChartRanges !== 'undefined' && params.suppressChartRanges !== null;
    const suppressChartRanges = suppressChartRangesSupplied ? params.suppressChartRanges : true;
    return this.createChart(cellRange, params.chartType, params.chartThemeName, false, suppressChartRanges, params.chartContainer, params.aggFunc, params.chartThemeOverrides, params.unlinkChart, crossFiltering);
  }
  createChart(cellRange, chartType, chartThemeName, pivotChart = false, suppressChartRanges = false, container, aggFunc, chartThemeOverrides, unlinkChart = false, crossFiltering = false, chartOptionsToRestore, chartPaletteToRestore, seriesChartTypes) {
    const createChartContainerFunc = this.gridOptionsService.getCallback('createChartContainer');
    const params = {
      chartId: this.generateId(),
      pivotChart,
      cellRange,
      chartType,
      chartThemeName,
      insideDialog: !(container || createChartContainerFunc),
      suppressChartRanges,
      aggFunc,
      chartThemeOverrides,
      unlinkChart,
      crossFiltering,
      crossFilteringContext: this.crossFilteringContext,
      chartOptionsToRestore,
      chartPaletteToRestore,
      seriesChartTypes,
      crossFilteringResetCallback: () => this.activeChartComps.forEach(c => c.crossFilteringReset())
    };
    const chartComp = new GridChartComp(params);
    this.context.createBean(chartComp);
    const chartRef = this.createChartRef(chartComp);
    if (container) {
      container.appendChild(chartComp.getGui());
      const theme = this.environment.getTheme();
      if (theme.el && !theme.el.contains(container)) {
        container.classList.add(theme.theme);
      }
    } else if (createChartContainerFunc) {
      createChartContainerFunc(chartRef);
    } else {
      chartComp.addEventListener(GridChartComp.EVENT_DESTROYED, () => {
        this.activeChartComps.delete(chartComp);
        this.activeCharts.delete(chartRef);
      });
    }
    return chartRef;
  }
  createChartRef(chartComp) {
    const chartRef = {
      destroyChart: () => {
        if (this.activeCharts.has(chartRef)) {
          this.context.destroyBean(chartComp);
          this.activeChartComps.delete(chartComp);
          this.activeCharts.delete(chartRef);
        }
      },
      chartElement: chartComp.getGui(),
      chart: chartComp.getUnderlyingChart(),
      chartId: chartComp.getChartModel().chartId
    };
    this.activeCharts.add(chartRef);
    this.activeChartComps.add(chartComp);
    return chartRef;
  }
  getSelectedRange() {
    const ranges = this.rangeService.getCellRanges();
    return ranges.length > 0 ? ranges[0] : {};
  }
  generateId() {
    return `id-${Math.random().toString(36).substring(2, 18)}`;
  }
  destroyAllActiveCharts() {
    this.activeCharts.forEach(chart => chart.destroyChart());
  }
};
ChartService.CHARTS_VERSION = CHARTS_VERSION;
__decorate([Optional('rangeService')], ChartService.prototype, "rangeService", void 0);
__decorate([Autowired('columnModel')], ChartService.prototype, "columnModel", void 0);
__decorate([PreDestroy], ChartService.prototype, "destroyAllActiveCharts", null);
ChartService = __decorate([Bean('chartService')], ChartService);
export { ChartService };