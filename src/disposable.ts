import type { SideEffectDisposer } from "./side-effect-manager";
import { invoke } from "./utils";

export type DisposableDisposer = () => any;

export class Disposable {
  /**
   * Add a disposer directly.
   * @param disposers a disposer or a list of disposers
   */
  public addDisposer(
    disposers: DisposableDisposer | DisposableDisposer[]
  ): void {
    if (Array.isArray(disposers)) {
      disposers.forEach(disposer => {
        this.disposers.add(disposer);
      });
    } else {
      this.disposers.add(disposers);
    }
  }

  /**
   * @alias addDisposer
   * Add a disposer directly.
   * @param disposer a disposer or a list of disposers
   */
  public push = this.addDisposer;

  /**
   * Add a side effect.
   * @param executor Executes side effect. Return a disposer or a list of disposers. Returns null or false to ignore.
   */
  public add(
    executor: () => DisposableDisposer | DisposableDisposer[] | null | false
  ): void {
    const disposers = executor();
    if (disposers) {
      this.push(disposers);
    }
  }

  /**
   * Sugar for addEventListener.
   * @param el
   * @param type
   * @param listener
   * @param options
   */
  public addEventListener<K extends keyof WindowEventMap>(
    el: Window,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): DisposableDisposer;
  public addEventListener<K extends keyof DocumentEventMap>(
    el: Document,
    type: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): DisposableDisposer;
  public addEventListener<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): DisposableDisposer;
  public addEventListener<K extends keyof MediaQueryListEventMap>(
    el: MediaQueryList,
    type: K,
    listener: (this: HTMLElement, ev: MediaQueryListEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): DisposableDisposer;
  public addEventListener(
    el: HTMLElement | Window | Document | MediaQueryList,
    type: string,
    listener: (this: HTMLElement | Window | Document, ev: Event) => unknown,
    options?: boolean | AddEventListenerOptions
  ): DisposableDisposer {
    el.addEventListener(type, listener, options);
    const disposer = () => el.removeEventListener(type, listener, options);
    this.push(disposer);
    return disposer;
  }

  /**
   * Sugar for setTimeout.
   * @param handler
   * @param timeout
   * @returns ticket
   */
  public setTimeout(handler: () => void, timeout: number): DisposableDisposer {
    const ticket = window.setTimeout(() => {
      this.remove(disposer);
      handler();
    }, timeout);
    const disposer = () => window.clearTimeout(ticket);
    this.push(disposer);
    return disposer;
  }

  /**
   * Sugar for setInterval.
   * @param handler
   * @param timeout
   * @returns ticket
   */
  public setInterval(handler: () => void, timeout: number): DisposableDisposer {
    const ticket = setInterval(handler, timeout);
    const disposer = () => clearInterval(ticket);
    this.push(disposer);
    return disposer;
  }

  /**
   * Remove but not run the disposer. Do nothing if not found.
   * @param disposer
   */
  public remove(disposer: DisposableDisposer): void {
    this.disposers.delete(disposer);
  }

  /**
   * Remove and run the disposer. Do nothing if not found.
   * @param disposer
   */
  public flush(disposer: DisposableDisposer): void {
    this.remove(disposer);
    disposer();
  }

  /**
   * Remove and run all of the disposers.
   */
  public flushAll(): void {
    this.disposers.forEach(invoke);
    this.disposers.clear();
  }

  /**
   * All disposers. Use this only when you know what you are doing.
   */
  public readonly disposers = new Set<SideEffectDisposer>();
}
