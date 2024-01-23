var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Component, PostConstruct, RefSelector } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { MiniChartsContainer } from "./miniChartsContainer";
// import { ZingChartThemePalette } from "zing-charts-enterprise";
import { ChartController } from "../../chartController";
export class ChartSettingsPanel extends Component {
    constructor(chartController) {
        super(ChartSettingsPanel.TEMPLATE);
        this.miniChartsContainers = [];
        this.cardItems = [];
        this.activePaletteIndex = 0;
        this.palettes = [];
        this.themes = [];
        this.chartController = chartController;
    }
    postConstruct() {
        this.resetPalettes();
        this.ePrevBtn.insertAdjacentElement('afterbegin', _.createIconNoSpan('previous', this.gridOptionsService));
        this.eNextBtn.insertAdjacentElement('afterbegin', _.createIconNoSpan('next', this.gridOptionsService));
        this.addManagedListener(this.ePrevBtn, 'click', () => this.setActivePalette(this.getPrev(), 'left'));
        this.addManagedListener(this.eNextBtn, 'click', () => this.setActivePalette(this.getNext(), 'right'));
        // change the selected chart when a combo chart is modified via the data panel, i.e. the custom combo should be selected
        this.addManagedListener(this.chartController, ChartController.EVENT_CHART_TYPE_CHANGED, () => this.resetPalettes(true));
        this.addManagedListener(this.chartController, ChartController.EVENT_CHART_API_UPDATE, () => this.resetPalettes(true));
        this.scrollSelectedIntoView();
    }
    scrollSelectedIntoView() {
        // the panel is not immediately visible due to the slide animation, so we add a
        // setTimeout to wait until the panel animation is over and is able to scroll
        setTimeout(() => {
            const isMiniChartsContainerVisible = (miniChartsContainers) => {
                return !miniChartsContainers.getGui().classList.contains('zing-hidden');
            };
            const currentMiniChartContainer = this.miniChartsContainers.find(isMiniChartsContainerVisible);
            const currentChart = currentMiniChartContainer.getGui().querySelector('.zing-selected');
            if (currentChart) {
                const parent = currentChart.offsetParent;
                if (parent) {
                    this.eMiniChartsContainer.scrollTo(0, parent.offsetTop);
                }
            }
        }, 250);
    }
    resetPalettes(forceReset) {
        var _a, _b;
        const palettes = this.chartController.getPalettes();
        const chartGroups = (_b = (_a = this.gridOptionsService.get('chartToolPanelsDef')) === null || _a === void 0 ? void 0 : _a.settingsPanel) === null || _b === void 0 ? void 0 : _b.chartGroupsDef;
        if ((_.shallowCompare(palettes, this.palettes) && !forceReset) || this.isAnimating) {
            return;
        }
        this.palettes = palettes;
        this.themes = this.chartController.getThemes();
        this.activePaletteIndex = this.themes.findIndex(name => name === this.chartController.getChartThemeName());
        this.cardItems = [];
        _.clearElement(this.eCardSelector);
        this.destroyMiniCharts();
        this.palettes.forEach((palette, index) => {
            const isActivePalette = this.activePaletteIndex === index;
            const { fills, strokes } = palette;
            const miniChartsContainer = this.createBean(new MiniChartsContainer(this.chartController, fills, strokes, chartGroups));
            this.miniChartsContainers.push(miniChartsContainer);
            this.eMiniChartsContainer.appendChild(miniChartsContainer.getGui());
            this.addCardLink(index);
            if (isActivePalette) {
                miniChartsContainer.updateSelectedMiniChart();
            }
            else {
                miniChartsContainer.setDisplayed(false);
            }
        });
        _.setDisplayed(this.eNavBar, this.palettes.length > 1);
        _.radioCssClass(this.cardItems[this.activePaletteIndex], 'zing-selected', 'zing-not-selected');
    }
    addCardLink(index) {
        const link = document.createElement('div');
        link.classList.add('zing-chart-settings-card-item');
        this.addManagedListener(link, 'click', () => {
            this.setActivePalette(index, index < this.activePaletteIndex ? 'left' : 'right');
        });
        this.eCardSelector.appendChild(link);
        this.cardItems.push(link);
    }
    getPrev() {
        let prev = this.activePaletteIndex - 1;
        if (prev < 0) {
            prev = this.palettes.length - 1;
        }
        return prev;
    }
    getNext() {
        let next = this.activePaletteIndex + 1;
        if (next >= this.palettes.length) {
            next = 0;
        }
        return next;
    }
    setActivePalette(index, animationDirection) {
        if (this.isAnimating || this.activePaletteIndex === index) {
            return;
        }
        _.radioCssClass(this.cardItems[index], 'zing-selected', 'zing-not-selected');
        const currentPalette = this.miniChartsContainers[this.activePaletteIndex];
        const currentGui = currentPalette.getGui();
        const futurePalette = this.miniChartsContainers[index];
        const nextGui = futurePalette.getGui();
        currentPalette.updateSelectedMiniChart();
        futurePalette.updateSelectedMiniChart();
        const multiplier = animationDirection === 'left' ? -1 : 1;
        const final = nextGui.style.left = `${(_.getAbsoluteWidth(this.getGui()) * multiplier)}px`;
        this.activePaletteIndex = index;
        this.isAnimating = true;
        const animatingClass = 'zing-animating';
        futurePalette.setDisplayed(true);
        currentPalette.addCssClass(animatingClass);
        futurePalette.addCssClass(animatingClass);
        this.chartController.setChartThemeName(this.themes[index]);
        window.setTimeout(() => {
            currentGui.style.left = `${-parseFloat(final)}px`;
            nextGui.style.left = '0px';
        }, 0);
        window.setTimeout(() => {
            this.isAnimating = false;
            currentPalette.removeCssClass(animatingClass);
            futurePalette.removeCssClass(animatingClass);
            currentPalette.setDisplayed(false);
        }, 300);
    }
    destroyMiniCharts() {
        _.clearElement(this.eMiniChartsContainer);
        this.miniChartsContainers = this.destroyBeans(this.miniChartsContainers);
    }
    destroy() {
        this.destroyMiniCharts();
        super.destroy();
    }
}
ChartSettingsPanel.TEMPLATE = `<div class="zing-chart-settings-wrapper">
            <div ref="eMiniChartsContainer" class="zing-chart-settings-mini-charts-container zing-scrollable-container"></div>
            <div ref="eNavBar" class="zing-chart-settings-nav-bar">
                <div ref="ePrevBtn" class="zing-chart-settings-prev">
                    <button type="button" class="zing-button zing-chart-settings-prev-button"></button>
                </div>
                <div ref="eCardSelector" class="zing-chart-settings-card-selector"></div>
                <div ref="eNextBtn" class="zing-chart-settings-next">
                    <button type="button" class="zing-button zing-chart-settings-next-button"></button>
                </div>
            </div>
        </div>`;
__decorate([
    Autowired('resizeObserverService')
], ChartSettingsPanel.prototype, "resizeObserverService", void 0);
__decorate([
    RefSelector('eMiniChartsContainer')
], ChartSettingsPanel.prototype, "eMiniChartsContainer", void 0);
__decorate([
    RefSelector('eNavBar')
], ChartSettingsPanel.prototype, "eNavBar", void 0);
__decorate([
    RefSelector('eCardSelector')
], ChartSettingsPanel.prototype, "eCardSelector", void 0);
__decorate([
    RefSelector('ePrevBtn')
], ChartSettingsPanel.prototype, "ePrevBtn", void 0);
__decorate([
    RefSelector('eNextBtn')
], ChartSettingsPanel.prototype, "eNextBtn", void 0);
__decorate([
    PostConstruct
], ChartSettingsPanel.prototype, "postConstruct", null);
