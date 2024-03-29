import { singleSeriesPaletteFactory } from '../../../util/theme';
import { CARTESIAN_AXIS_POSITIONS, CARTESIAN_AXIS_TYPES, FONT_WEIGHT } from '../../themes/constants';
import { DEFAULT_FONT_FAMILY, DEFAULT_INSIDE_SERIES_LABEL_COLOUR, DEFAULT_SHADOW_COLOUR, EXTENDS_SERIES_DEFAULTS } from '../../themes/symbols';
import { BarSeries } from './barSeries';
export const BarSeriesModule = {
  type: 'series',
  optionsKey: 'series[]',
  packageType: 'community',
  chartTypes: ['cartesian'],
  identifier: 'bar',
  instanceConstructor: BarSeries,
  stackable: true,
  groupable: true,
  seriesDefaults: {
    axes: [{
      type: CARTESIAN_AXIS_TYPES.NUMBER,
      position: CARTESIAN_AXIS_POSITIONS.LEFT
    }, {
      type: CARTESIAN_AXIS_TYPES.CATEGORY,
      position: CARTESIAN_AXIS_POSITIONS.BOTTOM
    }]
  },
  swapDefaultAxesCondition: series => (series === null || series === void 0 ? void 0 : series.direction) === 'horizontal',
  themeTemplate: {
    __extends__: EXTENDS_SERIES_DEFAULTS,
    fillOpacity: 1,
    strokeWidth: 0,
    lineDash: [0],
    lineDashOffset: 0,
    label: {
      enabled: false,
      fontStyle: undefined,
      fontWeight: FONT_WEIGHT.NORMAL,
      fontSize: 12,
      fontFamily: DEFAULT_FONT_FAMILY,
      color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
      formatter: undefined,
      placement: 'inside'
    },
    shadow: {
      enabled: false,
      color: DEFAULT_SHADOW_COLOUR,
      xOffset: 3,
      yOffset: 3,
      blur: 5
    }
  },
  enterpriseThemeTemplate: {
    errorBar: {
      cap: {
        lengthRatio: 0.3
      }
    }
  },
  paletteFactory: singleSeriesPaletteFactory
};