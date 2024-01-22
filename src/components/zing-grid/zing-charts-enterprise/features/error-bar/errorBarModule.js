import { ZingErrorBarSupportedSeriesTypes } from '@/components/zing-grid/zing-charts-community/main.js';
import { ErrorBars } from './errorBar';
import { ERROR_BARS_THEME } from './errorBarTheme';
export const ErrorBarsModule = {
    type: 'series-option',
    identifier: 'error-bars',
    optionsKey: 'errorBar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    seriesTypes: ZingErrorBarSupportedSeriesTypes,
    instanceConstructor: ErrorBars,
    themeTemplate: ERROR_BARS_THEME,
};
//# sourceMappingURL=errorBarModule.js.map