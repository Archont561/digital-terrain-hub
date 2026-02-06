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

  private static isRegistered = false;

  static register(Alpine: any, name: string, afterRegister?: () => void) {
    if (!AlpineController.isRegistered) {
      Alpine.data(name, (props: any) => new (AlpineController as any)(props));
      AlpineController.isRegistered = true;
      afterRegister?.();
    }
  }
}
