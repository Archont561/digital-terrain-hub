import type { Page } from "@playwright/test";
import _ from "lodash";
import type { ActionContextManager } from "./action";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface ComponentConfig<TProps> {
  page: Page;
  settings: {
    componentUrl: string;
    defaultProps: TProps;
  },
}

export abstract class ComponentPageNavigator<TProps> {
  constructor(protected config: ComponentConfig<TProps>) {}

  async goto(propsOverride?: DeepPartial<TProps>): Promise<void> {
    const props = this.getProps(propsOverride);
    const params = new URLSearchParams({
      props: encodeURIComponent(JSON.stringify(props)),
    });

    await this.config.page.goto(`${this.config.settings.componentUrl}?${params}`, {
      waitUntil: "domcontentloaded",
    });
  }

  /**
   * Merge default props with overrides
   */
  getProps(propsOverride?: DeepPartial<TProps>): TProps {
    if (!propsOverride) return this.config.settings.defaultProps;
    return _.merge({}, this.config.settings.defaultProps, propsOverride);
  }
}