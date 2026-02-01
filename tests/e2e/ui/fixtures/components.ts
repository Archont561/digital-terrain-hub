import type { Page, Locator } from "@playwright/test";
import _ from "lodash";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export abstract class ComponentPageNavigator<TProps> {
  protected abstract readonly componentUrl: string;
  protected abstract readonly defaultProps: TProps;
  protected abstract readonly rootSelector: string;
  protected abstract readonly selectors: Record<string, string>;

  constructor(protected readonly page: Page) {}

  get root(): Locator {
    return this.page.locator(this.rootSelector).first();
  }

  $(selector: string): Locator {
    return this.root.locator(selector);
  }

  async goto(propsOverride?: DeepPartial<TProps>): Promise<void> {
    const props = this.getProps(propsOverride);

    const params = new URLSearchParams({
      props: encodeURIComponent(JSON.stringify(props)),
    });

    await this.page.goto(`${this.componentUrl}?${params}`, {
      waitUntil: "domcontentloaded",
    });
  }

  getProps(propsOverride?: DeepPartial<TProps>): TProps {
    if (!propsOverride) return this.defaultProps;
    return _.merge({}, this.defaultProps, propsOverride);
  }
}
