var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub, DragSourceType, PostConstruct, VirtualListDragFeature } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class AdvancedFilterBuilderDragFeature extends BeanStub {
    constructor(comp, virtualList) {
        super();
        this.comp = comp;
        this.virtualList = virtualList;
    }
    postConstruct() {
        this.createManagedBean(new VirtualListDragFeature(this.comp, this.virtualList, {
            dragSourceType: DragSourceType.AdvancedFilterBuilder,
            listItemDragStartEvent: AdvancedFilterBuilderDragFeature.EVENT_DRAG_STARTED,
            listItemDragEndEvent: AdvancedFilterBuilderDragFeature.EVENT_DRAG_ENDED,
            eventSource: this,
            getCurrentDragValue: (listItemDragStartEvent) => this.getCurrentDragValue(listItemDragStartEvent),
            isMoveBlocked: () => false,
            getNumRows: (comp) => comp.getNumItems(),
            moveItem: (currentDragValue, lastHoveredListItem) => this.moveItem(currentDragValue, lastHoveredListItem)
        }));
    }
    getCurrentDragValue(listItemDragStartEvent) {
        return listItemDragStartEvent.item;
    }
    moveItem(currentDragValue, lastHoveredListItem) {
        this.comp.moveItem(currentDragValue, lastHoveredListItem);
    }
}
AdvancedFilterBuilderDragFeature.EVENT_DRAG_STARTED = 'advancedFilterBuilderDragStarted';
AdvancedFilterBuilderDragFeature.EVENT_DRAG_ENDED = 'advancedFilterBuilderDragEnded';
__decorate([
    PostConstruct
], AdvancedFilterBuilderDragFeature.prototype, "postConstruct", null);
