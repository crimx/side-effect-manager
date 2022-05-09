import { genUID } from "./gen-uid";

export type SideEffectDisposer = () => void;

export class SideEffectManager {
  /**
   * Add a disposer directly.
   * @param disposer a disposer
   * @param disposerID Optional id for the disposer
   * @returns disposerID
   */
  public addDisposer(
    disposer: SideEffectDisposer,
    disposerID: string = genUID()
  ): string {
    this.flush(disposerID);
    this.disposers.set(disposerID, disposer);
    return disposerID;
  }

  /**
   * Add a side effect.
   * @param executor execute side effect
   * @param disposerID Optional id for the disposer
   * @returns disposerID
   */
  public add(
    executor: () => SideEffectDisposer,
    disposerID: string = genUID()
  ): string {
    return this.addDisposer(executor(), disposerID);
  }

  /**
   * Sugar for addEventListener.
   * @param el
   * @param type
   * @param listener
   * @param options
   * @param disposerID Optional id for the disposer
   * @returns disposerID
   */
  public addEventListener<K extends keyof WindowEventMap>(
    el: Window,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
    disposerID?: string
  ): string;
  public addEventListener<K extends keyof DocumentEventMap>(
    el: Document,
    type: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
    disposerID?: string
  ): string;
  public addEventListener<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
    disposerID?: string
  ): string;
  public addEventListener<K extends keyof MediaQueryListEventMap>(
    el: MediaQueryList,
    type: K,
    listener: (this: HTMLElement, ev: MediaQueryListEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
    disposerID?: string
  ): string;
  public addEventListener(
    el: HTMLElement | Window | Document | MediaQueryList,
    type: string,
    listener: (this: HTMLElement | Window | Document, ev: Event) => unknown,
    options?: boolean | AddEventListenerOptions,
    disposerID = genUID()
  ): string {
    el.addEventListener(type, listener, options);
    this.addDisposer(
      () => el.removeEventListener(type, listener, options),
      disposerID
    );
    return disposerID;
  }

  /**
   * Sugar for setTimeout.
   * @param handler
   * @param timeout
   * @param disposerID Optional id for the disposer
   * @returns disposerID
   */
  public setTimeout(
    handler: () => void,
    timeout: number,
    disposerID: string = genUID()
  ): string {
    const ticket = window.setTimeout(() => {
      this.remove(disposerID);
      handler();
    }, timeout);
    return this.addDisposer(() => window.clearTimeout(ticket), disposerID);
  }

  /**
   * Sugar for setInterval.
   * @param handler
   * @param timeout
   * @param disposerID Optional id for the disposer
   * @returns disposerID
   */
  public setInterval(
    handler: () => void,
    timeout: number,
    disposerID: string = genUID()
  ): string {
    const ticket = window.setInterval(handler, timeout);
    return this.addDisposer(() => window.clearInterval(ticket), disposerID);
  }

  /**
   * Remove but not run the disposer. Do nothing if not found.
   * @param disposerID
   */
  public remove(disposerID: string): SideEffectDisposer | undefined {
    const disposer = this.disposers.get(disposerID);
    this.disposers.delete(disposerID);
    return disposer;
  }

  /**
   * Remove and run the disposer. Do nothing if not found.
   * @param disposerID
   */
  public flush(disposerID: string): void {
    const disposer = this.remove(disposerID);
    if (disposer) {
      try {
        disposer();
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * Remove and run all of the disposers.
   */
  public flushAll(): void {
    this.disposers.forEach(disposer => {
      try {
        disposer();
      } catch (e) {
        console.error(e);
      }
    });
    this.disposers.clear();
  }

  /**
   * All disposers. Use this only when you know what you are doing.
   */
  public readonly disposers = new Map<string, SideEffectDisposer>();
}
