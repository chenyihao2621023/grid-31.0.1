export { GridChartsModule } from "./gridChartsModule";
export * from './zingGridCoreExtension';
import { time, ZingChart } from "@/components/zing-grid/zing-charts-community/main.js";
// import { time, ZingEnterpriseCharts } from "zing-charts-enterprise";
export const zingCharts = {
    time,
    ZingChart
    // ZingChart: ZingEnterpriseCharts
};
