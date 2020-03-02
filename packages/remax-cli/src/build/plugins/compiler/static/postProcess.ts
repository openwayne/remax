import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

/**
 * 在生成模板后，对 jsx 再处理
 * 用于帮助简化 React 生成 虚拟 dom
 *
 * @export
 * @returns
 */
export default function postProcess() {
  return {
    visitor: {
      // 将所有静态的属性都删除
      JSXAttribute: (path: NodePath<t.JSXAttribute>) => {
        const { node } = path;

        // case: Null
        if (node.value === null) {
          path.remove();
        }

        // case: Literal 属性
        if (t.isLiteral(node.value)) {
          path.remove();
        }

        // case: 表达式
        if (t.isJSXExpressionContainer(node.value)) {
          // 同 Literal
          if (t.isLiteral(node.value.expression)) {
            path.remove();
          }
        }
      },
    },
  };
}
