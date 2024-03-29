import { jsonMerge } from '../../util/json';
import { Logger } from '../../util/logger';
import { ChartTheme } from '../themes/chartTheme';
import { DarkTheme } from '../themes/darkTheme';
import { MaterialDark } from '../themes/materialDark';
import { MaterialLight } from '../themes/materialLight';
import { PolychromaDark } from '../themes/polychromaDark';
import { PolychromaLight } from '../themes/polychromaLight';
import { SheetsDark } from '../themes/sheetsDark';
import { SheetsLight } from '../themes/sheetsLight';
import { VividDark } from '../themes/vividDark';
import { VividLight } from '../themes/vividLight';
const lightTheme = () => new ChartTheme();
const darkTheme = () => new DarkTheme();
const lightThemes = {
  undefined: lightTheme,
  null: lightTheme,
  'zing-default': lightTheme,
  'zing-sheets': () => new SheetsLight(),
  'zing-polychroma': () => new PolychromaLight(),
  'zing-vivid': () => new VividLight(),
  'zing-material': () => new MaterialLight()
};
const darkThemes = {
  undefined: darkTheme,
  null: darkTheme,
  'zing-default-dark': darkTheme,
  'zing-sheets-dark': () => new SheetsDark(),
  'zing-polychroma-dark': () => new PolychromaDark(),
  'zing-vivid-dark': () => new VividDark(),
  'zing-material-dark': () => new MaterialDark()
};
export const themes = Object.assign(Object.assign({}, darkThemes), lightThemes);
function validateChartThemeObject(unknownObject) {
  if (unknownObject === null) {
    return undefined;
  }
  let valid = true;
  const {
    baseTheme,
    palette,
    overrides
  } = unknownObject;
  if (baseTheme !== undefined && typeof baseTheme !== 'string' && typeof baseTheme !== 'object') {
    Logger.warn(`invalid theme.baseTheme type ${typeof baseTheme}, expected (string | object).`);
    valid = false;
  }
  if (overrides !== undefined && typeof overrides !== 'object') {
    Logger.warn(`invalid theme.overrides type ${typeof overrides}, expected object.`);
    valid = false;
  }
  if (typeof palette === 'object') {
    if (palette !== null) {
      const {
        fills,
        strokes
      } = palette;
      if (fills !== undefined && !Array.isArray(fills)) {
        Logger.warn(`theme.overrides.fills must be undefined or an array`);
        valid = false;
      }
      if (strokes !== undefined && !Array.isArray(strokes)) {
        Logger.warn(`theme.overrides.strokes must be undefined or an array`);
        valid = false;
      }
    }
  } else if (palette !== undefined) {
    Logger.warn(`invalid theme.palette type ${typeof palette}, expected object.`);
    valid = false;
  }
  if (valid) {
    return unknownObject;
  }
  return undefined;
}
function validateChartTheme(value) {
  if (value === undefined || typeof value === 'string' || value instanceof ChartTheme) {
    return value;
  }
  if (typeof value === 'object') {
    return validateChartThemeObject(value);
  }
  Logger.warn(`invalid theme value type ${typeof value}, expected object.`);
  return undefined;
}
export function getChartTheme(unvalidatedValue) {
  var _a;
  let value = validateChartTheme(unvalidatedValue);
  if (value instanceof ChartTheme) {
    return value;
  }
  if (value === undefined || typeof value === 'string') {
    const stockTheme = themes[value];
    if (stockTheme) {
      return stockTheme();
    }
    Logger.warnOnce(`the theme [${value}] is invalid, using [zing-default] instead.`);
    return lightTheme();
  }
  const overrides = [];
  let palette;
  while (typeof value === 'object') {
    overrides.push((_a = value.overrides) !== null && _a !== void 0 ? _a : {});
    if (value.palette && palette == null) {
      palette = value.palette;
    }
    value = value.baseTheme;
  }
  overrides.reverse();
  const flattenedTheme = Object.assign({
    baseTheme: value,
    overrides: jsonMerge(overrides)
  }, palette ? {
    palette
  } : {});
  const baseTheme = flattenedTheme.baseTheme ? getChartTheme(flattenedTheme.baseTheme) : lightTheme();
  return new baseTheme.constructor(flattenedTheme);
}