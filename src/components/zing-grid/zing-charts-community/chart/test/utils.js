var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
import { afterEach, beforeEach, expect, jest } from '@jest/globals';
import { Canvas, createCanvas } from 'canvas';
import * as fs from 'fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { mockCanvas } from 'zing-charts-test';
import { ZingCharts, _ModuleSupport } from '../../main';
const { Animation, AnimationManager, resetIds } = _ModuleSupport;
const FAILURE_THRESHOLD = Number((_a = process.env.SNAPSHOT_FAILURE_THRESHOLD) !== null && _a !== void 0 ? _a : 0.001);
export const IMAGE_SNAPSHOT_DEFAULTS = {
    failureThreshold: FAILURE_THRESHOLD,
    failureThresholdType: 'percent',
};
export const CANVAS_TO_BUFFER_DEFAULTS = { compressionLevel: 6, filters: new Canvas(0, 0).PNG_NO_FILTERS };
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
export function prepareTestOptions(options, container = document.body) {
    options.autoSize = false;
    options.width = CANVAS_WIDTH;
    options.height = CANVAS_HEIGHT;
    options.container = container;
    let baseTestTheme = {
        baseTheme: 'zing-default',
        palette: {
            fills: ['#f3622d', '#fba71b', '#57b757', '#41a9c9', '#4258c9', '#9a42c8', '#c84164', '#888888'],
            strokes: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
        },
    };
    if (typeof (options === null || options === void 0 ? void 0 : options.theme) === 'object' && (options === null || options === void 0 ? void 0 : options.theme.palette) != null) {
        // Keep existing theme.
        baseTestTheme = options.theme;
    }
    else if (typeof (options === null || options === void 0 ? void 0 : options.theme) === 'object') {
        // Keep theme supplied, just override palette colours.
        baseTestTheme = Object.assign(Object.assign({}, options.theme), { palette: baseTestTheme.palette });
    }
    else if (typeof (options === null || options === void 0 ? void 0 : options.theme) === 'string') {
        // Override colours.
        baseTestTheme.baseTheme = options.theme;
    }
    options.theme = baseTestTheme;
    return options;
}
function isChartInstance(chartOrProxy) {
    return chartOrProxy.constructor.name !== 'ZingChartInstanceProxy' || chartOrProxy.className != null;
}
export function deproxy(chartOrProxy) {
    return isChartInstance(chartOrProxy) ? chartOrProxy : chartOrProxy.chart;
}
export function repeat(value, count) {
    return new Array(count).fill(value);
}
export function range(start, end, step = 1) {
    const result = new Array(Math.floor((end - start) / step));
    let resultIndex = 0;
    for (let index = start; index <= end; index += step) {
        result[resultIndex++] = index;
    }
    return result;
}
export function dateRange(start, end, step = 24 * 60 * 60 * 1000) {
    const result = [];
    let next = start.getTime();
    const endTime = end.getTime();
    while (next <= endTime) {
        result.push(new Date(next));
        next += step;
    }
    return result;
}
export function waitForChartStability(chartOrProxy, animationAdvanceMs = 0) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const timeoutMs = 5000;
        const chart = deproxy(chartOrProxy);
        const chartAny = chart; // to access private properties
        yield chart.waitForUpdate(timeoutMs);
        if (chart.autoSize === true && !chartAny._lastAutoSize) {
            // Bypass wait for SizeObservable callback - it's never going to be invoked.
            const width = (_a = chart.width) !== null && _a !== void 0 ? _a : chart.scene.canvas.width;
            const height = (_b = chart.height) !== null && _b !== void 0 ? _b : chart.scene.canvas.height;
            chartAny._lastAutoSize = [width, height];
            chartAny.resize(width, height);
            yield chart.waitForUpdate(timeoutMs);
        }
        if (activeAnimateCb) {
            yield activeAnimateCb(0, 1);
            if (animationAdvanceMs > 0) {
                yield activeAnimateCb(animationAdvanceMs, 1);
            }
            yield chart.waitForUpdate(timeoutMs);
        }
        else if (animationAdvanceMs > 0) {
            throw new Error(`animationAdvancedMs is non-zero, but no animation mocks are present.`);
        }
    });
}
export function mouseMoveEvent({ offsetX, offsetY }) {
    const event = new MouseEvent('mousemove', { bubbles: true });
    Object.assign(event, { offsetX, offsetY, pageX: offsetX, pageY: offsetY });
    return event;
}
export function clickEvent({ offsetX, offsetY }) {
    const event = new MouseEvent('click', { bubbles: true });
    Object.assign(event, { offsetX, offsetY, pageX: offsetX, pageY: offsetY });
    return event;
}
export function doubleClickEvent({ offsetX, offsetY }) {
    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.assign(event, { offsetX, offsetY, pageX: offsetX, pageY: offsetY });
    return event;
}
export function wheelEvent({ clientX, clientY, deltaY, }) {
    return new WheelEvent('wheel', { bubbles: true, clientX, clientY, deltaY });
}
export function cartesianChartAssertions(params) {
    const { axisTypes = ['category', 'number'], seriesTypes = ['bar', 'bar'] } = params !== null && params !== void 0 ? params : {};
    return (chartOrProxy) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chart = deproxy(chartOrProxy);
        expect((_a = chart === null || chart === void 0 ? void 0 : chart.constructor) === null || _a === void 0 ? void 0 : _a.name).toEqual('CartesianChart');
        expect(chart.axes).toHaveLength(axisTypes.length);
        expect(chart.axes.map((a) => a.type)).toEqual(axisTypes);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    });
}
export function polarChartAssertions(params) {
    const { seriesTypes = ['pie'] } = params !== null && params !== void 0 ? params : {};
    return (chartOrProxy) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chart = deproxy(chartOrProxy);
        expect((_a = chart === null || chart === void 0 ? void 0 : chart.constructor) === null || _a === void 0 ? void 0 : _a.name).toEqual('PolarChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    });
}
export function hierarchyChartAssertions(params) {
    const { seriesTypes = ['treemap'] } = params !== null && params !== void 0 ? params : {};
    return (chartOrProxy) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chart = deproxy(chartOrProxy);
        expect((_a = chart === null || chart === void 0 ? void 0 : chart.constructor) === null || _a === void 0 ? void 0 : _a.name).toEqual('HierarchyChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    });
}
const checkTargetValid = (target) => {
    if (!target.isConnected)
        throw new Error('Chart must be configured with a container for event testing to work');
};
export function hoverAction(x, y) {
    return (chartOrProxy) => __awaiter(this, void 0, void 0, function* () {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        checkTargetValid(target);
        // Reveal tooltip.
        target === null || target === void 0 ? void 0 : target.dispatchEvent(mouseMoveEvent({ offsetX: x - 1, offsetY: y - 1 }));
        target === null || target === void 0 ? void 0 : target.dispatchEvent(mouseMoveEvent({ offsetX: x, offsetY: y }));
        return delay(50);
    });
}
export function clickAction(x, y) {
    return (chartOrProxy) => __awaiter(this, void 0, void 0, function* () {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        checkTargetValid(target);
        target === null || target === void 0 ? void 0 : target.dispatchEvent(clickEvent({ offsetX: x, offsetY: y }));
        return delay(50);
    });
}
export function doubleClickAction(x, y) {
    return (chartOrProxy) => __awaiter(this, void 0, void 0, function* () {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        // A double click is always preceded by two single clicks, simulate here to ensure correct handling
        target === null || target === void 0 ? void 0 : target.dispatchEvent(clickEvent({ offsetX: x, offsetY: y }));
        target === null || target === void 0 ? void 0 : target.dispatchEvent(clickEvent({ offsetX: x, offsetY: y }));
        yield delay(50);
        yield waitForChartStability(chart);
        target === null || target === void 0 ? void 0 : target.dispatchEvent(doubleClickEvent({ offsetX: x, offsetY: y }));
        return delay(50);
    });
}
export function scrollAction(x, y, delta) {
    return (chartOrProxy) => __awaiter(this, void 0, void 0, function* () {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        target === null || target === void 0 ? void 0 : target.dispatchEvent(wheelEvent({ clientX: x, clientY: y, deltaY: delta }));
        yield delay(50);
    });
}
export function extractImageData({ nodeCanvas, bbox, }) {
    let sourceCanvas = nodeCanvas;
    if (bbox && nodeCanvas) {
        const { x, y, width, height } = bbox;
        sourceCanvas = createCanvas(width, height);
        sourceCanvas === null || sourceCanvas === void 0 ? void 0 : sourceCanvas.getContext('2d').drawImage(nodeCanvas, Math.round(x), Math.round(y), Math.round(width), Math.round(height), 0, 0, Math.round(width), Math.round(height));
    }
    return sourceCanvas === null || sourceCanvas === void 0 ? void 0 : sourceCanvas.toBuffer('image/png', CANVAS_TO_BUFFER_DEFAULTS);
}
export function setupMockCanvas({ width = CANVAS_WIDTH, height = CANVAS_HEIGHT } = {}) {
    const mockCtx = new mockCanvas.MockContext(CANVAS_WIDTH, CANVAS_HEIGHT, document);
    beforeEach(() => {
        resetIds();
        mockCanvas.setup({ mockCtx, width, height, mockText: true });
    });
    afterEach(() => {
        mockCanvas.teardown(mockCtx);
    });
    return mockCtx === null || mockCtx === void 0 ? void 0 : mockCtx.ctx;
}
export function toMatchImage(actual, expected, { writeDiff = true } = {}) {
    // Grab values from enclosing Jest scope.
    const { testPath, currentTestName } = this;
    const width = CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;
    const diff = new PNG({ width, height });
    const result = pixelmatch(actual, expected, diff.data, width, height, { threshold: 0.01 });
    const diffOutputFilename = `${testPath.substring(0, testPath.lastIndexOf('/'))}/__image_snapshots__/${currentTestName}-diff.png`;
    const diffPercentage = (result * 100) / (width * height);
    const pass = diffPercentage <= 0.05;
    if (!pass && writeDiff) {
        fs.writeFileSync(diffOutputFilename, PNG.sync.write(diff));
    }
    else if (fs.existsSync(diffOutputFilename)) {
        fs.unlinkSync(diffOutputFilename);
    }
    return { message: () => `Images were ${result} (${diffPercentage.toFixed(2)}%) pixels different`, pass };
}
export function createChart(options) {
    return __awaiter(this, void 0, void 0, function* () {
        options = prepareTestOptions(Object.assign({}, options));
        const chart = deproxy(ZingCharts.create(options));
        yield waitForChartStability(chart);
        return chart;
    });
}
let activeAnimateCb;
export function spyOnAnimationManager() {
    const mocks = [];
    const rafCbs = new Map();
    let nextRafId = 1;
    const animateParameters = [0, 0];
    let time = Date.now();
    const animateCb = (totalDuration, ratio) => __awaiter(this, void 0, void 0, function* () {
        time += totalDuration * ratio;
        const cbs = [...rafCbs.values()];
        rafCbs.clear();
        yield Promise.all(cbs.map((cb) => cb(time)));
    });
    beforeEach(() => {
        const skippedMock = jest.spyOn(AnimationManager.prototype, 'isSkipped');
        skippedMock.mockImplementation(() => false);
        const animateMock = jest.spyOn(AnimationManager.prototype, 'animate');
        animateMock.mockImplementation((opts) => {
            const controller = new Animation(opts);
            return controller.update(animateParameters[0] * animateParameters[1]);
        });
        const skippingFramesMock = jest.spyOn(AnimationManager.prototype, 'isSkippingFrames');
        skippingFramesMock.mockImplementation(() => false);
        const safMock = jest.spyOn(AnimationManager.prototype, 'scheduleAnimationFrame');
        safMock.mockImplementation(function (cb) {
            this.requestId = nextRafId++;
            const rafId = nextRafId++;
            rafCbs.set(rafId, cb);
        });
        mocks.push(skippedMock, animateMock, skippingFramesMock, safMock);
        if (activeAnimateCb)
            throw new Error('activeAnimateCb already initialized - something is very wrong!');
        activeAnimateCb = animateCb;
    });
    afterEach(() => {
        activeAnimateCb = undefined;
        mocks.forEach((mock) => mock.mockRestore());
        rafCbs.clear();
    });
    return (totalDuration, ratio) => {
        animateParameters[0] = totalDuration;
        animateParameters[1] = ratio;
    };
}
export function reverseAxes(opts, reverse) {
    var _a;
    return Object.assign(Object.assign({}, opts), { axes: (_a = opts.axes) === null || _a === void 0 ? void 0 : _a.map((axis) => (Object.assign(Object.assign({}, axis), { reverse }))) });
}
export function mixinReversedAxesCases(baseCases) {
    const result = Object.assign({}, baseCases);
    Object.entries(baseCases).forEach(([name, baseCase]) => {
        result[name + '_REVERSED_AXES'] = Object.assign(Object.assign({}, baseCase), { options: reverseAxes(baseCase.options, true), warnings: baseCase.skipWarningsReversed === false ? baseCase.warnings : [] });
    });
    return result;
}
