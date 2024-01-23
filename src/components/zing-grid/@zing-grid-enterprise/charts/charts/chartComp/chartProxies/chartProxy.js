import { _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { _Theme, ZingCharts } from "@/components/zing-grid/zing-charts-community/main.js";
import { getSeriesType } from "../utils/seriesTypeMapper";
import { deproxy } from "../utils/integration";
import { createZingChartTheme, lookupCustomChartTheme } from './chartTheme';
export class ChartProxy {
  constructor(chartProxyParams) {
    this.chartProxyParams = chartProxyParams;
    this.clearThemeOverrides = false;
    this.chart = chartProxyParams.chartInstance;
    this.chartType = chartProxyParams.chartType;
    this.crossFiltering = chartProxyParams.crossFiltering;
    this.crossFilterCallback = chartProxyParams.crossFilterCallback;
    this.standaloneChartType = getSeriesType(this.chartType);
    if (this.chart == null) {
      this.chart = ZingCharts.create(this.getCommonChartOptions());
    } else {
      this.clearThemeOverrides = true;
    }
  }
  getChart() {
    return deproxy(this.chart);
  }
  getChartRef() {
    return this.chart;
  }
  downloadChart(dimensions, fileName, fileFormat) {
    const {
      chart
    } = this;
    const rawChart = deproxy(chart);
    const imageFileName = fileName || (rawChart.title ? rawChart.title.text : 'chart');
    const {
      width,
      height
    } = dimensions || {};
    ZingCharts.download(chart, {
      width,
      height,
      fileName: imageFileName,
      fileFormat
    });
  }
  getChartImageDataURL(type) {
    return this.getChart().scene.getDataURL(type);
  }
  getChartOptions() {
    return this.chart.getOptions();
  }
  getChartThemeOverrides() {
    var _a;
    const chartOptionsTheme = this.getChartOptions().theme;
    return (_a = chartOptionsTheme.overrides) !== null && _a !== void 0 ? _a : {};
  }
  getChartPalette() {
    return _Theme.getChartTheme(this.getChartOptions().theme).palette;
  }
  setPaired(paired) {
    const seriesType = getSeriesType(this.chartProxyParams.chartType);
    ZingCharts.updateDelta(this.chart, {
      theme: {
        overrides: {
          [seriesType]: {
            paired
          }
        }
      }
    });
  }
  isPaired() {
    const seriesType = getSeriesType(this.chartProxyParams.chartType);
    return _.get(this.getChartThemeOverrides(), `${seriesType}.paired`, true);
  }
  lookupCustomChartTheme(themeName) {
    return lookupCustomChartTheme(this.chartProxyParams, themeName);
  }
  transformData(data, categoryKey, categoryAxis) {
    if (categoryAxis) {
      return data.map((d, index) => {
        const value = d[categoryKey];
        const valueString = value && value.toString ? value.toString() : '';
        const datum = Object.assign({}, d);
        datum[categoryKey] = {
          id: index,
          value,
          toString: () => valueString
        };
        return datum;
      });
    }
    return data;
  }
  getCommonChartOptions(updatedOverrides) {
    var _a, _b;
    const existingOptions = this.clearThemeOverrides ? {} : (_b = (_a = this.chart) === null || _a === void 0 ? void 0 : _a.getOptions()) !== null && _b !== void 0 ? _b : {};
    const formattingPanelOverrides = this.chart != null ? {
      overrides: this.getActiveFormattingPanelOverrides()
    } : {};
    this.clearThemeOverrides = false;
    return Object.assign(Object.assign({}, existingOptions), {
      theme: Object.assign(Object.assign({}, createZingChartTheme(this.chartProxyParams, this)), updatedOverrides ? {
        overrides: updatedOverrides
      } : formattingPanelOverrides),
      container: this.chartProxyParams.parentElement,
      mode: 'integrated'
    });
  }
  getActiveFormattingPanelOverrides() {
    var _a, _b;
    if (this.clearThemeOverrides) {
      return {};
    }
    const inUseTheme = (_a = this.chart) === null || _a === void 0 ? void 0 : _a.getOptions().theme;
    return (_b = inUseTheme === null || inUseTheme === void 0 ? void 0 : inUseTheme.overrides) !== null && _b !== void 0 ? _b : {};
  }
  destroy({
    keepChartInstance = false
  } = {}) {
    if (keepChartInstance) {
      return this.chart;
    }
    this.destroyChart();
  }
  destroyChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }
}