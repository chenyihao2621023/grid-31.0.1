import { _Theme, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { BULLET_DEFAULTS } from './bulletDefaults';
import { BulletSeries } from './bulletSeries';
import { BulletColorRange } from './bulletSeriesProperties';
import { BULLET_SERIES_THEME } from './bulletThemes';
const { CARTESIAN_AXIS_POSITIONS } = _Theme;
export const BulletModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    solo: true,
    optionConstructors: { 'series[].colorRanges': BulletColorRange },
    instanceConstructor: BulletSeries,
    seriesDefaults: BULLET_DEFAULTS,
    themeTemplate: BULLET_SERIES_THEME,
    customDefaultsFunction: (series) => {
        var _a;
        const axis0 = Object.assign({}, BULLET_DEFAULTS.axes[0]);
        const axis1 = Object.assign({}, BULLET_DEFAULTS.axes[1]);
        if (series.direction === 'horizontal') {
            axis0.position = CARTESIAN_AXIS_POSITIONS.BOTTOM;
            axis1.position = CARTESIAN_AXIS_POSITIONS.LEFT;
        }
        if (((_a = series.scale) === null || _a === void 0 ? void 0 : _a.max) !== undefined) {
            axis0.max = series.scale.max;
        }
        return Object.assign(Object.assign({}, BULLET_DEFAULTS), { axes: [axis0, axis1] });
    },
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        var _a;
        const { properties } = themeTemplateParameters;
        const { fills: [fill], strokes: [stroke], } = takeColors(colorsCount);
        const themeBackgroundColor = themeTemplateParameters.properties.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill = (_a = (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor)) !== null && _a !== void 0 ? _a : 'white';
        const targetStroke = properties.get(_Theme.DEFAULT_CROSS_LINES_COLOUR);
        const colorRangeColor = _Util.Color.interpolate(fill, backgroundFill)(0.7);
        return {
            fill,
            stroke,
            target: { stroke: targetStroke },
            colorRanges: [{ color: colorRangeColor }],
        };
    },
};
