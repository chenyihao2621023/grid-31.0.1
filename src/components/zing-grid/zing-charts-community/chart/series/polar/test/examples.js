import { DATA_MANY_LONG_LABELS, DATA_MARKET_SHARE, DATA_MARKET_SHARE_WITH_NEGATIVE_VALUES } from './data';
export const PIE_SERIES = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
        },
    ],
};
export const PIE_SERIES_NEGATIVE_VALUES = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE_WITH_NEGATIVE_VALUES,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
        },
    ],
};
export const PIE_SECTORS_DIFFERENT_RADII = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
        },
    ],
};
const minRadius = Math.min(...DATA_MARKET_SHARE.map((d) => d.satisfaction));
const maxRadius = Math.max(...DATA_MARKET_SHARE.map((d) => d.satisfaction));
export const PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MIN = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            radiusMin: minRadius - 2,
        },
    ],
};
export const PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MIN = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            radiusMin: maxRadius + 2,
        },
    ],
};
export const PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MAX = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            radiusMax: minRadius - 2,
        },
    ],
};
export const PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MAX = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            radiusMax: maxRadius + 2,
        },
    ],
};
export const PIE_SECTORS_LABELS = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            sectorLabelKey: 'share',
            sectorLabel: {
                color: 'white',
            },
        },
    ],
};
export const DOUGHNUT_SERIES = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            innerRadiusOffset: -70,
        },
    ],
};
export const DOUGHNUT_SERIES_INNER_TEXT = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            calloutLabelKey: 'os',
            angleKey: 'share',
            innerRadiusOffset: -30,
            innerLabels: [
                { text: '35%', color: 'white', fontSize: 50 },
                { text: 'Market', margin: 10 },
            ],
            innerCircle: {
                fill: '#a3a2a1',
            },
        },
    ],
};
export const DOUGHNUT_SERIES_RATIO = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            sectorLabelKey: 'share',
            angleKey: 'share',
            outerRadiusRatio: 0.9,
            innerRadiusRatio: 0.2,
            sectorLabel: {
                positionRatio: 0.7,
            },
        },
    ],
};
export const GROUPED_DOUGHNUT_SERIES = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            title: {
                text: 'Market Share',
            },
            calloutLabelKey: 'os',
            angleKey: 'share',
            innerRadiusOffset: -40,
        },
        {
            type: 'pie',
            title: {
                text: 'Satisfaction',
            },
            calloutLabelKey: 'os',
            angleKey: 'satisfaction',
            outerRadiusOffset: -100,
            innerRadiusOffset: -140,
        },
    ],
};
export const DOUGHNUT_SERIES_DIFFERENT_RADII = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            title: {
                text: 'Market Share',
            },
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            innerRadiusOffset: -100,
        },
    ],
};
export const GROUPED_DOUGHNUT_SERIES_DIFFERENT_RADII = {
    title: {
        text: 'Market Share',
    },
    data: DATA_MARKET_SHARE,
    series: [
        {
            type: 'pie',
            title: {
                text: 'Market Share',
            },
            calloutLabelKey: 'os',
            angleKey: 'share',
            radiusKey: 'satisfaction',
            innerRadiusOffset: -100,
        },
        {
            type: 'pie',
            title: {
                text: 'Satisfaction',
            },
            calloutLabelKey: 'os',
            angleKey: 'satisfaction',
            radiusKey: 'satisfaction',
            outerRadiusOffset: -150,
            innerRadiusOffset: -250,
        },
    ],
};
export const PIE_CALLOUT_LABELS_COLLISIONS = {
    title: {
        text: 'Many Long Labels',
    },
    data: DATA_MANY_LONG_LABELS,
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'label',
            calloutLabel: {
                minAngle: 1,
            },
        },
    ],
};
//# sourceMappingURL=examples.js.map