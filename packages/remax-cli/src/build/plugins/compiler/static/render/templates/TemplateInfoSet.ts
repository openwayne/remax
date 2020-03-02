export interface TemplateInfo {
  template: string;
  id: string;
  module: string;
  isEntry?: boolean;
}

/**
 * 存储 template 信息
 *
 */
export default class TemplateInfoSet {
  public values() {
    return this.templates;
  }

  public add(id: string, template: string, module: string, isEntry?: boolean) {
    this.templates.push({ template, module, id, isEntry });
  }

  public remove(module: string) {
    this.templates.filter(t => t.module !== module);
  }

  private templates: TemplateInfo[] = [];
}
