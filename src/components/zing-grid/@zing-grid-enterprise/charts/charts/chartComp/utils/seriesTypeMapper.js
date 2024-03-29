export const VALID_SERIES_TYPES = ['area', 'bar', 'column', 'histogram', 'line', 'pie', 'scatter', 'bubble'];
const horizontalChartTypes = new Set(['bar', 'groupedBar', 'stackedBar', 'normalizedBar']);
export function isHorizontal(chartType) {
  return horizontalChartTypes.has(chartType);
}
const stackedChartTypes = new Set(['stackedColumn', 'normalizedColumn', 'stackedBar', 'normalizedBar']);
export function isStacked(chartType) {
  return stackedChartTypes.has(chartType);
}
export function getSeriesType(chartType) {
  switch (chartType) {
    case 'bar':
    case 'groupedBar':
    case 'stackedBar':
    case 'normalizedBar':
      return 'bar';
    case 'column':
    case 'groupedColumn':
    case 'stackedColumn':
    case 'normalizedColumn':
      return 'bar';
    case 'line':
      return 'line';
    case 'area':
    case 'stackedArea':
    case 'normalizedArea':
      return 'area';
    case 'bubble':
      return 'bubble';
    case 'scatter':
      return 'scatter';
    case 'histogram':
      return 'histogram';
    case 'pie':
    case 'doughnut':
      return 'pie';
    default:
      return 'cartesian';
  }
}