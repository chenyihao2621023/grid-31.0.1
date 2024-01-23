var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
import day from '../../util/time/day';
import { DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY_EXTENDED } from './data';
import * as data from './data-axes';
import * as examples from './examples';
export const CATEGORY_AXIS_BASIC_EXAMPLE = {
    data: data.DATA_COUNTRY_DIETARY_STATS,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'country',
            xName: 'Country',
            yKey: 'sugar',
            yName: 'Sugar',
            grouped: true,
            type: 'bar',
        },
        {
            xKey: 'country',
            xName: 'Country',
            yKey: 'fat',
            yName: 'Fat',
            grouped: true,
            type: 'bar',
        },
        {
            xKey: 'country',
            xName: 'Country',
            yKey: 'weight',
            yName: 'Weight',
            grouped: true,
            type: 'bar',
        },
    ],
};
export const CATEGORY_AXIS_UNIFORM_BASIC_EXAMPLE = {
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DAY_OF_YEAR,
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'day',
            xName: 'Day',
            yKey: 'likes',
            yName: 'Likes',
            type: 'bar',
        },
    ],
};
export const TIME_AXIS_BASIC_EXAMPLE = {
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DATE,
    axes: [
        { type: 'time', position: 'bottom', tick: { interval: day.every(7, { snapTo: 'start' }) } },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'date',
            xName: 'Day',
            yKey: 'likes',
            yName: 'Likes',
            type: 'line',
        },
    ],
};
export const TIME_AXIS_MIN_MAX_DATE_EXAMPLE = Object.assign(Object.assign({}, TIME_AXIS_BASIC_EXAMPLE), { axes: [
        {
            type: 'time',
            position: 'bottom',
            min: new Date(2022, 1, 15, 0, 0, 0),
            max: new Date(2022, 2, 15, 0, 0, 0),
            tick: { interval: day.every(3, { snapTo: 'start' }) },
        },
        { type: 'number', position: 'left' },
    ] });
export const TIME_AXIS_MIN_MAX_NUMBER_EXAMPLE = Object.assign(Object.assign({}, TIME_AXIS_MIN_MAX_DATE_EXAMPLE), { axes: [
        {
            type: 'time',
            position: 'bottom',
            min: new Date(2022, 1, 15, 0, 0, 0).getTime(),
            max: new Date(2022, 2, 15, 0, 0, 0).getTime(),
            tick: { interval: day.every(3, { snapTo: 'start' }) },
        },
        { type: 'number', position: 'left' },
    ] });
export const NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE = {
    data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DAY_OF_YEAR,
    axes: [
        { type: 'number', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    series: [
        {
            xKey: 'day',
            xName: 'Day',
            yKey: 'likes',
            yName: 'Likes',
            type: 'line',
        },
    ],
};
export const NUMBER_AXIS_LOG10_EXAMPLE = Object.assign(Object.assign({}, NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE), { data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DAY_OF_YEAR_LARGE_SCALE, axes: [
        { type: 'number', position: 'bottom' },
        { type: 'log', position: 'left', base: 10, label: { format: '.0f' } },
    ] });
export const NUMBER_AXIS_LOG2_EXAMPLE = Object.assign(Object.assign({}, NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE), { data: data.DATA_YOUTUBE_VIDEOS_STATS_BY_DAY_OF_YEAR_LARGE_SCALE, axes: [
        { type: 'number', position: 'bottom' },
        { type: 'log', position: 'left', base: 2, label: { format: '.0f' } },
    ] });
export const GROUPED_CATEGORY_AXIS_EXAMPLE = Object.assign(Object.assign({}, examples.GROUPED_CATEGORY_AXIS_EXAMPLE), { data: DATA_TOTAL_GAME_WINNINGS_GROUPED_BY_COUNTRY_EXTENDED.slice(0, 20) });
export const NUMBER_AXIS_NO_SERIES = Object.assign(Object.assign({}, examples.SIMPLE_SCATTER_CHART_EXAMPLE), { series: (_a = examples.SIMPLE_SCATTER_CHART_EXAMPLE.series) === null || _a === void 0 ? void 0 : _a.map((s) => (Object.assign(Object.assign({}, s), { visible: false }))), legend: { enabled: false } });
export const NUMBER_AXIS_TICK_VALUES = Object.assign(Object.assign({}, examples.SIMPLE_SCATTER_CHART_EXAMPLE), { axes: [
        { type: 'number', position: 'bottom', tick: { values: [142, 153, 203, 220, 290] } },
        { type: 'number', position: 'left' },
    ] });
export const TIME_AXIS_TICK_VALUES = Object.assign(Object.assign({}, examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS), { axes: [
        {
            type: 'time',
            position: 'bottom',
            tick: {
                values: [new Date(2020, 0, 1), new Date(2020, 0, 4), new Date(2020, 0, 17), new Date(2020, 0, 28)],
            },
        },
        {
            type: 'number',
            position: 'left',
        },
    ] });
export const LOG_AXIS_TICK_VALUES = Object.assign(Object.assign({}, NUMBER_AXIS_UNIFORM_BASIC_EXAMPLE), { axes: [
        { type: 'number', position: 'bottom' },
        {
            type: 'log',
            position: 'left',
            tick: { values: [2, 4, 8, 16, 12, 20, 200, 400, 800] },
        },
    ] });
export const CATEGORY_AXIS_TICK_VALUES = Object.assign(Object.assign({}, examples.GROUPED_COLUMN_EXAMPLE), { axes: [
        {
            type: 'category',
            position: 'bottom',
            tick: { values: ['2016', '2018'] },
        },
        { type: 'number', position: 'left' },
    ] });
export const AXIS_TICK_MIN_SPACING = Object.assign(Object.assign({}, examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS), { axes: [
        {
            type: 'time',
            position: 'bottom',
            tick: { minSpacing: 200 },
        },
        {
            type: 'number',
            position: 'left',
            tick: { minSpacing: 100 },
        },
    ] });
export const AXIS_TICK_MAX_SPACING = Object.assign(Object.assign({}, examples.SIMPLE_SCATTER_CHART_EXAMPLE), { axes: [
        { type: 'number', position: 'left', tick: { maxSpacing: 30 } },
        { type: 'number', position: 'bottom', tick: { maxSpacing: 30 } },
    ] });
export const AXIS_TICK_MIN_MAX_SPACING = Object.assign(Object.assign({}, examples.GROUPED_COLUMN_EXAMPLE), { axes: [
        { type: 'category', position: 'bottom', tick: { minSpacing: 150 } },
        { type: 'number', position: 'left', tick: { minSpacing: 50, maxSpacing: 100 } },
    ] });
export const NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN = Object.assign(Object.assign({}, NUMBER_AXIS_NO_SERIES), { axes: (_b = NUMBER_AXIS_NO_SERIES.axes) === null || _b === void 0 ? void 0 : _b.map((a) => {
        if (a.position === 'left' && a.type === 'number') {
            return Object.assign(Object.assign({}, a), { min: 66, max: 84 });
        }
        else if (a.position === 'bottom' && a.type === 'number') {
            return Object.assign(Object.assign({}, a), { min: 150, max: 290 });
        }
        return a;
    }) });
export const TIME_AXIS_NO_SERIES = Object.assign(Object.assign({}, examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS), { series: (_c = examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS.series) === null || _c === void 0 ? void 0 : _c.map((s) => (Object.assign(Object.assign({}, s), { visible: false }))), legend: { enabled: false } });
export const TIME_AXIS_NO_SERIES_FIXED_DOMAIN = Object.assign(Object.assign({}, TIME_AXIS_NO_SERIES), { axes: (_d = TIME_AXIS_NO_SERIES.axes) === null || _d === void 0 ? void 0 : _d.map((a) => {
        if (a.position === 'left' && a.type === 'number') {
            return Object.assign(Object.assign({}, a), { min: 2.4, max: 4.7 });
        }
        else if (a.position === 'bottom' && a.type === 'time') {
            return Object.assign(Object.assign({}, a), { min: new Date('2020-01-01T00:25:35.920Z'), max: new Date('2020-01-31T14:15:33.950Z') });
        }
        return a;
    }) });
export const COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES = Object.assign(Object.assign({}, examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE), { series: (_e = examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE.series) === null || _e === void 0 ? void 0 : _e.map((s) => (Object.assign(Object.assign({}, s), { visible: false }))), legend: { enabled: false } });
export const COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES_FIXED_DOMAIN = Object.assign(Object.assign({}, COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES), { axes: (_f = COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES.axes) === null || _f === void 0 ? void 0 : _f.map((a) => {
        if (a.position === 'left' && a.type === 'number') {
            return Object.assign(Object.assign({}, a), { min: 0, max: 4000 });
        }
        else if (a.position === 'right' && a.type === 'number') {
            return Object.assign(Object.assign({}, a), { min: 100000, max: 140000 });
        }
        return a;
    }) });
export const COMBO_SERIES_AREA_PADDING = Object.assign(Object.assign({}, COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES), { seriesArea: {
        padding: {
            left: 50,
            right: 50,
            bottom: 50,
        },
    }, axes: (_g = COMBO_CATEGORY_NUMBER_AXIS_NO_SERIES.axes) === null || _g === void 0 ? void 0 : _g.map((a) => {
        if (a.position === 'left' && a.type === 'number') {
            return Object.assign(Object.assign({}, a), { min: 0, max: 4000 });
        }
        else if (a.position === 'right' && a.type === 'number') {
            return Object.assign(Object.assign({}, a), { min: 100000, max: 140000 });
        }
        return a;
    }) });
export const COMBO_SERIES_AREA_PADDING_WITHOUT_TITLES = Object.assign(Object.assign({}, COMBO_SERIES_AREA_PADDING), { axes: (_h = COMBO_SERIES_AREA_PADDING.axes) === null || _h === void 0 ? void 0 : _h.map((axis) => (Object.assign(Object.assign({}, axis), { title: {
            enabled: false,
        } }))) });
export const COMBO_SERIES_AREA_PADDING_WITHOUT_LABELS = Object.assign(Object.assign({}, COMBO_SERIES_AREA_PADDING), { axes: (_j = COMBO_SERIES_AREA_PADDING.axes) === null || _j === void 0 ? void 0 : _j.map((axis) => (Object.assign(Object.assign({}, axis), { label: {
            enabled: false,
        } }))) });
export const COMBO_SERIES_AREA_PADDING_WITHOUT_LABELS_OR_TITLES = Object.assign(Object.assign({}, COMBO_SERIES_AREA_PADDING), { axes: (_k = COMBO_SERIES_AREA_PADDING.axes) === null || _k === void 0 ? void 0 : _k.map((axis) => (Object.assign(Object.assign({}, axis), { title: {
            enabled: false,
        }, label: {
            enabled: false,
        } }))) });
export const AREA_CHART_NO_SERIES = Object.assign(Object.assign({}, examples.STACKED_AREA_GRAPH_EXAMPLE), { series: (_l = examples.STACKED_AREA_GRAPH_EXAMPLE.series) === null || _l === void 0 ? void 0 : _l.map((s) => (Object.assign(Object.assign({}, s), { visible: false }))) });
export const AREA_CHART_STACKED_NORMALISED_NO_SERIES = Object.assign(Object.assign({}, examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE), { series: (_m = examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE.series) === null || _m === void 0 ? void 0 : _m.map((s) => (Object.assign(Object.assign({}, s), { visible: false }))) });
const extremeAxisConfig = {
    title: {
        text: 'Axis title',
    },
    line: {
        color: 'yellow',
        width: 20,
    },
    tick: {
        color: 'blue',
        size: 20,
        width: 400,
    },
};
export const GRIDLINE_TICKLINE_CLIPPING = Object.assign(Object.assign({}, CATEGORY_AXIS_BASIC_EXAMPLE), { axes: [
        Object.assign({ type: 'category', position: 'bottom' }, extremeAxisConfig),
        Object.assign({ type: 'number', position: 'left' }, extremeAxisConfig),
    ] });
export const GROUPED_CATEGORY_AXIS_GRIDLINE_TICKLINE_CLIPPING = Object.assign(Object.assign({}, examples.GROUPED_CATEGORY_AXIS_EXAMPLE), { axes: [
        Object.assign({ type: 'grouped-category', position: 'bottom' }, extremeAxisConfig),
        Object.assign({ type: 'number', position: 'left' }, extremeAxisConfig),
    ] });
