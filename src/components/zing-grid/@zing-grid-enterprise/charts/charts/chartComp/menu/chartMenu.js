var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, ZingPanel, ZingPromise, Autowired, CHART_TOOL_PANEL_ALLOW_LIST, CHART_TOOL_PANEL_MENU_OPTIONS, CHART_TOOLBAR_ALLOW_LIST, Component, Events, PostConstruct, RefSelector } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { TabbedChartMenu } from "./tabbedChartMenu";
import { ChartController } from "../chartController";
export class ChartMenu extends Component {
  constructor(eChartContainer, eMenuPanelContainer, chartController, chartOptionsService) {
    super(ChartMenu.TEMPLATE);
    this.eChartContainer = eChartContainer;
    this.eMenuPanelContainer = eMenuPanelContainer;
    this.chartController = chartController;
    this.chartOptionsService = chartOptionsService;
    this.buttons = {
      chartSettings: ['menu', () => this.showMenu(this.defaultPanel)],
      chartData: ['menu', () => this.showMenu("chartData")],
      chartFormat: ['menu', () => this.showMenu("chartFormat")],
      chartLink: ['linked', e => this.toggleDetached(e)],
      chartUnlink: ['unlinked', e => this.toggleDetached(e)],
      chartDownload: ['save', () => this.saveChart()]
    };
    this.panels = [];
    this.buttonListenersDestroyFuncs = [];
    this.menuVisible = false;
  }
  postConstruct() {
    this.createButtons();
    this.addManagedListener(this.eventService, Events.EVENT_CHART_CREATED, e => {
      var _a;
      if (e.chartId === this.chartController.getChartId()) {
        const showDefaultToolPanel = Boolean((_a = this.gridOptionsService.get('chartToolPanelsDef')) === null || _a === void 0 ? void 0 : _a.defaultToolPanel);
        if (showDefaultToolPanel) {
          this.showMenu(this.defaultPanel, false);
        }
      }
    });
    this.refreshMenuClasses();
    if (!this.gridOptionsService.get('suppressChartToolPanelsButton') && this.panels.length > 0) {
      this.getGui().classList.add('zing-chart-tool-panel-button-enable');
      this.addManagedListener(this.eHideButton, 'click', this.toggleMenu.bind(this));
    }
    this.addManagedListener(this.chartController, ChartController.EVENT_CHART_API_UPDATE, this.createButtons.bind(this));
  }
  isVisible() {
    return this.menuVisible;
  }
  getExtraPaddingDirections() {
    const topItems = ['chartLink', 'chartUnlink', 'chartDownload'];
    const rightItems = ['chartSettings', 'chartData', 'chartFormat'];
    const result = [];
    if (topItems.some(v => this.chartToolbarOptions.includes(v))) {
      result.push('top');
    }
    if (rightItems.some(v => this.chartToolbarOptions.includes(v))) {
      result.push(this.gridOptionsService.get('enableRtl') ? 'left' : 'right');
    }
    return result;
  }
  getToolbarOptions() {
    var _a, _b, _c;
    const useChartToolPanelCustomisation = Boolean(this.gridOptionsService.get('chartToolPanelsDef'));
    if (useChartToolPanelCustomisation) {
      const defaultChartToolbarOptions = [this.chartController.isChartLinked() ? 'chartLink' : 'chartUnlink', 'chartDownload'];
      const toolbarItemsFunc = this.gridOptionsService.getCallback('getChartToolbarItems');
      const params = {
        defaultItems: defaultChartToolbarOptions
      };
      let chartToolbarOptions = toolbarItemsFunc ? toolbarItemsFunc(params).filter(option => {
        if (!CHART_TOOLBAR_ALLOW_LIST.includes(option)) {
          const msg = CHART_TOOL_PANEL_ALLOW_LIST.includes(option) ? `ZING Grid: '${option}' is a Chart Tool Panel option and will be ignored since 'chartToolPanelsDef' is used. Please use 'chartToolPanelsDef.panels' grid option instead` : `ZING Grid: '${option}' is not a valid Chart Toolbar Option`;
          console.warn(msg);
          return false;
        }
        return true;
      }) : defaultChartToolbarOptions;
      const panelsOverride = (_b = (_a = this.gridOptionsService.get('chartToolPanelsDef')) === null || _a === void 0 ? void 0 : _a.panels) === null || _b === void 0 ? void 0 : _b.map(panel => {
        const menuOption = CHART_TOOL_PANEL_MENU_OPTIONS[panel];
        if (!menuOption) {
          console.warn(`ZING Grid - invalid panel in chartToolPanelsDef.panels: '${panel}'`);
        }
        return menuOption;
      }).filter(panel => Boolean(panel));
      this.panels = panelsOverride ? panelsOverride : Object.values(CHART_TOOL_PANEL_MENU_OPTIONS);
      if (this.chartController.isPivotChart()) {
        this.panels = this.panels.filter(panel => panel !== 'chartData');
      }
      const defaultToolPanel = (_c = this.gridOptionsService.get('chartToolPanelsDef')) === null || _c === void 0 ? void 0 : _c.defaultToolPanel;
      this.defaultPanel = defaultToolPanel && CHART_TOOL_PANEL_MENU_OPTIONS[defaultToolPanel] || this.panels[0];
      return this.panels.length > 0 ? [this.panels[0], ...chartToolbarOptions] : chartToolbarOptions;
    } else {
      let tabOptions = ['chartSettings', 'chartData', 'chartFormat', this.chartController.isChartLinked() ? 'chartLink' : 'chartUnlink', 'chartDownload'];
      const toolbarItemsFunc = this.gridOptionsService.getCallback('getChartToolbarItems');
      if (toolbarItemsFunc) {
        const isLegacyToolbar = this.gridOptionsService.get('suppressChartToolPanelsButton');
        const params = {
          defaultItems: isLegacyToolbar ? tabOptions : CHART_TOOLBAR_ALLOW_LIST
        };
        tabOptions = toolbarItemsFunc(params).filter(option => {
          if (!this.buttons[option]) {
            console.warn(`ZING Grid: '${option}' is not a valid Chart Toolbar Option`);
            return false;
          } else if (!isLegacyToolbar && CHART_TOOL_PANEL_ALLOW_LIST.includes(option)) {
            const msg = `ZING Grid: '${option}' is a Chart Tool Panel option and will be ignored. Please use 'chartToolPanelsDef.panels' grid option instead`;
            console.warn(msg);
            return false;
          }
          return true;
        });
        if (!isLegacyToolbar) {
          tabOptions = tabOptions.concat(CHART_TOOL_PANEL_ALLOW_LIST);
        }
      }
      if (this.chartController.isPivotChart()) {
        tabOptions = tabOptions.filter(option => option !== 'chartData');
      }
      const ignoreOptions = ['chartUnlink', 'chartLink', 'chartDownload'];
      this.panels = tabOptions.filter(option => ignoreOptions.indexOf(option) === -1);
      this.defaultPanel = this.panels[0];
      return tabOptions.filter(value => ignoreOptions.indexOf(value) !== -1 || this.panels.length && value === this.panels[0]);
    }
  }
  toggleDetached(e) {
    const target = e.target;
    const active = target.classList.contains('zing-icon-linked');
    target.classList.toggle('zing-icon-linked', !active);
    target.classList.toggle('zing-icon-unlinked', active);
    const tooltipKey = active ? 'chartUnlinkToolbarTooltip' : 'chartLinkToolbarTooltip';
    const tooltipTitle = this.chartTranslationService.translate(tooltipKey);
    if (tooltipTitle) {
      target.title = tooltipTitle;
    }
    this.chartController.detachChartRange();
  }
  createButtons() {
    this.buttonListenersDestroyFuncs.forEach(func => func());
    this.buttonListenersDestroyFuncs = [];
    this.chartToolbarOptions = this.getToolbarOptions();
    const menuEl = this.eMenu;
    _.clearElement(menuEl);
    this.chartToolbarOptions.forEach(button => {
      const buttonConfig = this.buttons[button];
      const [iconName, callback] = buttonConfig;
      const buttonEl = _.createIconNoSpan(iconName, this.gridOptionsService, undefined, true);
      buttonEl.classList.add('zing-chart-menu-icon');
      const tooltipTitle = this.chartTranslationService.translate(button + 'ToolbarTooltip');
      if (tooltipTitle && buttonEl instanceof HTMLElement) {
        buttonEl.title = tooltipTitle;
      }
      this.buttonListenersDestroyFuncs.push(this.addManagedListener(buttonEl, 'click', callback));
      menuEl.appendChild(buttonEl);
    });
  }
  saveChart() {
    const event = {
      type: ChartMenu.EVENT_DOWNLOAD_CHART
    };
    this.dispatchEvent(event);
  }
  createMenuPanel(defaultTab) {
    const width = this.environment.chartMenuPanelWidth();
    const menuPanel = this.menuPanel = this.createBean(new ZingPanel({
      minWidth: width,
      width,
      height: '100%',
      closable: true,
      hideTitleBar: true,
      cssIdentifier: 'chart-menu'
    }));
    menuPanel.setParentComponent(this);
    this.eMenuPanelContainer.appendChild(menuPanel.getGui());
    this.tabbedMenu = this.createBean(new TabbedChartMenu({
      controller: this.chartController,
      type: this.chartController.getChartType(),
      panels: this.panels,
      chartOptionsService: this.chartOptionsService
    }));
    this.addManagedListener(menuPanel, Component.EVENT_DESTROYED, () => this.destroyBean(this.tabbedMenu));
    return new ZingPromise(res => {
      window.setTimeout(() => {
        menuPanel.setBodyComponent(this.tabbedMenu);
        this.tabbedMenu.showTab(defaultTab);
        res(menuPanel);
        this.addManagedListener(this.eChartContainer, 'click', event => {
          if (this.getGui().contains(event.target)) {
            return;
          }
          if (this.menuVisible) {
            this.hideMenu();
          }
        });
      }, 100);
    });
  }
  showContainer() {
    if (!this.menuPanel) {
      return;
    }
    this.menuVisible = true;
    this.showParent(this.menuPanel.getWidth());
    this.refreshMenuClasses();
  }
  toggleMenu() {
    this.menuVisible ? this.hideMenu() : this.showMenu();
  }
  showMenu(panel, animate = true) {
    if (!animate) {
      this.eMenuPanelContainer.classList.add('zing-no-transition');
    }
    if (this.menuPanel && !panel) {
      this.showContainer();
    } else {
      const menuPanel = panel || this.defaultPanel;
      let tab = this.panels.indexOf(menuPanel);
      if (tab < 0) {
        console.warn(`ZING Grid: '${panel}' is not a valid Chart Tool Panel name`);
        tab = this.panels.indexOf(this.defaultPanel);
      }
      if (this.menuPanel) {
        this.tabbedMenu.showTab(tab);
        this.showContainer();
      } else {
        this.createMenuPanel(tab).then(this.showContainer.bind(this));
      }
    }
    if (!animate) {
      setTimeout(() => {
        if (!this.isAlive()) {
          return;
        }
        this.eMenuPanelContainer.classList.remove('zing-no-transition');
      }, 500);
    }
  }
  hideMenu() {
    this.hideParent();
    window.setTimeout(() => {
      this.menuVisible = false;
      this.refreshMenuClasses();
    }, 500);
  }
  refreshMenuClasses() {
    this.eChartContainer.classList.toggle('zing-chart-menu-visible', this.menuVisible);
    this.eChartContainer.classList.toggle('zing-chart-menu-hidden', !this.menuVisible);
    if (!this.gridOptionsService.get('suppressChartToolPanelsButton')) {
      this.eHideButtonIcon.classList.toggle('zing-icon-contracted', this.menuVisible);
      this.eHideButtonIcon.classList.toggle('zing-icon-expanded', !this.menuVisible);
    }
  }
  showParent(width) {
    this.eMenuPanelContainer.style.minWidth = `${width}px`;
  }
  hideParent() {
    this.eMenuPanelContainer.style.minWidth = '0';
  }
  destroy() {
    super.destroy();
    if (this.menuPanel && this.menuPanel.isAlive()) {
      this.destroyBean(this.menuPanel);
    }
    if (this.tabbedMenu && this.tabbedMenu.isAlive()) {
      this.destroyBean(this.tabbedMenu);
    }
  }
}
ChartMenu.EVENT_DOWNLOAD_CHART = "downloadChart";
ChartMenu.TEMPLATE = `<div>
        <div class="zing-chart-menu" ref="eMenu"></div>
        <button class="zing-button zing-chart-menu-close" ref="eHideButton">
            <span class="zing-icon zing-icon-contracted" ref="eHideButtonIcon"></span>
        </button>
    </div>`;
__decorate([Autowired('chartTranslationService')], ChartMenu.prototype, "chartTranslationService", void 0);
__decorate([RefSelector("eMenu")], ChartMenu.prototype, "eMenu", void 0);
__decorate([RefSelector("eHideButton")], ChartMenu.prototype, "eHideButton", void 0);
__decorate([RefSelector("eHideButtonIcon")], ChartMenu.prototype, "eHideButtonIcon", void 0);
__decorate([PostConstruct], ChartMenu.prototype, "postConstruct", null);