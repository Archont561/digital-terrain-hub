import type { Magics } from "alpinejs";

type AlpineRefs = Record<string, HTMLElement>;

type AlpineContext<T, Refs extends AlpineRefs = AlpineRefs> = Omit<
  Magics<T>,
  "$refs"
> & {
  $refs: Refs;
};

export abstract class AlpineController<
  T,
  Refs extends AlpineRefs = AlpineRefs,
> {
  protected ctx!: AlpineContext<T, Refs>;

  protected onInit?(): void;

  init() {
    this.ctx = this as any as AlpineContext<T, Refs>;
    this.onInit?.();
  }

  private static registeredControllers = new Set<string>();

  static register<T, Refs extends AlpineRefs = AlpineRefs>(
    this: new (...args: any[]) => AlpineController<T, Refs>,
    Alpine: any,
    name: string,
    afterRegister?: () => void
  ) {
    // Check if THIS specific controller is already registered
    if (AlpineController.registeredControllers.has(name)) {
      return;
    }

    const Ctor = this; // `this` is GCPEditorManager, not AlpineController

    //@ts-ignore
    Alpine.data(name, (...args: any[]) => new Ctor(...args));

    AlpineController.registeredControllers.add(name);
    afterRegister?.();
  }
}
