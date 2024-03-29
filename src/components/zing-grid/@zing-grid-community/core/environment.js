var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Bean, Autowired, PostConstruct } from './context/context';
import { BeanStub } from "./context/beanStub";
import { exists } from './utils/generic';
import { Events } from './eventKeys';
const DEFAULT_ROW_HEIGHT = 25;
const MIN_COL_WIDTH = 10;
const MAT_GRID_SIZE = 8;
const BASE_GRID_SIZE = 4;
const BALHAM_GRID_SIZE = 4;
const ALPINE_GRID_SIZE = 6;
const QUARTZ_ICON_SIZE = 16;
const QUARTZ_FONT_SIZE = 14;
const QUARTZ_GRID_SIZE = 8;
const HARD_CODED_SIZES = {
  'zing-theme-custom': {
    headerHeight: 25,
    headerCellMinWidth: 24,
    listItemHeight: BASE_GRID_SIZE * 5,
    rowHeight: 25,
    chartMenuPanelWidth: 220
  },
  'zing-theme-material': {
    headerHeight: MAT_GRID_SIZE * 7,
    headerCellMinWidth: 48,
    listItemHeight: MAT_GRID_SIZE * 4,
    rowHeight: MAT_GRID_SIZE * 6,
    chartMenuPanelWidth: 240
  },
  'zing-theme-balham': {
    headerHeight: BALHAM_GRID_SIZE * 8,
    headerCellMinWidth: 24,
    listItemHeight: BALHAM_GRID_SIZE * 6,
    rowHeight: BALHAM_GRID_SIZE * 7,
    chartMenuPanelWidth: 220
  },
  'zing-theme-alpine': {
    headerHeight: ALPINE_GRID_SIZE * 8,
    headerCellMinWidth: 36,
    listItemHeight: ALPINE_GRID_SIZE * 4,
    rowHeight: ALPINE_GRID_SIZE * 7,
    chartMenuPanelWidth: 240
  },
  'zing-theme-quartz': {
    headerHeight: QUARTZ_FONT_SIZE + QUARTZ_GRID_SIZE * 4.25,
    headerCellMinWidth: 36,
    listItemHeight: QUARTZ_ICON_SIZE + QUARTZ_GRID_SIZE,
    rowHeight: QUARTZ_FONT_SIZE + QUARTZ_GRID_SIZE * 3.5,
    chartMenuPanelWidth: 260
  }
};
const SASS_PROPERTY_BUILDER = {
  headerHeight: ['zing-header-row'],
  headerCellMinWidth: ['zing-header-cell'],
  listItemHeight: ['zing-virtual-list-item'],
  rowHeight: ['zing-row'],
  chartMenuPanelWidth: ['zing-chart-docked-container']
};
let Environment = class Environment extends BeanStub {
  constructor() {
    super(...arguments);
    this.calculatedSizes = {};
  }
  postConstruct() {
    var _a;
    const el = (_a = this.getTheme().el) !== null && _a !== void 0 ? _a : this.eGridDiv;
    this.addManagedPropertyListener('rowHeight', () => this.refreshRowHeightVariable());
    this.mutationObserver = new MutationObserver(() => {
      this.calculatedSizes = {};
      this.fireGridStylesChangedEvent();
    });
    this.mutationObserver.observe(el || this.eGridDiv, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  fireGridStylesChangedEvent() {
    const event = {
      type: Events.EVENT_GRID_STYLES_CHANGED
    };
    this.eventService.dispatchEvent(event);
  }
  getSassVariable(key) {
    const {
      themeFamily,
      el
    } = this.getTheme();
    if (!themeFamily || themeFamily.indexOf('zing-theme') !== 0) {
      return;
    }
    if (!this.calculatedSizes) {
      this.calculatedSizes = {};
    }
    if (!this.calculatedSizes[themeFamily]) {
      this.calculatedSizes[themeFamily] = {};
    }
    const size = this.calculatedSizes[themeFamily][key];
    if (size != null) {
      return size;
    }
    this.calculatedSizes[themeFamily][key] = this.calculateValueForSassProperty(key, themeFamily, el);
    return this.calculatedSizes[themeFamily][key];
  }
  calculateValueForSassProperty(property, theme, themeElement) {
    const useTheme = 'zing-theme-' + (theme.match('material') ? 'material' : theme.match('balham') ? 'balham' : theme.match('alpine') ? 'alpine' : 'custom');
    const defaultValue = HARD_CODED_SIZES[useTheme][property];
    const eDocument = this.gridOptionsService.getDocument();
    if (!themeElement) {
      themeElement = this.eGridDiv;
    }
    if (!SASS_PROPERTY_BUILDER[property]) {
      return defaultValue;
    }
    const classList = SASS_PROPERTY_BUILDER[property];
    const div = eDocument.createElement('div');
    const classesFromThemeElement = Array.from(themeElement.classList);
    div.classList.add(theme, ...classesFromThemeElement);
    div.style.position = 'absolute';
    const el = classList.reduce((prevEl, currentClass) => {
      const currentDiv = eDocument.createElement('div');
      currentDiv.style.position = 'static';
      currentDiv.classList.add(currentClass);
      prevEl.appendChild(currentDiv);
      return currentDiv;
    }, div);
    let calculatedValue = 0;
    if (eDocument.body) {
      eDocument.body.appendChild(div);
      const sizeName = property.toLowerCase().indexOf('height') !== -1 ? 'height' : 'width';
      calculatedValue = parseInt(window.getComputedStyle(el)[sizeName], 10);
      eDocument.body.removeChild(div);
    }
    return calculatedValue || defaultValue;
  }
  isThemeDark() {
    const {
      theme
    } = this.getTheme();
    return !!theme && theme.indexOf('dark') >= 0;
  }
  chartMenuPanelWidth() {
    return this.getSassVariable('chartMenuPanelWidth');
  }
  getTheme() {
    const reg = /\bzing-(material|(?:theme-([\w\-]*)))\b/g;
    let el = this.eGridDiv;
    let themeMatch = null;
    let allThemes = [];
    while (el) {
      themeMatch = reg.exec(el.className);
      if (!themeMatch) {
        el = el.parentElement || undefined;
      } else {
        const matched = el.className.match(reg);
        if (matched) {
          allThemes = matched;
        }
        break;
      }
    }
    if (!themeMatch) {
      return {
        allThemes
      };
    }
    const theme = themeMatch[0];
    return {
      theme,
      el,
      themeFamily: theme.replace(/-dark$/, ''),
      allThemes
    };
  }
  getFromTheme(defaultValue, sassVariableName) {
    var _a;
    return (_a = this.getSassVariable(sassVariableName)) !== null && _a !== void 0 ? _a : defaultValue;
  }
  getDefaultRowHeight() {
    return this.getFromTheme(DEFAULT_ROW_HEIGHT, 'rowHeight');
  }
  getListItemHeight() {
    return this.getFromTheme(20, 'listItemHeight');
  }
  refreshRowHeightVariable() {
    const oldRowHeight = this.eGridDiv.style.getPropertyValue('--zing-line-height').trim();
    const height = this.gridOptionsService.get('rowHeight');
    if (height == null || isNaN(height) || !isFinite(height)) {
      if (oldRowHeight !== null) {
        this.eGridDiv.style.setProperty('--zing-line-height', null);
      }
      return -1;
    }
    const newRowHeight = `${height}px`;
    if (oldRowHeight != newRowHeight) {
      this.eGridDiv.style.setProperty('--zing-line-height', newRowHeight);
      return height;
    }
    return oldRowHeight != '' ? parseFloat(oldRowHeight) : -1;
  }
  getMinColWidth() {
    const measuredMin = this.getFromTheme(null, 'headerCellMinWidth');
    return exists(measuredMin) ? Math.max(measuredMin, MIN_COL_WIDTH) : MIN_COL_WIDTH;
  }
  destroy() {
    this.calculatedSizes = null;
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    super.destroy();
  }
};
__decorate([Autowired('eGridDiv')], Environment.prototype, "eGridDiv", void 0);
__decorate([PostConstruct], Environment.prototype, "postConstruct", null);
Environment = __decorate([Bean('environment')], Environment);
export { Environment };