import { markerPaletteFactory } from '../../../util/theme';
import { CARTESIAN_AXIS_POSITIONS, CARTESIAN_AXIS_TYPES } from '../../themes/constants';
import { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, EXTENDS_CARTESIAN_MARKER_DEFAULTS, EXTENDS_SERIES_DEFAULTS } from '../../themes/symbols';
import { BubbleSeries } from './bubbleSeries';
export const BubbleSeriesModule = {
  type: 'series',
  optionsKey: 'series[]',
  packageType: 'community',
  chartTypes: ['cartesian'],
  identifier: 'bubble',
  instanceConstructor: BubbleSeries,
  seriesDefaults: {
    axes: [{
      type: CARTESIAN_AXIS_TYPES.NUMBER,
      position: CARTESIAN_AXIS_POSITIONS.BOTTOM
    }, {
      type: CARTESIAN_AXIS_TYPES.NUMBER,
      position: CARTESIAN_AXIS_POSITIONS.LEFT
    }]
  },
  themeTemplate: {
    __extends__: EXTENDS_SERIES_DEFAULTS,
    tooltip: {
      position: {
        type: 'node'
      }
    },
    marker: {
      __extends__: EXTENDS_CARTESIAN_MARKER_DEFAULTS,
      maxSize: 30,
      fillOpacity: 0.8
    },
    label: {
      enabled: false,
      fontStyle: undefined,
      fontWeight: undefined,
      fontSize: 12,
      fontFamily: DEFAULT_FONT_FAMILY,
      color: DEFAULT_LABEL_COLOUR
    }
  },
  paletteFactory: markerPaletteFactory
};