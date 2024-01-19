var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BBox } from '../scene/bbox';
import { Group } from '../scene/group';
import { Scene } from '../scene/scene';
import { sleep } from '../util/async';
import { CallbackCache } from '../util/callbackCache';
import { Debug } from '../util/debug';
import { createId } from '../util/id';
import { jsonClone } from '../util/json';
import { isPointLabelDatum, placeLabels } from '../util/labelPlacement';
import { Logger } from '../util/logger';
import { Mutex } from '../util/mutex';
import { Observable } from '../util/observable';
import { Padding } from '../util/padding';
import { ActionOnSet } from '../util/proxy';
import { debouncedAnimationFrame, debouncedCallback } from '../util/render';
import { SizeMonitor } from '../util/sizeMonitor';
import { BOOLEAN, UNION, Validate } from '../util/validation';
import { ChartHighlight } from './chartHighlight';
import { ChartUpdateType } from './chartUpdateType';
import { DataController } from './data/dataController';
import { AnimationManager } from './interaction/animationManager';
import { ChartEventManager } from './interaction/chartEventManager';
import { CursorManager } from './interaction/cursorManager';
import { HighlightManager } from './interaction/highlightManager';
import { InteractionManager } from './interaction/interactionManager';
import { TooltipManager } from './interaction/tooltipManager';
import { ZoomManager } from './interaction/zoomManager';
import { Layers } from './layers';
import { LayoutService } from './layout/layoutService';
import { Legend } from './legend';
import { ChartOverlays } from './overlay/chartOverlays';
import { SeriesNodePickMode } from './series/series';
import { SeriesLayerManager } from './series/seriesLayerManager';
import { SeriesStateManager } from './series/seriesStateManager';
import { Tooltip } from './tooltip/tooltip';
import { BaseLayoutProcessor } from './update/baseLayoutProcessor';
import { UpdateService } from './updateService';
function initialiseSpecialOverrides(opts) {
    let globalWindow;
    if (opts.window != null) {
        globalWindow = opts.window;
    }
    else if (typeof window !== 'undefined') {
        globalWindow = window;
    }
    else if (typeof global !== 'undefined') {
        globalWindow = global.window;
    }
    else {
        throw new Error('ZING Charts - unable to resolve global window');
    }
    let globalDocument;
    if (opts.document != null) {
        globalDocument = opts.document;
    }
    else if (typeof document !== 'undefined') {
        globalDocument = document;
    }
    else if (typeof global !== 'undefined') {
        globalDocument = global.document;
    }
    else {
        throw new Error('ZING Charts - unable to resolve global document');
    }
    return {
        document: globalDocument,
        window: globalWindow,
        overrideDevicePixelRatio: opts.overrideDevicePixelRatio,
        sceneMode: opts.sceneMode,
    };
}
class SeriesArea {
    constructor() {
        this.clip = undefined;
        this.padding = new Padding(0);
    }
}
__decorate([
    Validate(BOOLEAN, { optional: true })
], SeriesArea.prototype, "clip", void 0);
export const chartsInstances = new WeakMap();
export class Chart extends Observable {
    static getInstance(element) {
        return chartsInstances.get(element);
    }
    getOptions() {
        var _a;
        const { queuedUserOptions } = this;
        const lastUpdateOptions = (_a = queuedUserOptions[queuedUserOptions.length - 1]) !== null && _a !== void 0 ? _a : this.userOptions;
        return jsonClone(lastUpdateOptions);
    }
    autoSizeChanged(value) {
        const { style } = this.element;
        if (value) {
            style.display = 'block';
            style.width = '100%';
            style.height = '100%';
            if (!this._lastAutoSize) {
                return;
            }
            this.resize(undefined, undefined, 'autoSize option');
        }
        else {
            style.display = 'inline-block';
            style.width = 'auto';
            style.height = 'auto';
        }
    }
    download(fileName, fileFormat) {
        this.scene.download(fileName, fileFormat);
    }
    get seriesArea() {
        return this._seriesArea;
    }
    set seriesArea(newArea) {
        if (!newArea) {
            this._seriesArea = new SeriesArea();
        }
        else {
            this._seriesArea = newArea;
        }
    }
    get destroyed() {
        return this._destroyed;
    }
    constructor(specialOverrides, resources) {
        var _a;
        super();
        this.id = createId(this);
        this.processedOptions = {};
        this.userOptions = {};
        this.queuedUserOptions = [];
        this.seriesRoot = new Group({ name: `${this.id}-Series-root` });
        this.debug = Debug.create();
        this.extraDebugStats = {};
        this.container = undefined;
        this.data = [];
        this._firstAutoSize = true;
        this.padding = new Padding(20);
        this._seriesArea = new SeriesArea();
        this.title = undefined;
        this.subtitle = undefined;
        this.footnote = undefined;
        this.mode = 'standalone';
        this._destroyed = false;
        this._destroyFns = [];
        this.modules = new Map(); // TODO shouldn't be public
        this.legends = new Map();
        this.processors = [];
        this._pendingFactoryUpdatesCount = 0;
        this._performUpdateNoRenderCount = 0;
        this._performUpdateType = ChartUpdateType.NONE;
        this._performUpdateSkipAnimations = false;
        this.updateShortcutCount = 0;
        this.seriesToUpdate = new Set();
        this.updateMutex = new Mutex();
        this.updateRequestors = {};
        this.performUpdateTrigger = debouncedCallback(({ count }) => __awaiter(this, void 0, void 0, function* () {
            if (this._destroyed)
                return;
            this.updateMutex.acquire(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.performUpdate(count);
                }
                catch (error) {
                    this._lastPerformUpdateError = error;
                    Logger.error('update error', error);
                }
            }));
        }));
        this._axes = [];
        this._series = [];
        this.lastInteractionEvent = undefined;
        this.pointerScheduler = debouncedAnimationFrame(() => {
            if (this.lastInteractionEvent) {
                this.handlePointer(this.lastInteractionEvent);
            }
            this.lastInteractionEvent = undefined;
        });
        this.onSeriesNodeClick = (event) => {
            const seriesNodeClickEvent = Object.assign(Object.assign({}, event), { type: 'seriesNodeClick' });
            Object.defineProperty(seriesNodeClickEvent, 'series', {
                enumerable: false,
                // Should display the deprecation warning
                get: () => event.series,
            });
            this.fireEvent(seriesNodeClickEvent);
        };
        this.onSeriesNodeDoubleClick = (event) => {
            const seriesNodeDoubleClick = Object.assign(Object.assign({}, event), { type: 'seriesNodeDoubleClick' });
            this.fireEvent(seriesNodeDoubleClick);
        };
        this.specialOverrides = initialiseSpecialOverrides(specialOverrides);
        const { window, document } = this.specialOverrides;
        const scene = resources === null || resources === void 0 ? void 0 : resources.scene;
        const element = (_a = resources === null || resources === void 0 ? void 0 : resources.element) !== null && _a !== void 0 ? _a : document.createElement('div');
        const container = resources === null || resources === void 0 ? void 0 : resources.container;
        const root = new Group({ name: 'root' });
        // Prevent the scene from rendering chart components in an invalid state
        // (before first layout is performed).
        root.visible = false;
        root.append(this.seriesRoot);
        this.axisGridGroup = new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX });
        root.appendChild(this.axisGridGroup);
        this.axisGroup = new Group({ name: 'Axes', layer: true, zIndex: Layers.AXIS_ZINDEX });
        root.appendChild(this.axisGroup);
        this.element = element;
        element.classList.add('zing-chart-wrapper');
        element.style.position = 'relative';
        this.scene = scene !== null && scene !== void 0 ? scene : new Scene(this.specialOverrides);
        this.scene.root = root;
        this.scene.container = element;
        this.autoSize = true;
        this.chartEventManager = new ChartEventManager();
        this.cursorManager = new CursorManager(element);
        this.highlightManager = new HighlightManager();
        this.interactionManager = new InteractionManager(element, document, window);
        this.zoomManager = new ZoomManager();
        this.layoutService = new LayoutService();
        this.updateService = new UpdateService((type = ChartUpdateType.FULL, { forceNodeDataRefresh, skipAnimations }) => this.update(type, { forceNodeDataRefresh, skipAnimations }));
        this.seriesStateManager = new SeriesStateManager();
        this.seriesLayerManager = new SeriesLayerManager(this.seriesRoot);
        this.callbackCache = new CallbackCache();
        this.animationManager = new AnimationManager(this.interactionManager, this.updateMutex);
        this.animationManager.skip();
        this.animationManager.play();
        this.processors = [new BaseLayoutProcessor(this, this.layoutService)];
        this.tooltip = new Tooltip(this.scene.canvas.element, document, window, document.body);
        this.tooltipManager = new TooltipManager(this.tooltip, this.interactionManager);
        this.overlays = new ChartOverlays(this.element);
        this.highlight = new ChartHighlight();
        this.container = container;
        SizeMonitor.observe(this.element, (size) => this.rawResize(size));
        this._destroyFns.push(this.interactionManager.addListener('click', (event) => this.onClick(event)), this.interactionManager.addListener('dblclick', (event) => this.onDoubleClick(event)), this.interactionManager.addListener('hover', (event) => this.onMouseMove(event)), this.interactionManager.addListener('leave', (event) => this.onLeave(event)), this.interactionManager.addListener('page-left', () => this.destroy()), this.interactionManager.addListener('wheel', () => this.disablePointer()), 
        // Block redundant and interfering attempts to update the hovered element during dragging.
        this.interactionManager.addListener('drag-start', () => this.disablePointer()), this.animationManager.addListener('animation-frame', (_) => {
            this.update(ChartUpdateType.SCENE_RENDER);
        }), this.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)), this.zoomManager.addListener('zoom-change', (_) => this.update(ChartUpdateType.PROCESS_DATA, { forceNodeDataRefresh: true, skipAnimations: true })));
        this.attachLegend('category', Legend);
        this.legend = this.legends.get('category');
    }
    addModule(module) {
        if (this.modules.has(module.optionsKey)) {
            throw new Error(`ZING Charts - module already initialised: ${module.optionsKey}`);
        }
        const moduleInstance = new module.instanceConstructor(this.getModuleContext());
        if (module.type === 'legend') {
            const legend = moduleInstance;
            this.legends.set(module.identifier, legend);
            legend.attachLegend(this.scene.root);
        }
        this.modules.set(module.optionsKey, moduleInstance);
    }
    removeModule(module) {
        var _a;
        if (module.type === 'legend') {
            this.legends.delete(module.identifier);
        }
        (_a = this.modules.get(module.optionsKey)) === null || _a === void 0 ? void 0 : _a.destroy();
        this.modules.delete(module.optionsKey);
    }
    attachLegend(legendType, legendConstructor) {
        const legend = new legendConstructor(this.getModuleContext());
        this.legends.set(legendType, legend);
        legend.attachLegend(this.scene.root);
    }
    isModuleEnabled(module) {
        return this.modules.has(module.optionsKey);
    }
    getModuleContext() {
        const { scene, animationManager, chartEventManager, cursorManager, highlightManager, interactionManager, tooltipManager, zoomManager, layoutService, updateService, seriesStateManager, seriesLayerManager, callbackCache, specialOverrides: { window, document }, } = this;
        return {
            window,
            document,
            scene,
            animationManager,
            chartEventManager,
            cursorManager,
            highlightManager,
            interactionManager,
            tooltipManager,
            zoomManager,
            chartService: this,
            layoutService,
            updateService,
            seriesStateManager,
            seriesLayerManager,
            callbackCache,
        };
    }
    destroy(opts) {
        if (this._destroyed) {
            return;
        }
        const keepTransferableResources = opts === null || opts === void 0 ? void 0 : opts.keepTransferableResources;
        let result;
        this._performUpdateType = ChartUpdateType.NONE;
        this._destroyFns.forEach((fn) => fn());
        this.processors.forEach((p) => p.destroy());
        this.tooltipManager.destroy();
        this.tooltip.destroy();
        this.legends.forEach((legend) => legend.destroy());
        this.legends.clear();
        this.overlays.destroy();
        SizeMonitor.unobserve(this.element);
        for (const { instance: moduleInstance } of Object.values(this.modules)) {
            this.removeModule(moduleInstance);
        }
        this.interactionManager.destroy();
        this.animationManager.stop();
        if (keepTransferableResources) {
            this.scene.strip();
            result = { container: this.container, scene: this.scene, element: this.element };
        }
        else {
            this.scene.destroy();
            this.container = undefined;
        }
        this.removeAllSeries();
        this.seriesLayerManager.destroy();
        this.axes.forEach((a) => a.destroy());
        this.axes = [];
        this.callbackCache.invalidateCache();
        this._destroyed = true;
        return result;
    }
    disablePointer(highlightOnly = false) {
        if (!highlightOnly) {
            this.tooltipManager.removeTooltip(this.id);
        }
        this.highlightManager.updateHighlight(this.id);
        if (this.lastInteractionEvent) {
            this.lastInteractionEvent = undefined;
        }
    }
    requestFactoryUpdate(cb) {
        this._pendingFactoryUpdatesCount++;
        this.updateMutex.acquire(() => __awaiter(this, void 0, void 0, function* () {
            yield cb();
            this._pendingFactoryUpdatesCount--;
        }));
    }
    get performUpdateType() {
        return this._performUpdateType;
    }
    get lastPerformUpdateError() {
        return this._lastPerformUpdateError;
    }
    update(type = ChartUpdateType.FULL, opts) {
        var _a, _b;
        const { forceNodeDataRefresh = false, skipAnimations, seriesToUpdate = this.series, newAnimationBatch, } = opts !== null && opts !== void 0 ? opts : {};
        if (forceNodeDataRefresh) {
            this.series.forEach((series) => series.markNodeDataDirty());
        }
        for (const series of seriesToUpdate) {
            this.seriesToUpdate.add(series);
        }
        if (skipAnimations) {
            this.animationManager.skipCurrentBatch();
            this._performUpdateSkipAnimations = true;
        }
        if (newAnimationBatch) {
            if (this.animationManager.isActive()) {
                this._performUpdateSkipAnimations = true;
            }
            else {
                (_a = this._performUpdateSkipAnimations) !== null && _a !== void 0 ? _a : (this._performUpdateSkipAnimations = false);
            }
        }
        if (Debug.check(true)) {
            let stack = (_b = new Error().stack) !== null && _b !== void 0 ? _b : '<unknown>';
            stack = stack.replace(/\([^)]*/g, '');
            this.updateRequestors[stack] = type;
        }
        if (type < this._performUpdateType) {
            this._performUpdateType = type;
            this.performUpdateTrigger.schedule(opts === null || opts === void 0 ? void 0 : opts.backOffMs);
        }
    }
    performUpdate(count) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { _performUpdateType: performUpdateType, extraDebugStats } = this;
            const seriesToUpdate = [...this.seriesToUpdate];
            // Clear state immediately so that side-effects can be detected prior to SCENE_RENDER.
            this._performUpdateType = ChartUpdateType.NONE;
            this.seriesToUpdate.clear();
            if (this.updateShortcutCount === 0 && performUpdateType < ChartUpdateType.SCENE_RENDER) {
                this.animationManager.startBatch(this._performUpdateSkipAnimations);
            }
            this.debug('Chart.performUpdate() - start', ChartUpdateType[performUpdateType]);
            const splits = { start: performance.now() };
            switch (performUpdateType) {
                case ChartUpdateType.FULL:
                case ChartUpdateType.PROCESS_DATA:
                    yield this.processData();
                    this.disablePointer(true);
                    splits['🏭'] = performance.now();
                // fallthrough
                case ChartUpdateType.PERFORM_LAYOUT:
                    if (this.checkUpdateShortcut(ChartUpdateType.PERFORM_LAYOUT))
                        break;
                    if (!this.checkFirstAutoSize(seriesToUpdate))
                        break;
                    yield this.processLayout();
                    splits['⌖'] = performance.now();
                // fallthrough
                case ChartUpdateType.SERIES_UPDATE:
                    if (this.checkUpdateShortcut(ChartUpdateType.SERIES_UPDATE))
                        break;
                    const { seriesRect } = this;
                    const seriesUpdates = [...seriesToUpdate].map((series) => series.update({ seriesRect }));
                    yield Promise.all(seriesUpdates);
                    splits['🤔'] = performance.now();
                // fallthrough
                case ChartUpdateType.TOOLTIP_RECALCULATION:
                    if (this.checkUpdateShortcut(ChartUpdateType.TOOLTIP_RECALCULATION))
                        break;
                    const tooltipMeta = this.tooltipManager.getTooltipMeta(this.id);
                    const isHovered = ((_a = tooltipMeta === null || tooltipMeta === void 0 ? void 0 : tooltipMeta.event) === null || _a === void 0 ? void 0 : _a.type) === 'hover';
                    if (performUpdateType <= ChartUpdateType.SERIES_UPDATE && isHovered) {
                        this.handlePointer(tooltipMeta.event);
                    }
                    splits['↖'] = performance.now();
                // fallthrough
                case ChartUpdateType.SCENE_RENDER:
                    if (this.checkUpdateShortcut(ChartUpdateType.SCENE_RENDER))
                        break;
                    extraDebugStats['updateShortcutCount'] = this.updateShortcutCount;
                    yield this.scene.render({ debugSplitTimes: splits, extraDebugStats });
                    this.extraDebugStats = {};
                // fallthrough
                case ChartUpdateType.NONE:
                    // Do nothing.
                    this.updateShortcutCount = 0;
                    this.updateRequestors = {};
                    this._performUpdateSkipAnimations = undefined;
                    this.animationManager.endBatch();
            }
            this.updateService.dispatchUpdateComplete(this.getMinRect());
            const end = performance.now();
            this.debug('Chart.performUpdate() - end', {
                chart: this,
                durationMs: Math.round((end - splits['start']) * 100) / 100,
                count,
                performUpdateType: ChartUpdateType[performUpdateType],
            });
        });
    }
    checkUpdateShortcut(checkUpdateType) {
        const maxShortcuts = 3;
        if (this.updateShortcutCount > maxShortcuts) {
            Logger.warn(`exceeded the maximum number of simultaneous updates (${maxShortcuts + 1}), discarding changes and rendering`, this.updateRequestors);
            return false;
        }
        if (this.performUpdateType <= checkUpdateType) {
            // A previous step modified series state, and we need to re-run this or an earlier step before rendering.
            this.updateShortcutCount++;
            return true;
        }
        return false;
    }
    checkFirstAutoSize(seriesToUpdate) {
        if (this.autoSize && !this._lastAutoSize) {
            const count = this._performUpdateNoRenderCount++;
            const backOffMs = (count ^ 2) * 10;
            if (count < 8) {
                // Reschedule if canvas size hasn't been set yet to avoid a race.
                this.update(ChartUpdateType.PERFORM_LAYOUT, { seriesToUpdate, backOffMs });
                this.debug('Chart.checkFirstAutoSize() - backing off until first size update', backOffMs);
                return false;
            }
            // After several failed passes, continue and accept there maybe a redundant
            // render. Sometimes this case happens when we already have the correct
            // width/height, and we end up never rendering the chart in that scenario.
            this.debug('Chart.checkFirstAutoSize() - timeout for first size update.');
        }
        this._performUpdateNoRenderCount = 0;
        return true;
    }
    set axes(values) {
        const removedAxes = new Set();
        this._axes.forEach((axis) => {
            axis.detachAxis(this.axisGroup, this.axisGridGroup);
            removedAxes.add(axis);
        });
        // make linked axes go after the regular ones (simulates stable sort by `linkedTo` property)
        this._axes = values.filter((a) => !a.linkedTo).concat(values.filter((a) => a.linkedTo));
        this._axes.forEach((axis) => {
            axis.attachAxis(this.axisGroup, this.axisGridGroup);
            removedAxes.delete(axis);
        });
        this.zoomManager.updateAxes(this._axes);
        removedAxes.forEach((axis) => axis.destroy());
    }
    get axes() {
        return this._axes;
    }
    set series(values) {
        this.removeAllSeries();
        this.seriesLayerManager.setSeriesCount(values.length);
        values.forEach((series) => this.addSeries(series));
    }
    get series() {
        return this._series;
    }
    addSeries(series) {
        const { series: allSeries } = this;
        const canAdd = allSeries.indexOf(series) < 0;
        if (canAdd) {
            allSeries.push(series);
            if (series.rootGroup.parent == null) {
                this.seriesLayerManager.requestGroup(series);
            }
            this.initSeries(series);
            return true;
        }
        return false;
    }
    initSeries(series) {
        const chart = this;
        series.chart = {
            get mode() {
                return chart.mode;
            },
            get seriesRect() {
                return chart.seriesRect;
            },
            placeLabels() {
                return chart.placeLabels();
            },
        };
        series.setChartData(this.data);
        this.addSeriesListeners(series);
        series.addChartEventListeners();
    }
    removeAllSeries() {
        this.series.forEach((series) => {
            series.removeEventListener('nodeClick', this.onSeriesNodeClick);
            series.removeEventListener('nodeDoubleClick', this.onSeriesNodeDoubleClick);
            series.destroy();
            series.chart = undefined;
        });
        this._series = []; // using `_series` instead of `series` to prevent infinite recursion
    }
    addSeriesListeners(series) {
        if (this.hasEventListener('seriesNodeClick')) {
            series.addEventListener('nodeClick', this.onSeriesNodeClick);
        }
        if (this.hasEventListener('seriesNodeDoubleClick')) {
            series.addEventListener('nodeDoubleClick', this.onSeriesNodeDoubleClick);
        }
    }
    updateAllSeriesListeners() {
        this.series.forEach((series) => {
            series.removeEventListener('nodeClick', this.onSeriesNodeClick);
            series.removeEventListener('nodeDoubleClick', this.onSeriesNodeDoubleClick);
            this.addSeriesListeners(series);
        });
    }
    assignSeriesToAxes() {
        this.axes.forEach((axis) => {
            axis.boundSeries = this.series.filter((s) => {
                const seriesAxis = s.axes[axis.direction];
                return seriesAxis === axis;
            });
        });
    }
    assignAxesToSeries() {
        // This method has to run before `assignSeriesToAxes`.
        const directionToAxesMap = {};
        this.axes.forEach((axis) => {
            var _a;
            const direction = axis.direction;
            const directionAxes = ((_a = directionToAxesMap[direction]) !== null && _a !== void 0 ? _a : (directionToAxesMap[direction] = []));
            directionAxes.push(axis);
        });
        this.series.forEach((series) => {
            series.directions.forEach((direction) => {
                const directionAxes = directionToAxesMap[direction];
                if (!directionAxes) {
                    Logger.warnOnce(`no available axis for direction [${direction}]; check series and axes configuration.`);
                    return;
                }
                const seriesKeys = series.getKeys(direction);
                const newAxis = this.findMatchingAxis(directionAxes, seriesKeys);
                if (!newAxis) {
                    Logger.warnOnce(`no matching axis for direction [${direction}] and keys [${seriesKeys}]; check series and axes configuration.`);
                    return;
                }
                series.axes[direction] = newAxis;
            });
        });
    }
    findMatchingAxis(directionAxes, directionKeys) {
        for (const axis of directionAxes) {
            const axisKeys = axis.keys;
            if (!axisKeys.length) {
                return axis;
            }
            if (!directionKeys) {
                continue;
            }
            for (const directionKey of directionKeys) {
                if (axisKeys.indexOf(directionKey) >= 0) {
                    return axis;
                }
            }
        }
    }
    rawResize(size) {
        var _a;
        let { width, height } = size;
        width = Math.floor(width);
        height = Math.floor(height);
        if (!this.autoSize) {
            return;
        }
        if (width === 0 && height === 0) {
            return;
        }
        const [autoWidth = 0, authHeight = 0] = (_a = this._lastAutoSize) !== null && _a !== void 0 ? _a : [];
        if (autoWidth === width && authHeight === height) {
            return;
        }
        this._lastAutoSize = [width, height];
        this.resize(undefined, undefined, 'SizeMonitor');
    }
    resize(width, height, source) {
        var _a, _b, _c, _d;
        width !== null && width !== void 0 ? width : (width = (_a = this.width) !== null && _a !== void 0 ? _a : (this.autoSize ? (_b = this._lastAutoSize) === null || _b === void 0 ? void 0 : _b[0] : this.scene.canvas.width));
        height !== null && height !== void 0 ? height : (height = (_c = this.height) !== null && _c !== void 0 ? _c : (this.autoSize ? (_d = this._lastAutoSize) === null || _d === void 0 ? void 0 : _d[1] : this.scene.canvas.height));
        this.debug(`Chart.resize() from ${source}`, { width, height, stack: new Error().stack });
        if (!width || !height || !Number.isFinite(width) || !Number.isFinite(height))
            return;
        if (this.scene.resize(width, height)) {
            this.disablePointer();
            this.animationManager.reset();
            let skipAnimations = true;
            if (this.autoSize && this._firstAutoSize) {
                skipAnimations = false;
                this._firstAutoSize = false;
            }
            this.update(ChartUpdateType.PERFORM_LAYOUT, { forceNodeDataRefresh: true, skipAnimations });
        }
    }
    processData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.series.some((s) => s.canHaveAxes)) {
                this.assignAxesToSeries();
                this.assignSeriesToAxes();
            }
            const dataController = new DataController(this.mode);
            const seriesPromises = this.series.map((s) => s.processData(dataController));
            yield dataController.execute();
            yield Promise.all(seriesPromises);
            yield this.updateLegend();
        });
    }
    placeLabels() {
        const visibleSeries = [];
        const data = [];
        for (const series of this.series) {
            if (!series.visible) {
                continue;
            }
            const labelData = series.getLabelData();
            if (!(labelData && isPointLabelDatum(labelData[0]))) {
                continue;
            }
            data.push(labelData);
            visibleSeries.push(series);
        }
        const { seriesRect } = this;
        const { top, right, bottom, left } = this.seriesArea.padding;
        const labels = seriesRect && data.length > 0
            ? placeLabels(data, {
                x: -left,
                y: -top,
                width: seriesRect.width + left + right,
                height: seriesRect.height + top + bottom,
            })
            : [];
        return new Map(labels.map((l, i) => [visibleSeries[i], l]));
    }
    updateLegend() {
        return __awaiter(this, void 0, void 0, function* () {
            this.legends.forEach((legend, legendType) => {
                const isCategoryLegendData = (data) => data.every((d) => d.legendType === 'category');
                const legendData = this.series
                    .filter((s) => s.properties.showInLegend)
                    .flatMap((s) => s.getLegendData(legendType));
                if (isCategoryLegendData(legendData)) {
                    this.validateCategoryLegendData(legendData);
                }
                legend.data = legendData;
            });
        });
    }
    validateCategoryLegendData(legendData) {
        // Validate each series that shares a legend item label uses the same fill colour
        const labelMarkerFills = {};
        legendData.forEach((d) => {
            var _a, _b, _c;
            var _d, _e;
            const seriesType = (_a = this.series.find((s) => s.id === d.seriesId)) === null || _a === void 0 ? void 0 : _a.type;
            if (!seriesType)
                return;
            (_b = labelMarkerFills[seriesType]) !== null && _b !== void 0 ? _b : (labelMarkerFills[seriesType] = {});
            (_c = (_d = labelMarkerFills[seriesType])[_e = d.label.text]) !== null && _c !== void 0 ? _c : (_d[_e] = new Set());
            if (d.marker.fill != null) {
                labelMarkerFills[seriesType][d.label.text].add(d.marker.fill);
            }
        });
        for (const seriesMarkers of Object.values(labelMarkerFills)) {
            for (const [name, fills] of Object.entries(seriesMarkers)) {
                if (fills.size > 1) {
                    Logger.warnOnce(`legend item '${name}' has multiple fill colors, this may cause unexpected behaviour.`);
                }
            }
        }
    }
    processLayout() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const oldRect = this.animationRect;
            yield this.performLayout();
            if (oldRect && !((_a = this.animationRect) === null || _a === void 0 ? void 0 : _a.equals(oldRect))) {
                // Skip animations if the layout changed.
                this.animationManager.skipCurrentBatch();
            }
            this.handleOverlays();
            this.debug('Chart.performUpdate() - seriesRect', this.seriesRect);
        });
    }
    performLayout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.scene.root) {
                this.scene.root.visible = true;
            }
            const { width, height } = this.scene;
            let ctx = { shrinkRect: new BBox(0, 0, width, height) };
            ctx = this.layoutService.dispatchPerformLayout('start-layout', ctx);
            ctx = this.layoutService.dispatchPerformLayout('before-series', ctx);
            return ctx.shrinkRect;
        });
    }
    // x/y are local canvas coordinates in CSS pixels, not actual pixels
    pickSeriesNode(point, exactMatchOnly, maxDistance) {
        var _a, _b;
        const start = performance.now();
        // Disable 'nearest match' options if looking for exact matches only
        const pickModes = exactMatchOnly ? [SeriesNodePickMode.EXACT_SHAPE_MATCH] : undefined;
        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...this.series].reverse();
        let result;
        for (const series of reverseSeries) {
            if (!series.visible || !series.rootGroup.visible) {
                continue;
            }
            const { match, distance } = (_a = series.pickNode(point, pickModes)) !== null && _a !== void 0 ? _a : {};
            if (!match || distance == null) {
                continue;
            }
            if ((!result || result.distance > distance) && distance <= (maxDistance !== null && maxDistance !== void 0 ? maxDistance : Infinity)) {
                result = { series, distance, datum: match };
            }
            if (distance === 0) {
                break;
            }
        }
        this.extraDebugStats['pickSeriesNode'] = Math.round(((_b = this.extraDebugStats['pickSeriesNode']) !== null && _b !== void 0 ? _b : 0) + (performance.now() - start));
        return result;
    }
    onMouseMove(event) {
        this.lastInteractionEvent = event;
        this.pointerScheduler.schedule();
        this.extraDebugStats['mouseX'] = event.offsetX;
        this.extraDebugStats['mouseY'] = event.offsetY;
        this.update(ChartUpdateType.SCENE_RENDER);
    }
    onLeave(event) {
        if (this.tooltip.pointerLeftOntoTooltip(event)) {
            return;
        }
        this.disablePointer();
        this.update(ChartUpdateType.SCENE_RENDER);
    }
    handlePointer(event) {
        const { lastPick, hoverRect } = this;
        const { offsetX, offsetY } = event;
        const disablePointer = (highlightOnly = false) => {
            if (lastPick) {
                // Cursor moved from a non-marker node to empty space.
                this.disablePointer(highlightOnly);
            }
        };
        if (!(hoverRect === null || hoverRect === void 0 ? void 0 : hoverRect.containsPoint(offsetX, offsetY))) {
            disablePointer();
            return;
        }
        // Handle node highlighting and tooltip toggling when pointer within `tooltip.range`
        this.handlePointerTooltip(event, disablePointer);
        // Handle node highlighting and mouse cursor when pointer withing `series[].nodeClickRange`
        this.handlePointerNode(event);
    }
    handlePointerTooltip(event, disablePointer) {
        const { lastPick, tooltip } = this;
        const { range } = tooltip;
        const { offsetX, offsetY } = event;
        let pixelRange;
        if (typeof range === 'number' && Number.isFinite(range)) {
            pixelRange = range;
        }
        const pick = this.pickSeriesNode({ x: offsetX, y: offsetY }, range === 'exact', pixelRange);
        if (!pick) {
            this.tooltipManager.removeTooltip(this.id);
            if (this.highlight.range === 'tooltip')
                disablePointer(true);
            return;
        }
        const isNewDatum = this.highlight.range === 'node' || !lastPick || lastPick.datum !== pick.datum;
        let html;
        if (isNewDatum) {
            html = pick.series.getTooltipHtml(pick.datum);
            if (this.highlight.range === 'tooltip') {
                this.highlightManager.updateHighlight(this.id, pick.datum);
            }
        }
        else if (lastPick) {
            lastPick.event = event.sourceEvent;
        }
        const isPixelRange = pixelRange != null;
        const tooltipEnabled = this.tooltip.enabled && pick.series.properties.tooltip.enabled;
        const exactlyMatched = range === 'exact' && pick.distance === 0;
        const rangeMatched = range === 'nearest' || isPixelRange || exactlyMatched;
        const shouldUpdateTooltip = tooltipEnabled && rangeMatched && (!isNewDatum || html !== undefined);
        const meta = TooltipManager.makeTooltipMeta(event, this.scene.canvas, pick.datum, this.specialOverrides.window);
        if (shouldUpdateTooltip) {
            this.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }
    handlePointerNode(event) {
        const found = this.checkSeriesNodeRange(event, (series, datum) => {
            if (series.hasEventListener('nodeClick') || series.hasEventListener('nodeDoubleClick')) {
                this.cursorManager.updateCursor('chart', 'pointer');
            }
            if (this.highlight.range === 'node') {
                this.highlightManager.updateHighlight(this.id, datum);
            }
        });
        if (!found) {
            this.cursorManager.updateCursor('chart');
            if (this.highlight.range === 'node') {
                this.highlightManager.updateHighlight(this.id);
            }
        }
    }
    onClick(event) {
        if (this.checkSeriesNodeClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            return;
        }
        this.fireEvent({
            type: 'click',
            event: event.sourceEvent,
        });
    }
    onDoubleClick(event) {
        if (this.checkSeriesNodeDoubleClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            return;
        }
        this.fireEvent({
            type: 'doubleClick',
            event: event.sourceEvent,
        });
    }
    checkSeriesNodeClick(event) {
        return this.checkSeriesNodeRange(event, (series, datum) => series.fireNodeClickEvent(event.sourceEvent, datum));
    }
    checkSeriesNodeDoubleClick(event) {
        return this.checkSeriesNodeRange(event, (series, datum) => series.fireNodeDoubleClickEvent(event.sourceEvent, datum));
    }
    checkSeriesNodeRange(event, callback) {
        const nearestNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, false);
        const datum = nearestNode === null || nearestNode === void 0 ? void 0 : nearestNode.datum;
        const nodeClickRange = datum === null || datum === void 0 ? void 0 : datum.series.properties.nodeClickRange;
        let pixelRange;
        if (typeof nodeClickRange === 'number' && Number.isFinite(nodeClickRange)) {
            pixelRange = nodeClickRange;
        }
        // Find the node if exactly matched and update the highlight picked node
        let pickedNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, true);
        if (pickedNode) {
            this.highlightManager.updatePicked(this.id, pickedNode.datum);
        }
        else {
            this.highlightManager.updatePicked(this.id);
        }
        // First check if we should trigger the callback based on nearest node
        if (datum && nodeClickRange === 'nearest') {
            callback(datum.series, datum);
            return true;
        }
        if (nodeClickRange !== 'exact') {
            pickedNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, false, pixelRange);
        }
        if (!pickedNode)
            return false;
        // Then if we've picked a node within the pixel range, or exactly, trigger the callback
        const isPixelRange = pixelRange != null;
        const exactlyMatched = nodeClickRange === 'exact' && pickedNode.distance === 0;
        if (isPixelRange || exactlyMatched) {
            callback(pickedNode.series, pickedNode.datum);
            return true;
        }
        return false;
    }
    changeHighlightDatum(event) {
        var _a, _b;
        const seriesToUpdate = new Set();
        const { series: newSeries = undefined, datum: newDatum } = (_a = event.currentHighlight) !== null && _a !== void 0 ? _a : {};
        const { series: lastSeries = undefined, datum: lastDatum } = (_b = event.previousHighlight) !== null && _b !== void 0 ? _b : {};
        if (lastSeries) {
            seriesToUpdate.add(lastSeries);
        }
        if (newSeries) {
            seriesToUpdate.add(newSeries);
        }
        // Adjust cursor if a specific datum is highlighted, rather than just a series.
        if ((lastSeries === null || lastSeries === void 0 ? void 0 : lastSeries.properties.cursor) && lastDatum) {
            this.cursorManager.updateCursor(lastSeries.id);
        }
        if ((newSeries === null || newSeries === void 0 ? void 0 : newSeries.properties.cursor) && newDatum) {
            this.cursorManager.updateCursor(newSeries.id, newSeries.properties.cursor);
        }
        this.lastPick = event.currentHighlight ? { datum: event.currentHighlight } : undefined;
        const updateAll = newSeries == null || lastSeries == null;
        if (updateAll) {
            this.update(ChartUpdateType.SERIES_UPDATE);
        }
        else {
            this.update(ChartUpdateType.SERIES_UPDATE, { seriesToUpdate });
        }
    }
    waitForUpdate(timeoutMs = 5000) {
        return __awaiter(this, void 0, void 0, function* () {
            const start = performance.now();
            if (this._pendingFactoryUpdatesCount > 0) {
                // Await until any pending updates are flushed through.
                yield this.updateMutex.waitForClearAcquireQueue();
            }
            while (this._performUpdateType !== ChartUpdateType.NONE) {
                if (performance.now() - start > timeoutMs) {
                    throw new Error('waitForUpdate() timeout reached.');
                }
                yield sleep(5);
            }
            // Await until any remaining updates are flushed through.
            yield this.updateMutex.waitForClearAcquireQueue();
        });
    }
    handleOverlays() {
        const hasNoData = !this.series.some((s) => s.hasData());
        this.toggleOverlay(this.overlays.noData, hasNoData);
        if (!hasNoData) {
            // Don't draw both text overlays at the same time.
            const hasNoVisibleSeries = !this.series.some((series) => series.visible);
            this.toggleOverlay(this.overlays.noVisibleSeries, hasNoVisibleSeries);
        }
    }
    toggleOverlay(overlay, visible) {
        if (visible && this.seriesRect) {
            overlay.show(this.seriesRect);
        }
        else {
            overlay.hide();
        }
    }
    getMinRect() {
        const minRects = this.series.map((series) => series.getMinRect()).filter((rect) => rect !== undefined);
        if (!minRects.length)
            return undefined;
        return new BBox(0, 0, minRects.reduce((max, rect) => Math.max(max, rect.width), 0), minRects.reduce((max, rect) => Math.max(max, rect.height), 0));
    }
}
__decorate([
    ActionOnSet({
        newValue(value) {
            if (this.destroyed)
                return;
            value.setAttribute('data-zing-charts', '');
            value.appendChild(this.element);
            chartsInstances.set(value, this);
        },
        oldValue(value) {
            value.removeAttribute('data-zing-charts');
            value.removeChild(this.element);
            chartsInstances.delete(value);
        },
    })
], Chart.prototype, "container", void 0);
__decorate([
    ActionOnSet({
        newValue(value) {
            var _a;
            (_a = this.series) === null || _a === void 0 ? void 0 : _a.forEach((series) => {
                series.setChartData(value);
            });
        },
    })
], Chart.prototype, "data", void 0);
__decorate([
    ActionOnSet({
        newValue(value) {
            this.resize(value, undefined, 'width option');
        },
    })
], Chart.prototype, "width", void 0);
__decorate([
    ActionOnSet({
        newValue(value) {
            this.resize(undefined, value, 'height option');
        },
    })
], Chart.prototype, "height", void 0);
__decorate([
    ActionOnSet({
        changeValue(value) {
            this.autoSizeChanged(value);
        },
    }),
    Validate(BOOLEAN)
], Chart.prototype, "autoSize", void 0);
__decorate([
    ActionOnSet({
        newValue(value) {
            var _a;
            (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.appendChild(value.node);
        },
        oldValue(oldValue) {
            var _a;
            (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.removeChild(oldValue.node);
        },
    })
], Chart.prototype, "title", void 0);
__decorate([
    ActionOnSet({
        newValue(value) {
            var _a;
            (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.appendChild(value.node);
        },
        oldValue(oldValue) {
            var _a;
            (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.removeChild(oldValue.node);
        },
    })
], Chart.prototype, "subtitle", void 0);
__decorate([
    ActionOnSet({
        newValue(value) {
            var _a;
            (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.appendChild(value.node);
        },
        oldValue(oldValue) {
            var _a;
            (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.removeChild(oldValue.node);
        },
    })
], Chart.prototype, "footnote", void 0);
__decorate([
    Validate(UNION(['standalone', 'integrated'], 'a chart mode'))
], Chart.prototype, "mode", void 0);
//# sourceMappingURL=chart.js.map