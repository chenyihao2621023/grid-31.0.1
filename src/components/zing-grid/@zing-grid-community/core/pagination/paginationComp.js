var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from "../widgets/component";
import { Autowired, PostConstruct } from "../context/context";
import { RefSelector } from "../widgets/componentAnnotations";
import { Events } from "../events";
import { createIconNoSpan } from "../utils/icon";
import { formatNumberCommas } from "../utils/number";
import { setAriaDisabled } from "../utils/aria";
import { KeyCode } from '../constants/keyCode';
export class PaginationComp extends Component {
  constructor() {
    super();
    this.previousAndFirstButtonsDisabled = false;
    this.nextButtonDisabled = false;
    this.lastButtonDisabled = false;
    this.areListenersSetup = false;
  }
  postConstruct() {
    const isRtl = this.gridOptionsService.get('enableRtl');
    this.setTemplate(this.getTemplate());
    const {
      btFirst,
      btPrevious,
      btNext,
      btLast,
      pageSizeComp
    } = this;
    this.activateTabIndex([btFirst, btPrevious, btNext, btLast]);
    btFirst.insertAdjacentElement('afterbegin', createIconNoSpan(isRtl ? 'last' : 'first', this.gridOptionsService));
    btPrevious.insertAdjacentElement('afterbegin', createIconNoSpan(isRtl ? 'next' : 'previous', this.gridOptionsService));
    btNext.insertAdjacentElement('afterbegin', createIconNoSpan(isRtl ? 'previous' : 'next', this.gridOptionsService));
    btLast.insertAdjacentElement('afterbegin', createIconNoSpan(isRtl ? 'first' : 'last', this.gridOptionsService));
    this.addManagedPropertyListener('pagination', this.onPaginationChanged.bind(this));
    this.addManagedPropertyListener('suppressPaginationPanel', this.onPaginationChanged.bind(this));
    this.addManagedPropertyListeners(['paginationPageSizeSelector', 'paginationAutoPageSize', 'suppressPaginationPanel'], () => this.onPageSizeRelatedOptionsChange());
    this.pageSizeComp.toggleSelectDisplay(this.pageSizeComp.shouldShowPageSizeSelector());
    this.onPaginationChanged();
  }
  onPaginationChanged() {
    const isPaging = this.gridOptionsService.get('pagination');
    const paginationPanelEnabled = isPaging && !this.gridOptionsService.get('suppressPaginationPanel');
    this.setDisplayed(paginationPanelEnabled);
    if (!paginationPanelEnabled) {
      return;
    }
    this.setupListeners();
    this.enableOrDisableButtons();
    this.updateRowLabels();
    this.setCurrentPageLabel();
    this.setTotalLabels();
    this.onPageSizeRelatedOptionsChange();
  }
  onPageSizeRelatedOptionsChange() {
    this.pageSizeComp.toggleSelectDisplay(this.pageSizeComp.shouldShowPageSizeSelector());
  }
  setupListeners() {
    if (!this.areListenersSetup) {
      this.addManagedListener(this.eventService, Events.EVENT_PAGINATION_CHANGED, this.onPaginationChanged.bind(this));
      [{
        el: this.btFirst,
        fn: this.onBtFirst.bind(this)
      }, {
        el: this.btPrevious,
        fn: this.onBtPrevious.bind(this)
      }, {
        el: this.btNext,
        fn: this.onBtNext.bind(this)
      }, {
        el: this.btLast,
        fn: this.onBtLast.bind(this)
      }].forEach(item => {
        const {
          el,
          fn
        } = item;
        this.addManagedListener(el, 'click', fn);
        this.addManagedListener(el, 'keydown', e => {
          if (e.key === KeyCode.ENTER || e.key === KeyCode.SPACE) {
            e.preventDefault();
            fn();
          }
        });
      });
      this.areListenersSetup = true;
    }
  }
  onBtFirst() {
    if (!this.previousAndFirstButtonsDisabled) {
      this.paginationProxy.goToFirstPage();
    }
  }
  setCurrentPageLabel() {
    const pagesExist = this.paginationProxy.getTotalPages() > 0;
    const currentPage = this.paginationProxy.getCurrentPage();
    const toDisplay = pagesExist ? currentPage + 1 : 0;
    this.lbCurrent.innerHTML = this.formatNumber(toDisplay);
  }
  formatNumber(value) {
    const userFunc = this.gridOptionsService.getCallback('paginationNumberFormatter');
    if (userFunc) {
      const params = {
        value: value
      };
      return userFunc(params);
    }
    const localeTextFunc = this.localeService.getLocaleTextFunc();
    const thousandSeparator = localeTextFunc('thousandSeparator', ',');
    const decimalSeparator = localeTextFunc('decimalSeparator', '.');
    return formatNumberCommas(value, thousandSeparator, decimalSeparator);
  }
  getTemplate() {
    const localeTextFunc = this.localeService.getLocaleTextFunc();
    const strPage = localeTextFunc('page', 'Page');
    const strTo = localeTextFunc('to', 'to');
    const strOf = localeTextFunc('of', 'of');
    const strFirst = localeTextFunc('firstPage', 'First Page');
    const strPrevious = localeTextFunc('previousPage', 'Previous Page');
    const strNext = localeTextFunc('nextPage', 'Next Page');
    const strLast = localeTextFunc('lastPage', 'Last Page');
    const compId = this.getCompId();
    return `<div class="zing-paging-panel zing-unselectable" id="zing-${compId}">
                <zing-page-size-selector ref="pageSizeComp"></zing-page-size-selector>
                <span class="zing-paging-row-summary-panel" role="status">
                    <span id="zing-${compId}-first-row" ref="lbFirstRowOnPage" class="zing-paging-row-summary-panel-number"></span>
                    <span id="zing-${compId}-to">${strTo}</span>
                    <span id="zing-${compId}-last-row" ref="lbLastRowOnPage" class="zing-paging-row-summary-panel-number"></span>
                    <span id="zing-${compId}-of">${strOf}</span>
                    <span id="zing-${compId}-row-count" ref="lbRecordCount" class="zing-paging-row-summary-panel-number"></span>
                </span>
                <span class="zing-paging-page-summary-panel" role="presentation">
                    <div ref="btFirst" class="zing-button zing-paging-button" role="button" aria-label="${strFirst}"></div>
                    <div ref="btPrevious" class="zing-button zing-paging-button" role="button" aria-label="${strPrevious}"></div>
                    <span class="zing-paging-description" role="status">
                        <span id="zing-${compId}-start-page">${strPage}</span>
                        <span id="zing-${compId}-start-page-number" ref="lbCurrent" class="zing-paging-number"></span>
                        <span id="zing-${compId}-of-page">${strOf}</span>
                        <span id="zing-${compId}-of-page-number" ref="lbTotal" class="zing-paging-number"></span>
                    </span>
                    <div ref="btNext" class="zing-button zing-paging-button" role="button" aria-label="${strNext}"></div>
                    <div ref="btLast" class="zing-button zing-paging-button" role="button" aria-label="${strLast}"></div>
                </span>
            </div>`;
  }
  onBtNext() {
    if (!this.nextButtonDisabled) {
      this.paginationProxy.goToNextPage();
    }
  }
  onBtPrevious() {
    if (!this.previousAndFirstButtonsDisabled) {
      this.paginationProxy.goToPreviousPage();
    }
  }
  onBtLast() {
    if (!this.lastButtonDisabled) {
      this.paginationProxy.goToLastPage();
    }
  }
  enableOrDisableButtons() {
    const currentPage = this.paginationProxy.getCurrentPage();
    const maxRowFound = this.paginationProxy.isLastPageFound();
    const totalPages = this.paginationProxy.getTotalPages();
    this.previousAndFirstButtonsDisabled = currentPage === 0;
    this.toggleButtonDisabled(this.btFirst, this.previousAndFirstButtonsDisabled);
    this.toggleButtonDisabled(this.btPrevious, this.previousAndFirstButtonsDisabled);
    const zeroPagesToDisplay = this.isZeroPagesToDisplay();
    const onLastPage = currentPage === totalPages - 1;
    this.nextButtonDisabled = onLastPage || zeroPagesToDisplay;
    this.lastButtonDisabled = !maxRowFound || zeroPagesToDisplay || currentPage === totalPages - 1;
    this.toggleButtonDisabled(this.btNext, this.nextButtonDisabled);
    this.toggleButtonDisabled(this.btLast, this.lastButtonDisabled);
  }
  toggleButtonDisabled(button, disabled) {
    setAriaDisabled(button, disabled);
    button.classList.toggle('zing-disabled', disabled);
  }
  updateRowLabels() {
    const currentPage = this.paginationProxy.getCurrentPage();
    const pageSize = this.paginationProxy.getPageSize();
    const maxRowFound = this.paginationProxy.isLastPageFound();
    const rowCount = this.paginationProxy.isLastPageFound() ? this.paginationProxy.getMasterRowCount() : null;
    let startRow;
    let endRow;
    if (this.isZeroPagesToDisplay()) {
      startRow = endRow = 0;
    } else {
      startRow = pageSize * currentPage + 1;
      endRow = startRow + pageSize - 1;
      if (maxRowFound && endRow > rowCount) {
        endRow = rowCount;
      }
    }
    this.lbFirstRowOnPage.innerHTML = this.formatNumber(startRow);
    if (this.rowNodeBlockLoader.isLoading()) {
      const translate = this.localeService.getLocaleTextFunc();
      this.lbLastRowOnPage.innerHTML = translate('pageLastRowUnknown', '?');
    } else {
      this.lbLastRowOnPage.innerHTML = this.formatNumber(endRow);
    }
  }
  isZeroPagesToDisplay() {
    const maxRowFound = this.paginationProxy.isLastPageFound();
    const totalPages = this.paginationProxy.getTotalPages();
    return maxRowFound && totalPages === 0;
  }
  setTotalLabels() {
    const lastPageFound = this.paginationProxy.isLastPageFound();
    const totalPages = this.paginationProxy.getTotalPages();
    const rowCount = lastPageFound ? this.paginationProxy.getMasterRowCount() : null;
    if (rowCount === 1) {
      const firstRow = this.paginationProxy.getRow(0);
      const hiddenGroupRow = firstRow && firstRow.group && !(firstRow.groupData || firstRow.aggData);
      if (hiddenGroupRow) {
        this.setTotalLabelsToZero();
        return;
      }
    }
    if (lastPageFound) {
      this.lbTotal.innerHTML = this.formatNumber(totalPages);
      this.lbRecordCount.innerHTML = this.formatNumber(rowCount);
    } else {
      const moreText = this.localeService.getLocaleTextFunc()('more', 'more');
      this.lbTotal.innerHTML = moreText;
      this.lbRecordCount.innerHTML = moreText;
    }
  }
  setTotalLabelsToZero() {
    this.lbFirstRowOnPage.innerHTML = this.formatNumber(0);
    this.lbCurrent.innerHTML = this.formatNumber(0);
    this.lbLastRowOnPage.innerHTML = this.formatNumber(0);
    this.lbTotal.innerHTML = this.formatNumber(0);
    this.lbRecordCount.innerHTML = this.formatNumber(0);
  }
}
__decorate([Autowired('paginationProxy')], PaginationComp.prototype, "paginationProxy", void 0);
__decorate([Autowired('rowNodeBlockLoader')], PaginationComp.prototype, "rowNodeBlockLoader", void 0);
__decorate([RefSelector('btFirst')], PaginationComp.prototype, "btFirst", void 0);
__decorate([RefSelector('btPrevious')], PaginationComp.prototype, "btPrevious", void 0);
__decorate([RefSelector('btNext')], PaginationComp.prototype, "btNext", void 0);
__decorate([RefSelector('btLast')], PaginationComp.prototype, "btLast", void 0);
__decorate([RefSelector('lbRecordCount')], PaginationComp.prototype, "lbRecordCount", void 0);
__decorate([RefSelector('lbFirstRowOnPage')], PaginationComp.prototype, "lbFirstRowOnPage", void 0);
__decorate([RefSelector('lbLastRowOnPage')], PaginationComp.prototype, "lbLastRowOnPage", void 0);
__decorate([RefSelector('lbCurrent')], PaginationComp.prototype, "lbCurrent", void 0);
__decorate([RefSelector('lbTotal')], PaginationComp.prototype, "lbTotal", void 0);
__decorate([RefSelector('pageSizeComp')], PaginationComp.prototype, "pageSizeComp", void 0);
__decorate([PostConstruct], PaginationComp.prototype, "postConstruct", null);