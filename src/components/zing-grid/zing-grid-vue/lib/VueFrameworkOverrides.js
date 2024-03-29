var __extends = this && this.__extends || function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    };
    return extendStatics(d, b);
  };
  return function (d, b) {
    if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
import { VanillaFrameworkOverrides } from '@/components/zing-grid/zing-grid-community/main.js';
import { VueComponentFactory } from './VueComponentFactory';
var VueFrameworkOverrides = function (_super) {
  __extends(VueFrameworkOverrides, _super);
  function VueFrameworkOverrides(parent) {
    var _this = _super.call(this, 'vue') || this;
    _this.parent = parent;
    return _this;
  }
  VueFrameworkOverrides.prototype.frameworkComponent = function (name, components) {
    var foundInstance = !!VueComponentFactory.searchForComponentInstance(this.parent, name, 10, true);
    var result = foundInstance ? name : null;
    if (!result && components && components[name]) {
      var indirectName = components[name];
      foundInstance = !!VueComponentFactory.searchForComponentInstance(this.parent, indirectName, 10, true);
      result = foundInstance ? indirectName : null;
    }
    return result;
  };
  VueFrameworkOverrides.prototype.isFrameworkComponent = function (comp) {
    return typeof comp === 'object';
  };
  return VueFrameworkOverrides;
}(VanillaFrameworkOverrides);
export { VueFrameworkOverrides };