var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../context/beanStub";
import { Events } from "../events";
import { Autowired, Bean, PostConstruct } from "../context/context";
import { missing, exists } from "../utils/generic";
let PaginationProxy = class PaginationProxy extends BeanStub {
    constructor() {
        super(...arguments);
        this.currentPage = 0;
        this.topDisplayedRowIndex = 0;
        this.bottomDisplayedRowIndex = 0;
        this.pixelOffset = 0;
        this.masterRowCount = 0;
    }
    postConstruct() {
        this.active = this.gridOptionsService.get('pagination');
        this.pageSizeFromGridOptions = this.gridOptionsService.get('paginationPageSize');
        this.paginateChildRows = this.isPaginateChildRows();
        this.addManagedListener(this.eventService, Events.EVENT_MODEL_UPDATED, this.onModelUpdated.bind(this));
        this.addManagedPropertyListener('pagination', this.onPaginationGridOptionChanged.bind(this));
        this.addManagedPropertyListener('paginationPageSize', this.onPageSizeGridOptionChanged.bind(this));
        this.onModelUpdated();
    }
    ensureRowHeightsValid(startPixel, endPixel, startLimitIndex, endLimitIndex) {
        const res = this.rowModel.ensureRowHeightsValid(startPixel, endPixel, this.getPageFirstRow(), this.getPageLastRow());
        if (res) {
            this.calculatePages();
        }
        return res;
    }
    isPaginateChildRows() {
        const shouldPaginate = this.gridOptionsService.get('groupRemoveSingleChildren') || this.gridOptionsService.get('groupRemoveLowestSingleChildren');
        if (shouldPaginate) {
            return true;
        }
        return this.gridOptionsService.get('paginateChildRows');
    }
    onModelUpdated(modelUpdatedEvent) {
        this.calculatePages();
        const paginationChangedEvent = {
            type: Events.EVENT_PAGINATION_CHANGED,
            animate: modelUpdatedEvent ? modelUpdatedEvent.animate : false,
            newData: modelUpdatedEvent ? modelUpdatedEvent.newData : false,
            newPage: modelUpdatedEvent ? modelUpdatedEvent.newPage : false,
            newPageSize: modelUpdatedEvent ? modelUpdatedEvent.newPageSize : false,
            keepRenderedRows: modelUpdatedEvent ? modelUpdatedEvent.keepRenderedRows : false
        };
        this.eventService.dispatchEvent(paginationChangedEvent);
    }
    onPaginationGridOptionChanged() {
        this.active = this.gridOptionsService.get('pagination');
        this.calculatePages();
        const paginationChangedEvent = {
            type: Events.EVENT_PAGINATION_CHANGED,
            animate: false,
            newData: false,
            newPage: false,
            newPageSize: false,
            // important to keep rendered rows, otherwise every time grid is resized,
            // we would destroy all the rows.
            keepRenderedRows: true
        };
        this.eventService.dispatchEvent(paginationChangedEvent);
    }
    onPageSizeGridOptionChanged() {
        this.setPageSize(this.gridOptionsService.get('paginationPageSize'), 'gridOptions');
    }
    goToPage(page) {
        if (!this.active || this.currentPage === page || typeof this.currentPage !== 'number') {
            return;
        }
        this.currentPage = page;
        const event = {
            type: Events.EVENT_MODEL_UPDATED,
            animate: false,
            keepRenderedRows: false,
            newData: false,
            newPage: true,
            newPageSize: false
        };
        this.onModelUpdated(event);
    }
    getPixelOffset() {
        return this.pixelOffset;
    }
    getRow(index) {
        return this.rowModel.getRow(index);
    }
    getRowNode(id) {
        return this.rowModel.getRowNode(id);
    }
    getRowIndexAtPixel(pixel) {
        return this.rowModel.getRowIndexAtPixel(pixel);
    }
    getCurrentPageHeight() {
        if (missing(this.topRowBounds) || missing(this.bottomRowBounds)) {
            return 0;
        }
        return Math.max(this.bottomRowBounds.rowTop + this.bottomRowBounds.rowHeight - this.topRowBounds.rowTop, 0);
    }
    getCurrentPagePixelRange() {
        const pageFirstPixel = this.topRowBounds ? this.topRowBounds.rowTop : 0;
        const pageLastPixel = this.bottomRowBounds ? this.bottomRowBounds.rowTop + this.bottomRowBounds.rowHeight : 0;
        return { pageFirstPixel, pageLastPixel };
    }
    isRowPresent(rowNode) {
        if (!this.rowModel.isRowPresent(rowNode)) {
            return false;
        }
        const nodeIsInPage = rowNode.rowIndex >= this.topDisplayedRowIndex && rowNode.rowIndex <= this.bottomDisplayedRowIndex;
        return nodeIsInPage;
    }
    isEmpty() {
        return this.rowModel.isEmpty();
    }
    isRowsToRender() {
        return this.rowModel.isRowsToRender();
    }
    forEachNode(callback) {
        return this.rowModel.forEachNode(callback);
    }
    forEachNodeOnPage(callback) {
        const firstRow = this.getPageFirstRow();
        const lastRow = this.getPageLastRow();
        for (let i = firstRow; i <= lastRow; i++) {
            const node = this.getRow(i);
            if (node) {
                callback(node);
            }
        }
    }
    getType() {
        return this.rowModel.getType();
    }
    getRowBounds(index) {
        const res = this.rowModel.getRowBounds(index);
        res.rowIndex = index;
        return res;
    }
    getPageFirstRow() {
        return this.topRowBounds ? this.topRowBounds.rowIndex : -1;
    }
    getPageLastRow() {
        return this.bottomRowBounds ? this.bottomRowBounds.rowIndex : -1;
    }
    getRowCount() {
        return this.rowModel.getRowCount();
    }
    getPageForIndex(index) {
        return Math.floor(index / this.pageSize);
    }
    goToPageWithIndex(index) {
        if (!this.active) {
            return;
        }
        const pageNumber = this.getPageForIndex(index);
        this.goToPage(pageNumber);
    }
    isRowInPage(row) {
        if (!this.active) {
            return true;
        }
        const rowPage = this.getPageForIndex(row.rowIndex);
        return rowPage === this.currentPage;
    }
    isLastPageFound() {
        return this.rowModel.isLastRowIndexKnown();
    }
    getCurrentPage() {
        return this.currentPage;
    }
    goToNextPage() {
        this.goToPage(this.currentPage + 1);
    }
    goToPreviousPage() {
        this.goToPage(this.currentPage - 1);
    }
    goToFirstPage() {
        this.goToPage(0);
    }
    goToLastPage() {
        const rowCount = this.rowModel.getRowCount();
        const lastPage = Math.floor(rowCount / this.pageSize);
        this.goToPage(lastPage);
    }
    getPageSize() {
        return this.pageSize;
    }
    getTotalPages() {
        return this.totalPages;
    }
    
    setPage(page) {
        this.currentPage = page;
    }
    get pageSize() {
        if (exists(this.pageSizeAutoCalculated)) {
            return this.pageSizeAutoCalculated;
        }
        if (exists(this.pageSizeFromPageSizeSelector)) {
            return this.pageSizeFromPageSizeSelector;
        }
        if (exists(this.pageSizeFromInitialState)) {
            return this.pageSizeFromInitialState;
        }
        if (exists(this.pageSizeFromGridOptions)) {
            return this.pageSizeFromGridOptions;
        }
        return this.defaultPageSize;
    }
    unsetAutoCalculatedPageSize() {
        if (this.pageSizeAutoCalculated === undefined) {
            return;
        }
        const oldPageSize = this.pageSizeAutoCalculated;
        this.pageSizeAutoCalculated = undefined;
        if (this.pageSize === oldPageSize) {
            return;
        }
        this.onModelUpdated({
            type: Events.EVENT_MODEL_UPDATED,
            animate: false,
            keepRenderedRows: false,
            newData: false,
            newPage: false,
            newPageSize: true,
        });
    }
    setPageSize(size, source) {
        const currentSize = this.pageSize;
        switch (source) {
            case 'autoCalculated':
                this.pageSizeAutoCalculated = size;
                break;
            case 'pageSizeSelector':
                this.pageSizeFromPageSizeSelector = size;
                if (this.currentPage !== 0) {
                    this.goToFirstPage();
                }
                break;
            case 'initialState':
                this.pageSizeFromInitialState = size;
                break;
            case 'gridOptions':
                this.pageSizeFromGridOptions = size;
                this.pageSizeFromInitialState = undefined;
                this.pageSizeFromPageSizeSelector = undefined;
                if (this.currentPage !== 0) {
                    this.goToFirstPage();
                }
                break;
        }
        if (currentSize !== this.pageSize) {
            const event = {
                type: Events.EVENT_MODEL_UPDATED,
                animate: false,
                keepRenderedRows: false,
                newData: false,
                newPage: false,
                newPageSize: true,
            };
            this.onModelUpdated(event);
        }
    }
    calculatePages() {
        if (this.active) {
            if (this.paginateChildRows) {
                this.calculatePagesAllRows();
            }
            else {
                this.calculatePagesMasterRowsOnly();
            }
        }
        else {
            this.calculatedPagesNotActive();
        }
        this.topRowBounds = this.rowModel.getRowBounds(this.topDisplayedRowIndex);
        if (this.topRowBounds) {
            this.topRowBounds.rowIndex = this.topDisplayedRowIndex;
        }
        this.bottomRowBounds = this.rowModel.getRowBounds(this.bottomDisplayedRowIndex);
        if (this.bottomRowBounds) {
            this.bottomRowBounds.rowIndex = this.bottomDisplayedRowIndex;
        }
        this.setPixelOffset(exists(this.topRowBounds) ? this.topRowBounds.rowTop : 0);
    }
    setPixelOffset(value) {
        if (this.pixelOffset === value) {
            return;
        }
        this.pixelOffset = value;
        this.eventService.dispatchEvent({ type: Events.EVENT_PAGINATION_PIXEL_OFFSET_CHANGED });
    }
    setZeroRows() {
        this.masterRowCount = 0;
        this.topDisplayedRowIndex = 0;
        this.bottomDisplayedRowIndex = -1;
        this.currentPage = 0;
        this.totalPages = 0;
    }
    adjustCurrentPageIfInvalid() {
        if (this.currentPage >= this.totalPages) {
            this.currentPage = this.totalPages - 1;
        }
        if (!isFinite(this.currentPage) || isNaN(this.currentPage) || this.currentPage < 0) {
            this.currentPage = 0;
        }
    }
    calculatePagesMasterRowsOnly() {
        // const csrm = <ClientSideRowModel> this.rowModel;
        // const rootNode = csrm.getRootNode();
        // const masterRows = rootNode.childrenAfterSort;
        this.masterRowCount = this.rowModel.getTopLevelRowCount();
        // we say <=0 (rather than =0) as viewport returns -1 when no rows
        if (this.masterRowCount <= 0) {
            this.setZeroRows();
            return;
        }
        const masterLastRowIndex = this.masterRowCount - 1;
        this.totalPages = Math.floor((masterLastRowIndex) / this.pageSize) + 1;
        this.adjustCurrentPageIfInvalid();
        const masterPageStartIndex = this.pageSize * this.currentPage;
        let masterPageEndIndex = (this.pageSize * (this.currentPage + 1)) - 1;
        if (masterPageEndIndex > masterLastRowIndex) {
            masterPageEndIndex = masterLastRowIndex;
        }
        this.topDisplayedRowIndex = this.rowModel.getTopLevelRowDisplayedIndex(masterPageStartIndex);
        // masterRows[masterPageStartIndex].rowIndex;
        if (masterPageEndIndex === masterLastRowIndex) {
            // if showing the last master row, then we want to show the very last row of the model
            this.bottomDisplayedRowIndex = this.rowModel.getRowCount() - 1;
        }
        else {
            const firstIndexNotToShow = this.rowModel.getTopLevelRowDisplayedIndex(masterPageEndIndex + 1);
            //masterRows[masterPageEndIndex + 1].rowIndex;
            // this gets the index of the last child - eg current row is open, we want to display all children,
            // the index of the last child is one less than the index of the next parent row.
            this.bottomDisplayedRowIndex = firstIndexNotToShow - 1;
        }
    }
    getMasterRowCount() {
        return this.masterRowCount;
    }
    calculatePagesAllRows() {
        this.masterRowCount = this.rowModel.getRowCount();
        if (this.masterRowCount === 0) {
            this.setZeroRows();
            return;
        }
        const maxRowIndex = this.masterRowCount - 1;
        this.totalPages = Math.floor((maxRowIndex) / this.pageSize) + 1;
        this.adjustCurrentPageIfInvalid();
        this.topDisplayedRowIndex = this.pageSize * this.currentPage;
        this.bottomDisplayedRowIndex = (this.pageSize * (this.currentPage + 1)) - 1;
        if (this.bottomDisplayedRowIndex > maxRowIndex) {
            this.bottomDisplayedRowIndex = maxRowIndex;
        }
    }
    calculatedPagesNotActive() {
        this.setPageSize(this.masterRowCount, 'autoCalculated');
        this.totalPages = 1;
        this.currentPage = 0;
        this.topDisplayedRowIndex = 0;
        this.bottomDisplayedRowIndex = this.rowModel.getRowCount() - 1;
    }
};
__decorate([
    Autowired('rowModel')
], PaginationProxy.prototype, "rowModel", void 0);
__decorate([
    PostConstruct
], PaginationProxy.prototype, "postConstruct", null);
PaginationProxy = __decorate([
    Bean('paginationProxy')
], PaginationProxy);
export { PaginationProxy };
