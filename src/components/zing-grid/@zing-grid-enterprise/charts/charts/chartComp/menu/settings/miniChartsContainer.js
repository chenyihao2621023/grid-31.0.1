var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, ZingGroupComponent, Autowired, Component, DEFAULT_CHART_GROUPS, PostConstruct } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { MiniArea, MiniAreaColumnCombo, MiniBar, MiniBubble, MiniColumn, MiniColumnLineCombo, MiniCustomCombo, MiniDoughnut, MiniHistogram, MiniLine, MiniNormalizedArea, MiniNormalizedBar, MiniNormalizedColumn, MiniPie, MiniScatter, MiniStackedArea, MiniStackedBar, MiniStackedColumn } from "./miniCharts/index";
const miniChartMapping = {
  columnGroup: {
    column: MiniColumn,
    stackedColumn: MiniStackedColumn,
    normalizedColumn: MiniNormalizedColumn
  },
  barGroup: {
    bar: MiniBar,
    stackedBar: MiniStackedBar,
    normalizedBar: MiniNormalizedBar
  },
  pieGroup: {
    pie: MiniPie,
    doughnut: MiniDoughnut
  },
  lineGroup: {
    line: MiniLine
  },
  scatterGroup: {
    scatter: MiniScatter,
    bubble: MiniBubble
  },
  areaGroup: {
    area: MiniArea,
    stackedArea: MiniStackedArea,
    normalizedArea: MiniNormalizedArea
  },
  histogramGroup: {
    histogram: MiniHistogram
  },
  combinationGroup: {
    columnLineCombo: MiniColumnLineCombo,
    areaColumnCombo: MiniAreaColumnCombo,
    customCombo: MiniCustomCombo
  }
};
export class MiniChartsContainer extends Component {
  constructor(chartController, fills, strokes, chartGroups = DEFAULT_CHART_GROUPS) {
    super(MiniChartsContainer.TEMPLATE);
    this.wrappers = {};
    this.chartController = chartController;
    this.fills = fills;
    this.strokes = strokes;
    this.chartGroups = Object.assign({}, chartGroups);
  }
  init() {
    if (!this.chartController.customComboExists() && this.chartGroups.combinationGroup) {
      this.chartGroups.combinationGroup = this.chartGroups.combinationGroup.filter(chartType => chartType !== 'customCombo');
    }
    const eGui = this.getGui();
    Object.keys(this.chartGroups).forEach(group => {
      const chartGroupValues = this.chartGroups[group];
      const groupComponent = this.createBean(new ZingGroupComponent({
        title: this.chartTranslationService.translate(group),
        suppressEnabledCheckbox: true,
        enabled: true,
        suppressOpenCloseIcons: true,
        cssIdentifier: 'charts-settings',
        direction: 'horizontal'
      }));
      chartGroupValues.forEach(chartType => {
        var _a;
        const MiniClass = (_a = miniChartMapping[group]) === null || _a === void 0 ? void 0 : _a[chartType];
        if (!MiniClass) {
          _.warnOnce(`invalid chartGroupsDef config '${group}${miniChartMapping[group] ? `.${chartType}` : ''}'`);
          return;
        }
        const miniWrapper = document.createElement('div');
        miniWrapper.classList.add('zing-chart-mini-thumbnail');
        const miniClassChartType = MiniClass.chartType;
        this.addManagedListener(miniWrapper, 'click', () => {
          this.chartController.setChartType(miniClassChartType);
          this.updateSelectedMiniChart();
        });
        this.wrappers[miniClassChartType] = miniWrapper;
        this.createBean(new MiniClass(miniWrapper, this.fills, this.strokes));
        groupComponent.addItem(miniWrapper);
      });
      eGui.appendChild(groupComponent.getGui());
    });
    this.updateSelectedMiniChart();
  }
  updateSelectedMiniChart() {
    const selectedChartType = this.chartController.getChartType();
    for (const miniChartType in this.wrappers) {
      const miniChart = this.wrappers[miniChartType];
      const selected = miniChartType === selectedChartType;
      miniChart.classList.toggle('zing-selected', selected);
    }
  }
}
MiniChartsContainer.TEMPLATE = `<div class="zing-chart-settings-mini-wrapper"></div>`;
__decorate([Autowired('chartTranslationService')], MiniChartsContainer.prototype, "chartTranslationService", void 0);
__decorate([PostConstruct], MiniChartsContainer.prototype, "init", null);