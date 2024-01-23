import { RADIAL_COLUMN_DEFAULTS } from './radialColumnDefaults';
import { RadialColumnSeries } from './radialColumnSeries';
import { RADIAL_COLUMN_SERIES_THEME } from './radialColumnThemes';
export const RadialColumnModule = {
  type: 'series',
  optionsKey: 'series[]',
  packageType: 'enterprise',
  chartTypes: ['polar'],
  identifier: 'radial-column',
  instanceConstructor: RadialColumnSeries,
  seriesDefaults: RADIAL_COLUMN_DEFAULTS,
  themeTemplate: RADIAL_COLUMN_SERIES_THEME,
  paletteFactory: ({
    takeColors
  }) => {
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      fill,
      stroke
    };
  },
  stackable: true,
  groupable: true
};