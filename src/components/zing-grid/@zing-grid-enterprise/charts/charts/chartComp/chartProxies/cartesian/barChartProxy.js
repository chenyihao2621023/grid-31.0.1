import { _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { CartesianChartProxy } from "./cartesianChartProxy";
import { deepMerge } from "../../utils/object";
import { hexToRGBA } from "../../utils/color";
import { isHorizontal, isStacked } from "../../utils/seriesTypeMapper";
export class BarChartProxy extends CartesianChartProxy {
  constructor(params) {
    super(params);
  }
  getAxes(params) {
    const axes = [{
      type: this.getXAxisType(params),
      position: isHorizontal(this.chartType) ? 'left' : 'bottom'
    }, {
      type: 'number',
      position: isHorizontal(this.chartType) ? 'bottom' : 'left'
    }];
    if (this.isNormalised()) {
      const numberAxis = axes[1];
      numberAxis.label = Object.assign(Object.assign({}, numberAxis.label), {
        formatter: params => Math.round(params.value) + '%'
      });
    }
    return axes;
  }
  getSeries(params) {
    const series = params.fields.map(f => ({
      type: this.standaloneChartType,
      direction: isHorizontal(this.chartType) ? 'horizontal' : 'vertical',
      stacked: this.crossFiltering || isStacked(this.chartType),
      normalizedTo: this.isNormalised() ? 100 : undefined,
      xKey: params.category.id,
      xName: params.category.name,
      yKey: f.colId,
      yName: f.displayName
    }));
    return this.crossFiltering ? this.extractCrossFilterSeries(series) : series;
  }
  extractCrossFilterSeries(series) {
    const palette = this.getChartPalette();
    const updatePrimarySeries = (seriesOptions, index) => {
      return Object.assign(Object.assign({}, seriesOptions), {
        highlightStyle: {
          item: {
            fill: undefined
          }
        },
        fill: palette === null || palette === void 0 ? void 0 : palette.fills[index],
        stroke: palette === null || palette === void 0 ? void 0 : palette.strokes[index],
        listeners: {
          nodeClick: this.crossFilterCallback
        }
      });
    };
    const updateFilteredOutSeries = seriesOptions => {
      const yKey = seriesOptions.yKey + '-filtered-out';
      return Object.assign(Object.assign({}, deepMerge({}, seriesOptions)), {
        yKey,
        fill: hexToRGBA(seriesOptions.fill, '0.3'),
        stroke: hexToRGBA(seriesOptions.stroke, '0.3'),
        showInLegend: false
      });
    };
    const allSeries = [];
    for (let i = 0; i < series.length; i++) {
      const primarySeries = updatePrimarySeries(series[i], i);
      allSeries.push(primarySeries);
      allSeries.push(updateFilteredOutSeries(primarySeries));
    }
    return allSeries;
  }
  isNormalised() {
    const normalisedCharts = ['normalizedColumn', 'normalizedBar'];
    return !this.crossFiltering && _.includes(normalisedCharts, this.chartType);
  }
}