import { _Theme } from '@/components/zing-grid/zing-charts-community/main.js';
import { NIGHTINGALE_DEFAULTS } from './nightingaleDefaults';
import { NightingaleSeries } from './nightingaleSeries';
import { NIGHTINGALE_SERIES_THEME } from './nightingaleThemes';
export const NightingaleModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'nightingale',
    instanceConstructor: NightingaleSeries,
    seriesDefaults: NIGHTINGALE_DEFAULTS,
    themeTemplate: NIGHTINGALE_SERIES_THEME,
    paletteFactory: ({ takeColors, userPalette }) => {
        const { fills: [fill], strokes: [stroke], } = takeColors(1);
        return {
            fill,
            stroke: userPalette ? stroke : _Theme.DEFAULT_POLAR_SERIES_STROKE,
        };
    },
    stackable: true,
    groupable: true,
    stackedByDefault: true,
};
