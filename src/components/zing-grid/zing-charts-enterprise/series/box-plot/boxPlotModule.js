import { _Theme, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { BOX_PLOT_SERIES_DEFAULTS } from './boxPlotDefaults';
import { BoxPlotSeries } from './boxPlotSeries';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';
export const BoxPlotModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'box-plot',
    instanceConstructor: BoxPlotSeries,
    seriesDefaults: BOX_PLOT_SERIES_DEFAULTS,
    themeTemplate: BOX_PLOT_SERIES_THEME,
    groupable: true,
    paletteFactory: ({ takeColors, userPalette, themeTemplateParameters }) => {
        var _a;
        const themeBackgroundColor = themeTemplateParameters.properties.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill = (_a = (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor)) !== null && _a !== void 0 ? _a : 'white';
        const { fills: [fill], strokes: [stroke], } = takeColors(1);
        return {
            fill: userPalette ? fill : _Util.Color.interpolate(fill, backgroundFill)(0.7),
            stroke,
        };
    },
    swapDefaultAxesCondition({ direction }) {
        return direction === 'horizontal';
    },
};
//# sourceMappingURL=boxPlotModule.js.map