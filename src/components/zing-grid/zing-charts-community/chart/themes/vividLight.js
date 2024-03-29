import { ChartTheme } from './chartTheme';
import { DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE, DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS, DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS, DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS } from './symbols';
const VIVID_FILLS = {
  BLUE: '#0083ff',
  ORANGE: '#ff6600',
  GREEN: '#00af00',
  CYAN: '#00ccff',
  YELLOW: '#f7c700',
  VIOLET: '#ac26ff',
  GRAY: '#a7a7b7',
  MAGENTA: '#e800c5',
  BROWN: '#b54300',
  RED: '#ff0000'
};
const VIVID_STROKES = {
  BLUE: '#0f68c0',
  ORANGE: '#d47100',
  GREEN: '#007922',
  CYAN: '#009ac2',
  VIOLET: '#bca400',
  YELLOW: '#753cac',
  GRAY: '#646464',
  MAGENTA: '#9b2685',
  BROWN: '#6c3b00',
  RED: '#cb0021'
};
const palette = {
  fills: Array.from(Object.values(VIVID_FILLS)),
  strokes: Array.from(Object.values(VIVID_STROKES))
};
export class VividLight extends ChartTheme {
  static getWaterfallSeriesDefaultPositiveColors() {
    return {
      fill: VIVID_FILLS.BLUE,
      stroke: VIVID_STROKES.BLUE
    };
  }
  static getWaterfallSeriesDefaultNegativeColors() {
    return {
      fill: VIVID_FILLS.ORANGE,
      stroke: VIVID_STROKES.ORANGE
    };
  }
  static getWaterfallSeriesDefaultTotalColors() {
    return {
      fill: VIVID_FILLS.GRAY,
      stroke: VIVID_STROKES.GRAY
    };
  }
  getTemplateParameters() {
    const result = super.getTemplateParameters();
    result.properties.set(DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS, VividLight.getWaterfallSeriesDefaultPositiveColors());
    result.properties.set(DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS, VividLight.getWaterfallSeriesDefaultNegativeColors());
    result.properties.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, VividLight.getWaterfallSeriesDefaultTotalColors());
    result.properties.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [VIVID_FILLS.ORANGE, VIVID_FILLS.YELLOW, VIVID_FILLS.GREEN]);
    result.properties.set(DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE, VividLight.getWaterfallSeriesDefaultTotalColors().stroke);
    return result;
  }
  getPalette() {
    return palette;
  }
}