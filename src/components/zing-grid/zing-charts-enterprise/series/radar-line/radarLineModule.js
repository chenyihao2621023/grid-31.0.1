import { POLAR_DEFAULTS } from '../polarDefaults';
import { RadarLineSeries } from './radarLineSeries';
import { RADAR_LINE_SERIES_THEME } from './radarLineThemes';
export const RadarLineModule = {
  type: 'series',
  optionsKey: 'series[]',
  packageType: 'enterprise',
  chartTypes: ['polar'],
  identifier: 'radar-line',
  instanceConstructor: RadarLineSeries,
  seriesDefaults: POLAR_DEFAULTS,
  themeTemplate: RADAR_LINE_SERIES_THEME,
  paletteFactory: ({
    takeColors
  }) => {
    const {
      fills: [fill],
      strokes: [stroke]
    } = takeColors(1);
    return {
      stroke: fill,
      marker: {
        fill,
        stroke
      }
    };
  }
};