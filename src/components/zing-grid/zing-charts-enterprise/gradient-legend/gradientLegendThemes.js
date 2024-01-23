import { _Theme } from '@/components/zing-grid/zing-charts-community/main.js';
const BOTTOM = 'bottom';
export const GRADIENT_LEGEND_THEME = {
    position: BOTTOM,
    spacing: 20,
    scale: {
        padding: 8,
        label: {
            color: _Theme.DEFAULT_LABEL_COLOUR,
            fontStyle: undefined,
            fontWeight: undefined,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            formatter: undefined,
        },
        interval: {
            minSpacing: 1,
            maxSpacing: 50,
        },
    },
    gradient: {
        preferredLength: 100,
        thickness: 16,
    },
    reverseOrder: false,
};
