var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BBox } from '../scene/bbox';
import { HdpiCanvas } from '../scene/canvas/hdpiCanvas';
import { Group } from '../scene/group';
import { RedrawType } from '../scene/node';
import { Selection } from '../scene/selection';
import { getFont } from '../scene/shape/text';
import { createId } from '../util/id';
import { Logger } from '../util/logger';
import { BOOLEAN, COLOR_STRING, FONT_STYLE, FONT_WEIGHT, FUNCTION, POSITION, POSITIVE_NUMBER, STRING, UNION, Validate, } from '../util/validation';
import { ChartUpdateType } from './chartUpdateType';
import { gridLayout } from './gridLayout';
import { Layers } from './layers';
import { getMarker } from './marker/util';
import { MarkerLabel } from './markerLabel';
import { Pagination } from './pagination/pagination';
import { toTooltipHtml } from './tooltip/tooltip';
class LegendLabel {
    constructor() {
        this.maxLength = undefined;
        this.color = 'black';
        this.fontStyle = undefined;
        this.fontWeight = undefined;
        this.fontSize = 12;
        this.fontFamily = 'Verdana, sans-serif';
        this.formatter = undefined;
    }
}
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], LegendLabel.prototype, "maxLength", void 0);
__decorate([
    Validate(COLOR_STRING)
], LegendLabel.prototype, "color", void 0);
__decorate([
    Validate(FONT_STYLE, { optional: true })
], LegendLabel.prototype, "fontStyle", void 0);
__decorate([
    Validate(FONT_WEIGHT, { optional: true })
], LegendLabel.prototype, "fontWeight", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], LegendLabel.prototype, "fontSize", void 0);
__decorate([
    Validate(STRING)
], LegendLabel.prototype, "fontFamily", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], LegendLabel.prototype, "formatter", void 0);
class LegendMarker {
    constructor() {
        this.size = 15;
        /**
         * If the marker type is set, the legend will always use that marker type for all its items,
         * regardless of the type that comes from the `data`.
         */
        this._shape = undefined;
        /**
         * Padding between the marker and the label within each legend item.
         */
        this.padding = 8;
        this.strokeWidth = undefined;
        this.enabled = true;
    }
    set shape(value) {
        var _a;
        this._shape = value;
        (_a = this.parent) === null || _a === void 0 ? void 0 : _a.onMarkerShapeChange();
    }
    get shape() {
        return this._shape;
    }
}
__decorate([
    Validate(POSITIVE_NUMBER)
], LegendMarker.prototype, "size", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], LegendMarker.prototype, "padding", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], LegendMarker.prototype, "strokeWidth", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], LegendMarker.prototype, "enabled", void 0);
class LegendLine {
    constructor() {
        this.strokeWidth = undefined;
        this.length = undefined;
    }
}
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], LegendLine.prototype, "strokeWidth", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], LegendLine.prototype, "length", void 0);
class LegendItem {
    constructor() {
        this.marker = new LegendMarker();
        this.label = new LegendLabel();
        this.line = new LegendLine();
        /** Used to constrain the width of legend items. */
        this.maxWidth = undefined;
        /**
         * The legend uses grid layout for its items, occupying as few columns as possible when positioned to left or right,
         * and as few rows as possible when positioned to top or bottom. This config specifies the amount of horizontal
         * padding between legend items.
         */
        this.paddingX = 16;
        /**
         * The legend uses grid layout for its items, occupying as few columns as possible when positioned to left or right,
         * and as few rows as possible when positioned to top or bottom. This config specifies the amount of vertical
         * padding between legend items.
         */
        this.paddingY = 8;
        this.toggleSeriesVisible = true;
        this.showSeriesStroke = false;
    }
}
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], LegendItem.prototype, "maxWidth", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], LegendItem.prototype, "paddingX", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], LegendItem.prototype, "paddingY", void 0);
__decorate([
    Validate(BOOLEAN)
], LegendItem.prototype, "toggleSeriesVisible", void 0);
__decorate([
    Validate(BOOLEAN)
], LegendItem.prototype, "showSeriesStroke", void 0);
class LegendListeners {
    constructor() {
        this.legendItemClick = undefined;
        this.legendItemDoubleClick = undefined;
    }
}
__decorate([
    Validate(FUNCTION, { optional: true })
], LegendListeners.prototype, "legendItemClick", void 0);
export class Legend {
    set data(value) {
        this._data = value;
        this.updateGroupVisibility();
    }
    get data() {
        return this._data;
    }
    set enabled(value) {
        this._enabled = value;
        this.updateGroupVisibility();
    }
    get enabled() {
        return this._enabled;
    }
    getOrientation() {
        if (this.orientation !== undefined) {
            return this.orientation;
        }
        switch (this.position) {
            case 'right':
            case 'left':
                return 'vertical';
            case 'bottom':
            case 'top':
                return 'horizontal';
        }
    }
    constructor(ctx) {
        this.ctx = ctx;
        this.id = createId(this);
        this.group = new Group({ name: 'legend', layer: true, zIndex: Layers.LEGEND_ZINDEX });
        this.itemSelection = Selection.select(this.group, MarkerLabel);
        this.oldSize = [0, 0];
        this.pages = [];
        this.maxPageSize = [0, 0];
        /** Item index to track on re-pagination, so current page updates appropriately. */
        this.paginationTrackingIndex = 0;
        this.item = new LegendItem();
        this.listeners = new LegendListeners();
        this.truncatedItems = new Set();
        this._data = [];
        this._enabled = true;
        this.position = 'bottom';
        /** Used to constrain the width of the legend. */
        this.maxWidth = undefined;
        /** Used to constrain the height of the legend. */
        this.maxHeight = undefined;
        /** Reverse the display order of legend items if `true`. */
        this.reverseOrder = undefined;
        this.preventHidingAll = undefined;
        this.destroyFns = [];
        /**
         * Spacing between the legend and the edge of the chart's element.
         */
        this.spacing = 20;
        this.characterWidths = new Map();
        this.size = [0, 0];
        this._visible = true;
        this.item.marker.parent = this;
        this.pagination = new Pagination((type) => ctx.updateService.update(type), (page) => this.updatePageNumber(page), ctx.interactionManager, ctx.cursorManager);
        this.pagination.attachPagination(this.group);
        this.item.marker.parent = this;
        const bypass = { bypassPause: ['animation'] };
        this.destroyFns.push(ctx.interactionManager.addListener('click', (e) => this.checkLegendClick(e), bypass), ctx.interactionManager.addListener('dblclick', (e) => this.checkLegendDoubleClick(e), bypass), ctx.interactionManager.addListener('hover', (e) => this.handleLegendMouseMove(e)), ctx.layoutService.addListener('start-layout', (e) => this.positionLegend(e.shrinkRect)), () => this.detachLegend());
    }
    destroy() {
        this.destroyFns.forEach((f) => f());
    }
    onMarkerShapeChange() {
        this.itemSelection.clear();
        this.group.markDirty(this.group, RedrawType.MINOR);
    }
    getCharacterWidths(font) {
        const { characterWidths } = this;
        if (characterWidths.has(font)) {
            return characterWidths.get(font);
        }
        const cw = {
            '...': HdpiCanvas.getTextSize('...', font).width,
        };
        characterWidths.set(font, cw);
        return cw;
    }
    set visible(value) {
        this._visible = value;
        this.updateGroupVisibility();
    }
    get visible() {
        return this._visible;
    }
    updateGroupVisibility() {
        this.group.visible = this.enabled && this.visible && this.data.length > 0;
    }
    attachLegend(node) {
        node.append(this.group);
    }
    detachLegend() {
        var _a;
        (_a = this.group.parent) === null || _a === void 0 ? void 0 : _a.removeChild(this.group);
    }
    getItemLabel(datum) {
        const { ctx: { callbackCache }, } = this;
        const { formatter } = this.item.label;
        if (formatter) {
            return callbackCache.call(formatter, {
                itemId: datum.itemId,
                value: datum.label.text,
                seriesId: datum.seriesId,
            });
        }
        return datum.label.text;
    }
    /**
     * The method is given the desired size of the legend, which only serves as a hint.
     * The vertically oriented legend will take as much horizontal space as needed, but will
     * respect the height constraints, and the horizontal legend will take as much vertical
     * space as needed in an attempt not to exceed the given width.
     * After the layout is done, the {@link size} will contain the actual size of the legend.
     * If the actual size is not the same as the previous actual size, the legend will fire
     * the 'layoutChange' event to communicate that another layout is needed, and the above
     * process should be repeated.
     * @param width
     * @param height
     */
    performLayout(width, height) {
        const { paddingX, paddingY, label, maxWidth, marker: { size: markerSize, padding: markerPadding, shape: markerShape }, label: { maxLength = Infinity, fontStyle, fontWeight, fontSize, fontFamily }, line: itemLine, showSeriesStroke, } = this.item;
        const data = [...this.data];
        if (this.reverseOrder) {
            data.reverse();
        }
        this.itemSelection.update(data);
        // Update properties that affect the size of the legend items and measure them.
        const bboxes = [];
        const font = getFont(label);
        const itemMaxWidthPercentage = 0.8;
        const maxItemWidth = maxWidth !== null && maxWidth !== void 0 ? maxWidth : width * itemMaxWidthPercentage;
        const paddedMarkerWidth = markerSize + markerPadding + paddingX;
        this.itemSelection.each((markerLabel, datum) => {
            var _a, _b, _c;
            const Marker = getMarker(markerShape !== null && markerShape !== void 0 ? markerShape : datum.marker.shape);
            const markerEnabled = (_a = datum.marker.enabled) !== null && _a !== void 0 ? _a : this.item.marker.enabled;
            if (!(markerLabel.marker && markerLabel.marker instanceof Marker)) {
                markerLabel.marker = new Marker();
            }
            markerLabel.markerSize = markerSize;
            markerLabel.spacing = markerPadding;
            markerLabel.fontStyle = fontStyle;
            markerLabel.fontWeight = fontWeight;
            markerLabel.fontSize = fontSize;
            markerLabel.fontFamily = fontFamily;
            const id = (_b = datum.itemId) !== null && _b !== void 0 ? _b : datum.id;
            const labelText = this.getItemLabel(datum);
            const text = (labelText !== null && labelText !== void 0 ? labelText : '<unknown>').replace(/\r?\n/g, ' ');
            markerLabel.text = this.truncate(text, maxLength, maxItemWidth, paddedMarkerWidth, font, id);
            if (showSeriesStroke && datum.line !== undefined) {
                markerLabel.lineVisible = true;
                markerLabel.markerVisible = markerEnabled;
                markerLabel.setSeriesStrokeOffset((_c = itemLine.length) !== null && _c !== void 0 ? _c : 5);
            }
            else {
                markerLabel.lineVisible = false;
                markerLabel.markerVisible = true;
            }
            bboxes.push(markerLabel.computeBBox());
        });
        width = Math.max(1, width);
        height = Math.max(1, height);
        if (!isFinite(width)) {
            return false;
        }
        const size = this.size;
        const oldSize = this.oldSize;
        size[0] = width;
        size[1] = height;
        if (size[0] !== oldSize[0] || size[1] !== oldSize[1]) {
            oldSize[0] = size[0];
            oldSize[1] = size[1];
        }
        const { pages, maxPageHeight, maxPageWidth } = this.updatePagination(bboxes, width, height);
        this.pages = pages;
        this.maxPageSize = [maxPageWidth - paddingX, maxPageHeight - paddingY];
        const pageNumber = this.pagination.currentPage;
        const page = this.pages[pageNumber];
        if (this.pages.length < 1 || !page) {
            this.visible = false;
            return;
        }
        this.visible = true;
        // Position legend items
        this.updatePositions(pageNumber);
        // Update legend item properties that don't affect the layout.
        this.update();
    }
    truncate(text, maxCharLength, maxItemWidth, paddedMarkerWidth, font, id) {
        const ellipsis = `...`;
        const textChars = text.split('');
        let addEllipsis = false;
        if (text.length > maxCharLength) {
            text = `${text.substring(0, maxCharLength)}`;
            addEllipsis = true;
        }
        const labelWidth = Math.floor(paddedMarkerWidth + HdpiCanvas.getTextSize(text, font).width);
        if (labelWidth > maxItemWidth) {
            let truncatedText = '';
            const characterWidths = this.getCharacterWidths(font);
            let cumulativeWidth = paddedMarkerWidth + characterWidths[ellipsis];
            for (const char of textChars) {
                if (!characterWidths[char]) {
                    characterWidths[char] = HdpiCanvas.getTextSize(char, font).width;
                }
                cumulativeWidth += characterWidths[char];
                if (cumulativeWidth > maxItemWidth) {
                    break;
                }
                truncatedText += char;
            }
            text = truncatedText;
            addEllipsis = true;
        }
        if (addEllipsis) {
            text += ellipsis;
            this.truncatedItems.add(id);
        }
        else {
            this.truncatedItems.delete(id);
        }
        return text;
    }
    updatePagination(bboxes, width, height) {
        const orientation = this.getOrientation();
        const trackingIndex = Math.min(this.paginationTrackingIndex, bboxes.length);
        this.pagination.orientation = orientation;
        this.pagination.translationX = 0;
        this.pagination.translationY = 0;
        const { pages, maxPageHeight, maxPageWidth, paginationBBox, paginationVertical } = this.calculatePagination(bboxes, width, height);
        const newCurrentPage = pages.findIndex((p) => p.endIndex >= trackingIndex);
        this.pagination.currentPage = Math.min(Math.max(newCurrentPage, 0), pages.length - 1);
        const { paddingX: itemPaddingX, paddingY: itemPaddingY } = this.item;
        const paginationComponentPadding = 8;
        const legendItemsWidth = maxPageWidth - itemPaddingX;
        const legendItemsHeight = maxPageHeight - itemPaddingY;
        let paginationX = 0;
        let paginationY = -paginationBBox.y - this.item.marker.size / 2;
        if (paginationVertical) {
            paginationY += legendItemsHeight + paginationComponentPadding;
        }
        else {
            paginationX += -paginationBBox.x + legendItemsWidth + paginationComponentPadding;
            paginationY += (legendItemsHeight - paginationBBox.height) / 2;
        }
        this.pagination.translationX = paginationX;
        this.pagination.translationY = paginationY;
        this.pagination.update();
        this.pagination.updateMarkers();
        return {
            maxPageHeight,
            maxPageWidth,
            pages,
        };
    }
    calculatePagination(bboxes, width, height) {
        var _a, _b, _c;
        const { paddingX: itemPaddingX, paddingY: itemPaddingY } = this.item;
        const orientation = this.getOrientation();
        const paginationVertical = ['left', 'right'].includes(this.position);
        let paginationBBox = this.pagination.computeBBox();
        let lastPassPaginationBBox = new BBox(0, 0, 0, 0);
        let pages = [];
        let maxPageWidth = 0;
        let maxPageHeight = 0;
        let count = 0;
        const stableOutput = (lastPassPaginationBBox) => {
            const { width, height } = lastPassPaginationBBox;
            return width === paginationBBox.width && height === paginationBBox.height;
        };
        const forceResult = this.maxWidth !== undefined || this.maxHeight !== undefined;
        do {
            if (count++ > 10) {
                Logger.warn('unable to find stable legend layout.');
                break;
            }
            paginationBBox = lastPassPaginationBBox;
            const maxWidth = width - (paginationVertical ? 0 : paginationBBox.width);
            const maxHeight = height - (paginationVertical ? paginationBBox.height : 0);
            const layout = gridLayout({
                orientation,
                bboxes,
                maxHeight,
                maxWidth,
                itemPaddingY,
                itemPaddingX,
                forceResult,
            });
            pages = (_a = layout === null || layout === void 0 ? void 0 : layout.pages) !== null && _a !== void 0 ? _a : [];
            maxPageWidth = (_b = layout === null || layout === void 0 ? void 0 : layout.maxPageWidth) !== null && _b !== void 0 ? _b : 0;
            maxPageHeight = (_c = layout === null || layout === void 0 ? void 0 : layout.maxPageHeight) !== null && _c !== void 0 ? _c : 0;
            const totalPages = pages.length;
            this.pagination.visible = totalPages > 1;
            this.pagination.totalPages = totalPages;
            this.pagination.update();
            lastPassPaginationBBox = this.pagination.computeBBox();
            if (!this.pagination.visible) {
                break;
            }
        } while (!stableOutput(lastPassPaginationBBox));
        return { maxPageWidth, maxPageHeight, pages, paginationBBox, paginationVertical };
    }
    updatePositions(pageNumber = 0) {
        const { item: { paddingY }, itemSelection, pages, } = this;
        if (pages.length < 1 || !pages[pageNumber]) {
            return;
        }
        const { columns, startIndex: visibleStart, endIndex: visibleEnd } = pages[pageNumber];
        // Position legend items using the layout computed above.
        let x = 0;
        let y = 0;
        const columnCount = columns.length;
        const rowCount = columns[0].indices.length;
        const horizontal = this.getOrientation() === 'horizontal';
        const itemHeight = columns[0].bboxes[0].height + paddingY;
        const rowSumColumnWidths = [];
        itemSelection.each((markerLabel, _, i) => {
            var _a, _b;
            if (i < visibleStart || i > visibleEnd) {
                markerLabel.visible = false;
                return;
            }
            const pageIndex = i - visibleStart;
            let columnIndex = 0;
            let rowIndex = 0;
            if (horizontal) {
                columnIndex = pageIndex % columnCount;
                rowIndex = Math.floor(pageIndex / columnCount);
            }
            else {
                columnIndex = Math.floor(pageIndex / rowCount);
                rowIndex = pageIndex % rowCount;
            }
            markerLabel.visible = true;
            const column = columns[columnIndex];
            if (!column) {
                return;
            }
            y = itemHeight * rowIndex;
            x = (_a = rowSumColumnWidths[rowIndex]) !== null && _a !== void 0 ? _a : 0;
            rowSumColumnWidths[rowIndex] = ((_b = rowSumColumnWidths[rowIndex]) !== null && _b !== void 0 ? _b : 0) + column.columnWidth;
            // Round off for pixel grid alignment to work properly.
            markerLabel.translationX = Math.floor(x);
            markerLabel.translationY = Math.floor(y);
        });
    }
    updatePageNumber(pageNumber) {
        const { pages } = this;
        // Track an item on the page in re-pagination cases (e.g. resize).
        const { startIndex, endIndex } = pages[pageNumber];
        if (startIndex === 0) {
            // Stay on first page on pagination update.
            this.paginationTrackingIndex = 0;
        }
        else if (pageNumber === pages.length - 1) {
            // Stay on last page on pagination update.
            this.paginationTrackingIndex = endIndex;
        }
        else {
            // Track the middle item on the page).
            this.paginationTrackingIndex = Math.floor((startIndex + endIndex) / 2);
        }
        this.pagination.update();
        this.pagination.updateMarkers();
        this.updatePositions(pageNumber);
        this.ctx.updateService.update(ChartUpdateType.SCENE_RENDER);
    }
    update() {
        const { label: { color }, marker: itemMarker, line: itemLine, showSeriesStroke, } = this.item;
        this.itemSelection.each((markerLabel, datum) => {
            var _a, _b;
            const marker = datum.marker;
            markerLabel.markerFill = marker.fill;
            markerLabel.markerStroke = marker.stroke;
            markerLabel.markerStrokeWidth = (_a = itemMarker.strokeWidth) !== null && _a !== void 0 ? _a : Math.min(2, marker.strokeWidth);
            markerLabel.markerFillOpacity = marker.fillOpacity;
            markerLabel.markerStrokeOpacity = marker.strokeOpacity;
            markerLabel.opacity = datum.enabled ? 1 : 0.5;
            markerLabel.color = color;
            const { line } = datum;
            if (showSeriesStroke && line !== undefined) {
                markerLabel.lineStroke = line.stroke;
                markerLabel.lineStrokeOpacity = line.strokeOpacity;
                markerLabel.lineStrokeWidth = (_b = itemLine.strokeWidth) !== null && _b !== void 0 ? _b : Math.min(2, line.strokeWidth);
                markerLabel.lineLineDash = line.lineDash;
            }
        });
    }
    getDatumForPoint(x, y) {
        const visibleChildBBoxes = [];
        const closestLeftTop = { dist: Infinity, datum: undefined };
        for (const child of this.group.children) {
            if (!child.visible)
                continue;
            if (!(child instanceof MarkerLabel))
                continue;
            const childBBox = child.computeBBox();
            childBBox.grow(this.item.paddingX / 2, 'horizontal');
            childBBox.grow(this.item.paddingY / 2, 'vertical');
            if (childBBox.containsPoint(x, y)) {
                return child.datum;
            }
            const distX = x - childBBox.x - this.item.paddingX / 2;
            const distY = y - childBBox.y - this.item.paddingY / 2;
            const dist = Math.pow(distX, 2) + Math.pow(distY, 2);
            const toTheLeftTop = distX >= 0 && distY >= 0;
            if (toTheLeftTop && dist < closestLeftTop.dist) {
                closestLeftTop.dist = dist;
                closestLeftTop.datum = child.datum;
            }
            visibleChildBBoxes.push(childBBox);
        }
        const pageBBox = BBox.merge(visibleChildBBoxes);
        if (!pageBBox.containsPoint(x, y)) {
            // We're not in-between legend items.
            return undefined;
        }
        // Fallback to returning closest match to the left/up.
        return closestLeftTop.datum;
    }
    computeBBox() {
        return this.group.computeBBox();
    }
    computePagedBBox() {
        const actualBBox = this.group.computeBBox();
        if (this.pages.length <= 1) {
            return actualBBox;
        }
        const [maxPageWidth, maxPageHeight] = this.maxPageSize;
        actualBBox.height = Math.max(maxPageHeight, actualBBox.height);
        actualBBox.width = Math.max(maxPageWidth, actualBBox.width);
        return actualBBox;
    }
    checkLegendClick(event) {
        const { listeners: { legendItemClick }, ctx: { chartService, highlightManager }, item: { toggleSeriesVisible }, preventHidingAll, } = this;
        const { offsetX, offsetY } = event;
        const legendBBox = this.computeBBox();
        const pointerInsideLegend = this.group.visible && legendBBox.containsPoint(offsetX, offsetY);
        const datum = this.getDatumForPoint(offsetX, offsetY);
        if (!pointerInsideLegend || !datum) {
            return;
        }
        const { id, itemId, enabled } = datum;
        const series = chartService.series.find((s) => s.id === id);
        if (!series) {
            return;
        }
        event.consume();
        let newEnabled = enabled;
        if (toggleSeriesVisible) {
            newEnabled = !enabled;
            if (preventHidingAll && !newEnabled) {
                const numVisibleItems = chartService.series
                    .flatMap((series) => series.getLegendData('category'))
                    .filter((datum) => datum.enabled).length;
                if (numVisibleItems < 2) {
                    newEnabled = true;
                }
            }
            this.ctx.chartEventManager.legendItemClick(series, itemId, newEnabled, datum.legendItemName);
        }
        if (!newEnabled) {
            highlightManager.updateHighlight(this.id);
        }
        else {
            highlightManager.updateHighlight(this.id, {
                series,
                itemId,
                datum: undefined,
            });
        }
        this.ctx.updateService.update(ChartUpdateType.PROCESS_DATA, { forceNodeDataRefresh: true });
        legendItemClick === null || legendItemClick === void 0 ? void 0 : legendItemClick({ type: 'click', enabled: newEnabled, itemId, seriesId: series.id });
    }
    checkLegendDoubleClick(event) {
        var _a;
        const { listeners: { legendItemDoubleClick }, ctx: { chartService }, item: { toggleSeriesVisible }, } = this;
        const { offsetX, offsetY } = event;
        // Integrated charts do not handle double click behaviour correctly due to multiple instances of the
        // chart being created. See https://ag-grid.atlassian.net/browse/RTI-1381
        if (chartService.mode === 'integrated') {
            return;
        }
        const legendBBox = this.computeBBox();
        const pointerInsideLegend = this.group.visible && legendBBox.containsPoint(offsetX, offsetY);
        const datum = this.getDatumForPoint(offsetX, offsetY);
        if (!pointerInsideLegend || !datum) {
            return;
        }
        const { id, itemId, seriesId } = datum;
        const series = chartService.series.find((s) => s.id === id);
        if (!series) {
            return;
        }
        event.consume();
        if (toggleSeriesVisible) {
            const legendData = chartService.series.flatMap((series) => series.getLegendData('category'));
            const numVisibleItems = legendData.filter((datum) => datum.enabled).length;
            const clickedItem = legendData.find((d) => d.itemId === itemId && d.seriesId === seriesId);
            this.ctx.chartEventManager.legendItemDoubleClick(series, itemId, (_a = clickedItem === null || clickedItem === void 0 ? void 0 : clickedItem.enabled) !== null && _a !== void 0 ? _a : false, numVisibleItems, clickedItem === null || clickedItem === void 0 ? void 0 : clickedItem.legendItemName);
        }
        this.ctx.updateService.update(ChartUpdateType.PROCESS_DATA, { forceNodeDataRefresh: true });
        legendItemDoubleClick === null || legendItemDoubleClick === void 0 ? void 0 : legendItemDoubleClick({ type: 'dblclick', enabled: true, itemId, seriesId: series.id });
    }
    handleLegendMouseMove(event) {
        var _a;
        const { enabled, item: { toggleSeriesVisible }, listeners, } = this;
        if (!enabled) {
            return;
        }
        const legendBBox = this.computeBBox();
        const { pageX, pageY, offsetX, offsetY } = event;
        const pointerInsideLegend = this.group.visible && legendBBox.containsPoint(offsetX, offsetY);
        if (!pointerInsideLegend) {
            this.ctx.cursorManager.updateCursor(this.id);
            this.ctx.highlightManager.updateHighlight(this.id);
            this.ctx.tooltipManager.removeTooltip(this.id);
            return;
        }
        // Prevent other handlers from consuming this event if it's generated inside the legend
        // boundaries.
        event.consume();
        const datum = this.getDatumForPoint(offsetX, offsetY);
        const pointerOverLegendDatum = pointerInsideLegend && datum !== undefined;
        if (!pointerOverLegendDatum) {
            this.ctx.cursorManager.updateCursor(this.id);
            this.ctx.highlightManager.updateHighlight(this.id);
            return;
        }
        const series = datum ? this.ctx.chartService.series.find((series) => series.id === (datum === null || datum === void 0 ? void 0 : datum.id)) : undefined;
        if (datum && this.truncatedItems.has((_a = datum.itemId) !== null && _a !== void 0 ? _a : datum.id)) {
            this.ctx.tooltipManager.updateTooltip(this.id, { pageX, pageY, offsetX, offsetY, event, showArrow: false, addCustomClass: false }, toTooltipHtml({ content: this.getItemLabel(datum) }));
        }
        else {
            this.ctx.tooltipManager.removeTooltip(this.id);
        }
        if (toggleSeriesVisible || listeners.legendItemClick != null || listeners.legendItemDoubleClick != null) {
            this.ctx.cursorManager.updateCursor(this.id, 'pointer');
        }
        if ((datum === null || datum === void 0 ? void 0 : datum.enabled) && series) {
            this.ctx.highlightManager.updateHighlight(this.id, {
                series,
                itemId: datum === null || datum === void 0 ? void 0 : datum.itemId,
                datum: undefined,
            });
        }
        else {
            this.ctx.highlightManager.updateHighlight(this.id);
        }
    }
    positionLegend(shrinkRect) {
        const newShrinkRect = shrinkRect.clone();
        if (!this.enabled || !this.data.length) {
            return { shrinkRect: newShrinkRect };
        }
        const [legendWidth, legendHeight] = this.calculateLegendDimensions(shrinkRect);
        this.group.translationX = 0;
        this.group.translationY = 0;
        this.performLayout(legendWidth, legendHeight);
        const legendBBox = this.computePagedBBox();
        const calculateTranslationPerpendicularDimension = () => {
            switch (this.position) {
                case 'top':
                case 'left':
                    return 0;
                case 'bottom':
                    return shrinkRect.height - legendBBox.height;
                case 'right':
                default:
                    return shrinkRect.width - legendBBox.width;
            }
        };
        if (this.visible) {
            let translationX;
            let translationY;
            switch (this.position) {
                case 'top':
                case 'bottom':
                    translationX = (shrinkRect.width - legendBBox.width) / 2;
                    translationY = calculateTranslationPerpendicularDimension();
                    newShrinkRect.shrink(legendBBox.height, this.position);
                    break;
                case 'left':
                case 'right':
                default:
                    translationX = calculateTranslationPerpendicularDimension();
                    translationY = (shrinkRect.height - legendBBox.height) / 2;
                    newShrinkRect.shrink(legendBBox.width, this.position);
            }
            // Round off for pixel grid alignment to work properly.
            this.group.translationX = Math.floor(-legendBBox.x + shrinkRect.x + translationX);
            this.group.translationY = Math.floor(-legendBBox.y + shrinkRect.y + translationY);
        }
        if (this.visible && this.enabled && this.data.length) {
            const legendPadding = this.spacing;
            newShrinkRect.shrink(legendPadding, this.position);
            const legendPositionedBBox = legendBBox.clone();
            legendPositionedBBox.x += this.group.translationX;
            legendPositionedBBox.y += this.group.translationY;
            this.ctx.tooltipManager.updateExclusiveRect(this.id, legendPositionedBBox);
        }
        else {
            this.ctx.tooltipManager.updateExclusiveRect(this.id);
        }
        return { shrinkRect: newShrinkRect };
    }
    calculateLegendDimensions(shrinkRect) {
        const { width, height } = shrinkRect;
        const aspectRatio = width / height;
        const maxCoefficient = 0.5;
        const minHeightCoefficient = 0.2;
        const minWidthCoefficient = 0.25;
        let legendWidth, legendHeight;
        switch (this.position) {
            case 'top':
            case 'bottom':
                // A horizontal legend should take maximum between 20 to 50 percent of the chart height if height is larger than width
                // and maximum 20 percent of the chart height if height is smaller than width.
                const heightCoefficient = aspectRatio < 1
                    ? Math.min(maxCoefficient, minHeightCoefficient * (1 / aspectRatio))
                    : minHeightCoefficient;
                legendWidth = this.maxWidth ? Math.min(this.maxWidth, width) : width;
                legendHeight = this.maxHeight
                    ? Math.min(this.maxHeight, height)
                    : Math.round(height * heightCoefficient);
                break;
            case 'left':
            case 'right':
            default:
                // A vertical legend should take maximum between 25 to 50 percent of the chart width if width is larger than height
                // and maximum 25 percent of the chart width if width is smaller than height.
                const widthCoefficient = aspectRatio > 1 ? Math.min(maxCoefficient, minWidthCoefficient * aspectRatio) : minWidthCoefficient;
                legendWidth = this.maxWidth ? Math.min(this.maxWidth, width) : Math.round(width * widthCoefficient);
                legendHeight = this.maxHeight ? Math.min(this.maxHeight, height) : height;
        }
        return [legendWidth, legendHeight];
    }
}
Legend.className = 'Legend';
__decorate([
    Validate(BOOLEAN)
], Legend.prototype, "_enabled", void 0);
__decorate([
    Validate(POSITION)
], Legend.prototype, "position", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], Legend.prototype, "maxWidth", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], Legend.prototype, "maxHeight", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], Legend.prototype, "reverseOrder", void 0);
__decorate([
    Validate(UNION(['horizontal', 'vertical'], 'an orientation'), { optional: true })
], Legend.prototype, "orientation", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], Legend.prototype, "preventHidingAll", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], Legend.prototype, "spacing", void 0);
//# sourceMappingURL=legend.js.map