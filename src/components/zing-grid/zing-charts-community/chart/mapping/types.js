import { Logger } from '../../util/logger';
import { AXIS_TYPES } from '../factory/axisTypes';
import { CHART_TYPES } from '../factory/chartTypes';
import { isEnterpriseCartesian, isEnterpriseHierarchy, isEnterprisePolar } from '../factory/expectedEnterpriseModules';
export function optionsType(input) {
    var _a, _b, _c;
    return (_c = (_b = (_a = input.series) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.type) !== null && _c !== void 0 ? _c : 'line';
}
export function isZingCartesianChartOptions(input) {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return true;
    }
    if (specifiedType === 'cartesian') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }
    return CHART_TYPES.isCartesian(specifiedType) || isEnterpriseCartesian(specifiedType);
}
export function isZingHierarchyChartOptions(input) {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }
    if (specifiedType === 'hierarchy') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }
    return CHART_TYPES.isHierarchy(specifiedType) || isEnterpriseHierarchy(specifiedType);
}
export function isZingPolarChartOptions(input) {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }
    if (specifiedType === 'polar') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }
    return CHART_TYPES.isPolar(specifiedType) || isEnterprisePolar(specifiedType);
}
export function isSeriesOptionType(input) {
    if (input == null) {
        return false;
    }
    return CHART_TYPES.has(input);
}
export function isAxisOptionType(input) {
    if (input == null) {
        return false;
    }
    return AXIS_TYPES.has(input);
}
//# sourceMappingURL=types.js.map