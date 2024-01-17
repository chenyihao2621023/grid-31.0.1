import { Legend } from '../legend';
const LEGEND_FACTORIES = {
    category: Legend,
};
const LEGEND_KEYS = {
    category: 'legend',
};
export function registerLegend(type, key, ctr, theme) {
    LEGEND_FACTORIES[type] = ctr;
    LEGEND_KEYS[type] = key;
    LEGEND_THEME_TEMPLATES[key] = theme;
}
export function getLegend(type, ctx) {
    const ctor = LEGEND_FACTORIES[type];
    if (ctor) {
        return new ctor(ctx);
    }
    throw new Error(`AG Charts - unknown legend type: ${type}`);
}
const LEGEND_THEME_TEMPLATES = {};
export function getLegendThemeTemplates() {
    return LEGEND_THEME_TEMPLATES;
}
export function getLegendKeys() {
    return LEGEND_KEYS;
}
//# sourceMappingURL=legendTypes.js.map