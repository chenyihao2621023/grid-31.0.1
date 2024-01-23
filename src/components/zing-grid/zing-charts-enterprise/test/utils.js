import { prepareTestOptions } from 'zing-charts-community-test';
export function prepareEnterpriseTestOptions(options, container = document.body) {
  var _a, _b;
  if (!options.animation && !((_a = options.series) === null || _a === void 0 ? void 0 : _a.some(({
    type
  }) => type === 'treemap'))) {
    (_b = options.animation) !== null && _b !== void 0 ? _b : options.animation = {
      enabled: false
    };
  }
  return prepareTestOptions(options, container);
}