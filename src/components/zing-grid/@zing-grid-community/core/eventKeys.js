export class Events {
}


Events.EVENT_COLUMN_EVERYTHING_CHANGED = 'columnEverythingChanged';

Events.EVENT_NEW_COLUMNS_LOADED = 'newColumnsLoaded';

Events.EVENT_COLUMN_PIVOT_MODE_CHANGED = 'columnPivotModeChanged';

Events.EVENT_COLUMN_ROW_GROUP_CHANGED = 'columnRowGroupChanged';

Events.EVENT_EXPAND_COLLAPSE_ALL = 'expandOrCollapseAll';

Events.EVENT_COLUMN_PIVOT_CHANGED = 'columnPivotChanged';

Events.EVENT_GRID_COLUMNS_CHANGED = 'gridColumnsChanged';

Events.EVENT_COLUMN_VALUE_CHANGED = 'columnValueChanged';

Events.EVENT_COLUMN_MOVED = 'columnMoved';

Events.EVENT_COLUMN_VISIBLE = 'columnVisible';

Events.EVENT_COLUMN_PINNED = 'columnPinned';

Events.EVENT_COLUMN_GROUP_OPENED = 'columnGroupOpened';

Events.EVENT_COLUMN_RESIZED = 'columnResized';

Events.EVENT_DISPLAYED_COLUMNS_CHANGED = 'displayedColumnsChanged';

Events.EVENT_SUPPRESS_COLUMN_MOVE_CHANGED = 'suppressMovableColumns';

Events.EVENT_SUPPRESS_MENU_HIDE_CHANGED = 'suppressMenuHide';

Events.EVENT_SUPPRESS_FIELD_DOT_NOTATION = 'suppressFieldDotNotation';

Events.EVENT_VIRTUAL_COLUMNS_CHANGED = 'virtualColumnsChanged';

Events.EVENT_ASYNC_TRANSACTIONS_FLUSHED = 'asyncTransactionsFlushed';

Events.EVENT_ROW_GROUP_OPENED = 'rowGroupOpened';

Events.EVENT_ROW_DATA_UPDATED = 'rowDataUpdated';

Events.EVENT_PINNED_ROW_DATA_CHANGED = 'pinnedRowDataChanged';

Events.EVENT_RANGE_SELECTION_CHANGED = 'rangeSelectionChanged';

Events.EVENT_CHART_CREATED = 'chartCreated';

Events.EVENT_CHART_RANGE_SELECTION_CHANGED = 'chartRangeSelectionChanged';

Events.EVENT_CHART_OPTIONS_CHANGED = 'chartOptionsChanged';

Events.EVENT_CHART_DESTROYED = 'chartDestroyed';

Events.EVENT_TOOL_PANEL_VISIBLE_CHANGED = 'toolPanelVisibleChanged';
Events.EVENT_TOOL_PANEL_SIZE_CHANGED = 'toolPanelSizeChanged';
Events.EVENT_COLUMN_PANEL_ITEM_DRAG_START = 'columnPanelItemDragStart';
Events.EVENT_COLUMN_PANEL_ITEM_DRAG_END = 'columnPanelItemDragEnd';

Events.EVENT_MODEL_UPDATED = 'modelUpdated';
Events.EVENT_CUT_START = 'cutStart';
Events.EVENT_CUT_END = 'cutEnd';
Events.EVENT_PASTE_START = 'pasteStart';
Events.EVENT_PASTE_END = 'pasteEnd';
Events.EVENT_FILL_START = 'fillStart';
Events.EVENT_FILL_END = 'fillEnd';
Events.EVENT_RANGE_DELETE_START = 'rangeDeleteStart';
Events.EVENT_RANGE_DELETE_END = 'rangeDeleteEnd';

Events.EVENT_UNDO_STARTED = 'undoStarted';

Events.EVENT_UNDO_ENDED = 'undoEnded';

Events.EVENT_REDO_STARTED = 'redoStarted';

Events.EVENT_REDO_ENDED = 'redoEnded';
Events.EVENT_KEY_SHORTCUT_CHANGED_CELL_START = 'keyShortcutChangedCellStart';
Events.EVENT_KEY_SHORTCUT_CHANGED_CELL_END = 'keyShortcutChangedCellEnd';
Events.EVENT_CELL_CLICKED = 'cellClicked';
Events.EVENT_CELL_DOUBLE_CLICKED = 'cellDoubleClicked';
Events.EVENT_CELL_MOUSE_DOWN = 'cellMouseDown';
Events.EVENT_CELL_CONTEXT_MENU = 'cellContextMenu';
Events.EVENT_CELL_VALUE_CHANGED = 'cellValueChanged';
Events.EVENT_CELL_EDIT_REQUEST = 'cellEditRequest';
Events.EVENT_ROW_VALUE_CHANGED = 'rowValueChanged';
Events.EVENT_CELL_FOCUSED = 'cellFocused';
Events.EVENT_CELL_FOCUS_CLEARED = 'cellFocusCleared';
Events.EVENT_FULL_WIDTH_ROW_FOCUSED = 'fullWidthRowFocused';
Events.EVENT_ROW_SELECTED = 'rowSelected';
Events.EVENT_SELECTION_CHANGED = 'selectionChanged';
Events.EVENT_TOOLTIP_SHOW = 'tooltipShow';
Events.EVENT_TOOLTIP_HIDE = 'tooltipHide';
Events.EVENT_CELL_KEY_DOWN = 'cellKeyDown';
Events.EVENT_CELL_MOUSE_OVER = 'cellMouseOver';
Events.EVENT_CELL_MOUSE_OUT = 'cellMouseOut';

Events.EVENT_FILTER_CHANGED = 'filterChanged';

Events.EVENT_FILTER_MODIFIED = 'filterModified';
Events.EVENT_FILTER_OPENED = 'filterOpened';
Events.EVENT_ADVANCED_FILTER_BUILDER_VISIBLE_CHANGED = 'advancedFilterBuilderVisibleChanged';
Events.EVENT_SORT_CHANGED = 'sortChanged';

Events.EVENT_VIRTUAL_ROW_REMOVED = 'virtualRowRemoved';
Events.EVENT_ROW_CLICKED = 'rowClicked';
Events.EVENT_ROW_DOUBLE_CLICKED = 'rowDoubleClicked';

Events.EVENT_GRID_READY = 'gridReady';

Events.EVENT_GRID_PRE_DESTROYED = 'gridPreDestroyed';

Events.EVENT_GRID_SIZE_CHANGED = 'gridSizeChanged';

Events.EVENT_VIEWPORT_CHANGED = 'viewportChanged';

Events.EVENT_SCROLLBAR_WIDTH_CHANGED = 'scrollbarWidthChanged';

Events.EVENT_FIRST_DATA_RENDERED = 'firstDataRendered';

Events.EVENT_DRAG_STARTED = 'dragStarted';

Events.EVENT_DRAG_STOPPED = 'dragStopped';
Events.EVENT_CHECKBOX_CHANGED = 'checkboxChanged';
Events.EVENT_ROW_EDITING_STARTED = 'rowEditingStarted';
Events.EVENT_ROW_EDITING_STOPPED = 'rowEditingStopped';
Events.EVENT_CELL_EDITING_STARTED = 'cellEditingStarted';
Events.EVENT_CELL_EDITING_STOPPED = 'cellEditingStopped';

Events.EVENT_BODY_SCROLL = 'bodyScroll';

Events.EVENT_BODY_SCROLL_END = 'bodyScrollEnd';
Events.EVENT_HEIGHT_SCALE_CHANGED = 'heightScaleChanged';

Events.EVENT_PAGINATION_CHANGED = 'paginationChanged';

Events.EVENT_COMPONENT_STATE_CHANGED = 'componentStateChanged';

Events.EVENT_STORE_REFRESHED = 'storeRefreshed';
Events.EVENT_STATE_UPDATED = 'stateUpdated';



// not documented, either experimental, or we just don't want users using an depending on them
Events.EVENT_BODY_HEIGHT_CHANGED = 'bodyHeightChanged';
Events.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED = 'displayedColumnsWidthChanged';
Events.EVENT_SCROLL_VISIBILITY_CHANGED = 'scrollVisibilityChanged';
Events.EVENT_COLUMN_HOVER_CHANGED = 'columnHoverChanged';
Events.EVENT_FLASH_CELLS = 'flashCells';
Events.EVENT_PAGINATION_PIXEL_OFFSET_CHANGED = 'paginationPixelOffsetChanged';
Events.EVENT_DISPLAYED_ROWS_CHANGED = 'displayedRowsChanged';
Events.EVENT_LEFT_PINNED_WIDTH_CHANGED = 'leftPinnedWidthChanged';
Events.EVENT_RIGHT_PINNED_WIDTH_CHANGED = 'rightPinnedWidthChanged';
Events.EVENT_ROW_CONTAINER_HEIGHT_CHANGED = 'rowContainerHeightChanged';
Events.EVENT_HEADER_HEIGHT_CHANGED = 'headerHeightChanged';
Events.EVENT_COLUMN_HEADER_HEIGHT_CHANGED = 'columnHeaderHeightChanged';
Events.EVENT_ROW_DRAG_ENTER = 'rowDragEnter';
Events.EVENT_ROW_DRAG_MOVE = 'rowDragMove';
Events.EVENT_ROW_DRAG_LEAVE = 'rowDragLeave';
Events.EVENT_ROW_DRAG_END = 'rowDragEnd';
// environment
Events.EVENT_GRID_STYLES_CHANGED = 'gridStylesChanged';
// primarily for charts
Events.EVENT_POPUP_TO_FRONT = 'popupToFront';
// these are used for server side group and agg - only used by CS with Viewport Row Model - intention is
// to design these better around server side functions and then release to general public when fully working with
// all the row models.
Events.EVENT_COLUMN_ROW_GROUP_CHANGE_REQUEST = 'columnRowGroupChangeRequest';
Events.EVENT_COLUMN_PIVOT_CHANGE_REQUEST = 'columnPivotChangeRequest';
Events.EVENT_COLUMN_VALUE_CHANGE_REQUEST = 'columnValueChangeRequest';
Events.EVENT_COLUMN_AGG_FUNC_CHANGE_REQUEST = 'columnAggFuncChangeRequest';
Events.EVENT_STORE_UPDATED = 'storeUpdated';
Events.EVENT_FILTER_DESTROYED = 'filterDestroyed';
Events.EVENT_ROW_DATA_UPDATE_STARTED = 'rowDataUpdateStarted';
Events.EVENT_ROW_COUNT_READY = 'rowCountReady';
// Advanced Filters
Events.EVENT_ADVANCED_FILTER_ENABLED_CHANGED = 'advancedFilterEnabledChanged';
Events.EVENT_DATA_TYPES_INFERRED = 'dataTypesInferred';
// Widgets
Events.EVENT_FIELD_VALUE_CHANGED = 'fieldValueChanged';
Events.EVENT_FIELD_PICKER_VALUE_SELECTED = 'fieldPickerValueSelected';
Events.EVENT_SIDE_BAR_UPDATED = 'sideBarUpdated';
