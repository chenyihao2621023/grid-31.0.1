// import { _Scene, AgCartesianAxisType, AgChartInstance } from "zing-charts-enterprise";
export function deproxy(chartOrProxy) {
    if (chartOrProxy.chart != null) {
        return chartOrProxy.chart;
    }
    return chartOrProxy;
}
//# sourceMappingURL=integration.js.map