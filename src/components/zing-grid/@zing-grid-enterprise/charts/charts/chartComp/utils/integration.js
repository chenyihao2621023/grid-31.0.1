// import { _Scene, ZingCartesianAxisType, ZingChartInstance } from "zing-charts-enterprise";
export function deproxy(chartOrProxy) {
    if (chartOrProxy.chart != null) {
        return chartOrProxy.chart;
    }
    return chartOrProxy;
}
