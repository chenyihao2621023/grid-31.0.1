export const EXPECTED_ENTERPRISE_MODULES = [
    { type: 'root', optionsKey: 'animation', chartTypes: ['cartesian', 'polar', 'hierarchy'] },
    {
        type: 'root',
        optionsKey: 'background',
        chartTypes: ['cartesian', 'polar', 'hierarchy'],
        optionsInnerKey: 'image',
    },
    { type: 'root', optionsKey: 'contextMenu', chartTypes: ['cartesian', 'polar', 'hierarchy'] },
    { type: 'root', optionsKey: 'zoom', chartTypes: ['cartesian'] },
    {
        type: 'legend',
        optionsKey: 'gradientLegend',
        chartTypes: ['cartesian', 'polar', 'hierarchy'],
        identifier: 'gradient',
    },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-number' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-number' },
    { type: 'axis-option', optionsKey: 'crosshair', chartTypes: ['cartesian'] },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'box-plot' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'bullet' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'heatmap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'nightingale' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-line' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-column' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['hierarchy'], identifier: 'sunburst' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['hierarchy'], identifier: 'treemap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'waterfall' },
    { type: 'series-option', optionsKey: 'errorBar', chartTypes: ['cartesian'], identifier: 'error-bars' },
];
export function isEnterpriseSeriesType(type) {
    return EXPECTED_ENTERPRISE_MODULES.some((s) => s.type === 'series' && s.identifier === type);
}
export function getEnterpriseSeriesChartTypes(type) {
    var _a;
    return (_a = EXPECTED_ENTERPRISE_MODULES.find((s) => s.type === 'series' && s.identifier === type)) === null || _a === void 0 ? void 0 : _a.chartTypes;
}
export function isEnterpriseSeriesTypeLoaded(type) {
    var _a, _b;
    return ((_b = (_a = EXPECTED_ENTERPRISE_MODULES.find((s) => s.type === 'series' && s.identifier === type)) === null || _a === void 0 ? void 0 : _a.useCount) !== null && _b !== void 0 ? _b : 0) > 0;
}
export function isEnterpriseCartesian(seriesType) {
    var _a;
    const type = (_a = getEnterpriseSeriesChartTypes(seriesType)) === null || _a === void 0 ? void 0 : _a.find((v) => v === 'cartesian');
    return type === 'cartesian';
}
export function isEnterprisePolar(seriesType) {
    var _a;
    const type = (_a = getEnterpriseSeriesChartTypes(seriesType)) === null || _a === void 0 ? void 0 : _a.find((v) => v === 'polar');
    return type === 'polar';
}
export function isEnterpriseHierarchy(seriesType) {
    var _a;
    const type = (_a = getEnterpriseSeriesChartTypes(seriesType)) === null || _a === void 0 ? void 0 : _a.find((v) => v === 'hierarchy');
    return type === 'hierarchy';
}
export function verifyIfModuleExpected(module) {
    var _a;
    if (module.packageType !== 'enterprise') {
        throw new Error('ZING Charts - internal configuration error, only enterprise modules need verification.');
    }
    const stub = EXPECTED_ENTERPRISE_MODULES.find((s) => {
        return (s.type === module.type &&
            s.optionsKey === module.optionsKey &&
            s.identifier === module.identifier &&
            module.chartTypes.every((t) => s.chartTypes.includes(t)));
    });
    if (stub) {
        (_a = stub.useCount) !== null && _a !== void 0 ? _a : (stub.useCount = 0);
        stub.useCount++;
    }
    return stub != null;
}
export function getUnusedExpectedModules() {
    return EXPECTED_ENTERPRISE_MODULES.filter(({ useCount }) => useCount == null || useCount === 0);
}
//# sourceMappingURL=expectedEnterpriseModules.js.map