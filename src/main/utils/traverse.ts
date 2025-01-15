/**
 * 遍历Figma节点的工具函数
 * @param node Figma节点
 * @param callback 处理节点的回调函数
 */
export async function traverseNode(
    node: SceneNode,
    callback: (node: SceneNode) => Promise<void>
): Promise<void> {
    // 处理当前节点
    await callback(node);

    // 如果节点有子节点，递归处理
    if ('children' in node) {
        for (const child of node.children) {
            await traverseNode(child, callback);
        }
    }
} 