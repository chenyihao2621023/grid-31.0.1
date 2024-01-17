import { DATA_MEAN_SEA_LEVEL } from '../../test/data';
import { loadExampleOptions } from '../../test/load-example';
import { DATA_OIL_PETROLEUM } from './data';
export const GROUPED_BAR_CHART_EXAMPLE = loadExampleOptions('grouped-bar');
export const GROUPED_COLUMN_EXAMPLE = loadExampleOptions('grouped-column');
export const LINE_GRAPH_WITH_GAPS_EXAMPLE = loadExampleOptions('line-with-gaps');
export const XY_HISTOGRAM_WITH_MEAN_EXAMPLE = loadExampleOptions('xy-histogram-with-mean-aggregation');
export const AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE = loadExampleOptions('area-with-negative-values');
const baseChartOptions = {
    data: DATA_OIL_PETROLEUM,
    theme: {
        overrides: {
            line: {
                series: {
                    highlightStyle: {
                        series: {
                            strokeWidth: 3,
                            dimOpacity: 0.2,
                        },
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'petrol',
            stroke: '#01c185',
            marker: {
                stroke: '#01c185',
                fill: '#01c185',
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            stroke: '#000000',
            marker: {
                stroke: '#000000',
                fill: '#000000',
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            title: {
                text: 'Date',
            },
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Price in pence',
            },
        },
    ],
};
const baseCrossLineOptions = {
    type: 'range',
    fill: '#dbddf0',
    stroke: '#5157b7',
    fillOpacity: 0.4,
    label: {
        text: 'Price Peak',
        color: 'black',
        fontSize: 14,
    },
};
const createChartOptions = (rangeConfig) => {
    var _a;
    const result = {};
    for (const name in rangeConfig) {
        result[name] = Object.assign(Object.assign({}, baseChartOptions), { axes: (_a = baseChartOptions['axes']) === null || _a === void 0 ? void 0 : _a.map((axis) => {
                const range = axis.position === 'bottom' ? rangeConfig[name].vertical : rangeConfig[name].horizontal;
                return Object.assign(Object.assign({}, axis), { crossLines: [Object.assign(Object.assign({}, baseCrossLineOptions), { range })] });
            }) });
    }
    return result;
};
const createChartOptionsWithInvalidCrossLines = (config) => {
    var _a;
    const result = {};
    for (const name in config) {
        const invalidCrossLineOptions = config[name];
        result[name] = Object.assign(Object.assign({}, baseChartOptions), { axes: (_a = baseChartOptions['axes']) === null || _a === void 0 ? void 0 : _a.map((axis) => {
                return axis.position === 'left'
                    ? Object.assign(Object.assign({}, axis), { crossLines: [Object.assign(Object.assign(Object.assign({}, baseCrossLineOptions), { type: undefined }), invalidCrossLineOptions)] }) : axis;
            }) });
    }
    return result;
};
const crossLinesOptions = {
    VALID_RANGE: {
        vertical: [new Date(Date.UTC(2019, 4, 1)), new Date(Date.UTC(2019, 8, 1))],
        horizontal: [128, 134],
    },
    INVALID_RANGE: {
        vertical: [new Date(Date.UTC(2019, 4, 1)), undefined],
        horizontal: [128, undefined],
    },
    RANGE_OUTSIDE_DOMAIN_MAX: {
        vertical: [new Date(Date.UTC(2019, 4, 1)), new Date(Date.UTC(2022, 8, 1))],
        horizontal: [134, 160],
    },
    RANGE_OUTSIDE_DOMAIN_MIN: {
        vertical: [new Date(Date.UTC(2017, 8, 1)), new Date(Date.UTC(2019, 4, 1))],
        horizontal: [100, 134],
    },
    RANGE_OUTSIDE_DOMAIN_MIN_MAX: {
        vertical: [new Date(Date.UTC(2017, 8, 1)), new Date(Date.UTC(2022, 4, 1))],
        horizontal: [100, 160],
    },
    RANGE_OUTSIDE_DOMAIN: {
        vertical: [new Date(Date.UTC(2022, 4, 1)), new Date(Date.UTC(2022, 8, 1))],
        horizontal: [90, 110],
    },
};
const invalidCrossLinesOptions = {
    INVALID_RANGE_VALUE_CROSSLINE: {
        type: 'range',
        range: [undefined, 134],
    },
    INVALID_RANGE_LENGTH_CROSSLINE: {
        type: 'range',
        range: [128, 134, 135],
    },
    INVALID_RANGE_WITHOUT_TYPE_CROSSLINE: {
        range: [128, 134],
    },
    INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE: {
        type: 'line',
        range: [128, 134],
    },
    INVALID_LINE_VALUE_CROSSLINES: {
        type: 'line',
        value: 'a string instead of number',
    },
    INVALID_LINE_WITHOUT_TYPE_CROSSLINE: {
        value: 128,
    },
    INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE: {
        type: 'range',
        value: 128,
    },
};
const crossLineLabelPositionOptions = {
    LABEL: Object.assign({}, crossLinesOptions.VALID_RANGE),
};
const chartOptions = createChartOptions(Object.assign(Object.assign({}, crossLinesOptions), crossLineLabelPositionOptions));
const invalidChartOptions = createChartOptionsWithInvalidCrossLines(invalidCrossLinesOptions);
export const VALID_RANGE_CROSSLINES = chartOptions['VALID_RANGE'];
export const RANGE_OUTSIDE_DOMAIN_MAX_CROSSLINES = chartOptions['RANGE_OUTSIDE_DOMAIN_MAX'];
export const RANGE_OUTSIDE_DOMAIN_MIN_CROSSLINES = chartOptions['RANGE_OUTSIDE_DOMAIN_MIN'];
export const RANGE_OUTSIDE_DOMAIN_MIN_MAX_CROSSLINES = chartOptions['RANGE_OUTSIDE_DOMAIN_MIN_MAX'];
export const RANGE_OUTSIDE_DOMAIN_CROSSLINES = chartOptions['RANGE_OUTSIDE_DOMAIN'];
export const INVALID_RANGE_VALUE_CROSSLINE = invalidChartOptions['INVALID_RANGE_VALUE_CROSSLINE'];
export const INVALID_RANGE_LENGTH_CROSSLINE = invalidChartOptions['INVALID_RANGE_LENGTH_CROSSLINE'];
export const INVALID_RANGE_WITHOUT_TYPE_CROSSLINE = invalidChartOptions['INVALID_RANGE_WITHOUT_TYPE_CROSSLINE'];
export const INVALID_LINE_VALUE_CROSSLINES = invalidChartOptions['INVALID_LINE_VALUE_CROSSLINES'];
export const INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE = invalidChartOptions['INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE'];
export const INVALID_LINE_WITHOUT_TYPE_CROSSLINE = invalidChartOptions['INVALID_LINE_WITHOUT_TYPE_CROSSLINE'];
export const INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE = invalidChartOptions['INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE'];
export const DEFAULT_LABEL_POSITION_CROSSLINES = chartOptions['LABEL'];
const xAxisCrossLineStyle = {
    fill: 'rgba(0,118,0,0.5)',
    fillOpacity: 0.2,
    stroke: 'green',
    strokeWidth: 1,
};
const yAxisCrossLineStyle = {
    fill: 'pink',
    fillOpacity: 0.2,
    stroke: 'red',
    strokeWidth: 1,
};
export const SCATTER_CROSSLINES = {
    title: {
        text: 'Mean Sea Level (mm)',
    },
    data: DATA_MEAN_SEA_LEVEL,
    series: [
        {
            type: 'scatter',
            xKey: 'time',
            yKey: 'mm',
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'number',
            crossLines: [
                Object.assign({ type: 'range', range: [10, 30], label: {
                        text: '10 - 30',
                        position: 'right',
                    } }, yAxisCrossLineStyle),
                Object.assign({ type: 'line', value: 60, label: {
                        text: '60',
                        position: 'right',
                    } }, yAxisCrossLineStyle),
            ],
        },
        {
            position: 'bottom',
            type: 'number',
            crossLines: [
                Object.assign({ type: 'range', range: [2001, 2003], label: {
                        text: '2001 - 2003',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'range', range: [2013, 2014], label: {
                        text: '2013 - 20014',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'line', value: 2008, label: {
                        text: '2008',
                    } }, xAxisCrossLineStyle),
            ],
        },
    ],
    legend: {
        enabled: true,
        position: 'right',
    },
};
export const LINE_CROSSLINES = Object.assign(Object.assign({}, LINE_GRAPH_WITH_GAPS_EXAMPLE), { axes: [
        {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Week',
            },
            label: {
                formatter: (params) => (params.index % 3 ? '' : params.value),
            },
            crossLines: [
                Object.assign({ type: 'range', range: [1, 13], label: {
                        text: '1 - 13',
                        position: 'top',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'range', range: [34, 45], label: {
                        text: '34 - 45',
                        position: 'top',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'line', value: 27, label: {
                        text: '27',
                        position: 'top',
                    } }, xAxisCrossLineStyle),
            ],
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: '£ per kg',
            },
            nice: false,
            min: 0.2,
            max: 1,
            crossLines: [
                Object.assign({ type: 'range', range: [0.25, 0.33], label: {
                        text: '0.25 - 0.33',
                        position: 'insideLeft',
                        padding: 10,
                    } }, yAxisCrossLineStyle),
                Object.assign({ type: 'line', value: 0.87, label: {
                        text: '0.87',
                        position: 'topRight',
                    } }, yAxisCrossLineStyle),
            ],
        },
    ] });
export const AREA_CROSSLINES = Object.assign(Object.assign({}, AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE), { axes: [
        {
            type: 'category',
            position: 'bottom',
            crossLines: [
                Object.assign({ type: 'range', range: ['Q1', 'Q2'], label: {
                        text: 'Q1 - Q2',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'range', range: ['Q3', 'Q4'], label: {
                        text: 'Q3 - Q4',
                    } }, xAxisCrossLineStyle),
            ],
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Thousand tonnes of oil equivalent',
            },
            crossLines: [
                Object.assign({ type: 'range', range: [800, 1000], label: {
                        text: '800 - 1000',
                        position: 'insideBottomLeft',
                    } }, yAxisCrossLineStyle),
                Object.assign({ type: 'line', value: -700, label: {
                        text: '-700',
                        position: 'topLeft',
                    } }, yAxisCrossLineStyle),
            ],
        },
    ] });
export const COLUMN_CROSSLINES = Object.assign(Object.assign({}, GROUPED_COLUMN_EXAMPLE), { axes: [
        {
            position: 'bottom',
            type: 'category',
            crossLines: [
                Object.assign({ type: 'range', range: ['2015', '2016'], label: {
                        text: '2015 - 2016',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'range', range: ['2017', '2019'], label: {
                        text: '2017 - 2019',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'line', value: '2012', label: {
                        text: '2012',
                    } }, xAxisCrossLineStyle),
            ],
        },
        {
            position: 'left',
            type: 'number',
            crossLines: [
                Object.assign({ type: 'range', range: [7000, 8000], label: {
                        text: '7000 - 8000',
                        position: 'right',
                        rotation: -90,
                    } }, yAxisCrossLineStyle),
                Object.assign({ type: 'line', value: 3500, label: {
                        text: '3500',
                        position: 'right',
                        rotation: -90,
                    } }, yAxisCrossLineStyle),
            ],
        },
    ] });
export const BAR_CROSSLINES = Object.assign(Object.assign({}, GROUPED_BAR_CHART_EXAMPLE), { axes: [
        {
            position: 'left',
            type: 'category',
            crossLines: [
                Object.assign({ type: 'range', range: ['Whole economy', 'Public sector'], label: {
                        text: 'Whole economy - Public sector',
                        position: 'right',
                        rotation: -90,
                    } }, yAxisCrossLineStyle),
                Object.assign({ type: 'line', value: 'Manufacturing', label: {
                        text: 'Manufacturing',
                        position: 'right',
                        rotation: -90,
                    } }, yAxisCrossLineStyle),
            ],
        },
        {
            position: 'bottom',
            type: 'number',
            crossLines: [
                Object.assign({ type: 'range', range: [0.5, 1.4], label: {
                        text: '0.5 - 1.4',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'range', range: [2.3, 2.5], label: {
                        text: '2.3 - 2.5',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'line', value: 3.6, label: {
                        text: '3.6',
                    } }, xAxisCrossLineStyle),
            ],
        },
    ] });
export const HISTOGRAM_CROSSLINES = Object.assign(Object.assign({}, XY_HISTOGRAM_WITH_MEAN_EXAMPLE), { axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                enabled: true,
                text: 'Engine Size (Cubic inches)',
            },
            crossLines: [
                Object.assign({ type: 'range', range: [70, 100], label: {
                        text: '70 - 100',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'range', range: [200, 285], label: {
                        text: '200 - 285',
                    } }, xAxisCrossLineStyle),
                Object.assign({ type: 'line', value: 300, label: {
                        text: '300',
                    } }, xAxisCrossLineStyle),
            ],
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Highway MPG',
            },
            crossLines: [
                Object.assign({ type: 'range', range: [10, 15], label: {
                        text: '70 - 100',
                        position: 'insideTopRight',
                        color: 'orange',
                    } }, yAxisCrossLineStyle),
                Object.assign({ type: 'line', value: 50, label: {
                        text: '50',
                        position: 'bottomRight',
                        color: 'orange',
                    } }, yAxisCrossLineStyle),
            ],
        },
    ] });
//# sourceMappingURL=examples.js.map