import { _Theme } from '@/components/zing-grid/zing-charts-community/main.js';
export const HEATMAP_SERIES_THEME = {
  __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
  label: {
    __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    enabled: false,
    color: _Theme.DEFAULT_LABEL_COLOUR,
    fontStyle: undefined,
    fontSize: _Theme.FONT_SIZE.SMALL,
    minimumFontSize: undefined,
    fontFamily: _Theme.DEFAULT_FONT_FAMILY,
    wrapping: 'on-space',
    overflowStrategy: 'ellipsis'
  },
  itemPadding: 3
};