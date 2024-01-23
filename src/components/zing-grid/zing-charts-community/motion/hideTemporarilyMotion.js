export function hideTemporarilyMotion(groupId, subId, animationManager, selections) {
  for (const selection of selections) {
    for (const node of selection.nodes()) {
      animationManager.animate({
        id: `${groupId}_${subId}_${node.id}`,
        groupId,
        from: 0,
        to: 1,
        onUpdate(value) {
          node.visible = value >= 1;
        },
        onStop() {
          node.visible = true;
        },
        onComplete() {
          selection.cleanup();
        }
      });
    }
  }
}