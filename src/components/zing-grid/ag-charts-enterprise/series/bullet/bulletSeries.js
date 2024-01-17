var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { _ModuleSupport, _Scale, _Scene, _Util } from '@/components/zing-grid/ag-charts-community/main.js';
import { BulletSeriesProperties } from './bulletSeriesProperties';
const { animationValidation, collapsedStartingBarPosition, diff, keyProperty, partialAssign, prepareBarAnimationFunctions, resetBarSelectionsFn, seriesLabelFadeInAnimation, valueProperty, } = _ModuleSupport;
const { fromToMotion } = _Scene.motion;
const { sanitizeHtml } = _Util;
const STYLING_KEYS = [
    'fill',
    'fillOpacity',
    'stroke',
    'strokeWidth',
    'strokeOpacity',
    'lineDash',
    'lineDashOffset',
];
export class BulletSeries extends _ModuleSupport.AbstractBarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [_ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
            },
        });
        this.properties = new BulletSeriesProperties();
        this.normalizedColorRanges = [];
        this.colorRangesGroup = new _Scene.Group({ name: `${this.id}-colorRanges` });
        this.colorRangesSelection = _Scene.Selection.select(this.colorRangesGroup, _Scene.Rect, false);
        this.rootGroup.append(this.colorRangesGroup);
        this.targetLinesSelection = _Scene.Selection.select(this.annotationGroup, _Scene.Line, false);
    }
    destroy() {
        this.rootGroup.removeChild(this.colorRangesGroup);
        super.destroy();
    }
    processData(dataController) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid() || !this.data) {
                return;
            }
            const { valueKey, targetKey } = this.properties;
            const isContinuousX = _Scale.ContinuousScale.is((_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale);
            const isContinuousY = _Scale.ContinuousScale.is((_b = this.getValueAxis()) === null || _b === void 0 ? void 0 : _b.scale);
            const extraProps = [];
            if (targetKey !== undefined) {
                extraProps.push(valueProperty(this, targetKey, isContinuousY, { id: 'target' }));
            }
            if (!this.ctx.animationManager.isSkipped()) {
                if (this.processedData !== undefined) {
                    extraProps.push(diff(this.processedData));
                }
                extraProps.push(animationValidation(this));
            }
            // Bullet graphs only need 1 datum, but we keep that `data` option as array for consistency with other series
            // types and future compatibility (we may decide to support multiple datum at some point).
            yield this.requestDataModel(dataController, this.data.slice(0, 1), {
                props: [
                    keyProperty(this, valueKey, isContinuousX, { id: 'xValue' }),
                    valueProperty(this, valueKey, isContinuousY, { id: 'value' }),
                    ...extraProps,
                ],
                groupByKeys: true,
                dataVisible: this.visible,
            });
            this.animationState.transition('updateData');
        });
    }
    getBandScalePadding() {
        return { inner: 0, outer: 0 };
    }
    getMaxValue() {
        var _a, _b;
        return Math.max(...((_b = (_a = this.getValueAxis()) === null || _a === void 0 ? void 0 : _a.dataDomain.domain) !== null && _b !== void 0 ? _b : [0]));
    }
    getSeriesDomain(direction) {
        var _a;
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) {
            return [];
        }
        const { valueKey, targetKey, valueName } = this.properties;
        if (direction === this.getCategoryDirection()) {
            return [valueName !== null && valueName !== void 0 ? valueName : valueKey];
        }
        else if (direction == ((_a = this.getValueAxis()) === null || _a === void 0 ? void 0 : _a.direction)) {
            const valueDomain = dataModel.getDomain(this, 'value', 'value', processedData);
            const targetDomain = targetKey === undefined ? [] : dataModel.getDomain(this, 'target', 'value', processedData);
            return [0, Math.max(...valueDomain, ...targetDomain)];
        }
        else {
            throw new Error(`unknown direction ${direction}`);
        }
    }
    getKeys(direction) {
        if (direction === this.getBarDirection()) {
            return [this.properties.valueKey];
        }
        return super.getKeys(direction);
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const { dataModel, processedData } = this;
            const { valueKey, targetKey, widthRatio, target: { lengthRatio }, } = this.properties;
            const xScale = (_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale;
            const yScale = (_b = this.getValueAxis()) === null || _b === void 0 ? void 0 : _b.scale;
            if (!valueKey || !dataModel || !processedData || !xScale || !yScale)
                return [];
            if (widthRatio === undefined || lengthRatio === undefined)
                return [];
            const multiplier = (_c = xScale.bandwidth) !== null && _c !== void 0 ? _c : NaN;
            const maxValue = this.getMaxValue();
            const valueIndex = dataModel.resolveProcessedDataIndexById(this, 'value').index;
            const targetIndex = targetKey === undefined ? NaN : dataModel.resolveProcessedDataIndexById(this, 'target').index;
            const context = {
                itemId: valueKey,
                nodeData: [],
                labelData: [],
                scales: _super.calculateScaling.call(this),
                visible: this.visible,
            };
            for (const { datum, values } of processedData.data) {
                if (!Array.isArray(datum) || datum.length < 1) {
                    continue;
                }
                if (values[0][valueIndex] < 0) {
                    _Util.Logger.warnOnce('negative values are not supported, clipping to 0.');
                }
                const xValue = (_d = this.properties.valueName) !== null && _d !== void 0 ? _d : this.properties.valueKey;
                const yValue = Math.min(maxValue, Math.max(0, values[0][valueIndex]));
                const y = yScale.convert(yValue);
                const barWidth = widthRatio * multiplier;
                const bottomY = yScale.convert(0);
                const barAlongX = this.getBarDirection() === _ModuleSupport.ChartAxisDirection.X;
                const rect = {
                    x: (multiplier * (1.0 - widthRatio)) / 2,
                    y: Math.min(y, bottomY),
                    width: barWidth,
                    height: Math.abs(bottomY - y),
                };
                if (barAlongX) {
                    [rect.x, rect.y, rect.width, rect.height] = [rect.y, rect.x, rect.height, rect.width];
                }
                let target;
                if (values[0][targetIndex] < 0) {
                    _Util.Logger.warnOnce('negative targets are not supported, ignoring.');
                }
                if (this.properties.targetKey && values[0][targetIndex] >= 0) {
                    const targetLineLength = lengthRatio * multiplier;
                    const targetValue = Math.min(maxValue, values[0][targetIndex]);
                    if (!isNaN(targetValue) && targetValue !== undefined) {
                        const convertedY = yScale.convert(targetValue);
                        let x1 = (multiplier * (1.0 - lengthRatio)) / 2;
                        let x2 = x1 + targetLineLength;
                        let [y1, y2] = [convertedY, convertedY];
                        if (barAlongX) {
                            [x1, x2, y1, y2] = [y1, y2, x1, x2];
                        }
                        target = { value: targetValue, x1, x2, y1, y2 };
                    }
                }
                const nodeData = Object.assign(Object.assign({ series: this, datum: datum[0], xKey: valueKey, xValue, yKey: valueKey, yValue, cumulativeValue: yValue, target }, rect), { midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } });
                context.nodeData.push(nodeData);
            }
            const sortedRanges = [...this.properties.colorRanges].sort((a, b) => (a.stop || maxValue) - (b.stop || maxValue));
            let start = 0;
            this.normalizedColorRanges = sortedRanges.map((item) => {
                var _a;
                const stop = Math.min(maxValue, (_a = item.stop) !== null && _a !== void 0 ? _a : Infinity);
                const result = { color: item.color, start, stop };
                start = stop;
                return result;
            });
            return [context];
        });
    }
    getLegendData(_legendType) {
        return [];
    }
    getTooltipHtml(nodeDatum) {
        const { valueKey, valueName, targetKey, targetName } = this.properties;
        const axis = this.getValueAxis();
        const { yValue: valueValue, target: { value: targetValue } = { value: undefined }, datum } = nodeDatum;
        if (valueKey === undefined || valueValue === undefined || axis === undefined) {
            return '';
        }
        const makeLine = (key, name, value) => {
            const nameString = sanitizeHtml(name !== null && name !== void 0 ? name : key);
            const valueString = sanitizeHtml(axis.formatDatum(value));
            return `<b>${nameString}</b>: ${valueString}`;
        };
        const title = undefined;
        const content = targetKey === undefined || targetValue === undefined
            ? makeLine(valueKey, valueName, valueValue)
            : `${makeLine(valueKey, valueName, valueValue)}<br/>${makeLine(targetKey, targetName, targetValue)}`;
        return this.properties.tooltip.toTooltipHtml({ title, content, backgroundColor: this.properties.fill }, { datum, title, seriesId: this.id, valueKey, valueName, targetKey, targetName });
    }
    isLabelEnabled() {
        return false;
    }
    nodeFactory() {
        return new _Scene.Rect();
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.targetLinesSelection.update(opts.nodeData, undefined, undefined);
            return opts.datumSelection.update(opts.nodeData, undefined, undefined);
        });
    }
    updateDatumNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            // The translation of the rectangles (values) is updated by the animation manager.
            // The target lines aren't animated, therefore we must update the translation here.
            for (const { node } of opts.datumSelection) {
                const style = this.properties;
                partialAssign(STYLING_KEYS, node, style);
            }
            for (const { node, datum } of this.targetLinesSelection) {
                if (datum.target !== undefined) {
                    const style = this.properties.target;
                    partialAssign(['x1', 'x2', 'y1', 'y2'], node, datum.target);
                    partialAssign(STYLING_KEYS, node, style);
                }
                else {
                    node.visible = false;
                }
            }
        });
    }
    updateColorRanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const valAxis = this.getValueAxis();
            const catAxis = this.getCategoryAxis();
            if (!valAxis || !catAxis)
                return;
            const [min, max] = [0, Math.max(...catAxis.scale.range)];
            const computeRect = this.getBarDirection() === _ModuleSupport.ChartAxisDirection.Y
                ? (rect, colorRange) => {
                    rect.x = min;
                    rect.y = valAxis.scale.convert(colorRange.stop);
                    rect.height = valAxis.scale.convert(colorRange.start) - rect.y;
                    rect.width = max;
                }
                : (rect, colorRange) => {
                    rect.x = valAxis.scale.convert(colorRange.start);
                    rect.y = min;
                    rect.height = max;
                    rect.width = valAxis.scale.convert(colorRange.stop) - rect.x;
                };
            this.colorRangesSelection.update(this.normalizedColorRanges);
            for (const { node, datum } of this.colorRangesSelection) {
                computeRect(node, datum);
                node.fill = datum.color;
            }
        });
    }
    updateNodes(highlightedItems, seriesHighlighted, anySeriesItemEnabled) {
        const _super = Object.create(null, {
            updateNodes: { get: () => super.updateNodes }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.updateNodes.call(this, highlightedItems, seriesHighlighted, anySeriesItemEnabled);
            yield this.updateColorRanges();
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return opts.labelSelection;
        });
    }
    updateLabelNodes(_opts) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    animateEmptyUpdateReady(data) {
        const { datumSelections, labelSelections, annotationSelections } = data;
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes));
        fromToMotion(this.id, 'nodes', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }
    animateWaitingUpdateReady(data) {
        var _a, _b;
        const { datumSelections, labelSelections, annotationSelections } = data;
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        const diff = (_b = (_a = this.processedData) === null || _a === void 0 ? void 0 : _a.reduced) === null || _b === void 0 ? void 0 : _b.diff;
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes));
        fromToMotion(this.id, 'nodes', this.ctx.animationManager, datumSelections, fns, (_, datum) => String(datum.xValue), diff);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }
}
//# sourceMappingURL=bulletSeries.js.map