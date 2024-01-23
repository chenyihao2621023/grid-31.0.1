import { CARTESIAN_AXIS_POSITIONS, CARTESIAN_AXIS_TYPES } from '../../themes/constants';
import { DEFAULT_FONT_FAMILY, DEFAULT_INSIDE_SERIES_LABEL_COLOUR, DEFAULT_SHADOW_COLOUR, EXTENDS_SERIES_DEFAULTS, } from '../../themes/symbols';
import { HistogramSeries } from './histogramSeries';
export const HistogramSeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],
    identifier: 'histogram',
    instanceConstructor: HistogramSeries,
    seriesDefaults: {
        axes: [
            { type: CARTESIAN_AXIS_TYPES.NUMBER, position: CARTESIAN_AXIS_POSITIONS.BOTTOM },
            { type: CARTESIAN_AXIS_TYPES.NUMBER, position: CARTESIAN_AXIS_POSITIONS.LEFT },
        ],
    },
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS,
        strokeWidth: 1,
        fillOpacity: 1,
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
        label: {
            enabled: false,
            fontStyle: undefined,
            fontWeight: undefined,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
            formatter: undefined,
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
    },
    paletteFactory: ({ takeColors }) => {
        const { fills: [fill], strokes: [stroke], } = takeColors(1);
        return { fill, stroke };
    },
};
