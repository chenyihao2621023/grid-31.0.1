var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { enterpriseModule } from '../module/enterpriseModule';
import { REGISTERED_MODULES, hasRegisteredEnterpriseModules } from '../module/module';
import { Debug } from '../util/debug';
import { createDeprecationWarning } from '../util/deprecation';
import { jsonApply, jsonDiff, jsonMerge } from '../util/json';
import { Logger } from '../util/logger';
import { CartesianChart } from './cartesianChart';
import { Chart } from './chart';
import { getJsonApplyOptions } from './chartOptions';
import { AgChartInstanceProxy } from './chartProxy';
import { ChartUpdateType } from './chartUpdateType';
import { getAxis } from './factory/axisTypes';
import { isEnterpriseSeriesType, isEnterpriseSeriesTypeLoaded } from './factory/expectedEnterpriseModules';
import { getLegendKeys } from './factory/legendTypes';
import { registerInbuiltModules } from './factory/registerInbuiltModules';
import { getSeries } from './factory/seriesTypes';
import { setupModules } from './factory/setupModules';
import { HierarchyChart } from './hierarchyChart';
import { noDataCloneMergeOptions, prepareOptions } from './mapping/prepare';
import { AxisPositionGuesser } from './mapping/prepareAxis';
import { isAgCartesianChartOptions, isAgHierarchyChartOptions, isAgPolarChartOptions, optionsType, } from './mapping/types';
import { PolarChart } from './polarChart';
const debug = Debug.create(true, 'opts');
function chartType(options) {
    if (isAgCartesianChartOptions(options)) {
        return 'cartesian';
    }
    else if (isAgPolarChartOptions(options)) {
        return 'polar';
    }
    else if (isAgHierarchyChartOptions(options)) {
        return 'hierarchy';
    }
    throw new Error(`AG Chart - unknown type of chart for options with type: ${options.type}`);
}
/**
 * Factory for creating and updating instances of AgChartInstance.
 *
 * @docsInterface
 */
export class AgCharts {
    static licenseCheck(options) {
        var _a, _b, _c;
        if (this.licenseChecked)
            return;
        this.licenseManager = (_a = enterpriseModule.licenseManager) === null || _a === void 0 ? void 0 : _a.call(enterpriseModule, options);
        (_b = this.licenseManager) === null || _b === void 0 ? void 0 : _b.setLicenseKey(this.licenseKey);
        (_c = this.licenseManager) === null || _c === void 0 ? void 0 : _c.validateLicense();
        this.licenseChecked = true;
    }
    static setLicenseKey(licenseKey) {
        this.licenseKey = licenseKey;
    }
    /**
     * Returns the `AgChartInstance` for a DOM node, if there is one.
     */
    static getInstance(element) {
        return AgChartsInternal.getInstance(element);
    }
    /**
     * Create a new `AgChartInstance` based upon the given configuration options.
     */
    static create(options) {
        var _a, _b, _c;
        this.licenseCheck(options);
        const chart = AgChartsInternal.createOrUpdate(options);
        if ((_a = this.licenseManager) === null || _a === void 0 ? void 0 : _a.isDisplayWatermark()) {
            (_b = enterpriseModule.injectWatermark) === null || _b === void 0 ? void 0 : _b.call(enterpriseModule, (_c = options.document) !== null && _c !== void 0 ? _c : document, chart.chart.element, this.licenseManager.getWatermarkMessage());
        }
        return chart;
    }
    /**
     * Update an existing `AgChartInstance`. Options provided should be complete and not
     * partial.
     *
     * __NOTE__: As each call could trigger a chart redraw, multiple calls to update options in
     * quick succession could result in undesirable flickering, so callers should batch up and/or
     * debounce changes to avoid unintended partial update renderings.
     */
    static update(chart, options) {
        if (!AgChartInstanceProxy.isInstance(chart)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        AgChartsInternal.createOrUpdate(options, chart);
    }
    /**
     * Update an existing `AgChartInstance` by applying a partial set of option changes.
     *
     * __NOTE__: As each call could trigger a chart redraw, each individual delta options update
     * should leave the chart in a valid options state. Also, multiple calls to update options in
     * quick succession could result in undesirable flickering, so callers should batch up and/or
     * debounce changes to avoid unintended partial update renderings.
     */
    static updateDelta(chart, deltaOptions) {
        if (!AgChartInstanceProxy.isInstance(chart)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        AgChartsInternal.updateUserDelta(chart, deltaOptions);
    }
    /**
     * Starts a browser-based image download for the given `AgChartInstance`.
     */
    static download(chart, options) {
        if (!(chart instanceof AgChartInstanceProxy)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        AgChartsInternal.download(chart, options);
    }
    /**
     * Returns a base64-encoded image data URL for the given `AgChartInstance`.
     */
    static getImageDataURL(chart, options) {
        if (!(chart instanceof AgChartInstanceProxy)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        return AgChartsInternal.getImageDataURL(chart, options);
    }
}
AgCharts.INVALID_CHART_REF_MESSAGE = 'AG Charts - invalid chart reference passed';
AgCharts.licenseChecked = false;
/** @deprecated use AgCharts instead */
export class AgChart {
    static warnDeprecated(memberName) {
        const warnDeprecated = createDeprecationWarning();
        warnDeprecated(`AgChart.${memberName}`, `Use AgCharts.${memberName} instead`);
    }
    static create(options) {
        AgChart.warnDeprecated('create');
        return AgCharts.create(options);
    }
    static update(chart, options) {
        AgChart.warnDeprecated('update');
        return AgCharts.update(chart, options);
    }
    static updateDelta(chart, deltaOptions) {
        AgChart.warnDeprecated('updateDelta');
        return AgCharts.updateDelta(chart, deltaOptions);
    }
    static download(chart, options) {
        AgChart.warnDeprecated('download');
        return AgCharts.download(chart, options);
    }
    static getImageDataURL(chart, options) {
        AgChart.warnDeprecated('getImageDataURL');
        return AgCharts.getImageDataURL(chart, options);
    }
}
const proxyInstances = new WeakMap();
class AgChartsInternal {
    static getInstance(element) {
        const chart = Chart.getInstance(element);
        return chart != null ? proxyInstances.get(chart) : undefined;
    }
    static initialiseModules() {
        if (AgChartsInternal.initialised)
            return;
        registerInbuiltModules();
        setupModules();
        AgChartsInternal.initialised = true;
    }
    static createOrUpdate(userOptions, proxy) {
        var _a;
        var _b;
        AgChartsInternal.initialiseModules();
        debug('>>> AgChartV2.createOrUpdate() user options', userOptions);
        const { overrideDevicePixelRatio, document, window: userWindow } = userOptions, chartOptions = __rest(userOptions, ["overrideDevicePixelRatio", "document", "window"]);
        const specialOverrides = { overrideDevicePixelRatio, document, window: userWindow };
        const processedOptions = prepareOptions(chartOptions);
        let chart = proxy === null || proxy === void 0 ? void 0 : proxy.chart;
        if (chart != null) {
            proxyInstances.delete(chart);
        }
        if (chart == null || chartType(chartOptions) !== chartType(chart.processedOptions)) {
            chart = AgChartsInternal.createChartInstance(processedOptions, specialOverrides, chart);
        }
        if (proxy == null) {
            proxy = new AgChartInstanceProxy(chart);
        }
        else {
            proxy.chart = chart;
        }
        proxyInstances.set(chart, proxy);
        if (Debug.check() && typeof window !== 'undefined') {
            (_a = (_b = window).agChartInstances) !== null && _a !== void 0 ? _a : (_b.agChartInstances = {});
            window.agChartInstances[chart.id] = chart;
        }
        const chartToUpdate = chart;
        chartToUpdate.queuedUserOptions.push(chartOptions);
        const dequeue = () => {
            // If there are a lot of update calls, `requestFactoryUpdate()` may skip callbacks,
            // so we need to remove all queue items up to the last successfully applied item.
            const queuedOptionsIdx = chartToUpdate.queuedUserOptions.indexOf(chartOptions);
            chartToUpdate.queuedUserOptions.splice(0, queuedOptionsIdx);
        };
        chartToUpdate.requestFactoryUpdate(() => __awaiter(this, void 0, void 0, function* () {
            // Chart destroyed, skip processing.
            if (chartToUpdate.destroyed)
                return;
            const deltaOptions = jsonDiff(chartToUpdate.processedOptions, processedOptions);
            if (deltaOptions == null) {
                dequeue();
                return;
            }
            yield AgChartsInternal.updateDelta(chartToUpdate, deltaOptions, chartOptions);
            dequeue();
        }));
        return proxy;
    }
    static updateUserDelta(proxy, deltaOptions) {
        var _a;
        const { chart, chart: { queuedUserOptions }, } = proxy;
        const lastUpdateOptions = (_a = queuedUserOptions[queuedUserOptions.length - 1]) !== null && _a !== void 0 ? _a : chart.userOptions;
        const userOptions = jsonMerge([lastUpdateOptions, deltaOptions]);
        debug('>>> AgChartV2.updateUserDelta() user delta', deltaOptions);
        debug('AgChartV2.updateUserDelta() - base options', lastUpdateOptions);
        AgChartsInternal.createOrUpdate(userOptions, proxy);
    }
    /**
     * Returns the content of the current canvas as an image.
     * @param opts The download options including `width` and `height` of the image as well as `fileName` and `fileFormat`.
     */
    static download(proxy, opts) {
        const asyncDownload = () => __awaiter(this, void 0, void 0, function* () {
            const maybeClone = yield AgChartsInternal.prepareResizedChart(proxy, opts);
            const { chart } = maybeClone;
            chart.scene.download(opts === null || opts === void 0 ? void 0 : opts.fileName, opts === null || opts === void 0 ? void 0 : opts.fileFormat);
            if (maybeClone !== proxy) {
                maybeClone.destroy();
            }
        });
        asyncDownload().catch((e) => Logger.errorOnce(e));
    }
    static getImageDataURL(proxy, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const maybeClone = yield AgChartsInternal.prepareResizedChart(proxy, opts);
            const { chart } = maybeClone;
            const result = chart.scene.canvas.getDataURL(opts === null || opts === void 0 ? void 0 : opts.fileFormat);
            if (maybeClone !== proxy) {
                maybeClone.destroy();
            }
            return result;
        });
    }
    static prepareResizedChart(proxy, opts) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { chart } = proxy;
            let { width, height } = opts !== null && opts !== void 0 ? opts : {};
            const currentWidth = chart.width;
            const currentHeight = chart.height;
            const unchanged = (width === undefined && height === undefined) ||
                (chart.scene.canvas.pixelRatio === 1 && currentWidth === width && currentHeight === height);
            if (unchanged) {
                return proxy;
            }
            width !== null && width !== void 0 ? width : (width = currentWidth);
            height !== null && height !== void 0 ? height : (height = currentHeight);
            const options = Object.assign(Object.assign({}, chart.userOptions), { container: document.createElement('div'), width,
                height, autoSize: false, overrideDevicePixelRatio: 1 });
            if (hasRegisteredEnterpriseModules()) {
                // Disable enterprise features that may interfere with image generation.
                (_a = options.animation) !== null && _a !== void 0 ? _a : (options.animation = {});
                options.animation.enabled = false;
            }
            const clonedChart = AgChartsInternal.createOrUpdate(options);
            yield clonedChart.chart.waitForUpdate();
            return clonedChart;
        });
    }
    static createChartInstance(options, specialOverrides, oldChart) {
        const transferableResource = oldChart === null || oldChart === void 0 ? void 0 : oldChart.destroy({ keepTransferableResources: true });
        if (isAgCartesianChartOptions(options)) {
            return new CartesianChart(specialOverrides, transferableResource);
        }
        else if (isAgHierarchyChartOptions(options)) {
            return new HierarchyChart(specialOverrides, transferableResource);
        }
        else if (isAgPolarChartOptions(options)) {
            return new PolarChart(specialOverrides, transferableResource);
        }
        throw new Error(`AG Charts - couldn't apply configuration, check options are correctly structured and series types are specified`);
    }
    static updateDelta(chart, processedOptions, userOptions) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (processedOptions.type == null) {
                processedOptions = Object.assign(Object.assign({}, processedOptions), { type: (_a = chart.processedOptions.type) !== null && _a !== void 0 ? _a : optionsType(processedOptions) });
            }
            if (chart.destroyed)
                return;
            debug('AgChartV2.updateDelta() - applying delta', processedOptions);
            applyChartOptions(chart, processedOptions, userOptions);
        });
    }
}
AgChartsInternal.initialised = false;
function applyChartOptions(chart, processedOptions, userOptions) {
    var _a, _b, _c;
    const completeOptions = jsonMerge([(_a = chart.processedOptions) !== null && _a !== void 0 ? _a : {}, processedOptions], noDataCloneMergeOptions);
    const modulesChanged = applyModules(chart, completeOptions);
    const skip = ['type', 'data', 'series', 'listeners', 'theme', 'legend.listeners'];
    if (isAgCartesianChartOptions(processedOptions) || isAgPolarChartOptions(processedOptions)) {
        // Append axes to defaults.
        skip.push('axes');
    }
    else if (isAgHierarchyChartOptions(processedOptions)) {
        // Use defaults.
    }
    else {
        throw new Error(`AG Charts - couldn't apply configuration, check type of options and chart: ${processedOptions['type']}`);
    }
    // Needs to be done before applying the series to detect if a seriesNode[Double]Click listener has been added
    if (processedOptions.listeners) {
        registerListeners(chart, processedOptions.listeners);
    }
    applyOptionValues(chart, chart.getModuleContext(), processedOptions, { skip });
    let forceNodeDataRefresh = false;
    let seriesRecreated = false;
    if (processedOptions.series && processedOptions.series.length > 0) {
        seriesRecreated = applySeries(chart, processedOptions);
        forceNodeDataRefresh = true;
    }
    if ('axes' in completeOptions && Array.isArray(completeOptions.axes)) {
        const axesPresent = applyAxes(chart, completeOptions, seriesRecreated);
        if (axesPresent) {
            forceNodeDataRefresh = true;
        }
    }
    const seriesOpts = processedOptions.series;
    const seriesDataUpdate = !!processedOptions.data || (seriesOpts === null || seriesOpts === void 0 ? void 0 : seriesOpts.some((s) => s.data != null));
    const legendKeys = getLegendKeys();
    const optionsHaveLegend = Object.values(legendKeys).some((legendKey) => processedOptions[legendKey] != null);
    const otherRefreshUpdate = processedOptions.title != null && processedOptions.subtitle != null;
    forceNodeDataRefresh = forceNodeDataRefresh || seriesDataUpdate || optionsHaveLegend || otherRefreshUpdate;
    if (processedOptions.data) {
        chart.data = processedOptions.data;
    }
    if ((_b = processedOptions.legend) === null || _b === void 0 ? void 0 : _b.listeners) {
        Object.assign(chart.legend.listeners, processedOptions.legend.listeners);
    }
    if (processedOptions.listeners) {
        chart.updateAllSeriesListeners();
    }
    chart.processedOptions = completeOptions;
    chart.userOptions = jsonMerge([(_c = chart.userOptions) !== null && _c !== void 0 ? _c : {}, userOptions], noDataCloneMergeOptions);
    const majorChange = forceNodeDataRefresh || modulesChanged;
    const updateType = majorChange ? ChartUpdateType.PROCESS_DATA : ChartUpdateType.PERFORM_LAYOUT;
    debug('AgChartV2.applyChartOptions() - update type', ChartUpdateType[updateType]);
    chart.update(updateType, { forceNodeDataRefresh, newAnimationBatch: true });
}
function applyModules(chart, options) {
    const matchingChartType = ({ chartTypes }) => (chart instanceof CartesianChart && chartTypes.includes('cartesian')) ||
        (chart instanceof PolarChart && chartTypes.includes('polar')) ||
        (chart instanceof HierarchyChart && chartTypes.includes('hierarchy'));
    let modulesChanged = false;
    for (const module of REGISTERED_MODULES) {
        if (module.type !== 'root' && module.type !== 'legend') {
            continue;
        }
        const shouldBeEnabled = matchingChartType(module) && options[module.optionsKey] != null;
        const isEnabled = chart.isModuleEnabled(module);
        if (shouldBeEnabled === isEnabled) {
            continue;
        }
        if (shouldBeEnabled) {
            chart.addModule(module);
            chart[module.optionsKey] = chart.modules.get(module.optionsKey); // TODO remove
        }
        else {
            chart.removeModule(module);
            delete chart[module.optionsKey]; // TODO remove
        }
        modulesChanged = true;
    }
    return modulesChanged;
}
function applySeries(chart, options) {
    const optSeries = options.series;
    if (!optSeries) {
        return false;
    }
    const keysToConsider = ['direction', 'xKey', 'yKey', 'sizeKey', 'angleKey', 'stacked', 'stackGroup'];
    let matchingTypes = chart.series.length === optSeries.length;
    for (let i = 0; i < chart.series.length && matchingTypes; i++) {
        matchingTypes && (matchingTypes = chart.series[i].type === optSeries[i].type);
        for (const key of keysToConsider) {
            matchingTypes && (matchingTypes = chart.series[i].properties[key] === optSeries[i][key]);
        }
    }
    // Try to optimise series updates if series count and types didn't change.
    if (matchingTypes) {
        chart.series.forEach((s, i) => {
            var _a, _b, _c, _d;
            const previousOpts = (_c = (_b = (_a = chart.processedOptions) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b[i]) !== null && _c !== void 0 ? _c : {};
            const seriesDiff = jsonDiff(previousOpts, (_d = optSeries[i]) !== null && _d !== void 0 ? _d : {});
            if (!seriesDiff) {
                return;
            }
            debug(`AgChartV2.applySeries() - applying series diff idx ${i}`, seriesDiff);
            applySeriesValues(s, seriesDiff);
            s.markNodeDataDirty();
        });
        return false;
    }
    debug(`AgChartV2.applySeries() - creating new series instances`);
    chart.series = createSeries(chart, optSeries);
    return true;
}
function applyAxes(chart, options, forceRecreate) {
    const optAxes = options.axes;
    if (!optAxes) {
        return false;
    }
    const matchingTypes = !forceRecreate &&
        chart.axes.length === optAxes.length &&
        chart.axes.every((a, i) => a.type === optAxes[i].type);
    // Try to optimise series updates if series count and types didn't change.
    if (matchingTypes) {
        const oldOpts = chart.processedOptions;
        const moduleContext = chart.getModuleContext();
        if (isAgCartesianChartOptions(oldOpts)) {
            chart.axes.forEach((a, i) => {
                var _a, _b;
                const previousOpts = (_b = (_a = oldOpts.axes) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : {};
                const axisDiff = jsonDiff(previousOpts, optAxes[i]);
                debug(`AgChartV2.applyAxes() - applying axis diff idx ${i}`, axisDiff);
                const path = `axes[${i}]`;
                const skip = ['axes[].type'];
                applyOptionValues(a, moduleContext, axisDiff, { path, skip });
            });
            return true;
        }
    }
    chart.axes = createAxis(chart, optAxes);
    return true;
}
function createSeries(chart, options) {
    var _a;
    const series = [];
    const moduleContext = chart.getModuleContext();
    for (const seriesOptions of options !== null && options !== void 0 ? options : []) {
        const type = (_a = seriesOptions.type) !== null && _a !== void 0 ? _a : 'unknown';
        if (isEnterpriseSeriesType(type) && !isEnterpriseSeriesTypeLoaded(type)) {
            continue;
        }
        const seriesInstance = getSeries(type, moduleContext);
        applySeriesOptionModules(seriesInstance, seriesOptions);
        applySeriesValues(seriesInstance, seriesOptions);
        series.push(seriesInstance);
    }
    return series;
}
function applySeriesOptionModules(series, options) {
    const seriesOptionModules = REGISTERED_MODULES.filter((m) => m.type === 'series-option');
    const moduleContext = series.createModuleContext();
    const moduleMap = series.getModuleMap();
    for (const module of seriesOptionModules) {
        const supportedSeriesTypes = module.seriesTypes;
        if (module.optionsKey in options && supportedSeriesTypes.includes(series.type)) {
            moduleMap.addModule(module, (module) => new module.instanceConstructor(moduleContext));
            series[module.optionsKey] = moduleMap.getModule(module); // TODO remove
        }
    }
}
function createAxis(chart, options) {
    const guesser = new AxisPositionGuesser();
    const moduleContext = chart.getModuleContext();
    const skip = ['axes[].type'];
    let index = 0;
    for (const axisOptions of options !== null && options !== void 0 ? options : []) {
        const axis = getAxis(axisOptions.type, moduleContext);
        const path = `axes[${index++}]`;
        applyAxisModules(axis, axisOptions);
        applyOptionValues(axis, moduleContext, axisOptions, { path, skip });
        guesser.push(axis, axisOptions);
    }
    return guesser.guessInvalidPositions();
}
function applyAxisModules(axis, options) {
    let modulesChanged = false;
    const rootModules = REGISTERED_MODULES.filter((m) => m.type === 'axis-option');
    const moduleContext = axis.createModuleContext();
    for (const module of rootModules) {
        const shouldBeEnabled = options[module.optionsKey] != null;
        const moduleMap = axis.getModuleMap();
        const isEnabled = moduleMap.isModuleEnabled(module);
        if (shouldBeEnabled === isEnabled)
            continue;
        modulesChanged = true;
        if (shouldBeEnabled) {
            moduleMap.addModule(module, (module) => new module.instanceConstructor(moduleContext));
            axis[module.optionsKey] = moduleMap.getModule(module); // TODO remove
        }
        else {
            moduleMap.removeModule(module);
            delete axis[module.optionsKey]; // TODO remove
        }
    }
    return modulesChanged;
}
function registerListeners(source, listeners) {
    source.clearEventListeners();
    const entries = Object.entries(listeners !== null && listeners !== void 0 ? listeners : {});
    for (const [property, listener] of entries) {
        if (typeof listener !== 'function')
            continue;
        source.addEventListener(property, listener);
    }
}
function applyOptionValues(target, moduleContext, options, { skip, path } = {}) {
    const applyOpts = Object.assign(Object.assign(Object.assign({}, getJsonApplyOptions(moduleContext)), { skip }), (path ? { path } : {}));
    return jsonApply(target, options, applyOpts);
}
function applySeriesValues(target, options) {
    const moduleMap = target.getModuleMap();
    const _a = options, { type, data, errorBar, listeners, seriesGrouping } = _a, seriesOptions = __rest(_a, ["type", "data", "errorBar", "listeners", "seriesGrouping"]);
    target.properties.set(seriesOptions);
    if ('data' in options) {
        target.data = options.data;
    }
    if ('errorBar' in options && moduleMap.isModuleEnabled('errorBar')) {
        moduleMap.getModule('errorBar').properties.set(options.errorBar);
    }
    if ((options === null || options === void 0 ? void 0 : options.listeners) != null) {
        registerListeners(target, options.listeners);
    }
    if ('seriesGrouping' in options) {
        target.seriesGrouping = seriesGrouping
            ? Object.freeze(Object.assign(Object.assign({}, target.seriesGrouping), seriesGrouping))
            : undefined;
    }
}
//# sourceMappingURL=agChartV2.js.map