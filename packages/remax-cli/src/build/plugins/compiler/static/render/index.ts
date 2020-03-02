import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import { TEMPLATE_ID_ATTRIBUTE_NAME } from '../constants';
import { ENTRY_ATTRIBUTE_NAME } from '../constants';
import { createTemplate, templateInfoSet } from '../render/templates';
import * as helpers from '../helpers';

/**
 * 是否该记录这个 JSX 片段，用于生成模板
 *
 * @param {NodePath} path
 * @returns
 */
function shouldBeTemplate(path: NodePath<t.JSXElement>) {
  const parent = path.parent;

  // case:
  // 记录根节点
  // 父节点不为 JSXElement 或 JSXFragment，说明 path 为根节点
  if (!t.isJSXElement(parent) && !t.isJSXFragment(parent)) {
    return true;
  }

  // TODO: path 本身是一个 React 组件 或者 原生组件，也应该记录下来，
  // 可以将它的 children 静态化成模板做优化

  return false;
}

/**
 * 判断是否是入口 JSX 片段
 *
 * @param {t.JSXElement} node
 * @returns
 */
function isEntryPath(node: t.JSXElement) {
  return !!node.openingElement.attributes.find(
    attr => t.isJSXAttribute(attr) && attr.name.name === ENTRY_ATTRIBUTE_NAME
  );
}

let id = 0;

function generateID() {
  id += 1;
  return id.toString();
}

/**
 * 标记 template id
 * 在 react 虚拟 dom 上记录 template id，就可以在渲染时找到虚拟节点对应的模板
 *
 * @param {t.JSXOpeningElement} element
 * @returns
 */
function markTemplateID(element: t.JSXOpeningElement) {
  let templateID = helpers.getTemplateID(element);

  if (!templateID) {
    templateID = generateID();
    element.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier(TEMPLATE_ID_ATTRIBUTE_NAME),
        t.stringLiteral(templateID)
      )
    );
  }

  return templateID;
}

/**
 * 将 JSX 片段保存起来，用于生成静态化的原生模板
 *
 * @export
 * @returns
 */
export default function render() {
  return {
    pre(state: any) {
      templateInfoSet.remove(state.opts.filename);
    },
    visitor: {
      JSXElement: (path: NodePath<t.JSXElement>, state: any) => {
        if (!shouldBeTemplate(path)) {
          return;
        }

        const module = state.filename;
        const templateID = markTemplateID(path.node.openingElement);
        const template = createTemplate(path.node, path, module, ['node']);

        templateInfoSet.add(
          templateID,
          template,
          module,
          isEntryPath(path.node)
        );
      },
    },
  };
}
