var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { _ModuleSupport, _Scene, _Util } from '@/components/zing-grid/ag-charts-community/main.js';
import { RangeBarProperties } from './rangeBarProperties';
const { SeriesNodePickMode, valueProperty, keyProperty, ChartAxisDirection, getRectConfig, updateRect, checkCrisp, updateLabelNode, CategoryAxis, SMALLEST_KEY_INTERVAL, diff, prepareBarAnimationFunctions, midpointStartingBarPosition, resetBarSelectionsFn, fixNumericExtent, seriesLabelFadeInAnimation, resetLabelFn, animationValidation, } = _ModuleSupport;
const { ContinuousScale, BandScale, Rect, PointerEvents, motion } = _Scene;
const { sanitizeHtml, isNumber, extent } = _Util;
const DEFAULT_DIRECTION_KEYS = {
    [_ModuleSupport.ChartAxisDirection.X]: ['xKey'],
    [_ModuleSupport.ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'],
};
const DEFAULT_DIRECTION_NAMES = {
    [ChartAxisDirection.X]: ['xName'],
    [ChartAxisDirection.Y]: ['yLowName', 'yHighName', 'yName'],
};
class RangeBarSeriesNodeClickEvent extends _ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yLowKey = series.properties.yLowKey;
        this.yHighKey = series.properties.yHighKey;
    }
}
export class RangeBarSeries extends _ModuleSupport.AbstractBarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            directionKeys: DEFAULT_DIRECTION_KEYS,
            directionNames: DEFAULT_DIRECTION_NAMES,
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
        this.properties = new RangeBarProperties();
        this.NodeClickEvent = RangeBarSeriesNodeClickEvent;
        /**
         * Used to get the position of bars within each group.
         */
        this.groupScale = new BandScale();
        this.smallestDataInterval = undefined;
    }
    resolveKeyDirection(direction) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }
    processData(dataController) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid()) {
                return;
            }
            const { xKey, yLowKey, yHighKey } = this.properties;
            const isContinuousX = ContinuousScale.is((_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale);
            const isContinuousY = ContinuousScale.is((_b = this.getValueAxis()) === null || _b === void 0 ? void 0 : _b.scale);
            const extraProps = [];
            if (!this.ctx.animationManager.isSkipped()) {
                if (this.processedData) {
                    extraProps.push(diff(this.processedData));
                }
                extraProps.push(animationValidation(this));
            }
            const { processedData } = yield this.requestDataModel(dataController, (_c = this.data) !== null && _c !== void 0 ? _c : [], {
                props: [
                    keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                    valueProperty(this, yLowKey, isContinuousY, { id: `yLowValue` }),
                    valueProperty(this, yHighKey, isContinuousY, { id: `yHighValue` }),
                    ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                    ...extraProps,
                ],
                groupByKeys: true,
                dataVisible: this.visible,
            });
            this.smallestDataInterval = {
                x: (_e = (_d = processedData.reduced) === null || _d === void 0 ? void 0 : _d.smallestKeyInterval) !== null && _e !== void 0 ? _e : Infinity,
                y: Infinity,
            };
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        var _a;
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel))
            return [];
        const { domain: { keys: [keys], values, }, } = processedData;
        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if ((keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.type) === 'key' && (keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.valueType) === 'category') {
                return keys;
            }
            const { reduced: { [SMALLEST_KEY_INTERVAL.property]: smallestX } = {} } = processedData;
            const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
            const keysExtent = (_a = extent(keys)) !== null && _a !== void 0 ? _a : [NaN, NaN];
            const categoryAxis = this.getCategoryAxis();
            const isReversed = categoryAxis === null || categoryAxis === void 0 ? void 0 : categoryAxis.isReversed();
            if (direction === ChartAxisDirection.Y) {
                const d0 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
                const d1 = keysExtent[1] + (isReversed ? scalePadding : 0);
                return fixNumericExtent([d0, d1], categoryAxis);
            }
            const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
            const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
            return fixNumericExtent([d0, d1], categoryAxis);
        }
        else {
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, 'yLowValue').index;
            const yLowExtent = values[yLowIndex];
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, 'yHighValue').index;
            const yHighExtent = values[yHighIndex];
            const fixedYExtent = [
                yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
                yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1],
            ];
            return fixNumericExtent(fixedYExtent);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { data, dataModel, groupScale, processedData, smallestDataInterval, ctx: { seriesStateManager }, properties: { visible }, } = this;
            const xAxis = this.getCategoryAxis();
            const yAxis = this.getValueAxis();
            if (!(data && visible && xAxis && yAxis && dataModel)) {
                return [];
            }
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
            const { xKey, yLowKey, yHighKey, fill, stroke, strokeWidth } = this.properties;
            const itemId = `${yLowKey}-${yHighKey}`;
            const contexts = [];
            const domain = [];
            const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
            for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
                domain.push(String(groupIdx));
            }
            const xBandWidth = ContinuousScale.is(xScale)
                ? xScale.calcBandwidth(smallestDataInterval === null || smallestDataInterval === void 0 ? void 0 : smallestDataInterval.x)
                : xScale.bandwidth;
            groupScale.domain = domain;
            groupScale.range = [0, xBandWidth !== null && xBandWidth !== void 0 ? xBandWidth : 0];
            if (xAxis instanceof CategoryAxis) {
                groupScale.paddingInner = xAxis.groupPaddingInner;
            }
            else {
                // Number or Time axis
                groupScale.padding = 0;
            }
            // To get exactly `0` padding we need to turn off rounding
            groupScale.round = groupScale.padding !== 0;
            const barWidth = groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume range charts.
                    groupScale.bandwidth
                : // Handle high-volume range charts gracefully.
                    groupScale.rawBandwidth;
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, `yLowValue`).index;
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, `yHighValue`).index;
            const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            processedData === null || processedData === void 0 ? void 0 : processedData.data.forEach(({ keys, datum, values }, dataIndex) => {
                values.forEach((value, contextIndex) => {
                    var _a;
                    (_a = contexts[contextIndex]) !== null && _a !== void 0 ? _a : (contexts[contextIndex] = {
                        itemId,
                        nodeData: [],
                        labelData: [],
                        scales: _super.calculateScaling.call(this),
                        visible: this.visible,
                    });
                    const xDatum = keys[xIndex];
                    const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex));
                    const rawLowValue = value[yLowIndex];
                    const rawHighValue = value[yHighIndex];
                    const yLowValue = Math.min(rawLowValue, rawHighValue);
                    const yHighValue = Math.max(rawLowValue, rawHighValue);
                    const yLow = Math.round(yScale.convert(yLowValue));
                    const yHigh = Math.round(yScale.convert(yHighValue));
                    const y = yHigh;
                    const bottomY = yLow;
                    const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));
                    const rect = {
                        x: barAlongX ? Math.min(y, bottomY) : x,
                        y: barAlongX ? x : Math.min(y, bottomY),
                        width: barAlongX ? barHeight : barWidth,
                        height: barAlongX ? barWidth : barHeight,
                    };
                    const nodeMidPoint = {
                        x: rect.x + rect.width / 2,
                        y: rect.y + rect.height / 2,
                    };
                    const labelData = this.createLabelData({
                        rect,
                        barAlongX,
                        yLowValue,
                        yHighValue,
                        datum: datum[contextIndex],
                        series: this,
                    });
                    const nodeDatum = {
                        index: dataIndex,
                        series: this,
                        itemId,
                        datum: datum[contextIndex],
                        xValue: xDatum,
                        yLowValue: rawLowValue,
                        yHighValue: rawHighValue,
                        yLowKey,
                        yHighKey,
                        xKey,
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height,
                        midPoint: nodeMidPoint,
                        fill,
                        stroke,
                        strokeWidth,
                        labels: labelData,
                    };
                    contexts[contextIndex].nodeData.push(nodeDatum);
                    contexts[contextIndex].labelData.push(...labelData);
                });
            });
            return contexts;
        });
    }
    createLabelData({ rect, barAlongX, yLowValue, yHighValue, datum, series, }) {
        const { xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, label } = this.properties;
        const labelParams = { datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName };
        const { placement, padding } = label;
        const paddingDirection = placement === 'outside' ? 1 : -1;
        const labelPadding = padding * paddingDirection;
        const yLowLabel = {
            x: rect.x + (barAlongX ? -labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : rect.height + labelPadding),
            textAlign: barAlongX ? 'left' : 'center',
            textBaseline: barAlongX ? 'middle' : 'bottom',
            text: this.getLabelText(label, Object.assign({ itemId: 'low', value: yLowValue }, labelParams), (value) => isNumber(value) ? value.toFixed(2) : ''),
            itemId: 'low',
            datum,
            series,
        };
        const yHighLabel = {
            x: rect.x + (barAlongX ? rect.width + labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : -labelPadding),
            textAlign: barAlongX ? 'right' : 'center',
            textBaseline: barAlongX ? 'middle' : 'top',
            text: this.getLabelText(label, Object.assign({ itemId: 'high', value: yHighValue }, labelParams), (value) => isNumber(value) ? value.toFixed(2) : ''),
            itemId: 'high',
            datum,
            series,
        };
        if (placement === 'outside') {
            yLowLabel.textAlign = barAlongX ? 'right' : 'center';
            yLowLabel.textBaseline = barAlongX ? 'middle' : 'top';
            yHighLabel.textAlign = barAlongX ? 'left' : 'center';
            yHighLabel.textBaseline = barAlongX ? 'middle' : 'bottom';
        }
        return [yLowLabel, yHighLabel];
    }
    nodeFactory() {
        return new Rect();
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nodeData, datumSelection } = opts;
            const data = nodeData !== null && nodeData !== void 0 ? nodeData : [];
            return datumSelection.update(data, undefined, (datum) => this.getDatumId(datum));
        });
    }
    updateDatumNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { datumSelection, isHighlight } = opts;
            const { id: seriesId, ctx } = this;
            const { yLowKey, yHighKey, highlightStyle: { item: itemHighlightStyle }, } = this.properties;
            const xAxis = this.axes[ChartAxisDirection.X];
            const crisp = checkCrisp(xAxis === null || xAxis === void 0 ? void 0 : xAxis.visibleRange);
            const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;
            datumSelection.each((rect, datum) => {
                const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, formatter, shadow: fillShadow, } = this.properties;
                const style = {
                    fill: datum.fill,
                    stroke: datum.stroke,
                    fillOpacity,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                    fillShadow,
                    strokeWidth: this.getStrokeWidth(strokeWidth),
                    cornerRadius: this.properties.cornerRadius,
                    cornerRadiusBbox: undefined,
                };
                const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
                const config = getRectConfig({
                    datum,
                    lowValue: datum.yLowValue,
                    highValue: datum.yHighValue,
                    isHighlighted: isHighlight,
                    style,
                    highlightStyle: itemHighlightStyle,
                    formatter,
                    seriesId,
                    itemId: datum.itemId,
                    ctx,
                    yLowKey,
                    yHighKey,
                });
                config.crisp = crisp;
                config.visible = visible;
                updateRect({ rect, config });
            });
        });
    }
    getHighlightLabelData(labelData, highlightedItem) {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const labelData = this.properties.label.enabled ? opts.labelData : [];
            return opts.labelSelection.update(labelData, (text) => {
                text.pointerEvents = PointerEvents.None;
            });
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            opts.labelSelection.each((textNode, datum) => {
                updateLabelNode(textNode, this.properties.label, datum);
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        var _a, _b;
        const { id: seriesId, ctx: { callbackCache }, } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }
        const { xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, fill, strokeWidth, formatter, tooltip } = this.properties;
        const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;
        let format;
        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                xKey,
                yLowKey,
                yHighKey,
                fill,
                strokeWidth,
                highlighted: false,
                seriesId,
                itemId,
            });
        }
        const color = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill) !== null && _b !== void 0 ? _b : 'gray';
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml(yAxis.formatDatum(yHighValue));
        const xSubheading = xName !== null && xName !== void 0 ? xName : xKey;
        const yLowSubheading = yLowName !== null && yLowName !== void 0 ? yLowName : yLowKey;
        const yHighSubheading = yHighName !== null && yHighName !== void 0 ? yHighName : yHighKey;
        const title = sanitizeHtml(yName);
        const content = yName
            ? `<b>${sanitizeHtml(xSubheading)}</b>: ${xString}<br>` +
                `<b>${sanitizeHtml(yLowSubheading)}</b>: ${yLowString}<br>` +
                `<b>${sanitizeHtml(yHighSubheading)}</b>: ${yHighString}<br>`
            : `${xString}: ${yLowString} - ${yHighString}`;
        const defaults = {
            title,
            content,
            backgroundColor: color,
        };
        return tooltip.toTooltipHtml(defaults, {
            datum,
            xKey,
            xName,
            yLowKey,
            yLowName,
            yHighKey,
            yHighName,
            yName,
            color,
            seriesId,
            itemId,
        });
    }
    getLegendData(legendType) {
        const { id, visible } = this;
        if (legendType !== 'category') {
            return [];
        }
        const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, yName, yLowName, yHighName, yLowKey, yHighKey } = this.properties;
        const legendItemText = yName !== null && yName !== void 0 ? yName : `${yLowName !== null && yLowName !== void 0 ? yLowName : yLowKey} - ${yHighName !== null && yHighName !== void 0 ? yHighName : yHighKey}`;
        return [
            {
                legendType: 'category',
                id,
                itemId: `${yLowKey}-${yHighKey}`,
                seriesId: id,
                enabled: visible,
                label: { text: `${legendItemText}` },
                marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth },
            },
        ];
    }
    animateEmptyUpdateReady({ datumSelections, labelSelections }) {
        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical()));
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }
    animateWaitingUpdateReady(data) {
        var _a;
        const { datumSelections, labelSelections } = data;
        const { processedData } = this;
        const diff = (_a = processedData === null || processedData === void 0 ? void 0 : processedData.reduced) === null || _a === void 0 ? void 0 : _a.diff;
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical()));
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, fns, (_, datum) => String(datum.xValue), diff);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }
    getDatumId(datum) {
        return `${datum.xValue}`;
    }
    isLabelEnabled() {
        return this.properties.label.enabled;
    }
    onDataChange() { }
}
RangeBarSeries.className = 'RangeBarSeries';
RangeBarSeries.type = 'range-bar';
//# sourceMappingURL=rangeBar.js.map