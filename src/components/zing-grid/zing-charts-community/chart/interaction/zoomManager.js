import { ChartAxisDirection } from '../chartAxisDirection';
import { BaseManager } from './baseManager';
export class ZoomManager extends BaseManager {
  constructor() {
    super(...arguments);
    this.axes = {};
  }
  updateAxes(axes) {
    var _a;
    const removedAxes = new Set(Object.keys(this.axes));
    axes.forEach(axis => {
      var _a;
      var _b, _c;
      removedAxes.delete(axis.id);
      (_a = (_b = this.axes)[_c = axis.id]) !== null && _a !== void 0 ? _a : _b[_c] = new AxisZoomManager(axis);
    });
    removedAxes.forEach(axisId => {
      delete this.axes[axisId];
    });
    if ((_a = this.initialZoom) === null || _a === void 0 ? void 0 : _a.newZoom) {
      this.updateZoom(this.initialZoom.callerId, this.initialZoom.newZoom);
    }
    this.initialZoom = undefined;
  }
  updateZoom(callerId, newZoom) {
    if (Object.keys(this.axes).length === 0) {
      this.initialZoom = {
        callerId,
        newZoom
      };
      return;
    }
    Object.values(this.axes).forEach(axis => {
      axis.updateZoom(callerId, newZoom === null || newZoom === void 0 ? void 0 : newZoom[axis.getDirection()]);
    });
    this.applyStates();
  }
  updateAxisZoom(callerId, axisId, newZoom) {
    var _a;
    (_a = this.axes[axisId]) === null || _a === void 0 ? void 0 : _a.updateZoom(callerId, newZoom);
    this.applyStates();
  }
  getZoom() {
    let x;
    let y;
    Object.values(this.axes).forEach(axis => {
      if (axis.getDirection() === ChartAxisDirection.X) {
        x = axis.getZoom();
      } else if (axis.getDirection() === ChartAxisDirection.Y) {
        y = axis.getZoom();
      }
    });
    if (x || y) {
      return {
        x,
        y
      };
    }
  }
  getAxisZoom(axisId) {
    var _a;
    return (_a = this.axes[axisId]) === null || _a === void 0 ? void 0 : _a.getZoom();
  }
  getAxisZooms() {
    const axes = {};
    for (const [axisId, axis] of Object.entries(this.axes)) {
      axes[axisId] = {
        direction: axis.getDirection(),
        zoom: axis.getZoom()
      };
    }
    return axes;
  }
  applyStates() {
    const changed = Object.values(this.axes).map(axis => axis.applyStates()).some(Boolean);
    if (!changed) {
      return;
    }
    const currentZoom = this.getZoom();
    const axes = {};
    for (const [axisId, axis] of Object.entries(this.axes)) {
      axes[axisId] = axis.getZoom();
    }
    this.listeners.dispatch('zoom-change', Object.assign(Object.assign({
      type: 'zoom-change'
    }, currentZoom !== null && currentZoom !== void 0 ? currentZoom : {}), {
      axes
    }));
  }
}
class AxisZoomManager {
  constructor(axis) {
    this.states = {};
    this.axis = axis;
    const [min = 0, max = 1] = axis.visibleRange;
    this.currentZoom = {
      min,
      max
    };
    this.states['__initial__'] = this.currentZoom;
  }
  getDirection() {
    return this.axis.direction;
  }
  updateZoom(callerId, newZoom) {
    delete this.states[callerId];
    if (newZoom != null) {
      this.states[callerId] = Object.assign({}, newZoom);
    }
  }
  getZoom() {
    return this.currentZoom;
  }
  applyStates() {
    var _a, _b;
    const prevZoom = this.currentZoom;
    const last = Object.keys(this.states)[Object.keys(this.states).length - 1];
    this.currentZoom = Object.assign({}, this.states[last]);
    return (prevZoom === null || prevZoom === void 0 ? void 0 : prevZoom.min) !== ((_a = this.currentZoom) === null || _a === void 0 ? void 0 : _a.min) || (prevZoom === null || prevZoom === void 0 ? void 0 : prevZoom.max) !== ((_b = this.currentZoom) === null || _b === void 0 ? void 0 : _b.max);
  }
}