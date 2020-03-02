import * as t from '@babel/types';
import * as helpers from '../../helpers';
import { NodePath } from '@babel/traverse';
import JSXElement from './JSXElement';
import JSXExpressionContainer from './JSXExpressionContainer';
import TemplateInfoSet from './TemplateInfoSet';

export const templateInfoSet = new TemplateInfoSet();

/**
 * 创建单个原生模板
 *
 * @param element
 * @param {NodePath} path
 * @param {string} module
 * @param {(Array<string | number>)} dataPath
 * @returns {string}
 */
export function createTemplate(
  element:
    | t.JSXElement
    | t.JSXText
    | t.JSXFragment
    | t.JSXExpressionContainer
    | t.JSXSpreadChild,
  path: NodePath<t.JSXElement>,
  module: string,
  dataPath: Array<string | number>
): string {
  if (t.isJSXElement(element)) {
    return JSXElement(element, path, dataPath, createTemplate);
  }

  if (t.isJSXExpressionContainer(element)) {
    return JSXExpressionContainer(element, dataPath);
  }

  if (t.isJSXText(element)) {
    return `{{'${helpers.normalizeLiteral(element.value)}'}}`;
  }

  // case: JSXFragment
  // JSXFragment 已经都被预处理成 block 标签，所以不存在

  // case: JSXSpreadChild
  // 未知使用场景

  return '';
}
