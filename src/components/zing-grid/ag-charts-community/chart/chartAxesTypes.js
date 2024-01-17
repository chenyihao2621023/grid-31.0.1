const TYPES = {
    number: 'number',
    time: 'time',
    log: 'log',
    category: 'category',
    'grouped-category': 'grouped-category',
};
const AXES_THEME_TEMPLATES = {};
export const CHART_AXES_TYPES = {
    has(axisType) {
        return Object.hasOwn(TYPES, axisType);
    },
    get axesTypes() {
        return Object.keys(TYPES);
    },
};
export function registerAxisThemeTemplate(axisType, theme) {
    AXES_THEME_TEMPLATES[axisType] = theme;
}
export function getAxisThemeTemplate(axisType) {
    var _a;
    return (_a = AXES_THEME_TEMPLATES[axisType]) !== null && _a !== void 0 ? _a : {};
}
//# sourceMappingURL=chartAxesTypes.js.map