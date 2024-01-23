export class FloatingFilterMapper {
  static getFloatingFilterType(filterType) {
    return this.filterToFloatingFilterMapping[filterType];
  }
}
FloatingFilterMapper.filterToFloatingFilterMapping = {
  set: 'zingSetColumnFloatingFilter',
  zingSetColumnFilter: 'zingSetColumnFloatingFilter',
  multi: 'zingMultiColumnFloatingFilter',
  zingMultiColumnFilter: 'zingMultiColumnFloatingFilter',
  group: 'zingGroupColumnFloatingFilter',
  zingGroupColumnFilter: 'zingGroupColumnFloatingFilter',
  number: 'zingNumberColumnFloatingFilter',
  zingNumberColumnFilter: 'zingNumberColumnFloatingFilter',
  date: 'zingDateColumnFloatingFilter',
  zingDateColumnFilter: 'zingDateColumnFloatingFilter',
  text: 'zingTextColumnFloatingFilter',
  zingTextColumnFilter: 'zingTextColumnFloatingFilter'
};