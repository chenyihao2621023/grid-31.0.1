import { includes } from "./utils/array";
import { ZingPromise } from "./utils";
const OUTSIDE_ANGULAR_EVENTS = ['mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'mousemove'];
const PASSIVE_EVENTS = ['touchstart', 'touchend', 'touchmove', 'touchcancel'];
export var VanillaFrameworkOverrides = function () {
  function VanillaFrameworkOverrides(frameworkName) {
    if (frameworkName === void 0) {
      frameworkName = 'javascript';
    }
    this.frameworkName = frameworkName;
    this.renderingEngine = "vanilla";
    this.isOutsideAngular = function (eventType) {
      return includes(OUTSIDE_ANGULAR_EVENTS, eventType);
    };
  }
  VanillaFrameworkOverrides.prototype.setTimeout = function (action, timeout) {
    window.setTimeout(action, timeout);
  };
  VanillaFrameworkOverrides.prototype.setInterval = function (action, timeout) {
    return new ZingPromise(function (resolve) {
      resolve(window.setInterval(action, timeout));
    });
  };
  VanillaFrameworkOverrides.prototype.addEventListener = function (element, type, listener, useCapture) {
    var isPassive = includes(PASSIVE_EVENTS, type);
    element.addEventListener(type, listener, {
      capture: !!useCapture,
      passive: isPassive
    });
  };
  VanillaFrameworkOverrides.prototype.dispatchEvent = function (eventType, listener, global) {
    listener();
  };
  VanillaFrameworkOverrides.prototype.frameworkComponent = function (name) {
    return null;
  };
  VanillaFrameworkOverrides.prototype.isFrameworkComponent = function (comp) {
    return false;
  };
  VanillaFrameworkOverrides.prototype.getDocLink = function (path) {
    var framework = this.frameworkName === 'solid' ? 'react' : this.frameworkName;
    return "https://www.zing-grid.com/".concat(framework, "-data-grid").concat(path ? "/".concat(path) : '');
  };
  return VanillaFrameworkOverrides;
}();