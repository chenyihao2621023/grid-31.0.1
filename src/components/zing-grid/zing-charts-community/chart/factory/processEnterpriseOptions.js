import { Logger } from '../../util/logger';
import { optionsType } from '../mapping/types';
import { getChartType } from './chartTypes';
import { EXPECTED_ENTERPRISE_MODULES } from './expectedEnterpriseModules';
export function removeUsedEnterpriseOptions(options) {
    var _a, _b, _c, _d;
    const usedOptions = [];
    const optionsChartType = getChartType(optionsType(options));
    for (const { type, chartTypes, optionsKey, optionsInnerKey, identifier } of EXPECTED_ENTERPRISE_MODULES) {
        if (optionsChartType !== 'unknown' && !chartTypes.includes(optionsChartType))
            continue;
        if (type === 'root' || type === 'legend') {
            const optionValue = options[optionsKey];
            if (optionValue == null)
                continue;
            if (!optionsInnerKey) {
                usedOptions.push(optionsKey);
                delete options[optionsKey];
            }
            else if (optionValue[optionsInnerKey]) {
                usedOptions.push(`${optionsKey}.${optionsInnerKey}`);
                delete optionValue[optionsInnerKey];
            }
        }
        else if (type === 'axis') {
            if (!('axes' in options) || !((_a = options.axes) === null || _a === void 0 ? void 0 : _a.some((axis) => axis.type === identifier)))
                continue;
            usedOptions.push(`axis[type=${identifier}]`);
            options.axes = options.axes.filter((axis) => axis.type !== identifier);
        }
        else if (type === 'axis-option') {
            if (!('axes' in options) || !((_b = options.axes) === null || _b === void 0 ? void 0 : _b.some((axis) => axis[optionsKey])))
                continue;
            usedOptions.push(`axis.${optionsKey}`);
            options.axes.forEach((axis) => {
                if (axis[optionsKey]) {
                    delete axis[optionsKey];
                }
            });
        }
        else if (type === 'series') {
            if (!((_c = options.series) === null || _c === void 0 ? void 0 : _c.some((series) => series.type === identifier)))
                continue;
            usedOptions.push(`series[type=${identifier}]`);
            options.series = options.series.filter((series) => series.type !== identifier);
        }
        else if (type === 'series-option') {
            if (!((_d = options.series) === null || _d === void 0 ? void 0 : _d.some((series) => series[optionsKey])))
                continue;
            usedOptions.push(`series.${optionsKey}`);
            options.series.forEach((series) => {
                if (series[optionsKey]) {
                    delete series[optionsKey];
                }
            });
        }
    }
    if (usedOptions.length > 0) {
        Logger.warnOnce([
            `unable to use these enterprise features as 'zing-charts-enterprise' has not been loaded:`,
            ``,
            ...usedOptions,
            ``,
            'See: https://charts.zing-grid.com/javascript/installation/',
        ].join('\n'));
    }
}
//# sourceMappingURL=processEnterpriseOptions.js.map