import { _Theme } from '@/components/zing-grid/zing-charts-community/main.js';
import { WATERFALL_DEFAULTS } from './waterfallDefaults';
import { WaterfallSeries } from './waterfallSeries';
import { WATERFALL_SERIES_THEME } from './waterfallThemes';
export const WaterfallModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'waterfall',
    instanceConstructor: WaterfallSeries,
    seriesDefaults: WATERFALL_DEFAULTS,
    themeTemplate: WATERFALL_SERIES_THEME,
    swapDefaultAxesCondition: ({ direction }) => direction === 'horizontal',
    paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        const { fills, strokes } = takeColors(colorsCount);
        return userPalette
            ? {
                item: {
                    positive: {
                        fill: fills[0],
                        stroke: strokes[0],
                    },
                    negative: {
                        fill: fills[1],
                        stroke: strokes[1],
                    },
                    total: {
                        fill: fills[2],
                        stroke: strokes[2],
                    },
                },
            }
            : {
                item: {
                    positive: properties.get(_Theme.DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS),
                    negative: properties.get(_Theme.DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS),
                    total: properties.get(_Theme.DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS),
                },
            };
    },
};
//# sourceMappingURL=waterfallModule.js.map