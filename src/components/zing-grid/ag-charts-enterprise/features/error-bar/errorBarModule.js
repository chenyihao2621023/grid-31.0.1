import { AgErrorBarSupportedSeriesTypes } from '@/components/zing-grid/ag-charts-community/main.js';
import { ErrorBars } from './errorBar';
import { ERROR_BARS_THEME } from './errorBarTheme';
export const ErrorBarsModule = {
    type: 'series-option',
    identifier: 'error-bars',
    optionsKey: 'errorBar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    seriesTypes: AgErrorBarSupportedSeriesTypes,
    instanceConstructor: ErrorBars,
    themeTemplate: ERROR_BARS_THEME,
};
//# sourceMappingURL=errorBarModule.js.map