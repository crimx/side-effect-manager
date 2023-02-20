import { genUID } from "./gen-uid";
import { invoke } from "./utils";

export type AsyncSideEffectDisposer = () => Promise<any> | any;

export type AsyncSideEffectExecutor = () =>
  | Promise<AsyncSideEffectDisposer | AsyncSideEffectDisposer[] | null | false>
  | AsyncSideEffectDisposer
  | AsyncSideEffectDisposer[]
  | null
  | false;

export class AsyncSideEffectManager {
  /**
   * Add a side effect.
   * @param executor Execute side effect. Return a disposer or a disposer array. Return null or false to ignore.
   * @param disposerID Optional id for the disposer
   * @returns disposerID
   */
  public add(
    executor: AsyncSideEffectExecutor,
    disposerID: string = this.genUID()
  ): string {
    if (this._isRunning_.has(disposerID)) {
      this._nextTask_.set(disposerID, () => this._add_(executor, disposerID));
    } else {
      this._add_(executor, disposerID);
    }
    return disposerID;
  }

  private async _add_(
    executor: AsyncSideEffectExecutor,
    disposerID: string
  ): Promise<void> {
    this._startTask_(disposerID);

    const disposer = this.remove(disposerID);
    if (disposer) {
      try {
        await disposer();
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const disposers = await executor();
      if (disposers) {
        this.disposers.set(
          disposerID,
          Array.isArray(disposers) ? joinAsyncDisposers(disposers) : disposers
        );
      }
    } catch (e) {
      console.error(e);
    }

    this._endTask_(disposerID);

    const task = this._nextTask_.get(disposerID);
    if (task) {
      this._nextTask_.delete(disposerID);
      task();
    }
  }

  /**
   * Add a disposer directly.
   * @param disposer a disposer
   * @param disposerID Optional id for the disposer
   * @returns disposerID
   */
  public addDisposer(
    disposer: AsyncSideEffectDisposer | AsyncSideEffectDisposer[],
    disposerID: string = this.genUID()
  ): string {
    return this.add(() => disposer, disposerID);
  }

  /**
   * @alias addDisposer
   * Add a disposer directly.
   * @param disposer a disposer
   * @param disposerID Optional id for the disposer
   * @returns disposerID
   */
  public push = this.addDisposer;

  /**
   * Remove but not run the disposer. Do nothing if not found.
   * @param disposerID
   */
  public remove(disposerID: string): AsyncSideEffectDisposer | undefined {
    const disposer = this.disposers.get(disposerID);
    this.disposers.delete(disposerID);
    return disposer;
  }

  /**
   * Remove and run the disposer. Do nothing if not found.
   * @param disposerID
   */
  public flush(disposerID: string): void {
    if (this._isRunning_.has(disposerID)) {
      this._nextTask_.set(disposerID, () => this._flush_(disposerID));
    } else {
      this._flush_(disposerID);
    }
  }

  private async _flush_(disposerID: string): Promise<void> {
    const disposer = this.remove(disposerID);
    if (disposer) {
      this._startTask_(disposerID);
      try {
        await disposer();
      } catch (e) {
        console.error(e);
      }
      this._endTask_(disposerID);
    }

    const task = this._nextTask_.get(disposerID);
    if (task) {
      this._nextTask_.delete(disposerID);
      task();
    }
  }

  /**
   * Remove and run all of the disposers.
   */
  public flushAll(): void {
    this.disposers.forEach((_, disposerID) => this.flush(disposerID));
  }

  /**
   * @returns a Promise resolved when current tasks are finished.
   */
  public finished: Promise<void> = Promise.resolve();
  private _resolveFinished_?: () => void;

  /**
   * All disposers. Use this only when you know what you are doing.
   */
  public readonly disposers = new Map<string, AsyncSideEffectDisposer>();

  public genUID(): string {
    let uid: string;
    do {
      uid = genUID();
    } while (this.disposers.has(uid));
    return uid;
  }

  private readonly _nextTask_ = new Map<string, () => any>();
  private readonly _isRunning_ = new Set<string>();

  private _startTask_(disposerID: string): void {
    this._isRunning_.add(disposerID);
    if (!this._resolveFinished_) {
      this.finished = new Promise(resolve => {
        this._resolveFinished_ = resolve;
      });
    }
  }

  private _endTask_(disposerID: string): void {
    this._isRunning_.delete(disposerID);
    if (
      this._resolveFinished_ &&
      this._isRunning_.size <= 0 &&
      this._nextTask_.size <= 0
    ) {
      this._resolveFinished_();
      this._resolveFinished_ = undefined;
    }
  }
}

/**
 * Join multiple disposers into on disposer and wait until all disposers are resolved.
 */
export function joinAsyncDisposers(
  disposers: AsyncSideEffectDisposer[]
): AsyncSideEffectDisposer {
  return () => Promise.all(disposers.map(invoke));
}
