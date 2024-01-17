import { _Theme } from '@/components/zing-grid/ag-charts-community/main.js';
import { HEATMAP_DEFAULTS } from './heatmapDefaults';
import { HeatmapSeries } from './heatmapSeries';
import { HEATMAP_SERIES_THEME } from './heatmapThemes';
export const HeatmapModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'heatmap',
    instanceConstructor: HeatmapSeries,
    seriesDefaults: HEATMAP_DEFAULTS,
    themeTemplate: HEATMAP_SERIES_THEME,
    paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
        var _a;
        const { properties } = themeTemplateParameters;
        const defaultColorRange = properties.get(_Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
        const defaultBackgroundColor = properties.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill = (_a = (Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor)) !== null && _a !== void 0 ? _a : 'white';
        const { fills, strokes } = takeColors(colorsCount);
        return {
            stroke: userPalette ? strokes[0] : backgroundFill,
            colorRange: userPalette ? [fills[0], fills[1]] : defaultColorRange,
        };
    },
};
//# sourceMappingURL=heatmapModule.js.map