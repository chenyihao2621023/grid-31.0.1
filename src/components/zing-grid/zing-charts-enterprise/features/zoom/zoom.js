var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
import { ContextMenu } from '../context-menu/main';
import { ZoomRect } from './scenes/zoomRect';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomPanner } from './zoomPanner';
import { ZoomScroller } from './zoomScroller';
import { ZoomSelector } from './zoomSelector';
import { UNIT, constrainZoom, definedZoomState, pointToRatio, scaleZoomCenter, translateZoom, unitZoomState } from './zoomTransformers';
const {
  BOOLEAN,
  NUMBER,
  RATIO,
  UNION,
  ActionOnSet,
  ChartAxisDirection,
  ChartUpdateType,
  Validate
} = _ModuleSupport;
const ANCHOR_CORD = UNION(['pointer', 'start', 'middle', 'end'], 'an anchor cord');
const CONTEXT_ZOOM_ACTION_ID = 'zoom-action';
const CONTEXT_PAN_ACTION_ID = 'pan-action';
const CURSOR_ID = 'zoom-cursor';
const TOOLTIP_ID = 'zoom-tooltip';
const ZOOM_ID = 'zoom';
const DECIMALS = 3;
const round = (value, decimals = DECIMALS) => {
  const pow = Math.pow(10, decimals);
  return Math.round(value * pow) / pow;
};
export class Zoom extends _ModuleSupport.BaseModuleInstance {
  constructor(ctx) {
    var _a;
    super();
    this.ctx = ctx;
    this.enabled = false;
    this.enableAxisDragging = true;
    this.enableDoubleClickToReset = true;
    this.enablePanning = true;
    this.enableScrolling = true;
    this.enableSelecting = false;
    this.panKey = 'alt';
    this.axes = 'x';
    this.scrollingStep = UNIT.max / 10;
    this.minVisibleItemsX = 2;
    this.minVisibleItemsY = 2;
    this.anchorPointX = 'end';
    this.anchorPointY = 'middle';
    this.axisDragger = new ZoomAxisDragger();
    this.panner = new ZoomPanner();
    this.scroller = new ZoomScroller();
    this.isDragging = false;
    this.minRatioX = 0;
    this.minRatioY = 0;
    this.enableSecondaryAxis = false;
    this.scene = ctx.scene;
    this.cursorManager = ctx.cursorManager;
    this.highlightManager = ctx.highlightManager;
    this.tooltipManager = ctx.tooltipManager;
    this.zoomManager = ctx.zoomManager;
    this.updateService = ctx.updateService;
    const interactionOpts = {
      bypassPause: ['animation']
    };
    this.destroyFns.push(ctx.interactionManager.addListener('dblclick', event => this.onDoubleClick(event), interactionOpts), ctx.interactionManager.addListener('drag', event => this.onDrag(event), interactionOpts), ctx.interactionManager.addListener('drag-end', () => this.onDragEnd(), interactionOpts), ctx.interactionManager.addListener('wheel', event => this.onWheel(event), interactionOpts), ctx.interactionManager.addListener('hover', () => this.onHover(), interactionOpts), ctx.chartEventManager.addListener('axis-hover', event => this.onAxisHover(event)), ctx.layoutService.addListener('layout-complete', event => this.onLayoutComplete(event)), ctx.updateService.addListener('update-complete', event => this.onUpdateComplete(event)));
    const selectionRect = new ZoomRect();
    this.selector = new ZoomSelector(selectionRect);
    (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.appendChild(selectionRect);
    this.destroyFns.push(() => {
      var _a;
      return (_a = this.scene.root) === null || _a === void 0 ? void 0 : _a.removeChild(selectionRect);
    });
  }
  registerContextMenuActions() {
    ContextMenu.registerDefaultAction({
      id: CONTEXT_ZOOM_ACTION_ID,
      label: 'Zoom to here',
      action: params => this.onContextMenuZoomToHere(params)
    });
    ContextMenu.registerDefaultAction({
      id: CONTEXT_PAN_ACTION_ID,
      label: 'Pan to here',
      action: params => this.onContextMenuPanToHere(params)
    });
    const zoom = definedZoomState(this.zoomManager.getZoom());
    this.toggleContextMenuActions(zoom);
  }
  toggleContextMenuActions(zoom) {
    if (this.isMinZoom(zoom)) {
      ContextMenu.disableAction(CONTEXT_ZOOM_ACTION_ID);
    } else {
      ContextMenu.enableAction(CONTEXT_ZOOM_ACTION_ID);
    }
    if (this.isMaxZoom(zoom)) {
      ContextMenu.disableAction(CONTEXT_PAN_ACTION_ID);
    } else {
      ContextMenu.enableAction(CONTEXT_PAN_ACTION_ID);
    }
  }
  onDoubleClick(event) {
    var _a;
    if (!this.enabled || !this.enableDoubleClickToReset) return;
    if (this.hoveredAxis) {
      const {
        id,
        direction
      } = this.hoveredAxis;
      this.updateAxisZoom(id, direction, Object.assign({}, UNIT));
    } else if (((_a = this.seriesRect) === null || _a === void 0 ? void 0 : _a.containsPoint(event.offsetX, event.offsetY)) && this.highlightManager.getActivePicked() === undefined) {
      this.updateZoom(unitZoomState());
    }
  }
  onDrag(event) {
    var _a;
    if (!this.enabled || !this.seriesRect) return;
    const sourceEvent = event.sourceEvent;
    const isPrimaryMouseButton = sourceEvent.button === 0;
    if (!isPrimaryMouseButton) return;
    this.isDragging = true;
    this.tooltipManager.updateTooltip(TOOLTIP_ID);
    const zoom = definedZoomState(this.zoomManager.getZoom());
    if (this.enableAxisDragging && this.hoveredAxis) {
      const {
        id: axisId,
        direction
      } = this.hoveredAxis;
      const anchor = direction === _ModuleSupport.ChartAxisDirection.X ? this.anchorPointX : this.anchorPointY;
      const axisZoom = (_a = this.zoomManager.getAxisZoom(axisId)) !== null && _a !== void 0 ? _a : Object.assign({}, UNIT);
      const newZoom = this.axisDragger.update(event, direction, anchor, this.seriesRect, zoom, axisZoom);
      this.updateAxisZoom(axisId, direction, newZoom);
      return;
    }
    if (!this.seriesRect.containsPoint(event.offsetX, event.offsetY)) {
      return;
    }
    if (this.enablePanning && (!this.enableSelecting || this.isPanningKeyPressed(sourceEvent))) {
      const newZooms = this.panner.update(event, this.seriesRect, this.zoomManager.getAxisZooms());
      for (const [axisId, {
        direction,
        zoom: newZoom
      }] of Object.entries(newZooms)) {
        this.updateAxisZoom(axisId, direction, newZoom);
      }
      this.cursorManager.updateCursor(CURSOR_ID, 'grabbing');
      return;
    }
    if (!this.enableSelecting || this.isPanningKeyPressed(sourceEvent) || this.panner.isPanning || this.isMinZoom(zoom)) {
      return;
    }
    this.selector.update(event, this.minRatioX, this.minRatioY, this.isScalingX(), this.isScalingY(), this.seriesRect, zoom);
    this.updateService.update(ChartUpdateType.PERFORM_LAYOUT, {
      skipAnimations: true
    });
  }
  onDragEnd() {
    if (!this.enabled || !this.isDragging) return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    this.cursorManager.updateCursor(CURSOR_ID);
    if (this.enableAxisDragging && this.axisDragger.isAxisDragging) {
      this.axisDragger.stop();
    } else if (this.enablePanning && this.panner.isPanning) {
      this.panner.stop();
    } else if (this.enableSelecting && !this.isMinZoom(zoom)) {
      const newZoom = this.selector.stop(this.seriesRect, zoom);
      this.updateZoom(newZoom);
    }
    this.isDragging = false;
    this.tooltipManager.removeTooltip(TOOLTIP_ID);
  }
  onWheel(event) {
    if (!this.enabled || !this.enableScrolling || !this.seriesRect) return;
    const currentZoom = this.zoomManager.getZoom();
    const isSeriesScrolling = this.seriesRect.containsPoint(event.offsetX, event.offsetY);
    const isAxisScrolling = this.enableAxisDragging && this.hoveredAxis != null;
    let isScalingX = this.isScalingX();
    let isScalingY = this.isScalingY();
    if (isAxisScrolling) {
      isScalingX = this.hoveredAxis.direction === _ModuleSupport.ChartAxisDirection.X;
      isScalingY = !isScalingX;
    }
    if (isSeriesScrolling || isAxisScrolling) {
      event.consume();
      event.sourceEvent.preventDefault();
      const newZoom = this.scroller.update(event, this.scrollingStep, this.getAnchorPointX(), this.getAnchorPointY(), isScalingX, isScalingY, this.seriesRect, currentZoom);
      this.updateZoom(newZoom);
    }
  }
  onHover() {
    if (!this.enabled) return;
    this.hoveredAxis = undefined;
    this.cursorManager.updateCursor(CURSOR_ID);
  }
  onAxisHover(event) {
    if (!this.enabled) return;
    this.hoveredAxis = {
      id: event.axisId,
      direction: event.direction
    };
    if (this.enableAxisDragging) {
      this.cursorManager.updateCursor(CURSOR_ID, event.direction === ChartAxisDirection.X ? 'ew-resize' : 'ns-resize');
    }
  }
  onLayoutComplete(event) {
    if (!this.enabled) return;
    const {
      series: {
        paddedRect,
        shouldFlipXY
      }
    } = event;
    this.seriesRect = paddedRect;
    this.shouldFlipXY = shouldFlipXY;
  }
  onUpdateComplete({
    minRect
  }) {
    if (!this.enabled || !this.seriesRect || !minRect) return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const minVisibleItemsWidth = this.shouldFlipXY ? this.minVisibleItemsY : this.minVisibleItemsX;
    const minVisibleItemsHeight = this.shouldFlipXY ? this.minVisibleItemsX : this.minVisibleItemsY;
    const widthRatio = minRect.width * minVisibleItemsWidth / this.seriesRect.width;
    const heightRatio = minRect.height * minVisibleItemsHeight / this.seriesRect.height;
    const ratioX = widthRatio * (zoom.x.max - zoom.x.min);
    const ratioY = heightRatio * (zoom.y.max - zoom.y.min);
    if (this.isScalingX()) {
      this.minRatioX || (this.minRatioX = Math.min(1, round(ratioX)));
    }
    if (this.isScalingY()) {
      this.minRatioY || (this.minRatioY = Math.min(1, round(ratioY)));
    }
    this.minRatioX || (this.minRatioX = this.minRatioY || 0);
    this.minRatioY || (this.minRatioY = this.minRatioX || 0);
  }
  onContextMenuZoomToHere({
    event
  }) {
    if (!this.enabled || !this.seriesRect || !event || !event.target) return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const origin = pointToRatio(this.seriesRect, event.clientX, event.clientY);
    const scaledOriginX = origin.x * (zoom.x.max - zoom.x.min);
    const scaledOriginY = origin.y * (zoom.y.max - zoom.y.min);
    const size = UNIT.max - UNIT.min;
    const halfSize = size / 2;
    let newZoom = {
      x: {
        min: origin.x - halfSize,
        max: origin.x + halfSize
      },
      y: {
        min: origin.y - halfSize,
        max: origin.y + halfSize
      }
    };
    newZoom = scaleZoomCenter(newZoom, this.isScalingX() ? this.minRatioX : size, this.isScalingY() ? this.minRatioY : size);
    newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);
    this.updateZoom(constrainZoom(newZoom));
  }
  onContextMenuPanToHere({
    event
  }) {
    if (!this.enabled || !this.seriesRect || !event || !event.target) return;
    const zoom = definedZoomState(this.zoomManager.getZoom());
    const origin = pointToRatio(this.seriesRect, event.clientX, event.clientY);
    const scaleX = zoom.x.max - zoom.x.min;
    const scaleY = zoom.y.max - zoom.y.min;
    const scaledOriginX = origin.x * scaleX;
    const scaledOriginY = origin.y * scaleY;
    const halfSize = (UNIT.max - UNIT.min) / 2;
    let newZoom = {
      x: {
        min: origin.x - halfSize,
        max: origin.x + halfSize
      },
      y: {
        min: origin.y - halfSize,
        max: origin.y + halfSize
      }
    };
    newZoom = scaleZoomCenter(newZoom, scaleX, scaleY);
    newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);
    this.updateZoom(constrainZoom(newZoom));
  }
  isPanningKeyPressed(event) {
    switch (this.panKey) {
      case 'alt':
        return event.altKey;
      case 'ctrl':
        return event.ctrlKey;
      case 'shift':
        return event.shiftKey;
      case 'meta':
        return event.metaKey;
    }
  }
  isScalingX() {
    if (this.axes === 'xy') return true;
    return this.shouldFlipXY ? this.axes === 'y' : this.axes === 'x';
  }
  isScalingY() {
    if (this.axes === 'xy') return true;
    return this.shouldFlipXY ? this.axes === 'x' : this.axes === 'y';
  }
  getAnchorPointX() {
    return this.shouldFlipXY ? this.anchorPointY : this.anchorPointX;
  }
  getAnchorPointY() {
    return this.shouldFlipXY ? this.anchorPointX : this.anchorPointY;
  }
  isMinZoom(zoom) {
    const minXCheckValue = this.enableScrolling ? (zoom.x.max - zoom.x.min) * (1 - this.scrollingStep) : round(zoom.x.max - zoom.x.min);
    const minYCheckValue = this.enableScrolling ? (zoom.y.max - zoom.y.min) * (1 - this.scrollingStep) : round(zoom.y.max - zoom.y.min);
    const isMinXZoom = !this.isScalingX() || minXCheckValue <= this.minRatioX;
    const isMinYZoom = !this.isScalingY() || minYCheckValue <= this.minRatioX;
    return isMinXZoom && isMinYZoom;
  }
  isMaxZoom(zoom) {
    return zoom.x.min === UNIT.min && zoom.x.max === UNIT.max && zoom.y.min === UNIT.min && zoom.y.max === UNIT.max;
  }
  updateZoom(zoom) {
    const dx = round(zoom.x.max - zoom.x.min);
    const dy = round(zoom.y.max - zoom.y.min);
    if (dx < this.minRatioX || dy < this.minRatioY) {
      ContextMenu.disableAction(CONTEXT_ZOOM_ACTION_ID);
      ContextMenu.enableAction(CONTEXT_PAN_ACTION_ID);
      return;
    }
    this.toggleContextMenuActions(zoom);
    this.zoomManager.updateZoom(ZOOM_ID, zoom);
  }
  updateAxisZoom(axisId, direction, partialZoom) {
    if (!partialZoom) return;
    if (!this.enableSecondaryAxis) {
      const fullZoom = definedZoomState(this.zoomManager.getZoom());
      if (direction === ChartAxisDirection.X) {
        fullZoom.x = partialZoom;
      } else {
        fullZoom.y = partialZoom;
      }
      this.updateZoom(fullZoom);
      return;
    }
    const d = round(partialZoom.max - partialZoom.min);
    if (direction === ChartAxisDirection.X && d < this.minRatioX || direction === ChartAxisDirection.Y && d < this.minRatioY) {
      return;
    }
    this.zoomManager.updateAxisZoom(ZOOM_ID, axisId, partialZoom);
  }
}
__decorate([ActionOnSet({
  changeValue(newValue) {
    if (newValue) {
      this.updateZoom(unitZoomState());
      this.registerContextMenuActions();
    }
  }
}), Validate(BOOLEAN)], Zoom.prototype, "enabled", void 0);
__decorate([Validate(BOOLEAN)], Zoom.prototype, "enableAxisDragging", void 0);
__decorate([Validate(BOOLEAN)], Zoom.prototype, "enableDoubleClickToReset", void 0);
__decorate([Validate(BOOLEAN)], Zoom.prototype, "enablePanning", void 0);
__decorate([Validate(BOOLEAN)], Zoom.prototype, "enableScrolling", void 0);
__decorate([Validate(BOOLEAN)], Zoom.prototype, "enableSelecting", void 0);
__decorate([Validate(UNION(['alt', 'ctrl', 'meta', 'shift'], 'a pan key'))], Zoom.prototype, "panKey", void 0);
__decorate([Validate(UNION(['x', 'y', 'xy'], 'an axis'))], Zoom.prototype, "axes", void 0);
__decorate([Validate(RATIO)], Zoom.prototype, "scrollingStep", void 0);
__decorate([Validate(NUMBER.restrict({
  min: 1
}))], Zoom.prototype, "minVisibleItemsX", void 0);
__decorate([Validate(NUMBER.restrict({
  min: 1
}))], Zoom.prototype, "minVisibleItemsY", void 0);
__decorate([Validate(ANCHOR_CORD)], Zoom.prototype, "anchorPointX", void 0);
__decorate([Validate(ANCHOR_CORD)], Zoom.prototype, "anchorPointY", void 0);