import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
import { RangeAreaSeries } from './rangeArea';
import { RANGE_AREA_DEFAULTS } from './rangeAreaDefaults';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';
const { markerPaletteFactory } = _ModuleSupport;
export const RangeAreaModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'range-area',
    instanceConstructor: RangeAreaSeries,
    seriesDefaults: RANGE_AREA_DEFAULTS,
    themeTemplate: RANGE_AREA_SERIES_THEME,
    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory(params);
        return {
            fill: marker.fill,
            stroke: marker.stroke,
            marker,
        };
    },
};
//# sourceMappingURL=rangeAreaModule.js.map