export class ZingChartInstanceProxy {
  static isInstance(x) {
    var _a;
    if (x instanceof ZingChartInstanceProxy) {
      return true;
    }
    if (((_a = x.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'ZingChartInstanceProxy' && x.chart != null) {
      return true;
    }
    return x.chart != null && this.validateImplementation(x);
  }
  static validateImplementation(x) {
    var _a, _b;
    const chartProps = ['getOptions', 'destroy'];
    const signatureProps = Object.keys((_b = (_a = x.constructor) === null || _a === void 0 ? void 0 : _a.prototype) !== null && _b !== void 0 ? _b : {});
    return chartProps.every(prop => signatureProps.includes(prop));
  }
  constructor(chart) {
    this.chart = chart;
  }
  getOptions() {
    return this.chart.getOptions();
  }
  destroy() {
    this.chart.destroy();
  }
}