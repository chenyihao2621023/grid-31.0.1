var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub, PostConstruct } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class ComboChartModel extends BeanStub {
  constructor(chartDataModel) {
    var _a;
    super();
    this.suppressComboChartWarnings = false;
    this.chartDataModel = chartDataModel;
    this.seriesChartTypes = (_a = chartDataModel.params.seriesChartTypes) !== null && _a !== void 0 ? _a : [];
  }
  init() {
    this.initComboCharts();
  }
  update(seriesChartTypes) {
    this.seriesChartTypes = seriesChartTypes !== null && seriesChartTypes !== void 0 ? seriesChartTypes : this.seriesChartTypes;
    this.initComboCharts();
    this.updateSeriesChartTypes();
  }
  initComboCharts() {
    const seriesChartTypesExist = this.seriesChartTypes && this.seriesChartTypes.length > 0;
    const customCombo = this.chartDataModel.chartType === 'customCombo' || seriesChartTypesExist;
    if (customCombo) {
      this.chartDataModel.chartType = 'customCombo';
      this.savedCustomSeriesChartTypes = this.seriesChartTypes || [];
    }
  }
  updateSeriesChartTypes() {
    if (!this.chartDataModel.isComboChart()) {
      return;
    }
    this.seriesChartTypes = this.seriesChartTypes.map(seriesChartType => {
      const primaryOnly = ['groupedColumn', 'stackedColumn', 'stackedArea'].includes(seriesChartType.chartType);
      seriesChartType.secondaryAxis = primaryOnly ? false : seriesChartType.secondaryAxis;
      return seriesChartType;
    });
    if (this.chartDataModel.chartType === 'customCombo') {
      this.updateSeriesChartTypesForCustomCombo();
      return;
    }
    this.updateChartSeriesTypesForBuiltInCombos();
  }
  updateSeriesChartTypesForCustomCombo() {
    const seriesChartTypesSupplied = this.seriesChartTypes && this.seriesChartTypes.length > 0;
    if (!seriesChartTypesSupplied && !this.suppressComboChartWarnings) {
      console.warn(`ZING Grid: 'seriesChartTypes' are required when the 'customCombo' chart type is specified.`);
    }
    this.seriesChartTypes = this.seriesChartTypes.map(s => {
      if (!ComboChartModel.SUPPORTED_COMBO_CHART_TYPES.includes(s.chartType)) {
        console.warn(`ZING Grid: invalid chartType '${s.chartType}' supplied in 'seriesChartTypes', converting to 'line' instead.`);
        s.chartType = 'line';
      }
      return s;
    });
    const getSeriesChartType = valueCol => {
      if (!this.savedCustomSeriesChartTypes || this.savedCustomSeriesChartTypes.length === 0) {
        this.savedCustomSeriesChartTypes = this.seriesChartTypes;
      }
      const providedSeriesChartType = this.savedCustomSeriesChartTypes.find(s => s.colId === valueCol.colId);
      if (!providedSeriesChartType) {
        if (valueCol.selected && !this.suppressComboChartWarnings) {
          console.warn(`ZING Grid: no 'seriesChartType' found for colId = '${valueCol.colId}', defaulting to 'line'.`);
        }
        return {
          colId: valueCol.colId,
          chartType: 'line',
          secondaryAxis: false
        };
      }
      return providedSeriesChartType;
    };
    const updatedSeriesChartTypes = this.chartDataModel.valueColState.map(getSeriesChartType);
    this.seriesChartTypes = updatedSeriesChartTypes;
    this.savedCustomSeriesChartTypes = updatedSeriesChartTypes;
    this.suppressComboChartWarnings = true;
  }
  updateChartSeriesTypesForBuiltInCombos() {
    const {
      chartType,
      valueColState
    } = this.chartDataModel;
    let primaryChartType = chartType === 'columnLineCombo' ? 'groupedColumn' : 'stackedArea';
    let secondaryChartType = chartType === 'columnLineCombo' ? 'line' : 'groupedColumn';
    const selectedCols = valueColState.filter(cs => cs.selected);
    const lineIndex = Math.ceil(selectedCols.length / 2);
    this.seriesChartTypes = selectedCols.map((valueCol, i) => {
      const seriesType = i >= lineIndex ? secondaryChartType : primaryChartType;
      return {
        colId: valueCol.colId,
        chartType: seriesType,
        secondaryAxis: false
      };
    });
  }
}
ComboChartModel.SUPPORTED_COMBO_CHART_TYPES = ['line', 'groupedColumn', 'stackedColumn', 'area', 'stackedArea'];
__decorate([PostConstruct], ComboChartModel.prototype, "init", null);