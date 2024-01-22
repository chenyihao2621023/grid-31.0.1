import { enterpriseModule } from '../../module/enterpriseModule';
import { DELETE, jsonMerge, jsonWalk } from '../../util/json';
import { Logger } from '../../util/logger';
import { isArray, isDefined } from '../../util/type-guards';
import { AXIS_TYPES } from '../factory/axisTypes';
import { CHART_TYPES } from '../factory/chartTypes';
import { isEnterpriseSeriesType } from '../factory/expectedEnterpriseModules';
import { removeUsedEnterpriseOptions } from '../factory/processEnterpriseOptions';
import { executeCustomDefaultsFunctions, getSeriesDefaults, getSeriesPaletteFactory, isDefaultAxisSwapNeeded, isSoloSeries, } from '../factory/seriesTypes';
import { resolvePartialPalette } from '../themes/chartTheme';
import { resolveModuleConflicts, swapAxes } from './defaults';
import { processSeriesOptions } from './prepareSeries';
import { getChartTheme } from './themes';
import { isZingCartesianChartOptions, isZingHierarchyChartOptions, isZingPolarChartOptions, isAxisOptionType, isSeriesOptionType, optionsType, } from './types';
function takeColours(context, colours, maxCount) {
    const result = [];
    for (let count = 0; count < maxCount; count++) {
        result.push(colours[(count + context.colourIndex) % colours.length]);
    }
    return result;
}
export const noDataCloneMergeOptions = {
    avoidDeepClone: ['data'],
};
function getGlobalTooltipPositionOptions(position) {
    // Note: we do not need to show a warning message if the validation fails. These global tooltip options
    // are already processed at the root of the chart options. Logging a message here would trigger duplicate
    // validation warnings.
    if (position === undefined || typeof position !== 'object' || position === null) {
        return {};
    }
    const { type, xOffset, yOffset } = position;
    const ZingTooltipPositionTypeMap = { pointer: true, node: true };
    const result = {};
    const isTooltipPositionType = (value) => Object.keys(ZingTooltipPositionTypeMap).includes(value);
    if (typeof type === 'string' && isTooltipPositionType(type)) {
        result.type = type;
    }
    if (typeof xOffset === 'number' && !isNaN(xOffset) && isFinite(xOffset)) {
        result.xOffset = xOffset;
    }
    if (typeof yOffset === 'number' && !isNaN(yOffset) && isFinite(yOffset)) {
        result.yOffset = yOffset;
    }
    return result;
}
export function prepareOptions(options) {
    var _a, _b, _c, _d;
    sanityCheckOptions(options);
    // Determine type and ensure it's explicit in the options config.
    const type = optionsType(options);
    const checkSeriesType = (type) => {
        if (type != null && !(isSeriesOptionType(type) || isEnterpriseSeriesType(type) || getSeriesDefaults(type))) {
            throw new Error(`ZING Charts - unknown series type: ${type}; expected one of: ${CHART_TYPES.seriesTypes}`);
        }
    };
    for (const { type: seriesType } of (_a = options.series) !== null && _a !== void 0 ? _a : []) {
        if (seriesType == null)
            continue;
        checkSeriesType(seriesType);
    }
    options = validateSoloSeries(options);
    let defaultSeriesType = 'line';
    if (isZingCartesianChartOptions(options)) {
        defaultSeriesType = 'line';
    }
    else if (isZingHierarchyChartOptions(options)) {
        defaultSeriesType = 'treemap';
    }
    else if (isZingPolarChartOptions(options)) {
        defaultSeriesType = 'pie';
    }
    let defaultOverrides = getSeriesDefaults(type);
    if (isDefaultAxisSwapNeeded(options)) {
        defaultOverrides = swapAxes(defaultOverrides);
    }
    defaultOverrides = executeCustomDefaultsFunctions(options, defaultOverrides);
    const conflictOverrides = resolveModuleConflicts(options);
    removeDisabledOptions(options);
    const globalTooltipPositionOptions = getGlobalTooltipPositionOptions((_b = options.tooltip) === null || _b === void 0 ? void 0 : _b.position);
    const { context, mergedOptions, axesThemes, seriesThemes, theme } = prepareMainOptions(defaultOverrides, options, conflictOverrides);
    // Special cases where we have arrays of elements which need their own defaults.
    // Apply series themes before calling processSeriesOptions() as it reduces and renames some
    // properties, and in that case then cannot correctly have themes applied.
    mergedOptions.series = processSeriesOptions(mergedOptions, ((_c = mergedOptions.series) !== null && _c !== void 0 ? _c : []).map((s) => {
        var _a;
        const type = (_a = s.type) !== null && _a !== void 0 ? _a : defaultSeriesType;
        const mergedSeries = mergeSeriesOptions(s, type, seriesThemes, globalTooltipPositionOptions);
        if (type === 'pie') {
            preparePieOptions(seriesThemes.pie, s, mergedSeries);
        }
        return mergedSeries;
    }))
        .map((s) => prepareSeries(context, s))
        .map((s) => theme.templateTheme(s));
    const checkAxisType = (type) => {
        const isAxisType = isAxisOptionType(type);
        if (!isAxisType) {
            Logger.warnOnce(`unknown axis type: ${type}; expected one of: ${AXIS_TYPES.axesTypes}, ignoring.`);
        }
        return isAxisType;
    };
    if ('axes' in mergedOptions) {
        let validAxesTypes = true;
        for (const { type: axisType } of (_d = mergedOptions.axes) !== null && _d !== void 0 ? _d : []) {
            validAxesTypes && (validAxesTypes = checkAxisType(axisType));
        }
        const axisSource = validAxesTypes ? mergedOptions.axes : defaultOverrides.axes;
        mergedOptions.axes = axisSource === null || axisSource === void 0 ? void 0 : axisSource.map((axis) => {
            var _a, _b, _c, _d, _e;
            const axisType = axis.type;
            let axisDefaults;
            if (validAxesTypes) {
                axisDefaults = (_a = defaultOverrides.axes) === null || _a === void 0 ? void 0 : _a.find(({ type }) => type === axisType);
            }
            const axesTheme = jsonMerge([
                (_b = axesThemes[axisType]) !== null && _b !== void 0 ? _b : {},
                (_e = (_c = axesThemes[axisType]) === null || _c === void 0 ? void 0 : _c[(_d = axis.position) !== null && _d !== void 0 ? _d : 'unknown']) !== null && _e !== void 0 ? _e : {},
                axisDefaults,
            ]);
            return prepareAxis(axis, axesTheme);
        });
        prepareLegendEnabledOption(options, mergedOptions);
    }
    prepareEnabledOptions(options, mergedOptions);
    return mergedOptions;
}
function sanityCheckOptions(options) {
    const deprecatedArrayProps = {
        yKeys: 'yKey',
        yNames: 'yName',
    };
    Object.entries(deprecatedArrayProps).forEach(([oldProp, newProp]) => {
        var _a;
        if ((_a = options.series) === null || _a === void 0 ? void 0 : _a.some((s) => s[oldProp] != null)) {
            Logger.warnOnce(`Property [series.${oldProp}] is deprecated, please use [series.${newProp}] and multiple series instead.`);
        }
    });
}
function hasSoloSeries(options) {
    return options.some((series) => isSoloSeries(series.type));
}
function validateSoloSeries(options) {
    if (options.series === undefined || options.series.length <= 1 || !hasSoloSeries(options.series)) {
        return options;
    }
    // If the first series is a solo-series, remove all trailing series, otherwise remove all solo-series.
    let series = [...options.series];
    if (isSoloSeries(series[0].type)) {
        Logger.warn(`series[0] of type '${series[0].type}' is incompatible with other series types. Only processing series[0]`);
        series = series.slice(0, 1);
    }
    else {
        const rejects = Array.from(new Set(series.filter((s) => isSoloSeries(s.type)).map((s) => s.type)));
        Logger.warnOnce(`Unable to mix these series types with the lead series type: ${rejects}`);
        series = series.filter((s) => !isSoloSeries(s.type));
    }
    return Object.assign(Object.assign({}, options), { series });
}
function mergeSeriesOptions(series, type, seriesThemes, globalTooltipPositionOptions) {
    var _a, _b;
    const mergedTooltipPosition = jsonMerge([Object.assign({}, globalTooltipPositionOptions), (_a = series.tooltip) === null || _a === void 0 ? void 0 : _a.position], noDataCloneMergeOptions);
    return jsonMerge([
        (_b = seriesThemes[type]) !== null && _b !== void 0 ? _b : {},
        Object.assign(Object.assign({}, series), { type, tooltip: Object.assign(Object.assign({}, series.tooltip), { position: mergedTooltipPosition }) }),
    ], noDataCloneMergeOptions);
}
function prepareMainOptions(defaultOverrides, options, conflictOverrides) {
    const { theme, cleanedTheme, axesThemes, seriesThemes, userPalette: partialPalette } = prepareTheme(options);
    const userPalette = resolvePartialPalette(partialPalette, theme.palette);
    const context = { colourIndex: 0, palette: theme.palette, userPalette, theme };
    defaultOverrides = theme.templateTheme(defaultOverrides);
    const mergedOptions = jsonMerge([defaultOverrides, cleanedTheme, options, conflictOverrides], noDataCloneMergeOptions);
    if (!enterpriseModule.isEnterprise) {
        removeUsedEnterpriseOptions(mergedOptions);
    }
    return { context, mergedOptions, axesThemes, seriesThemes, theme };
}
function prepareTheme(options) {
    var _a;
    const theme = getChartTheme(options.theme);
    const themeConfig = theme.config[optionsType(options)];
    const seriesThemes = Object.entries(theme.config).reduce((result, [seriesType, { series }]) => {
        result[seriesType] = series;
        return result;
    }, {});
    const userTheme = options.theme;
    const userPalette = typeof userTheme === 'object' && userTheme.palette ? userTheme.palette : null;
    return {
        theme,
        axesThemes: (_a = themeConfig === null || themeConfig === void 0 ? void 0 : themeConfig['axes']) !== null && _a !== void 0 ? _a : {},
        seriesThemes: seriesThemes,
        cleanedTheme: jsonMerge([themeConfig !== null && themeConfig !== void 0 ? themeConfig : {}, { axes: DELETE, series: DELETE }]),
        userPalette,
    };
}
function prepareSeries(context, input, ...defaults) {
    const paletteOptions = calculateSeriesPalette(context, input);
    // Part of the options interface, but not directly consumed by the series implementations.
    const removeOptions = { stacked: DELETE, grouped: DELETE };
    return jsonMerge([...defaults, paletteOptions, input, removeOptions], noDataCloneMergeOptions);
}
function calculateSeriesPalette(context, input) {
    const paletteFactory = getSeriesPaletteFactory(input.type);
    if (!paletteFactory) {
        return {};
    }
    const { palette: { fills = [], strokes = [] }, userPalette, theme, } = context;
    const colorsCount = Math.max(fills.length, strokes.length);
    return paletteFactory({
        userPalette,
        themeTemplateParameters: theme.getTemplateParameters(),
        colorsCount,
        takeColors: (count) => {
            const colors = {
                fills: takeColours(context, fills, count),
                strokes: takeColours(context, strokes, count),
            };
            context.colourIndex += count;
            return colors;
        },
    });
}
function prepareAxis(axis, axisTheme) {
    var _a, _b;
    // Remove redundant theme overload keys.
    const removeOptions = { top: DELETE, bottom: DELETE, left: DELETE, right: DELETE };
    // Special cross lines case where we have an array of cross line elements which need their own defaults.
    if (axis.crossLines) {
        if (!Array.isArray(axis.crossLines)) {
            Logger.warn('axis[].crossLines should be an array.');
            axis.crossLines = [];
        }
        axis.crossLines = axis.crossLines.map((crossLine) => { var _a; return jsonMerge([(_a = axisTheme.crossLines) !== null && _a !== void 0 ? _a : {}, crossLine]); });
    }
    // Same thing grid lines (AG-8777)
    const gridLineStyle = (_a = axisTheme.gridLine) === null || _a === void 0 ? void 0 : _a.style;
    if (((_b = axis.gridLine) === null || _b === void 0 ? void 0 : _b.style) !== undefined && gridLineStyle !== undefined && gridLineStyle.length > 0) {
        if (!Array.isArray(axis.gridLine.style)) {
            Logger.warn('axis[].gridLine.style should be an array.');
            axis.gridLine.style = [];
        }
        axis.gridLine.style = axis.gridLine.style.map((userStyle, index) => {
            // An empty gridLine (e.g. `gridLine: { style: [ {} ] }`) means "draw nothing". So ignore theme
            // defaults if this is the case:
            if (userStyle.stroke === undefined && userStyle.lineDash === undefined) {
                return userStyle;
            }
            // Themes will normally only have one element in gridLineStyle[], but cycle through the array
            // with `mod` anyway to make sure that we honour the theme's grid line style sequence.
            const themeStyle = gridLineStyle[index % gridLineStyle.length];
            return jsonMerge([themeStyle, userStyle]);
        });
    }
    const cleanTheme = { crossLines: DELETE };
    return jsonMerge([axisTheme, cleanTheme, axis, removeOptions], noDataCloneMergeOptions);
}
function removeDisabledOptions(options) {
    // Remove configurations from all option objects with a `false` value for the `enabled` property.
    jsonWalk(options, (userOptionsNode) => {
        if ('enabled' in userOptionsNode && userOptionsNode.enabled === false) {
            Object.keys(userOptionsNode).forEach((key) => {
                if (key === 'enabled')
                    return;
                delete userOptionsNode[key];
            });
        }
    }, { skip: ['data', 'theme'] });
}
function prepareLegendEnabledOption(options, mergedOptions) {
    var _a, _b, _c, _d;
    // Disable legend by default for single series cartesian charts
    if (!isDefined((_a = options.legend) === null || _a === void 0 ? void 0 : _a.enabled) && !isDefined((_b = mergedOptions.legend) === null || _b === void 0 ? void 0 : _b.enabled)) {
        (_c = mergedOptions.legend) !== null && _c !== void 0 ? _c : (mergedOptions.legend = {});
        mergedOptions.legend.enabled = ((_d = options.series) !== null && _d !== void 0 ? _d : []).length > 1;
    }
}
function prepareEnabledOptions(options, mergedOptions) {
    // Set `enabled: true` for all option objects where the user has provided values.
    jsonWalk(options, (visitingUserOpts, visitingMergedOpts) => {
        if (visitingMergedOpts &&
            'enabled' in visitingMergedOpts &&
            !visitingMergedOpts._enabledFromTheme &&
            visitingUserOpts.enabled == null) {
            visitingMergedOpts.enabled = true;
        }
    }, { skip: ['data', 'theme'] }, mergedOptions);
    // Cleanup any special properties.
    jsonWalk(mergedOptions, (visitingMergedOpts) => {
        if (visitingMergedOpts._enabledFromTheme != null) {
            // Do not apply special handling, base enablement on theme.
            delete visitingMergedOpts._enabledFromTheme;
        }
    }, { skip: ['data', 'theme'] });
}
function preparePieOptions(pieSeriesTheme, seriesOptions, mergedSeries) {
    if (isArray(seriesOptions.innerLabels)) {
        mergedSeries.innerLabels = seriesOptions.innerLabels.map((innerLabel) => jsonMerge([pieSeriesTheme.innerLabels, innerLabel]));
    }
    else {
        mergedSeries.innerLabels = DELETE;
    }
}
//# sourceMappingURL=prepare.js.map