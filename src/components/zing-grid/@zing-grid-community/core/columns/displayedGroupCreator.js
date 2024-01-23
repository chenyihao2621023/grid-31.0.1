var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ColumnGroup } from "../entities/columnGroup";
import { Bean } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { exists } from "../utils/generic";
let DisplayedGroupCreator = class DisplayedGroupCreator extends BeanStub {
  createDisplayedGroups(sortedVisibleColumns, groupInstanceIdCreator, pinned, oldDisplayedGroups) {
    const oldColumnsMapped = this.mapOldGroupsById(oldDisplayedGroups);
    const topLevelResultCols = [];
    let groupsOrColsAtCurrentLevel = sortedVisibleColumns;
    while (groupsOrColsAtCurrentLevel.length) {
      const currentlyIterating = groupsOrColsAtCurrentLevel;
      groupsOrColsAtCurrentLevel = [];
      let lastGroupedColIdx = 0;
      const createGroupToIndex = to => {
        const from = lastGroupedColIdx;
        lastGroupedColIdx = to;
        const previousNode = currentlyIterating[from];
        const previousNodeProvided = previousNode instanceof ColumnGroup ? previousNode.getProvidedColumnGroup() : previousNode;
        const previousNodeParent = previousNodeProvided.getOriginalParent();
        if (previousNodeParent == null) {
          for (let i = from; i < to; i++) {
            topLevelResultCols.push(currentlyIterating[i]);
          }
          return;
        }
        const newGroup = this.createColumnGroup(previousNodeParent, groupInstanceIdCreator, oldColumnsMapped, pinned);
        for (let i = from; i < to; i++) {
          newGroup.addChild(currentlyIterating[i]);
        }
        groupsOrColsAtCurrentLevel.push(newGroup);
      };
      for (let i = 1; i < currentlyIterating.length; i++) {
        const thisNode = currentlyIterating[i];
        const thisNodeProvided = thisNode instanceof ColumnGroup ? thisNode.getProvidedColumnGroup() : thisNode;
        const thisNodeParent = thisNodeProvided.getOriginalParent();
        const previousNode = currentlyIterating[lastGroupedColIdx];
        const previousNodeProvided = previousNode instanceof ColumnGroup ? previousNode.getProvidedColumnGroup() : previousNode;
        const previousNodeParent = previousNodeProvided.getOriginalParent();
        if (thisNodeParent !== previousNodeParent) {
          createGroupToIndex(i);
        }
      }
      if (lastGroupedColIdx < currentlyIterating.length) {
        createGroupToIndex(currentlyIterating.length);
      }
    }
    this.setupParentsIntoColumns(topLevelResultCols, null);
    return topLevelResultCols;
  }
  createColumnGroup(providedGroup, groupInstanceIdCreator, oldColumnsMapped, pinned) {
    const groupId = providedGroup.getGroupId();
    const instanceId = groupInstanceIdCreator.getInstanceIdForKey(groupId);
    const uniqueId = ColumnGroup.createUniqueId(groupId, instanceId);
    let columnGroup = oldColumnsMapped[uniqueId];
    if (columnGroup && columnGroup.getProvidedColumnGroup() !== providedGroup) {
      columnGroup = null;
    }
    if (exists(columnGroup)) {
      columnGroup.reset();
    } else {
      columnGroup = new ColumnGroup(providedGroup, groupId, instanceId, pinned);
      this.context.createBean(columnGroup);
    }
    return columnGroup;
  }
  mapOldGroupsById(displayedGroups) {
    const result = {};
    const recursive = columnsOrGroups => {
      columnsOrGroups.forEach(columnOrGroup => {
        if (columnOrGroup instanceof ColumnGroup) {
          const columnGroup = columnOrGroup;
          result[columnOrGroup.getUniqueId()] = columnGroup;
          recursive(columnGroup.getChildren());
        }
      });
    };
    if (displayedGroups) {
      recursive(displayedGroups);
    }
    return result;
  }
  setupParentsIntoColumns(columnsOrGroups, parent) {
    columnsOrGroups.forEach(columnsOrGroup => {
      columnsOrGroup.setParent(parent);
      if (columnsOrGroup instanceof ColumnGroup) {
        const columnGroup = columnsOrGroup;
        this.setupParentsIntoColumns(columnGroup.getChildren(), columnGroup);
      }
    });
  }
};
DisplayedGroupCreator = __decorate([Bean('displayedGroupCreator')], DisplayedGroupCreator);
export { DisplayedGroupCreator };