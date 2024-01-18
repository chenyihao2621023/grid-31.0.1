import { deconstructSelectionsOrNodes } from './animation';
/**
 * Implements a per-node reset.
 *
 * @param selections contains nodes to be reset
 * @param propsFn callback to determine per-node properties
 */
export function resetMotion(selectionsOrNodes, propsFn) {
    const { nodes, selections } = deconstructSelectionsOrNodes(selectionsOrNodes);
    for (const selection of selections) {
        for (const node of selection.nodes()) {
            const from = propsFn(node, node.datum);
            node.setProperties(from);
        }
        selection.cleanup();
    }
    for (const node of nodes) {
        const from = propsFn(node, node.datum);
        node.setProperties(from);
    }
}
//# sourceMappingURL=resetMotion.js.map