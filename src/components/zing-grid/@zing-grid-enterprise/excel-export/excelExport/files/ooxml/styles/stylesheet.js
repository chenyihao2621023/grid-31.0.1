import { _ } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import numberFormatsFactory from './numberFormats';
import fontsFactory from './fonts';
import fillsFactory from './fills';
import bordersFactory from './borders';
import cellStylesXfsFactory from './cellStyleXfs';
import cellXfsFactory from './cellXfs';
import cellStylesFactory from './cellStyles';
import { convertLegacyBorder, convertLegacyColor, convertLegacyPattern } from '../../../assets/excelLegacyConvert';
import { numberFormatMap } from '../../../assets/excelConstants';
import { getFontFamilyId } from '../../../assets/excelUtils';
let stylesMap;
let registeredNumberFmts;
let registeredFonts;
let registeredFills;
let registeredBorders;
let registeredCellStyleXfs;
let registeredCellXfs;
let registeredCellStyles;
let currentSheet;
const getStyleName = (name, currentSheet) => {
  if (name.indexOf('mixedStyle') !== -1 && currentSheet > 1) {
    name += `_${currentSheet}`;
  }
  return name;
};
const resetStylesheetValues = () => {
  stylesMap = {
    base: 0
  };
  registeredNumberFmts = [];
  registeredFonts = [{
    fontName: 'Calibri',
    colorTheme: '1',
    family: '2',
    scheme: 'minor'
  }];
  registeredFills = [{
    patternType: 'none'
  }, {
    patternType: 'gray125'
  }];
  registeredBorders = [{
    left: undefined,
    right: undefined,
    top: undefined,
    bottom: undefined,
    diagonal: undefined
  }];
  registeredCellStyleXfs = [{
    borderId: 0,
    fillId: 0,
    fontId: 0,
    numFmtId: 0
  }];
  registeredCellXfs = [{
    borderId: 0,
    fillId: 0,
    fontId: 0,
    numFmtId: 0,
    xfId: 0
  }];
  registeredCellStyles = [{
    builtinId: 0,
    name: 'Normal',
    xfId: 0
  }];
};
const registerFill = fill => {
  const convertedPattern = convertLegacyPattern(fill.pattern);
  const convertedFillColor = convertLegacyColor(fill.color);
  const convertedPatternColor = convertLegacyColor(fill.patternColor);
  let pos = registeredFills.findIndex(currentFill => {
    const {
      patternType,
      fgRgb,
      bgRgb
    } = currentFill;
    if (patternType != convertedPattern || fgRgb != convertedFillColor || bgRgb != convertedPatternColor) {
      return false;
    }
    return true;
  });
  if (pos === -1) {
    pos = registeredFills.length;
    registeredFills.push({
      patternType: convertedPattern,
      fgRgb: convertedFillColor,
      bgRgb: convertedPatternColor
    });
  }
  return pos;
};
const registerNumberFmt = format => {
  format = _.utf8_encode(format);
  if (numberFormatMap[format]) {
    return numberFormatMap[format];
  }
  let pos = registeredNumberFmts.findIndex(currentFormat => currentFormat.formatCode === format);
  if (pos === -1) {
    pos = registeredNumberFmts.length + 164;
    registeredNumberFmts.push({
      formatCode: format,
      numFmtId: pos
    });
  } else {
    pos = registeredNumberFmts[pos].numFmtId;
  }
  return pos;
};
const registerBorders = borders => {
  const {
    borderBottom,
    borderTop,
    borderLeft,
    borderRight
  } = borders;
  let bottomStyle;
  let topStyle;
  let leftStyle;
  let rightStyle;
  let bottomColor;
  let topColor;
  let leftColor;
  let rightColor;
  if (borderLeft) {
    leftStyle = convertLegacyBorder(borderLeft.lineStyle, borderLeft.weight);
    leftColor = convertLegacyColor(borderLeft.color);
  }
  if (borderRight) {
    rightStyle = convertLegacyBorder(borderRight.lineStyle, borderRight.weight);
    rightColor = convertLegacyColor(borderRight.color);
  }
  if (borderBottom) {
    bottomStyle = convertLegacyBorder(borderBottom.lineStyle, borderBottom.weight);
    bottomColor = convertLegacyColor(borderBottom.color);
  }
  if (borderTop) {
    topStyle = convertLegacyBorder(borderTop.lineStyle, borderTop.weight);
    topColor = convertLegacyColor(borderTop.color);
  }
  let pos = registeredBorders.findIndex(currentBorder => {
    const {
      left,
      right,
      top,
      bottom
    } = currentBorder;
    if (!left && (leftStyle || leftColor)) {
      return false;
    }
    if (!right && (rightStyle || rightColor)) {
      return false;
    }
    if (!top && (topStyle || topColor)) {
      return false;
    }
    if (!bottom && (bottomStyle || bottomColor)) {
      return false;
    }
    const {
      style: clS,
      color: clC
    } = left || {};
    const {
      style: crS,
      color: crC
    } = right || {};
    const {
      style: ctS,
      color: ctC
    } = top || {};
    const {
      style: cbS,
      color: cbC
    } = bottom || {};
    if (clS != leftStyle || clC != leftColor) {
      return false;
    }
    if (crS != rightStyle || crC != rightColor) {
      return false;
    }
    if (ctS != topStyle || ctC != topColor) {
      return false;
    }
    if (cbS != bottomStyle || cbC != bottomColor) {
      return false;
    }
    return true;
  });
  if (pos === -1) {
    pos = registeredBorders.length;
    registeredBorders.push({
      left: {
        style: leftStyle,
        color: leftColor
      },
      right: {
        style: rightStyle,
        color: rightColor
      },
      top: {
        style: topStyle,
        color: topColor
      },
      bottom: {
        style: bottomStyle,
        color: bottomColor
      },
      diagonal: {
        style: undefined,
        color: undefined
      }
    });
  }
  return pos;
};
const registerFont = font => {
  const {
    fontName: name = 'Calibri',
    color,
    size,
    bold,
    italic,
    outline,
    shadow,
    strikeThrough,
    underline,
    family,
    verticalAlign
  } = font;
  const utf8Name = name ? _.utf8_encode(name) : name;
  const convertedColor = convertLegacyColor(color);
  const familyId = getFontFamilyId(family);
  const convertedUnderline = underline ? underline.toLocaleLowerCase() : undefined;
  const convertedVerticalAlign = verticalAlign ? verticalAlign.toLocaleLowerCase() : undefined;
  let pos = registeredFonts.findIndex(currentFont => {
    if (currentFont.fontName != utf8Name || currentFont.color != convertedColor || currentFont.size != size || currentFont.bold != bold || currentFont.italic != italic || currentFont.outline != outline || currentFont.shadow != shadow || currentFont.strikeThrough != strikeThrough || currentFont.underline != convertedUnderline || currentFont.verticalAlign != convertedVerticalAlign || currentFont.family != familyId) {
      return false;
    }
    return true;
  });
  if (pos === -1) {
    pos = registeredFonts.length;
    registeredFonts.push({
      fontName: utf8Name,
      color: convertedColor,
      size,
      bold,
      italic,
      outline,
      shadow,
      strikeThrough,
      underline: convertedUnderline,
      verticalAlign: convertedVerticalAlign,
      family: familyId != null ? familyId.toString() : undefined
    });
  }
  return pos;
};
const registerStyle = config => {
  const {
    alignment,
    borders,
    font,
    interior,
    numberFormat,
    protection
  } = config;
  let {
    id
  } = config;
  let currentFill = 0;
  let currentBorder = 0;
  let currentFont = 0;
  let currentNumberFmt = 0;
  if (!id) {
    return;
  }
  id = getStyleName(id, currentSheet);
  if (stylesMap[id] != undefined) {
    return;
  }
  if (interior) {
    currentFill = registerFill(interior);
  }
  if (borders) {
    currentBorder = registerBorders(borders);
  }
  if (font) {
    currentFont = registerFont(font);
  }
  if (numberFormat) {
    currentNumberFmt = registerNumberFmt(numberFormat.format);
  }
  stylesMap[id] = registeredCellXfs.length;
  registeredCellXfs.push({
    alignment,
    borderId: currentBorder || 0,
    fillId: currentFill || 0,
    fontId: currentFont || 0,
    numFmtId: currentNumberFmt || 0,
    protection,
    xfId: 0
  });
};
const stylesheetFactory = {
  getTemplate(defaultFontSize) {
    const numberFormats = numberFormatsFactory.getTemplate(registeredNumberFmts);
    const fonts = fontsFactory.getTemplate(registeredFonts.map(font => Object.assign(Object.assign({}, font), {
      size: font.size != null ? font.size : defaultFontSize
    })));
    const fills = fillsFactory.getTemplate(registeredFills);
    const borders = bordersFactory.getTemplate(registeredBorders);
    const cellStylesXfs = cellStylesXfsFactory.getTemplate(registeredCellStyleXfs);
    const cellXfs = cellXfsFactory.getTemplate(registeredCellXfs);
    const cellStyles = cellStylesFactory.getTemplate(registeredCellStyles);
    resetStylesheetValues();
    return {
      name: 'styleSheet',
      properties: {
        rawMap: {
          'mc:Ignorable': 'x14ac x16r2 xr',
          'xmlns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
          'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
          'xmlns:x14ac': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac',
          'xmlns:x16r2': 'http://schemas.microsoft.com/office/spreadsheetml/2015/02/main',
          'xmlns:xr': 'http://schemas.microsoft.com/office/spreadsheetml/2014/revision'
        }
      },
      children: [numberFormats, fonts, fills, borders, cellStylesXfs, cellXfs, cellStyles, {
        name: 'tableStyles',
        properties: {
          rawMap: {
            count: 0,
            defaultPivotStyle: 'PivotStyleLight16',
            defaultTableStyle: 'TableStyleMedium2'
          }
        }
      }]
    };
  }
};
export const getStyleId = (name, currentSheet) => {
  return stylesMap[getStyleName(name, currentSheet)] || 0;
};
export const registerStyles = (styles, _currentSheet) => {
  currentSheet = _currentSheet;
  if (currentSheet === 1) {
    resetStylesheetValues();
  }
  styles.forEach(registerStyle);
};
export default stylesheetFactory;