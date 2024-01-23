export function sortRowNodesByOrder(rowNodes, rowNodeOrder) {
  if (!rowNodes) {
    return false;
  }
  const comparator = (nodeA, nodeB) => {
    const positionA = rowNodeOrder[nodeA.id];
    const positionB = rowNodeOrder[nodeB.id];
    const aHasIndex = positionA !== undefined;
    const bHasIndex = positionB !== undefined;
    const bothNodesAreUserNodes = aHasIndex && bHasIndex;
    const bothNodesAreFillerNodes = !aHasIndex && !bHasIndex;
    if (bothNodesAreUserNodes) {
      return positionA - positionB;
    }
    if (bothNodesAreFillerNodes) {
      return nodeA.__objectId - nodeB.__objectId;
    }
    if (aHasIndex) {
      return 1;
    }
    return -1;
  };
  let rowNodeA;
  let rowNodeB;
  let atLeastOneOutOfOrder = false;
  for (let i = 0; i < rowNodes.length - 1; i++) {
    rowNodeA = rowNodes[i];
    rowNodeB = rowNodes[i + 1];
    if (comparator(rowNodeA, rowNodeB) > 0) {
      atLeastOneOutOfOrder = true;
      break;
    }
  }
  if (atLeastOneOutOfOrder) {
    rowNodes.sort(comparator);
    return true;
  }
  return false;
}