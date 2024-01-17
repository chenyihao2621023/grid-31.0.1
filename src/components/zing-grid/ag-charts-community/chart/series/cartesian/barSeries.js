var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fromToMotion } from '../../../motion/fromToMotion';
import { BandScale } from '../../../scale/bandScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import { Rect } from '../../../scene/shape/rect';
import { extent } from '../../../util/array';
import { sanitizeHtml } from '../../../util/sanitize';
import { isNumber } from '../../../util/value';
import { CategoryAxis } from '../../axis/categoryAxis';
import { GroupedCategoryAxis } from '../../axis/groupedCategoryAxis';
import { LogAxis } from '../../axis/logAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { fixNumericExtent } from '../../data/dataModel';
import { SMALLEST_KEY_INTERVAL, animationValidation, diff, normaliseGroupTo } from '../../data/processors';
import { SeriesNodePickMode, groupAccumulativeValueProperty, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { AbstractBarSeries } from './abstractBarSeries';
import { BarSeriesProperties } from './barSeriesProperties';
import { checkCrisp, collapsedStartingBarPosition, getRectConfig, prepareBarAnimationFunctions, resetBarSelectionsFn, updateRect, } from './barUtil';
import { adjustLabelPlacement, updateLabelNode } from './labelUtil';
var BarSeriesNodeTag;
(function (BarSeriesNodeTag) {
    BarSeriesNodeTag[BarSeriesNodeTag["Bar"] = 0] = "Bar";
    BarSeriesNodeTag[BarSeriesNodeTag["Label"] = 1] = "Label";
})(BarSeriesNodeTag || (BarSeriesNodeTag = {}));
export class BarSeries extends AbstractBarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasHighlightedLabels: true,
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
        this.properties = new BarSeriesProperties();
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
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid() || !this.data) {
                return;
            }
            const { seriesGrouping: { groupIndex = this.id } = {}, data = [] } = this;
            const { xKey, yKey, normalizedTo } = this.properties;
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const normalizedToAbs = Math.abs(normalizedTo !== null && normalizedTo !== void 0 ? normalizedTo : NaN);
            const isContinuousX = ContinuousScale.is((_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale);
            const isContinuousY = ContinuousScale.is((_b = this.getValueAxis()) === null || _b === void 0 ? void 0 : _b.scale);
            const stackGroupName = `bar-stack-${groupIndex}-yValues`;
            const stackGroupTrailingName = `${stackGroupName}-trailing`;
            const normaliseTo = normalizedToAbs && isFinite(normalizedToAbs) ? normalizedToAbs : undefined;
            const extraProps = [];
            if (normaliseTo) {
                extraProps.push(normaliseGroupTo(this, [stackGroupName, stackGroupTrailingName], normaliseTo, 'range'));
            }
            if (animationEnabled && this.processedData) {
                extraProps.push(diff(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation(this));
            }
            const visibleProps = !this.visible ? { forceValue: 0 } : {};
            const { processedData } = yield this.requestDataModel(dataController, data, {
                props: [
                    keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                    valueProperty(this, yKey, isContinuousY, Object.assign({ id: `yValue-raw`, invalidValue: null }, visibleProps)),
                    ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'normal', 'current', Object.assign({ id: `yValue-end`, rangeId: `yValue-range`, invalidValue: null, missingValue: 0, groupId: stackGroupName, separateNegative: true }, visibleProps)),
                    ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'trailing', 'current', Object.assign({ id: `yValue-start`, invalidValue: null, missingValue: 0, groupId: stackGroupTrailingName, separateNegative: true }, visibleProps)),
                    ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                    ...extraProps,
                ],
                groupByKeys: true,
                groupByData: false,
            });
            this.smallestDataInterval = {
                x: (_d = (_c = processedData.reduced) === null || _c === void 0 ? void 0 : _c.smallestKeyInterval) !== null && _d !== void 0 ? _d : Infinity,
                y: Infinity,
            };
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        var _a;
        const { processedData, dataModel } = this;
        if (!processedData || !dataModel || processedData.data.length === 0)
            return [];
        const { reduced: { [SMALLEST_KEY_INTERVAL.property]: smallestX } = {} } = processedData;
        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();
        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yExtent = dataModel.getDomain(this, `yValue-end`, 'value', processedData);
        if (direction === this.getCategoryDirection()) {
            if ((keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.type) === 'key' && (keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.valueType) === 'category') {
                return keys;
            }
            const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
            const keysExtent = (_a = extent(keys)) !== null && _a !== void 0 ? _a : [NaN, NaN];
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
        else if (this.getValueAxis() instanceof LogAxis) {
            return fixNumericExtent(yExtent, valueAxis);
        }
        else {
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent(fixedYExtent, valueAxis);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { dataModel } = this;
            const xAxis = this.getCategoryAxis();
            const yAxis = this.getValueAxis();
            if (!(dataModel && xAxis && yAxis && this.properties.isValid())) {
                return [];
            }
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const { groupScale, processedData, smallestDataInterval, ctx: { seriesStateManager }, } = this;
            const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, cornerRadius, legendItemName, label } = this.properties;
            const yReversed = yAxis.isReversed();
            const xBandWidth = ContinuousScale.is(xScale)
                ? xScale.calcBandwidth(smallestDataInterval === null || smallestDataInterval === void 0 ? void 0 : smallestDataInterval.x)
                : xScale.bandwidth;
            const domain = [];
            const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
            for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
                domain.push(String(groupIdx));
            }
            groupScale.domain = domain;
            groupScale.range = [0, xBandWidth !== null && xBandWidth !== void 0 ? xBandWidth : 0];
            if (xAxis instanceof CategoryAxis) {
                groupScale.paddingInner = xAxis.groupPaddingInner;
            }
            else if (xAxis instanceof GroupedCategoryAxis) {
                groupScale.padding = 0.1;
            }
            else {
                // Number or Time axis
                groupScale.padding = 0;
            }
            // To get exactly `0` padding we need to turn off rounding
            groupScale.round = groupScale.padding !== 0;
            const barWidth = groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume bar charts.
                    groupScale.bandwidth
                : // Handle high-volume bar charts gracefully.
                    groupScale.rawBandwidth;
            const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-raw`).index;
            const yStartIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-start`).index;
            const yEndIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-end`).index;
            const yRangeIndex = dataModel.resolveProcessedDataDefById(this, `yValue-range`).index;
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const contexts = [];
            processedData === null || processedData === void 0 ? void 0 : processedData.data.forEach(({ keys, datum: seriesDatum, values, aggValues }) => {
                values.forEach((value, contextIndex) => {
                    var _a, _b;
                    (_a = contexts[contextIndex]) !== null && _a !== void 0 ? _a : (contexts[contextIndex] = {
                        itemId: yKey,
                        nodeData: [],
                        labelData: [],
                        scales: _super.calculateScaling.call(this),
                        visible: this.visible || animationEnabled,
                    });
                    const xValue = keys[xIndex];
                    const x = xScale.convert(xValue);
                    const currY = +value[yEndIndex];
                    const prevY = +value[yStartIndex];
                    const yRawValue = value[yRawIndex];
                    const isPositive = yRawValue >= 0;
                    const isUpward = isPositive !== yReversed;
                    const yRange = (_b = aggValues === null || aggValues === void 0 ? void 0 : aggValues[yRangeIndex][isPositive ? 1 : 0]) !== null && _b !== void 0 ? _b : 0;
                    const barX = x + groupScale.convert(String(groupIndex));
                    if (isNaN(currY)) {
                        return;
                    }
                    const y = yScale.convert(currY);
                    const bottomY = yScale.convert(prevY);
                    const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
                    const bboxHeight = yScale.convert(yRange);
                    const bboxBottom = yScale.convert(0);
                    const cornerRadiusBbox = new BBox(barAlongX ? Math.min(bboxBottom, bboxHeight) : barX, barAlongX ? barX : Math.min(bboxBottom, bboxHeight), barAlongX ? Math.abs(bboxBottom - bboxHeight) : barWidth, barAlongX ? barWidth : Math.abs(bboxBottom - bboxHeight));
                    const rect = {
                        x: barAlongX ? Math.min(y, bottomY) : barX,
                        y: barAlongX ? barX : Math.min(y, bottomY),
                        width: barAlongX ? Math.abs(bottomY - y) : barWidth,
                        height: barAlongX ? barWidth : Math.abs(bottomY - y),
                        cornerRadiusBbox,
                    };
                    const { fontStyle: labelFontStyle, fontWeight: labelFontWeight, fontSize: labelFontSize, fontFamily: labelFontFamily, color: labelColor, placement, } = label;
                    const labelText = this.getLabelText(this.properties.label, {
                        datum: seriesDatum[contextIndex],
                        value: yRawValue,
                        xKey,
                        yKey,
                        xName,
                        yName,
                        legendItemName,
                    }, (value) => (isNumber(value) ? value.toFixed(2) : ''));
                    const labelDatum = labelText
                        ? Object.assign({ text: labelText, fill: labelColor, fontStyle: labelFontStyle, fontWeight: labelFontWeight, fontSize: labelFontSize, fontFamily: labelFontFamily }, adjustLabelPlacement({
                            isPositive,
                            isVertical: !barAlongX,
                            placement,
                            rect,
                        })) : undefined;
                    const lengthRatioMultiplier = this.shouldFlipXY() ? rect.height : rect.width;
                    const nodeData = {
                        series: this,
                        itemId: yKey,
                        datum: seriesDatum[contextIndex],
                        cumulativeValue: currY,
                        xValue,
                        yValue: yRawValue,
                        yKey,
                        xKey,
                        capDefaults: {
                            lengthRatioMultiplier: lengthRatioMultiplier,
                            lengthMax: lengthRatioMultiplier,
                        },
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height,
                        midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
                        fill,
                        stroke,
                        strokeWidth,
                        cornerRadius,
                        topLeftCornerRadius: !(barAlongX === isUpward),
                        topRightCornerRadius: isUpward,
                        bottomRightCornerRadius: barAlongX === isUpward,
                        bottomLeftCornerRadius: !isUpward,
                        cornerRadiusBbox,
                        label: labelDatum,
                    };
                    contexts[contextIndex].nodeData.push(nodeData);
                    contexts[contextIndex].labelData.push(nodeData);
                });
            });
            return contexts;
        });
    }
    nodeFactory() {
        return new Rect();
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return opts.datumSelection.update(opts.nodeData, (rect) => {
                rect.tag = BarSeriesNodeTag.Bar;
            }, (datum) => datum.xValue);
        });
    }
    updateDatumNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid()) {
                return;
            }
            const { yKey, stackGroup, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, formatter, shadow, highlightStyle: { item: itemHighlightStyle }, } = this.properties;
            const xAxis = this.axes[ChartAxisDirection.X];
            const crisp = checkCrisp(xAxis === null || xAxis === void 0 ? void 0 : xAxis.visibleRange);
            const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;
            opts.datumSelection.each((rect, datum) => {
                const style = {
                    fill,
                    stroke,
                    fillOpacity,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                    fillShadow: shadow,
                    strokeWidth: this.getStrokeWidth(strokeWidth),
                    cornerRadius: datum.cornerRadius,
                    topLeftCornerRadius: datum.topLeftCornerRadius,
                    topRightCornerRadius: datum.topRightCornerRadius,
                    bottomRightCornerRadius: datum.bottomRightCornerRadius,
                    bottomLeftCornerRadius: datum.bottomLeftCornerRadius,
                    cornerRadiusBbox: datum.cornerRadiusBbox,
                };
                const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
                const config = getRectConfig({
                    datum,
                    ctx: this.ctx,
                    seriesId: this.id,
                    isHighlighted: opts.isHighlight,
                    highlightStyle: itemHighlightStyle,
                    yKey,
                    style,
                    formatter,
                    stackGroup,
                });
                config.crisp = crisp;
                config.visible = visible;
                updateRect({ rect, config });
            });
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = this.isLabelEnabled() ? opts.labelData : [];
            return opts.labelSelection.update(data, (text) => {
                text.tag = BarSeriesNodeTag.Label;
                text.pointerEvents = PointerEvents.None;
            });
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            opts.labelSelection.each((textNode, datum) => {
                updateLabelNode(textNode, this.properties.label, datum.label);
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        var _a;
        const { id: seriesId, processedData, ctx: { callbackCache }, } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!processedData || !this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }
        const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, tooltip, formatter, stackGroup } = this.properties;
        const { xValue, yValue, datum } = nodeDatum;
        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);
        let format;
        if (formatter) {
            format = callbackCache.call(formatter, {
                seriesId,
                datum,
                xKey,
                yKey,
                stackGroup,
                fill,
                stroke,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                highlighted: false,
            });
        }
        const color = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill;
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, Object.assign({ seriesId,
            datum,
            xKey,
            yKey,
            xName,
            yName,
            stackGroup,
            title,
            color }, this.getModuleTooltipParams()));
    }
    getLegendData(legendType) {
        var _a, _b;
        const { showInLegend } = this.properties;
        if (legendType !== 'category' || !((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || !this.properties.isValid() || !showInLegend) {
            return [];
        }
        const { yKey, yName, fill, stroke, strokeWidth, fillOpacity, strokeOpacity, legendItemName, visible } = this.properties;
        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: yKey,
                seriesId: this.id,
                enabled: visible,
                label: { text: (_b = legendItemName !== null && legendItemName !== void 0 ? legendItemName : yName) !== null && _b !== void 0 ? _b : yKey },
                marker: { fill, fillOpacity, stroke, strokeWidth, strokeOpacity },
                legendItemName,
            },
        ];
    }
    animateEmptyUpdateReady({ datumSelections, labelSelections, annotationSelections }) {
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
    isLabelEnabled() {
        return this.properties.label.enabled;
    }
}
BarSeries.className = 'BarSeries';
BarSeries.type = 'bar';
//# sourceMappingURL=barSeries.js.map