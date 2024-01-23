
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
            // when comparing two nodes the user has provided, they always
            // have indexes
            return positionA - positionB;
        }
        if (bothNodesAreFillerNodes) {
            // when comparing two filler nodes, we have no index to compare them
            // against, however we want this sorting to be deterministic, so that
            // the rows don't jump around as the user does delta updates. so we
            // want the same sort result. so we use the __objectId - which doesn't make sense
            // from a sorting point of view, but does give consistent behaviour between
            // calls. otherwise groups jump around as delta updates are done.
            // note: previously here we used nodeId, however this gave a strange order
            // as string ordering of numbers is wrong, so using id based on creation order
            // as least gives better looking order.
            return nodeA.__objectId - nodeB.__objectId;
        }
        if (aHasIndex) {
            return 1;
        }
        return -1;
    };
    // check if the list first needs sorting
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
