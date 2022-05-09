import { SideEffectManager } from "../src";

describe("add", () => {
  it("should add a side effect", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute");
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);
  });

  it("should add two side effects", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    sideEffect.add(() => {
      executer("execute1");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute1");
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.add(() => {
      executer("execute2");
      return disposer;
    });

    expect(executer).toBeCalledTimes(2);
    expect(executer).lastCalledWith("execute2");
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(2);
  });

  it("should return disposerID when adding a side effect", () => {
    const sideEffect = new SideEffectManager();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      return disposer;
    });

    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);
    expect(sideEffect.disposers.get(disposerID)).toBe(disposer);
  });

  it("should flush effect with same id when adding a side effect", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute1");
      return () => disposer("dispose1");
    });

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute1");
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    executer.mockReset();
    disposer.mockReset();

    const disposerID2 = sideEffect.add(() => {
      executer("execute2");
      return () => disposer("dispose2");
    }, disposerID);

    expect(disposerID2).toBe(disposerID);
    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute2");
    expect(disposer).toBeCalledTimes(1);
    expect(disposer).lastCalledWith("dispose1");
    expect(sideEffect.disposers.size).toBe(1);
  });
});

describe("addDisposer", () => {
  it("should add a disposer", () => {
    const sideEffect = new SideEffectManager();
    const disposer = jest.fn();

    sideEffect.addDisposer(disposer);

    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);
  });

  it("should add two disposers", () => {
    const sideEffect = new SideEffectManager();
    const disposer1 = jest.fn();
    const disposer2 = jest.fn();

    sideEffect.addDisposer(disposer1);

    expect(disposer1).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.addDisposer(disposer2);

    expect(disposer2).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(2);
  });

  it("should return disposerID when adding a disposer", () => {
    const sideEffect = new SideEffectManager();
    const disposer = jest.fn();

    const disposerID = sideEffect.addDisposer(disposer);

    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);
    expect(sideEffect.disposers.get(disposerID)).toBe(disposer);
  });

  it("should flush effect with same id when adding a disposer", () => {
    const sideEffect = new SideEffectManager();
    const disposer = jest.fn();

    const disposerID = sideEffect.addDisposer(() => disposer("dispose1"));

    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    disposer.mockReset();

    const disposerID2 = sideEffect.addDisposer(
      () => disposer("dispose2"),
      disposerID
    );

    expect(disposerID2).toBe(disposerID);
    expect(disposer).toBeCalledTimes(1);
    expect(disposer).lastCalledWith("dispose1");
    expect(sideEffect.disposers.size).toBe(1);
  });
});

describe("remove", () => {
  it("should remove a side effect", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.remove(disposerID);

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should be able to call remove on a removed disposerID", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.remove(disposerID);

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(0);

    sideEffect.remove(disposerID);

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should remove two side effects", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID1 = sideEffect.add(() => {
      executer("execute1");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(executer).lastCalledWith("execute1");
    expect(sideEffect.disposers.size).toBe(1);

    const disposerID2 = sideEffect.add(() => {
      executer("execute2");
      return disposer;
    });

    expect(executer).toBeCalledTimes(2);
    expect(disposer).toBeCalledTimes(0);
    expect(executer).lastCalledWith("execute2");
    expect(sideEffect.disposers.size).toBe(2);

    sideEffect.remove(disposerID1);

    expect(executer).toBeCalledTimes(2);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.remove(disposerID2);

    expect(executer).toBeCalledTimes(2);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should return disposer", () => {
    const sideEffect = new SideEffectManager();
    const spy = jest.fn();

    const disposerID = sideEffect.add(() => {
      return spy;
    });

    const disposer = sideEffect.remove(disposerID);

    expect(disposer).toBe(spy);

    const none = sideEffect.remove(disposerID);

    expect(none).toBeUndefined();
  });
});

describe("flush", () => {
  it("should flush a side effect", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposerID);

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(1);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should be able to call flush on a flushed disposerID", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposerID);

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(1);
    expect(sideEffect.disposers.size).toBe(0);

    sideEffect.flush(disposerID);

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(1);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should flush two side effects", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID1 = sideEffect.add(() => {
      executer("execute1");
      return disposer;
    });

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(executer).lastCalledWith("execute1");
    expect(sideEffect.disposers.size).toBe(1);

    const disposerID2 = sideEffect.add(() => {
      executer("execute2");
      return disposer;
    });

    expect(executer).toBeCalledTimes(2);
    expect(disposer).toBeCalledTimes(0);
    expect(executer).lastCalledWith("execute2");
    expect(sideEffect.disposers.size).toBe(2);

    sideEffect.flush(disposerID1);

    expect(executer).toBeCalledTimes(2);
    expect(disposer).toBeCalledTimes(1);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposerID2);

    expect(executer).toBeCalledTimes(2);
    expect(disposer).toBeCalledTimes(2);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should catch error in disposer", () => {
    const sideEffect = new SideEffectManager();
    const spy = jest.spyOn(window.console, "error").mockImplementation();
    const error = new Error();

    const disposerID = sideEffect.add(() => {
      return () => {
        throw error;
      };
    });

    expect(window.console.error).toBeCalledTimes(0);

    sideEffect.flush(disposerID);

    expect(window.console.error).toBeCalledTimes(1);
    expect(window.console.error).toBeCalledWith(error);

    spy.mockRestore();
  });
});

describe("flushAll", () => {
  it("should flush all side effects", () => {
    const sideEffect = new SideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();
    const count = 100;

    for (let i = 0; i < count; i++) {
      sideEffect.add(() => {
        executer("execute");
        return disposer;
      });
    }

    expect(executer).toBeCalledTimes(100);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(count);

    sideEffect.flushAll();
    expect(sideEffect.disposers.size).toBe(0);

    sideEffect.flushAll();
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should catch error in disposer", () => {
    const sideEffect = new SideEffectManager();
    const spy = jest.spyOn(window.console, "error").mockImplementation();
    const error1 = new Error();
    const error2 = new Error();

    sideEffect.add(() => {
      return () => {
        throw error1;
      };
    });

    sideEffect.add(() => {
      return () => {
        throw error2;
      };
    });

    expect(window.console.error).toBeCalledTimes(0);

    sideEffect.flushAll();

    expect(window.console.error).toBeCalledTimes(2);
    expect(window.console.error).toBeCalledWith(error1);
    expect(window.console.error).toBeCalledWith(error2);

    spy.mockRestore();
  });
});

describe("addEventListener", () => {
  it("should addEventListener", () => {
    const sideEffect = new SideEffectManager();
    const handler = jest.fn();
    const el = document.createElement("div");
    const disposerID = sideEffect.addEventListener(el, "click", handler);

    expect(typeof disposerID).toBe("string");
    expect(handler).toHaveBeenCalledTimes(0);

    el.dispatchEvent(new Event("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    sideEffect.flush(disposerID);

    expect(sideEffect.disposers.size).toBe(0);

    el.dispatchEvent(new Event("click"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not trigger flushed event listener", () => {
    const sideEffect = new SideEffectManager();
    const handler = jest.fn();
    const el = document.createElement("div");
    const disposerID = sideEffect.addEventListener(el, "click", handler);

    expect(typeof disposerID).toBe("string");
    expect(handler).toHaveBeenCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposerID);

    el.dispatchEvent(new Event("click"));
    expect(handler).toHaveBeenCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(0);
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
    const sideEffect = new SideEffectManager();
    const handler = jest.fn();

    expect(jest.getTimerCount()).toBe(0);

    const disposerID = sideEffect.setTimeout(handler, 1000);

    expect(jest.getTimerCount()).toBe(1);
    expect(typeof disposerID).toBe("string");
    expect(handler).toHaveBeenCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    jest.runAllTimers();

    expect(jest.getTimerCount()).toBe(0);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should not trigger flushed timeout", () => {
    const sideEffect = new SideEffectManager();
    const handler = jest.fn();

    expect(jest.getTimerCount()).toBe(0);

    const disposerID = sideEffect.setTimeout(handler, 1000);

    expect(jest.getTimerCount()).toBe(1);
    expect(typeof disposerID).toBe("string");
    expect(handler).toHaveBeenCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposerID);

    jest.runAllTimers();

    expect(jest.getTimerCount()).toBe(0);
    expect(handler).toHaveBeenCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(0);
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
    const sideEffect = new SideEffectManager();
    const handler = jest.fn();

    expect(jest.getTimerCount()).toBe(0);

    const disposerID = sideEffect.setInterval(handler, 1000);

    expect(jest.getTimerCount()).toBe(1);
    expect(typeof disposerID).toBe("string");
    expect(handler).toHaveBeenCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    jest.runOnlyPendingTimers();

    expect(jest.getTimerCount()).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(sideEffect.disposers.size).toBe(1);

    jest.runOnlyPendingTimers();

    expect(jest.getTimerCount()).toBe(1);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposerID);

    expect(jest.getTimerCount()).toBe(0);

    jest.runOnlyPendingTimers();

    expect(handler).toHaveBeenCalledTimes(2);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should not trigger flushed interval", () => {
    const sideEffect = new SideEffectManager();
    const handler = jest.fn();

    expect(jest.getTimerCount()).toBe(0);

    const disposerID = sideEffect.setInterval(handler, 1000);

    expect(jest.getTimerCount()).toBe(1);
    expect(typeof disposerID).toBe("string");
    expect(handler).toHaveBeenCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposerID);

    jest.runAllTimers();

    expect(jest.getTimerCount()).toBe(0);
    expect(handler).toHaveBeenCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(0);
  });
});
