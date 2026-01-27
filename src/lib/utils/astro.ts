import {
  experimental_AstroContainer as AstroContainer,
  type ContainerRenderOptions,
} from "astro/container";
import type { ComponentProps } from "astro/types";

type AstroComponentFactory = Parameters<AstroContainer["renderToString"]>[0];

type ComponentContainerRenderOptions<T extends AstroComponentFactory> = Omit<
  ContainerRenderOptions,
  "props"
> & {
  // @ts-expect-error Astro typing mismatch
  props?: ComponentProps<T>;
};

async function withContainer<R>(
  fn: (container: AstroContainer) => Promise<R>,
): Promise<R> {
  const container = await AstroContainer.create();
  return fn(container);
}

export const renderComponent = {
  async asString<T extends AstroComponentFactory>(
    Component: T,
    options: ComponentContainerRenderOptions<T> = {},
  ): Promise<string> {
    return withContainer((container) =>
      container.renderToString(Component, options),
    );
  },

  async asResponse<T extends AstroComponentFactory>(
    Component: T,
    options: ComponentContainerRenderOptions<T> = {},
  ): Promise<Response> {
    return withContainer((container) =>
      container.renderToResponse(Component, options),
    );
  },
} as const;
