import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import * as helpers from './helpers';
import { VOID_BLOCK, TEMPLATE_ID } from './constants';

function shouldRemoveAttribute(
  attribute: t.JSXAttribute | t.JSXSpreadAttribute
) {
  if (t.isJSXSpreadAttribute(attribute)) {
    return false;
  }

  const attrName = attribute.name.name;

  // TEMPLATE_ID 不能删
  if (attrName === TEMPLATE_ID) {
    return false;
  }

  // case: Null
  if (attribute.value === null) {
    return true;
  }

  // case: Literal 属性
  if (t.isLiteral(attribute.value)) {
    return true;
  }

  // case: 表达式
  if (t.isJSXExpressionContainer(attribute.value)) {
    // 同 Literal
    if (t.isLiteral(attribute.value.expression)) {
      return true;
    }
  }
}

/**
 * 判断是否是一个可以置空的元素
 *
 * @param {t.JSXElement} node
 * @returns
 */
function isVoidElement(node: t.JSXElement) {
  if ((node.openingElement.name as any)?.name === VOID_BLOCK) {
    return true;
  }

  const attributes = node.openingElement.attributes;
  const isSelfVoid = attributes.every(shouldRemoveAttribute);
  const isChildrenVoid = node.children.every(c => {
    if (t.isJSXElement(c)) {
      return isVoidElement(c);
    }

    if (t.isJSXText(c)) {
      return true;
    }

    // case: JSXExpressionContainer，还没被删除的表达式都是不能静态化的
    // case: JSXSpreadChild
    // case: JSXFragment，JSXFragment 已经被替换掉了

    return false;
  });

  return isSelfVoid && isChildrenVoid;
}

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
        if (shouldRemoveAttribute(path.node)) {
          path.remove();
        }
      },
      JSXElement: (path: NodePath<t.JSXElement>) => {
        const node = path.node;

        if ((node.openingElement.name as any)?.name === VOID_BLOCK) {
          return;
        }

        if (isVoidElement(node)) {
          helpers.replacedWithVoidBlock(node, path);
        }
      },
      JSXExpressionContainer: (path: NodePath<t.JSXExpressionContainer>) => {
        const node = path.node;

        if (t.isLiteral(node.expression)) {
          path.remove();
        }
      },
    },
  };
}
