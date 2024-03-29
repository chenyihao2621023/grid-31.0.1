import { _Theme } from '@/components/zing-grid/zing-charts-community/main.js';
import { SunburstSeries } from './sunburstSeries';
const {
  EXTENDS_SERIES_DEFAULTS,
  DEFAULT_INSIDE_SERIES_LABEL_COLOUR
} = _Theme;
export const SunburstSeriesModule = {
  type: 'series',
  optionsKey: 'series[]',
  packageType: 'enterprise',
  chartTypes: ['hierarchy'],
  identifier: 'sunburst',
  instanceConstructor: SunburstSeries,
  seriesDefaults: {
    gradientLegend: {
      enabled: true
    }
  },
  solo: true,
  themeTemplate: {
    __extends__: EXTENDS_SERIES_DEFAULTS,
    label: {
      fontSize: 14,
      minimumFontSize: 9,
      color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
      overflowStrategy: 'ellipsis',
      wrapping: 'never',
      spacing: 2
    },
    secondaryLabel: {
      fontSize: 8,
      minimumFontSize: 7,
      color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
      overflowStrategy: 'ellipsis',
      wrapping: 'never'
    },
    sectorSpacing: 2,
    padding: 3,
    highlightStyle: {
      label: {
        color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR
      },
      secondaryLabel: {
        color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR
      },
      stroke: `rgba(0, 0, 0, 0.4)`,
      strokeWidth: 2
    }
  },
  paletteFactory: ({
    takeColors,
    colorsCount,
    themeTemplateParameters
  }) => {
    const {
      properties
    } = themeTemplateParameters;
    const {
      fills,
      strokes
    } = takeColors(colorsCount);
    const defaultColorRange = properties.get(_Theme.DEFAULT_DIVERGING_SERIES_COLOUR_RANGE);
    return {
      fills,
      strokes,
      colorRange: defaultColorRange
    };
  }
};