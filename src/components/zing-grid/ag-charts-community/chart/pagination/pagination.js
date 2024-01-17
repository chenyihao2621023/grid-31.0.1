var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { HdpiCanvas } from '../../scene/canvas/hdpiCanvas';
import { Group } from '../../scene/group';
import { Text } from '../../scene/shape/text';
import { createId } from '../../util/id';
import { ActionOnSet } from '../../util/proxy';
import { COLOR_STRING, FONT_STYLE, FONT_WEIGHT, POSITIVE_NUMBER, RATIO, STRING, Validate } from '../../util/validation';
import { ChartUpdateType } from '../chartUpdateType';
import { Triangle } from '../marker/triangle';
import { getMarker } from '../marker/util';
class PaginationLabel {
    constructor() {
        this.color = 'black';
        this.fontStyle = undefined;
        this.fontWeight = undefined;
        this.fontSize = 12;
        this.fontFamily = 'Verdana, sans-serif';
    }
}
__decorate([
    Validate(COLOR_STRING)
], PaginationLabel.prototype, "color", void 0);
__decorate([
    Validate(FONT_STYLE, { optional: true })
], PaginationLabel.prototype, "fontStyle", void 0);
__decorate([
    Validate(FONT_WEIGHT, { optional: true })
], PaginationLabel.prototype, "fontWeight", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PaginationLabel.prototype, "fontSize", void 0);
__decorate([
    Validate(STRING)
], PaginationLabel.prototype, "fontFamily", void 0);
class PaginationMarkerStyle {
    constructor() {
        this.size = 15;
        this.fill = undefined;
        this.fillOpacity = undefined;
        this.stroke = undefined;
        this.strokeWidth = 1;
        this.strokeOpacity = 1;
    }
}
__decorate([
    Validate(POSITIVE_NUMBER)
], PaginationMarkerStyle.prototype, "size", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], PaginationMarkerStyle.prototype, "fill", void 0);
__decorate([
    Validate(RATIO, { optional: true })
], PaginationMarkerStyle.prototype, "fillOpacity", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], PaginationMarkerStyle.prototype, "stroke", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PaginationMarkerStyle.prototype, "strokeWidth", void 0);
__decorate([
    Validate(RATIO)
], PaginationMarkerStyle.prototype, "strokeOpacity", void 0);
class PaginationMarker {
    constructor(parent) {
        this.parent = parent;
        this.shape = Triangle;
        this.size = 15;
        /**
         * Inner padding between a pagination button and the label.
         */
        this.padding = 8;
    }
}
__decorate([
    ActionOnSet({
        changeValue() {
            if (this.parent.marker === this) {
                this.parent.onMarkerShapeChange();
            }
        },
    })
], PaginationMarker.prototype, "shape", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PaginationMarker.prototype, "size", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], PaginationMarker.prototype, "padding", void 0);
export class Pagination {
    constructor(chartUpdateCallback, pageUpdateCallback, interactionManager, cursorManager) {
        this.chartUpdateCallback = chartUpdateCallback;
        this.pageUpdateCallback = pageUpdateCallback;
        this.interactionManager = interactionManager;
        this.cursorManager = cursorManager;
        this.id = createId(this);
        this.group = new Group({ name: 'pagination' });
        this.labelNode = new Text();
        this.marker = new PaginationMarker(this);
        this.activeStyle = new PaginationMarkerStyle();
        this.inactiveStyle = new PaginationMarkerStyle();
        this.highlightStyle = new PaginationMarkerStyle();
        this.label = new PaginationLabel();
        this.totalPages = 0;
        this.currentPage = 0;
        this.translationX = 0;
        this.translationY = 0;
        this.nextButtonDisabled = false;
        this.previousButtonDisabled = false;
        this._visible = true;
        this._enabled = true;
        this._orientation = 'vertical';
        this._nextButton = new Triangle();
        this._previousButton = new Triangle();
        const { labelNode } = this;
        labelNode.textBaseline = 'middle';
        labelNode.fontSize = 12;
        labelNode.fontFamily = 'Verdana, sans-serif';
        labelNode.fill = 'black';
        labelNode.y = HdpiCanvas.has.textMetrics ? 1 : 0;
        this.group.append([this.nextButton, this.previousButton, labelNode]);
        this.interactionManager.addListener('click', (event) => this.onPaginationClick(event));
        this.interactionManager.addListener('hover', (event) => this.onPaginationMouseMove(event));
        this.update();
        this.updateMarkers();
    }
    set visible(value) {
        this._visible = value;
        this.updateGroupVisibility();
    }
    get visible() {
        return this._visible;
    }
    set enabled(value) {
        this._enabled = value;
        this.updateGroupVisibility();
    }
    get enabled() {
        return this._enabled;
    }
    updateGroupVisibility() {
        this.group.visible = this.enabled && this.visible;
    }
    set orientation(value) {
        this._orientation = value;
        switch (value) {
            case 'horizontal': {
                this.previousButton.rotation = -Math.PI / 2;
                this.nextButton.rotation = Math.PI / 2;
                break;
            }
            case 'vertical':
            default: {
                this.previousButton.rotation = 0;
                this.nextButton.rotation = Math.PI;
            }
        }
    }
    get orientation() {
        return this._orientation;
    }
    set nextButton(value) {
        if (this._nextButton !== value) {
            this.group.removeChild(this._nextButton);
            this._nextButton = value;
            this.group.appendChild(value);
        }
    }
    get nextButton() {
        return this._nextButton;
    }
    set previousButton(value) {
        if (this._previousButton !== value) {
            this.group.removeChild(this._previousButton);
            this._previousButton = value;
            this.group.appendChild(value);
        }
    }
    get previousButton() {
        return this._previousButton;
    }
    update() {
        this.updateLabel();
        this.updatePositions();
        this.enableOrDisableButtons();
    }
    updatePositions() {
        this.group.translationX = this.translationX;
        this.group.translationY = this.translationY;
        this.updateLabelPosition();
        this.updateNextButtonPosition();
    }
    updateLabelPosition() {
        const { size: markerSize, padding: markerPadding } = this.marker;
        this.nextButton.size = markerSize;
        this.previousButton.size = markerSize;
        this.labelNode.x = markerSize / 2 + markerPadding;
    }
    updateNextButtonPosition() {
        const labelBBox = this.labelNode.computeBBox();
        this.nextButton.translationX = labelBBox.x + labelBBox.width + this.marker.size / 2 + this.marker.padding;
    }
    updateLabel() {
        const { currentPage, totalPages: pages, labelNode, label: { color, fontStyle, fontWeight, fontSize, fontFamily }, } = this;
        labelNode.text = `${currentPage + 1} / ${pages}`;
        labelNode.fill = color;
        labelNode.fontStyle = fontStyle;
        labelNode.fontWeight = fontWeight;
        labelNode.fontSize = fontSize;
        labelNode.fontFamily = fontFamily;
    }
    updateMarkers() {
        const { nextButton, previousButton, nextButtonDisabled, previousButtonDisabled, activeStyle, inactiveStyle, highlightStyle, highlightActive, } = this;
        const buttonStyle = (button, disabled) => {
            if (disabled) {
                return inactiveStyle;
            }
            else if (button === highlightActive) {
                return highlightStyle;
            }
            return activeStyle;
        };
        this.updateMarker(nextButton, buttonStyle('next', nextButtonDisabled));
        this.updateMarker(previousButton, buttonStyle('previous', previousButtonDisabled));
    }
    updateMarker(marker, style) {
        var _a;
        const { size } = this.marker;
        marker.size = size;
        marker.fill = style.fill;
        marker.fillOpacity = (_a = style.fillOpacity) !== null && _a !== void 0 ? _a : 1;
        marker.stroke = style.stroke;
        marker.strokeWidth = style.strokeWidth;
        marker.strokeOpacity = style.strokeOpacity;
    }
    enableOrDisableButtons() {
        const { currentPage, totalPages } = this;
        const zeroPagesToDisplay = totalPages === 0;
        const onLastPage = currentPage === totalPages - 1;
        const onFirstPage = currentPage === 0;
        this.nextButtonDisabled = onLastPage || zeroPagesToDisplay;
        this.previousButtonDisabled = onFirstPage || zeroPagesToDisplay;
    }
    nextButtonContainsPoint(offsetX, offsetY) {
        return !this.nextButtonDisabled && this.nextButton.containsPoint(offsetX, offsetY);
    }
    previousButtonContainsPoint(offsetX, offsetY) {
        return !this.previousButtonDisabled && this.previousButton.containsPoint(offsetX, offsetY);
    }
    onPaginationClick(event) {
        const { offsetX, offsetY } = event;
        if (this.nextButtonContainsPoint(offsetX, offsetY)) {
            this.incrementPage();
            this.onPaginationChanged();
            event.consume();
        }
        else if (this.previousButtonContainsPoint(offsetX, offsetY)) {
            this.decrementPage();
            this.onPaginationChanged();
            event.consume();
        }
    }
    onPaginationMouseMove(event) {
        const { offsetX, offsetY } = event;
        if (this.nextButtonContainsPoint(offsetX, offsetY)) {
            this.cursorManager.updateCursor(this.id, 'pointer');
            this.highlightActive = 'next';
        }
        else if (this.previousButtonContainsPoint(offsetX, offsetY)) {
            this.cursorManager.updateCursor(this.id, 'pointer');
            this.highlightActive = 'previous';
        }
        else {
            this.cursorManager.updateCursor(this.id);
            this.highlightActive = undefined;
        }
        this.updateMarkers();
        this.chartUpdateCallback(ChartUpdateType.SCENE_RENDER);
    }
    onPaginationChanged() {
        this.pageUpdateCallback(this.currentPage);
    }
    incrementPage() {
        this.currentPage = Math.min(this.currentPage + 1, this.totalPages - 1);
    }
    decrementPage() {
        this.currentPage = Math.max(this.currentPage - 1, 0);
    }
    onMarkerShapeChange() {
        const Marker = getMarker(this.marker.shape || Triangle);
        this.previousButton = new Marker();
        this.nextButton = new Marker();
        this.updatePositions();
        this.updateMarkers();
        this.chartUpdateCallback(ChartUpdateType.SCENE_RENDER);
    }
    attachPagination(node) {
        node.append(this.group);
    }
    computeBBox() {
        return this.group.computeBBox();
    }
}
Pagination.className = 'Pagination';
//# sourceMappingURL=pagination.js.map