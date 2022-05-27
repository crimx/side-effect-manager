import { genUID } from "./gen-uid";

export type AsyncSideEffectDisposer = () => Promise<void> | void;

export type AsyncSideEffectExecutor = () =>
  | Promise<AsyncSideEffectDisposer>
  | AsyncSideEffectDisposer;

export class AsyncSideEffectManager {
  /**
   * Add a side effect.
   * @param executor execute side effect
   * @param disposerID Optional id for the disposer
   * @returns disposerID
   */
  public add(
    executor: AsyncSideEffectExecutor,
    disposerID: string = this.genUID()
  ): string {
    if (this._isRunning.has(disposerID)) {
      this._nextTask.set(disposerID, () => this._add(executor, disposerID));
    } else {
      this._add(executor, disposerID);
    }
    return disposerID;
  }

  private async _add(
    executor: AsyncSideEffectExecutor,
    disposerID: string
  ): Promise<void> {
    this._startTask(disposerID);

    const disposer = this.remove(disposerID);
    if (disposer) {
      try {
        await disposer();
      } catch (e) {
        console.error(e);
      }
    }

    try {
      this.disposers.set(disposerID, await executor());
    } catch (e) {
      console.error(e);
    }

    this._endTask(disposerID);

    const task = this._nextTask.get(disposerID);
    if (task) {
      this._nextTask.delete(disposerID);
      task();
    }
  }

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
    if (this._isRunning.has(disposerID)) {
      this._nextTask.set(disposerID, () => this._flush(disposerID));
    } else {
      this._flush(disposerID);
    }
  }

  private async _flush(disposerID: string): Promise<void> {
    const disposer = this.remove(disposerID);
    if (disposer) {
      this._startTask(disposerID);
      try {
        await disposer();
      } catch (e) {
        console.error(e);
      }
      this._endTask(disposerID);
    }

    const task = this._nextTask.get(disposerID);
    if (task) {
      this._nextTask.delete(disposerID);
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
  private _resolveFinished?: () => void;

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

  private readonly _nextTask = new Map<string, () => any>();
  private readonly _isRunning = new Set<string>();

  private _startTask(disposerID: string): void {
    this._isRunning.add(disposerID);
    if (!this._resolveFinished) {
      this.finished = new Promise(resolve => {
        this._resolveFinished = resolve;
      });
    }
  }

  private _endTask(disposerID: string): void {
    this._isRunning.delete(disposerID);
    if (
      this._resolveFinished &&
      this._isRunning.size <= 0 &&
      this._nextTask.size <= 0
    ) {
      this._resolveFinished();
      this._resolveFinished = undefined;
    }
  }
}
