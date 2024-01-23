import { hasRegisteredEnterpriseModules } from '../../module-support';
import { jsonMerge } from '../../sparklines-util';
import { registerChartSeriesType } from './chartTypes';
const SERIES_FACTORIES = {};
const SERIES_DEFAULTS = {};
const SERIES_THEME_TEMPLATES = {};
const ENTERPRISE_SERIES_THEME_TEMPLATES = {};
const SERIES_PALETTE_FACTORIES = {};
const SOLO_SERIES_TYPES = new Set();
const STACKABLE_SERIES_TYPES = new Set();
const GROUPABLE_SERIES_TYPES = new Set();
const STACKED_BY_DEFAULT_SERIES_TYPES = new Set();
const SWAP_DEFAULT_AXES_CONDITIONS = {};
const CUSTOM_DEFAULTS_FUNCTIONS = {};
export function registerSeries(seriesType, chartType, cstr, defaults, theme, enterpriseTheme, paletteFactory, solo, stackable, groupable, stackedByDefault, swapDefaultAxesCondition, customDefaultsFunction) {
  SERIES_FACTORIES[seriesType] = cstr;
  SERIES_DEFAULTS[seriesType] = defaults;
  registerSeriesThemeTemplate(seriesType, theme, enterpriseTheme);
  if (paletteFactory) {
    addSeriesPaletteFactory(seriesType, paletteFactory);
  }
  if (solo) {
    addSoloSeriesType(seriesType);
  }
  if (stackable) {
    addStackableSeriesType(seriesType);
  }
  if (groupable) {
    addGroupableSeriesType(seriesType);
  }
  if (stackedByDefault) {
    addStackedByDefaultSeriesType(seriesType);
  }
  if (swapDefaultAxesCondition) {
    addSwapDefaultAxesCondition(seriesType, swapDefaultAxesCondition);
  }
  if (customDefaultsFunction) {
    addCustomDefaultsFunctions(seriesType, customDefaultsFunction);
  }
  registerChartSeriesType(seriesType, chartType);
}
export function registerSeriesThemeTemplate(seriesType, themeTemplate, enterpriseThemeTemplate = {}) {
  const existingTemplate = SERIES_THEME_TEMPLATES[seriesType];
  SERIES_THEME_TEMPLATES[seriesType] = jsonMerge([existingTemplate, themeTemplate]);
  ENTERPRISE_SERIES_THEME_TEMPLATES[seriesType] = jsonMerge([existingTemplate, themeTemplate, enterpriseThemeTemplate]);
}
export function getSeries(chartType, moduleCtx) {
  const seriesConstructor = SERIES_FACTORIES[chartType];
  if (seriesConstructor) {
    return new seriesConstructor(moduleCtx);
  }
  throw new Error(`ZING Charts - unknown series type: ${chartType}`);
}
export function getSeriesDefaults(chartType) {
  return SERIES_DEFAULTS[chartType];
}
export function getSeriesThemeTemplate(chartType) {
  if (hasRegisteredEnterpriseModules()) {
    return ENTERPRISE_SERIES_THEME_TEMPLATES[chartType];
  }
  return SERIES_THEME_TEMPLATES[chartType];
}
export function addSeriesPaletteFactory(seriesType, factory) {
  SERIES_PALETTE_FACTORIES[seriesType] = factory;
}
export function getSeriesPaletteFactory(seriesType) {
  return SERIES_PALETTE_FACTORIES[seriesType];
}
export function isSoloSeries(seriesType) {
  return SOLO_SERIES_TYPES.has(seriesType);
}
export function isStackableSeries(seriesType) {
  return STACKABLE_SERIES_TYPES.has(seriesType);
}
export function isGroupableSeries(seriesType) {
  return GROUPABLE_SERIES_TYPES.has(seriesType);
}
export function isSeriesStackedByDefault(seriesType) {
  return STACKED_BY_DEFAULT_SERIES_TYPES.has(seriesType);
}
export function addGroupableSeriesType(seriesType) {
  GROUPABLE_SERIES_TYPES.add(seriesType);
}
export function addSoloSeriesType(seriesType) {
  SOLO_SERIES_TYPES.add(seriesType);
}
export function addStackableSeriesType(seriesType) {
  STACKABLE_SERIES_TYPES.add(seriesType);
}
export function addStackedByDefaultSeriesType(seriesType) {
  STACKED_BY_DEFAULT_SERIES_TYPES.add(seriesType);
}
export function addSwapDefaultAxesCondition(seriesType, predicate) {
  SWAP_DEFAULT_AXES_CONDITIONS[seriesType] = predicate;
}
export function addCustomDefaultsFunctions(seriesType, predicate) {
  CUSTOM_DEFAULTS_FUNCTIONS[seriesType] = predicate;
}
export function isDefaultAxisSwapNeeded(opts) {
  var _a, _b;
  let result;
  for (const series of (_a = opts.series) !== null && _a !== void 0 ? _a : []) {
    const {
      type = 'line'
    } = series;
    const isDefaultAxisSwapped = (_b = SWAP_DEFAULT_AXES_CONDITIONS[type]) === null || _b === void 0 ? void 0 : _b.call(SWAP_DEFAULT_AXES_CONDITIONS, series);
    if (isDefaultAxisSwapped != null) {
      if (result != null && result != isDefaultAxisSwapped) {
        throw new Error('ZING Charts - The provided series have incompatible directions');
      }
      result = isDefaultAxisSwapped;
    }
  }
  return result;
}
export function executeCustomDefaultsFunctions(opts, initialDefaults) {
  var _a;
  let result = initialDefaults;
  for (const series of (_a = opts.series) !== null && _a !== void 0 ? _a : []) {
    const {
      type
    } = series;
    const fn = type != null ? CUSTOM_DEFAULTS_FUNCTIONS[type] : undefined;
    if (fn !== undefined) {
      result = Object.assign(Object.assign({}, result), fn(series));
    }
  }
  return result;
}