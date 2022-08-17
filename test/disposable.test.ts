import { Disposable } from "../src";

describe("add", () => {
  it("should add a side effect", () => {
    const disposable = new Disposable();
    const executer = jest.fn();
    const disposer = jest.fn();

    disposable.add(() => {
      executer("execute");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute");
    expect(disposer).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);
  });

  it("should add two side effects", () => {
    const disposable = new Disposable();
    const executer = jest.fn();

    const disposer1 = jest.fn();

    disposable.add(() => {
      executer("execute1");
      return disposer1;
    });

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute1");
    expect(disposer1).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);

    const disposer2 = jest.fn();

    disposable.add(() => {
      executer("execute2");
      return disposer2;
    });

    expect(executer).toBeCalledTimes(2);
    expect(executer).lastCalledWith("execute2");
    expect(disposer2).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(2);
  });

  it("should ignore disposer if executor returns null or false", () => {
    const disposable = new Disposable();

    disposable.add(() => {
      return null;
    });

    disposable.add(() => {
      return false;
    });

    expect(disposable.disposers.size).toBe(0);
  });

  it("should return disposerID when adding a side effect", () => {
    const disposable = new Disposable();
    const disposer = jest.fn();

    disposable.add(() => {
      return disposer;
    });

    expect(disposer).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);
    expect(disposable.disposers.has(disposer)).toBeTruthy();
  });

  it("should accept a list of disposes returned from executor", () => {
    const disposable = new Disposable();
    const executer = jest.fn();
    const disposer1 = jest.fn();
    const disposer2 = jest.fn();

    disposable.add(() => {
      executer("execute1");
      return [disposer1, disposer2];
    });

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute1");
    expect(disposer1).toBeCalledTimes(0);
    expect(disposer2).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(2);

    disposable.add(() => {
      executer("execute2");
      return [disposer1, disposer2];
    });

    expect(executer).toBeCalledTimes(2);
    expect(executer).lastCalledWith("execute2");
    expect(disposer1).toBeCalledTimes(0);
    expect(disposer2).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(2);
  });
});

describe("push", () => {
  it("should add a disposer", () => {
    const disposable = new Disposable();
    const disposer = jest.fn();

    disposable.push(disposer);

    expect(disposer).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);
  });

  it("should add a list of disposers", () => {
    const disposable = new Disposable();
    const disposers = Array.from({ length: 5 }).map(() => jest.fn());

    disposable.push(disposers);

    disposers.forEach(disposer => {
      expect(disposer).toBeCalledTimes(0);
    });
    expect(disposable.disposers.size).toBe(5);
  });

  it("should add two disposers", () => {
    const disposable = new Disposable();
    const disposer1 = jest.fn();
    const disposer2 = jest.fn();

    disposable.push(disposer1);

    expect(disposer1).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);

    disposable.push(disposer2);

    expect(disposer2).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(2);
  });
});

describe("remove", () => {
  it("should remove a side effect", () => {
    const disposable = new Disposable();
    const executer = jest.fn();
    const disposer = jest.fn();

    disposable.add(() => {
      executer("execute");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);

    disposable.remove(disposer);

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(disposable.disposers.size).toBe(0);
  });
});

describe("flushAll", () => {
  it("should flush all side effects", () => {
    const disposable = new Disposable();
    const executer = jest.fn();
    const disposers: Array<jest.Mock<any, any>> = [];
    const count = 100;

    for (let i = 0; i < count; i++) {
      disposable.add(() => {
        executer("execute");
        const disposer = jest.fn();
        disposers.push(disposer);
        return disposer;
      });
    }

    expect(executer).toBeCalledTimes(100);
    expect(disposers).toHaveLength(count);
    for (const disposer of disposers) {
      expect(disposer).toBeCalledTimes(0);
    }
    expect(disposable.disposers.size).toBe(count);

    disposable.flushAll();
    expect(disposable.disposers.size).toBe(0);

    disposable.flushAll();
    expect(disposable.disposers.size).toBe(0);
  });

  it("should catch error in disposer", () => {
    const disposable = new Disposable();
    const spy = jest.spyOn(window.console, "error").mockImplementation();
    const error1 = new Error();
    const error2 = new Error();

    disposable.add(() => {
      return () => {
        throw error1;
      };
    });

    disposable.add(() => {
      return () => {
        throw error2;
      };
    });

    expect(window.console.error).toBeCalledTimes(0);

    disposable.flushAll();

    expect(window.console.error).toBeCalledTimes(2);
    expect(window.console.error).toBeCalledWith(error1);
    expect(window.console.error).toBeCalledWith(error2);

    spy.mockRestore();
  });
});

describe("addEventListener", () => {
  it("should addEventListener", () => {
    const disposable = new Disposable();
    const handler = jest.fn();
    const el = document.createElement("div");
    const disposer = disposable.addEventListener(el, "click", handler);

    expect(handler).toHaveBeenCalledTimes(0);

    el.dispatchEvent(new Event("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    disposable.flush(disposer);

    expect(disposable.disposers.size).toBe(0);

    el.dispatchEvent(new Event("click"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not trigger flushed event listener", () => {
    const disposable = new Disposable();
    const handler = jest.fn();
    const el = document.createElement("div");
    const disposer = disposable.addEventListener(el, "click", handler);

    expect(handler).toHaveBeenCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);

    disposable.flush(disposer);

    el.dispatchEvent(new Event("click"));
    expect(handler).toHaveBeenCalledTimes(0);
    expect(disposable.disposers.size).toBe(0);
  });
});

describe("setTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should setTimeout", () => {
    const disposable = new Disposable();
    const handler = jest.fn();

    expect(jest.getTimerCount()).toBe(0);

    const disposer = disposable.setTimeout(handler, 1000);

    expect(jest.getTimerCount()).toBe(1);
    expect(typeof disposer).toBe("function");
    expect(handler).toHaveBeenCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);

    jest.runAllTimers();

    expect(jest.getTimerCount()).toBe(0);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(disposable.disposers.size).toBe(0);
  });

  it("should not trigger flushed timeout", () => {
    const disposable = new Disposable();
    const handler = jest.fn();

    expect(jest.getTimerCount()).toBe(0);

    const disposer = disposable.setTimeout(handler, 1000);

    expect(jest.getTimerCount()).toBe(1);
    expect(handler).toHaveBeenCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);

    disposable.flush(disposer);

    jest.runAllTimers();

    expect(jest.getTimerCount()).toBe(0);
    expect(handler).toHaveBeenCalledTimes(0);
    expect(disposable.disposers.size).toBe(0);
  });
});

describe("setInterval", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should setInterval", () => {
    const disposable = new Disposable();
    const handler = jest.fn();

    expect(jest.getTimerCount()).toBe(0);

    const disposer = disposable.setInterval(handler, 1000);

    expect(jest.getTimerCount()).toBe(1);
    expect(typeof disposer).toBe("function");
    expect(handler).toHaveBeenCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);

    jest.runOnlyPendingTimers();

    expect(jest.getTimerCount()).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(disposable.disposers.size).toBe(1);

    jest.runOnlyPendingTimers();

    expect(jest.getTimerCount()).toBe(1);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(disposable.disposers.size).toBe(1);

    disposable.flush(disposer);

    expect(jest.getTimerCount()).toBe(0);

    jest.runOnlyPendingTimers();

    expect(handler).toHaveBeenCalledTimes(2);
    expect(disposable.disposers.size).toBe(0);
  });

  it("should not trigger flushed interval", () => {
    const disposable = new Disposable();
    const handler = jest.fn();

    expect(jest.getTimerCount()).toBe(0);

    const disposer = disposable.setInterval(handler, 1000);

    expect(jest.getTimerCount()).toBe(1);
    expect(typeof disposer).toBe("function");
    expect(handler).toHaveBeenCalledTimes(0);
    expect(disposable.disposers.size).toBe(1);

    disposable.flush(disposer);

    jest.runAllTimers();

    expect(jest.getTimerCount()).toBe(0);
    expect(handler).toHaveBeenCalledTimes(0);
    expect(disposable.disposers.size).toBe(0);
  });
});
