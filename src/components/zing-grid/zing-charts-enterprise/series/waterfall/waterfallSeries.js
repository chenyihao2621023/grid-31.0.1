var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { _ModuleSupport, _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { WaterfallSeriesProperties } from './waterfallSeriesProperties';
const { adjustLabelPlacement, SeriesNodePickMode, fixNumericExtent, valueProperty, keyProperty, accumulativeValueProperty, trailingAccumulatedValueProperty, ChartAxisDirection, getRectConfig, updateRect, checkCrisp, updateLabelNode, prepareBarAnimationFunctions, collapsedStartingBarPosition, resetBarSelectionsFn, seriesLabelFadeInAnimation, resetLabelFn, animationValidation, } = _ModuleSupport;
const { ContinuousScale, Rect, motion } = _Scene;
const { sanitizeHtml, isContinuous, isNumber } = _Util;
export class WaterfallSeries extends _ModuleSupport.AbstractBarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 1,
            hasHighlightedLabels: true,
            pathsZIndexSubOrderOffset: [-1, -1],
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
        this.properties = new WaterfallSeriesProperties();
        this.seriesItemTypes = new Set(['positive', 'negative', 'total']);
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
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const { xKey, yKey, totals } = this.properties;
            const { data = [] } = this;
            if (!this.properties.isValid()) {
                return;
            }
            const positiveNumber = (v) => {
                return isContinuous(v) && v >= 0;
            };
            const negativeNumber = (v) => {
                return isContinuous(v) && v < 0;
            };
            const totalTypeValue = (v) => {
                return v === 'total' || v === 'subtotal';
            };
            const propertyDefinition = {
                missingValue: undefined,
                invalidValue: undefined,
            };
            const dataWithTotals = [];
            const totalsMap = totals.reduce((totalsMap, total) => {
                const totalsAtIndex = totalsMap.get(total.index);
                if (totalsAtIndex) {
                    totalsAtIndex.push(total);
                }
                else {
                    totalsMap.set(total.index, [total]);
                }
                return totalsMap;
            }, new Map());
            data.forEach((datum, i) => {
                var _a;
                dataWithTotals.push(datum);
                // Use the `toString` method to make the axis labels unique as they're used as categories in the axis scale domain.
                // Add random id property as there is caching for the axis label formatter result. If the label object is not unique, the axis label formatter will not be invoked.
                (_a = totalsMap.get(i)) === null || _a === void 0 ? void 0 : _a.forEach((total) => dataWithTotals.push(Object.assign(Object.assign({}, total.toJson()), { [xKey]: total.axisLabel })));
            });
            const isContinuousX = ContinuousScale.is((_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale);
            const extraProps = [];
            if (!this.ctx.animationManager.isSkipped()) {
                extraProps.push(animationValidation(this));
            }
            const { processedData } = yield this.requestDataModel(dataController, dataWithTotals, {
                props: [
                    keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                    accumulativeValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { id: `yCurrent` })),
                    accumulativeValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { missingValue: 0, id: `yCurrentTotal` })),
                    accumulativeValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { id: `yCurrentPositive`, validation: positiveNumber })),
                    accumulativeValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { id: `yCurrentNegative`, validation: negativeNumber })),
                    trailingAccumulatedValueProperty(this, yKey, true, Object.assign(Object.assign({}, propertyDefinition), { id: `yPrevious` })),
                    valueProperty(this, yKey, true, { id: `yRaw` }), // Raw value pass-through.
                    valueProperty(this, 'totalType', false, {
                        id: `totalTypeValue`,
                        missingValue: undefined,
                        validation: totalTypeValue,
                    }),
                    ...(isContinuousX ? [_ModuleSupport.SMALLEST_KEY_INTERVAL] : []),
                    ...extraProps,
                ],
                dataVisible: this.visible,
            });
            this.smallestDataInterval = {
                x: (_c = (_b = processedData.reduced) === null || _b === void 0 ? void 0 : _b.smallestKeyInterval) !== null && _c !== void 0 ? _c : Infinity,
                y: Infinity,
            };
            this.updateSeriesItemTypes();
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        var _a;
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel))
            return [];
        const { domain: { keys: [keys], values, }, reduced: { [_ModuleSupport.SMALLEST_KEY_INTERVAL.property]: smallestX } = {}, } = processedData;
        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        if (direction === this.getCategoryDirection()) {
            if ((keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.type) === 'key' && (keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.valueType) === 'category') {
                return keys;
            }
            const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
            const keysExtent = (_a = _ModuleSupport.extent(keys)) !== null && _a !== void 0 ? _a : [NaN, NaN];
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
            const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrent').index;
            const yExtent = values[yCurrIndex];
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent(fixedYExtent);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const { data, dataModel, smallestDataInterval } = this;
            const { visible, line } = this.properties;
            const categoryAxis = this.getCategoryAxis();
            const valueAxis = this.getValueAxis();
            if (!(data && visible && categoryAxis && valueAxis && dataModel)) {
                return [];
            }
            const xScale = categoryAxis.scale;
            const yScale = valueAxis.scale;
            const categoryAxisReversed = categoryAxis.isReversed();
            const valueAxisReversed = valueAxis.isReversed();
            const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
            const barWidth = (_a = (ContinuousScale.is(xScale) ? xScale.calcBandwidth(smallestDataInterval === null || smallestDataInterval === void 0 ? void 0 : smallestDataInterval.x) : xScale.bandwidth)) !== null && _a !== void 0 ? _a : 10;
            const halfLineWidth = line.strokeWidth / 2;
            const offsetDirection = (barAlongX && !valueAxisReversed) || (!barAlongX && valueAxisReversed) ? -1 : 1;
            const offset = offsetDirection * halfLineWidth;
            if (((_b = this.processedData) === null || _b === void 0 ? void 0 : _b.type) !== 'ungrouped') {
                return [];
            }
            const contexts = [];
            const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yRaw`).index;
            const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`).index;
            const contextIndexMap = new Map();
            const pointData = [];
            const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrent').index;
            const yPrevIndex = dataModel.resolveProcessedDataIndexById(this, 'yPrevious').index;
            const yCurrTotalIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentTotal').index;
            function getValues(isTotal, isSubtotal, values) {
                if (isTotal || isSubtotal) {
                    return {
                        cumulativeValue: values[yCurrTotalIndex],
                        trailingValue: isSubtotal ? trailingSubtotal : 0,
                    };
                }
                return {
                    cumulativeValue: values[yCurrIndex],
                    trailingValue: values[yPrevIndex],
                };
            }
            function getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue) {
                if (isTotal) {
                    return cumulativeValue;
                }
                if (isSubtotal) {
                    return (cumulativeValue !== null && cumulativeValue !== void 0 ? cumulativeValue : 0) - (trailingValue !== null && trailingValue !== void 0 ? trailingValue : 0);
                }
                return rawValue;
            }
            let trailingSubtotal = 0;
            const { xKey, yKey, xName, yName } = this.properties;
            (_c = this.processedData) === null || _c === void 0 ? void 0 : _c.data.forEach(({ keys, datum, values }, dataIndex) => {
                var _a;
                const datumType = values[totalTypeIndex];
                const isSubtotal = this.isSubtotal(datumType);
                const isTotal = this.isTotal(datumType);
                const isTotalOrSubtotal = isTotal || isSubtotal;
                const xDatum = keys[xIndex];
                const x = Math.round(xScale.convert(xDatum));
                const rawValue = values[yRawIndex];
                const { cumulativeValue, trailingValue } = getValues(isTotal, isSubtotal, values);
                if (isTotalOrSubtotal) {
                    trailingSubtotal = cumulativeValue !== null && cumulativeValue !== void 0 ? cumulativeValue : 0;
                }
                const currY = Math.round(yScale.convert(cumulativeValue));
                const trailY = Math.round(yScale.convert(trailingValue));
                const value = getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue);
                const isPositive = (value !== null && value !== void 0 ? value : 0) >= 0;
                const seriesItemType = this.getSeriesItemType(isPositive, datumType);
                const { fill, stroke, strokeWidth, label } = this.getItemConfig(seriesItemType);
                const y = (isPositive ? currY : trailY) - offset;
                const bottomY = (isPositive ? trailY : currY) + offset;
                const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));
                const itemId = seriesItemType;
                let contextIndex = contextIndexMap.get(itemId);
                if (contextIndex === undefined) {
                    contextIndex = contexts.length;
                    contextIndexMap.set(itemId, contextIndex);
                }
                (_a = contexts[contextIndex]) !== null && _a !== void 0 ? _a : (contexts[contextIndex] = {
                    itemId,
                    nodeData: [],
                    labelData: [],
                    pointData: [],
                    scales: _super.calculateScaling.call(this),
                    visible: this.visible,
                });
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
                const pointY = isTotalOrSubtotal ? currY : trailY;
                const pixelAlignmentOffset = (Math.floor(line.strokeWidth) % 2) / 2;
                const startY = categoryAxisReversed ? currY : pointY;
                const stopY = categoryAxisReversed ? pointY : currY;
                let startCoordinates;
                let stopCoordinates;
                if (barAlongX) {
                    startCoordinates = {
                        x: startY + pixelAlignmentOffset,
                        y: rect.y,
                    };
                    stopCoordinates = {
                        x: stopY + pixelAlignmentOffset,
                        y: rect.y + rect.height,
                    };
                }
                else {
                    startCoordinates = {
                        x: rect.x,
                        y: startY + pixelAlignmentOffset,
                    };
                    stopCoordinates = {
                        x: rect.x + rect.width,
                        y: stopY + pixelAlignmentOffset,
                    };
                }
                const pathPoint = {
                    // lineTo
                    x: categoryAxisReversed ? stopCoordinates.x : startCoordinates.x,
                    y: categoryAxisReversed ? stopCoordinates.y : startCoordinates.y,
                    // moveTo
                    x2: categoryAxisReversed ? startCoordinates.x : stopCoordinates.x,
                    y2: categoryAxisReversed ? startCoordinates.y : stopCoordinates.y,
                    size: 0,
                };
                pointData.push(pathPoint);
                const labelText = this.getLabelText(label, {
                    itemId: itemId === 'subtotal' ? 'total' : itemId,
                    value,
                    datum,
                    xKey,
                    yKey,
                    xName,
                    yName,
                }, (value) => (isNumber(value) ? value.toFixed(2) : String(value)));
                const nodeDatum = {
                    index: dataIndex,
                    series: this,
                    itemId,
                    datum,
                    cumulativeValue: cumulativeValue !== null && cumulativeValue !== void 0 ? cumulativeValue : 0,
                    xValue: xDatum,
                    yValue: value,
                    yKey,
                    xKey,
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    midPoint: nodeMidPoint,
                    fill,
                    stroke,
                    strokeWidth,
                    label: Object.assign({ text: labelText }, adjustLabelPlacement({
                        isPositive: (value !== null && value !== void 0 ? value : -1) >= 0,
                        isVertical: !barAlongX,
                        placement: label.placement,
                        padding: label.padding,
                        rect,
                    })),
                };
                contexts[contextIndex].nodeData.push(nodeDatum);
                contexts[contextIndex].labelData.push(nodeDatum);
            });
            const connectorLinesEnabled = this.properties.line.enabled;
            if (contexts.length > 0 && yCurrIndex !== undefined && connectorLinesEnabled) {
                contexts[0].pointData = pointData;
            }
            return contexts;
        });
    }
    updateSeriesItemTypes() {
        var _a, _b;
        const { dataModel, seriesItemTypes, processedData } = this;
        if (!dataModel || !processedData) {
            return;
        }
        seriesItemTypes.clear();
        const yPositiveIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentPositive').index;
        const yNegativeIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentNegative').index;
        const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`).index;
        const positiveDomain = (_a = processedData.domain.values[yPositiveIndex]) !== null && _a !== void 0 ? _a : [];
        const negativeDomain = (_b = processedData.domain.values[yNegativeIndex]) !== null && _b !== void 0 ? _b : [];
        if (positiveDomain.length > 0) {
            seriesItemTypes.add('positive');
        }
        if (negativeDomain.length > 0) {
            seriesItemTypes.add('negative');
        }
        const itemTypes = processedData === null || processedData === void 0 ? void 0 : processedData.domain.values[totalTypeIndex];
        if (!itemTypes) {
            return;
        }
        itemTypes.forEach((type) => {
            if (type === 'total' || type === 'subtotal') {
                seriesItemTypes.add('total');
            }
        });
    }
    isSubtotal(datumType) {
        return datumType === 'subtotal';
    }
    isTotal(datumType) {
        return datumType === 'total';
    }
    nodeFactory() {
        return new Rect();
    }
    getSeriesItemType(isPositive, datumType) {
        return datumType !== null && datumType !== void 0 ? datumType : (isPositive ? 'positive' : 'negative');
    }
    getItemConfig(seriesItemType) {
        switch (seriesItemType) {
            case 'positive': {
                return this.properties.item.positive;
            }
            case 'negative': {
                return this.properties.item.negative;
            }
            case 'subtotal':
            case 'total': {
                return this.properties.item.total;
            }
        }
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nodeData, datumSelection } = opts;
            const data = nodeData !== null && nodeData !== void 0 ? nodeData : [];
            return datumSelection.update(data);
        });
    }
    updateDatumNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { datumSelection, isHighlight } = opts;
            const { id: seriesId, ctx } = this;
            const { yKey, highlightStyle: { item: itemHighlightStyle }, } = this.properties;
            const categoryAxis = this.getCategoryAxis();
            const crisp = checkCrisp(categoryAxis === null || categoryAxis === void 0 ? void 0 : categoryAxis.visibleRange);
            const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;
            datumSelection.each((rect, datum) => {
                const seriesItemType = datum.itemId;
                const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, cornerRadius, formatter, shadow: fillShadow, } = this.getItemConfig(seriesItemType);
                const style = {
                    fill: datum.fill,
                    stroke: datum.stroke,
                    fillOpacity,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                    fillShadow,
                    strokeWidth: this.getStrokeWidth(strokeWidth),
                    cornerRadius,
                    cornerRadiusBbox: undefined,
                };
                const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
                const config = getRectConfig({
                    datum,
                    isHighlighted: isHighlight,
                    style,
                    highlightStyle: itemHighlightStyle,
                    formatter,
                    seriesId,
                    itemId: datum.itemId,
                    ctx,
                    value: datum.yValue,
                    yKey,
                });
                config.crisp = crisp;
                config.visible = visible;
                updateRect({ rect, config });
            });
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelData, labelSelection } = opts;
            if (labelData.length === 0) {
                return labelSelection.update([]);
            }
            const itemId = labelData[0].itemId;
            const { label } = this.getItemConfig(itemId);
            const data = label.enabled ? labelData : [];
            return labelSelection.update(data);
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            opts.labelSelection.each((textNode, datum) => {
                updateLabelNode(textNode, this.getItemConfig(datum.itemId).label, datum.label);
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        var _a, _b, _c;
        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();
        if (!this.properties.isValid() || !categoryAxis || !valueAxis) {
            return '';
        }
        const { id: seriesId } = this;
        const { xKey, yKey, xName, yName, tooltip } = this.properties;
        const { datum, itemId, xValue, yValue } = nodeDatum;
        const { fill, strokeWidth, name, formatter } = this.getItemConfig(itemId);
        let format;
        if (formatter) {
            format = this.ctx.callbackCache.call(formatter, {
                datum,
                value: yValue,
                xKey,
                yKey,
                fill,
                strokeWidth,
                highlighted: false,
                seriesId,
                itemId: nodeDatum.itemId,
            });
        }
        const color = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill) !== null && _b !== void 0 ? _b : 'gray';
        const xString = sanitizeHtml(categoryAxis.formatDatum(xValue));
        const yString = sanitizeHtml(valueAxis.formatDatum(yValue));
        const isTotal = this.isTotal(itemId);
        const isSubtotal = this.isSubtotal(itemId);
        const ySubheading = isTotal ? 'Total' : isSubtotal ? 'Subtotal' : (_c = name !== null && name !== void 0 ? name : yName) !== null && _c !== void 0 ? _c : yKey;
        const title = sanitizeHtml(yName);
        const content = `<b>${sanitizeHtml(xName !== null && xName !== void 0 ? xName : xKey)}</b>: ${xString}<br/>` +
            `<b>${sanitizeHtml(ySubheading)}</b>: ${yString}`;
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, { seriesId, itemId, datum, xKey, yKey, xName, yName, color });
    }
    getLegendData(legendType) {
        if (legendType !== 'category') {
            return [];
        }
        const { id, seriesItemTypes } = this;
        const legendData = [];
        const capitalise = (text) => text.charAt(0).toUpperCase() + text.substring(1);
        seriesItemTypes.forEach((item) => {
            const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, name } = this.getItemConfig(item);
            legendData.push({
                legendType: 'category',
                id,
                itemId: item,
                seriesId: id,
                enabled: true,
                label: { text: name !== null && name !== void 0 ? name : capitalise(item) },
                marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth },
            });
        });
        return legendData;
    }
    toggleSeriesItem() { }
    animateEmptyUpdateReady({ datumSelections, labelSelections, contextData, paths }) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes));
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        contextData.forEach(({ pointData }, contextDataIndex) => {
            if (contextDataIndex !== 0 || !pointData) {
                return;
            }
            const [lineNode] = paths[contextDataIndex];
            if (this.isVertical()) {
                this.animateConnectorLinesVertical(lineNode, pointData);
            }
            else {
                this.animateConnectorLinesHorizontal(lineNode, pointData);
            }
        });
    }
    animateConnectorLinesHorizontal(lineNode, pointData) {
        const { path: linePath } = lineNode;
        this.updateLineNode(lineNode);
        const valueAxis = this.getValueAxis();
        const valueAxisReversed = valueAxis === null || valueAxis === void 0 ? void 0 : valueAxis.isReversed();
        const compare = valueAxisReversed ? (v, v2) => v < v2 : (v, v2) => v > v2;
        const startX = valueAxis === null || valueAxis === void 0 ? void 0 : valueAxis.scale.convert(0);
        const endX = pointData.reduce((end, point) => {
            if (compare(point.x, end)) {
                end = point.x;
            }
            return end;
        }, valueAxisReversed ? Infinity : 0);
        const scale = (value, start1, end1, start2, end2) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };
        this.ctx.animationManager.animate({
            id: `${this.id}_datums`,
            groupId: this.id,
            from: startX,
            to: endX,
            ease: _ModuleSupport.Motion.easeOut,
            onUpdate(pointX) {
                linePath.clear({ trackChanges: true });
                pointData.forEach((point, index) => {
                    const x = scale(pointX, startX, endX, startX, point.x);
                    const x2 = scale(pointX, startX, endX, startX, point.x2);
                    if (index !== 0) {
                        linePath.lineTo(x, point.y);
                    }
                    linePath.moveTo(x2, point.y2);
                });
                lineNode.checkPathDirty();
            },
        });
    }
    animateConnectorLinesVertical(lineNode, pointData) {
        const { path: linePath } = lineNode;
        this.updateLineNode(lineNode);
        const valueAxis = this.getValueAxis();
        const valueAxisReversed = valueAxis === null || valueAxis === void 0 ? void 0 : valueAxis.isReversed();
        const compare = valueAxisReversed ? (v, v2) => v > v2 : (v, v2) => v < v2;
        const startY = valueAxis === null || valueAxis === void 0 ? void 0 : valueAxis.scale.convert(0);
        const endY = pointData.reduce((end, point) => {
            if (compare(point.y, end)) {
                end = point.y;
            }
            return end;
        }, valueAxisReversed ? 0 : Infinity);
        const scale = (value, start1, end1, start2, end2) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };
        this.ctx.animationManager.animate({
            id: `${this.id}_datums`,
            groupId: this.id,
            from: startY,
            to: endY,
            ease: _ModuleSupport.Motion.easeOut,
            onUpdate(pointY) {
                linePath.clear({ trackChanges: true });
                pointData.forEach((point, index) => {
                    const y = scale(pointY, startY, endY, startY, point.y);
                    const y2 = scale(pointY, startY, endY, startY, point.y2);
                    if (index !== 0) {
                        linePath.lineTo(point.x, y);
                    }
                    linePath.moveTo(point.x2, y2);
                });
                lineNode.checkPathDirty();
            },
        });
    }
    animateReadyResize(data) {
        super.animateReadyResize(data);
        this.resetConnectorLinesPath(data);
    }
    resetConnectorLinesPath({ contextData, paths, }) {
        if (paths.length === 0) {
            return;
        }
        const [lineNode] = paths[0];
        this.updateLineNode(lineNode);
        const { path: linePath } = lineNode;
        linePath.clear({ trackChanges: true });
        const { pointData } = contextData[0];
        if (!pointData) {
            return;
        }
        pointData.forEach((point, index) => {
            if (index !== 0) {
                linePath.lineTo(point.x, point.y);
            }
            linePath.moveTo(point.x2, point.y2);
        });
        lineNode.checkPathDirty();
    }
    updateLineNode(lineNode) {
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.properties.line;
        lineNode.setProperties({
            fill: undefined,
            stroke,
            strokeWidth: this.getStrokeWidth(strokeWidth),
            strokeOpacity,
            lineDash,
            lineDashOffset,
            lineJoin: 'round',
            pointerEvents: _Scene.PointerEvents.None,
        });
    }
    isLabelEnabled() {
        const { positive, negative, total } = this.properties.item;
        return positive.label.enabled || negative.label.enabled || total.label.enabled;
    }
    onDataChange() { }
}
WaterfallSeries.className = 'WaterfallSeries';
WaterfallSeries.type = 'waterfall';
//# sourceMappingURL=waterfallSeries.js.map