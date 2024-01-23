export function getAdvancedFilterBuilderAddButtonParams(translate, maxPickerWidth) {
    return {
        pickerAriaLabelKey: 'ariaLabelAdvancedFilterBuilderAddField',
        pickerAriaLabelValue: 'Advanced Filter Builder Add Field',
        pickerType: 'zing-list',
        valueList: [{
                key: 'condition',
                displayValue: translate('advancedFilterBuilderAddCondition')
            }, {
                key: 'join',
                displayValue: translate('advancedFilterBuilderAddJoin')
            }],
        valueFormatter: (value) => { var _a; return value == null ? null : (_a = value.displayValue) !== null && _a !== void 0 ? _a : value.key; },
        pickerIcon: 'advancedFilterBuilderAdd',
        maxPickerWidth: `${maxPickerWidth !== null && maxPickerWidth !== void 0 ? maxPickerWidth : 120}px`,
        wrapperClassName: 'zing-advanced-filter-builder-item-button',
        ariaLabel: translate('advancedFilterBuilderAddButtonTooltip')
    };
}
