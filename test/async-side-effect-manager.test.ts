import { AsyncSideEffectManager } from "../src";

describe("add", () => {
  it("should add a side effect", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute");
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);
  });

  it("should add two side effects", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    sideEffect.add(() => {
      executer("execute1");
      return disposer;
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute1");
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.add(() => {
      executer("execute2");
      return disposer;
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(2);
    expect(executer).lastCalledWith("execute2");
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(2);
  });

  it("should ignore disposer if executor returns null or false", async () => {
    const sideEffect = new AsyncSideEffectManager();

    const disposerID1 = sideEffect.add(() => {
      return null;
    });

    const disposerID2 = sideEffect.add(() => {
      return false;
    });

    await sideEffect.finished;

    expect(sideEffect.disposers.size).toBe(0);
    expect(sideEffect.disposers.get(disposerID1)).toBe(undefined);
    expect(sideEffect.disposers.get(disposerID2)).toBe(undefined);
  });

  it("should return disposerID when adding a side effect", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      return disposer;
    });

    await sideEffect.finished;

    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);
    expect(sideEffect.disposers.get(disposerID)).toBe(disposer);
  });

  it("should flush effect with same id when adding a side effect", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute1");
      return () => disposer("dispose1");
    });

    await sideEffect.finished;

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

    await sideEffect.finished;

    expect(disposerID2).toBe(disposerID);
    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute2");
    expect(disposer).toBeCalledTimes(1);
    expect(disposer).lastCalledWith("dispose1");
    expect(sideEffect.disposers.size).toBe(1);
  });

  it("should wait and flush previous effect when adding", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposeID = sideEffect.add(async () => {
      executer("execute1");
      return async () => disposer("dispose1");
    });

    sideEffect.add(async () => {
      executer("execute2");
      return async () => disposer("dispose2");
    }, disposeID);

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(2);
    expect(executer).lastCalledWith("execute2");
    expect(disposer).toBeCalledTimes(1);
    expect(disposer).lastCalledWith("dispose1");
    expect(sideEffect.disposers.size).toBe(1);
  });

  it("should wait and flush previous effect when flushing", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposeID = sideEffect.add(async () => {
      executer("execute1");
      return async () => disposer("dispose1");
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute1");
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposeID);

    sideEffect.add(async () => {
      executer("execute2");
      return async () => disposer("dispose2");
    }, disposeID);

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(2);
    expect(executer).lastCalledWith("execute2");
    expect(disposer).toBeCalledTimes(1);
    expect(disposer).lastCalledWith("dispose1");
    expect(sideEffect.disposers.size).toBe(1);
  });

  it("should catch error in executor", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const spy = jest.spyOn(window.console, "error").mockImplementation();
    const error1 = new Error();
    const error2 = new Error();

    sideEffect.add(async () => {
      throw error1;
    });

    sideEffect.add(() => {
      throw error2;
    });

    await sideEffect.finished;

    expect(window.console.error).toBeCalledTimes(2);
    expect(window.console.error).lastCalledWith(error2);

    spy.mockRestore();
  });

  it("should accept a list of disposes returned from executor", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer1 = jest.fn();
    const disposer2 = jest.fn();

    sideEffect.add(async () => {
      executer("execute1");
      return [disposer1, disposer2];
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute1");
    expect(disposer1).toBeCalledTimes(0);
    expect(disposer2).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.add(() => {
      executer("execute2");
      return [disposer1, disposer2];
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(2);
    expect(executer).lastCalledWith("execute2");
    expect(disposer1).toBeCalledTimes(0);
    expect(disposer2).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(2);
  });
});

describe("push", () => {
  it("should add a disposer", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const disposer = jest.fn();

    sideEffect.push(disposer);

    await sideEffect.finished;

    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);
  });

  it("should add a list of disposers", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const disposers = Array.from({ length: 5 }).map(() => jest.fn());

    sideEffect.push(disposers);

    await sideEffect.finished;

    disposers.forEach(disposer => {
      expect(disposer).toBeCalledTimes(0);
    });
    expect(sideEffect.disposers.size).toBe(1);
  });

  it("should add two disposers", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const disposer1 = jest.fn();
    const disposer2 = jest.fn();

    sideEffect.push(disposer1);

    await sideEffect.finished;

    expect(disposer1).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.push(disposer2);

    await sideEffect.finished;

    expect(disposer2).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(2);
  });

  it("should return disposerID when adding a disposer", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const disposer = jest.fn();

    const disposerID = sideEffect.push(disposer);

    await sideEffect.finished;

    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);
    expect(sideEffect.disposers.get(disposerID)).toBe(disposer);
  });

  it("should flush effect with same id when adding a disposer", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const disposer = jest.fn();

    const disposerID = sideEffect.push(() => disposer("dispose1"));

    await sideEffect.finished;

    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    disposer.mockReset();

    const disposerID2 = sideEffect.push(() => disposer("dispose2"), disposerID);

    await sideEffect.finished;

    expect(disposerID2).toBe(disposerID);
    expect(disposer).toBeCalledTimes(1);
    expect(disposer).lastCalledWith("dispose1");
    expect(sideEffect.disposers.size).toBe(1);
  });
});

describe("remove", () => {
  it("should remove a side effect", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.remove(disposerID);

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should remove a side effect with a list of disposers", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposers = Array.from({ length: 5 }).map(() => jest.fn());

    const disposerID = sideEffect.add(async () => {
      executer("execute");
      return disposers;
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    disposers.forEach(disposer => {
      expect(disposer).toBeCalledTimes(0);
    });
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.remove(disposerID);

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    disposers.forEach(disposer => {
      expect(disposer).toBeCalledTimes(0);
    });
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should be able to call remove on a removed disposerID", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    await sideEffect.finished;

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

  it("should remove two side effects", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID1 = sideEffect.add(() => {
      executer("execute1");
      return disposer;
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(executer).lastCalledWith("execute1");
    expect(sideEffect.disposers.size).toBe(1);

    const disposerID2 = sideEffect.add(() => {
      executer("execute2");
      return disposer;
    });

    await sideEffect.finished;

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

  it("should return disposer", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const spy = jest.fn();

    const disposerID = sideEffect.add(() => {
      return spy;
    });

    await sideEffect.finished;

    const disposer = sideEffect.remove(disposerID);

    expect(disposer).toBe(spy);

    const none = sideEffect.remove(disposerID);

    expect(none).toBeUndefined();
  });
});

describe("flush", () => {
  it("should flush a side effect", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposerID);

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(1);
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should flush a side effect with a list of disposers", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposers = Array.from({ length: 5 }).map(() => jest.fn());

    const disposerID = sideEffect.add(async () => {
      executer("execute");
      return disposers;
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    disposers.forEach(disposer => {
      expect(disposer).toBeCalledTimes(0);
    });
    expect(sideEffect.disposers.size).toBe(1);

    sideEffect.flush(disposerID);

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    disposers.forEach(disposer => {
      expect(disposer).toBeCalledTimes(1);
    });
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should be able to call flush on a flushed disposerID", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID = sideEffect.add(() => {
      executer("execute");
      return disposer;
    });

    await sideEffect.finished;

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

  it("should flush two side effects", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposerID1 = sideEffect.add(() => {
      executer("execute1");
      return disposer;
    });

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(disposer).toBeCalledTimes(0);
    expect(executer).lastCalledWith("execute1");
    expect(sideEffect.disposers.size).toBe(1);

    const disposerID2 = sideEffect.add(() => {
      executer("execute2");
      return disposer;
    });

    await sideEffect.finished;

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

  it("should catch error in disposer", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const spy = jest.spyOn(window.console, "error").mockImplementation();
    const error = new Error();

    const disposerID = sideEffect.add(() => {
      return () => {
        throw error;
      };
    });

    await sideEffect.finished;

    expect(window.console.error).toBeCalledTimes(0);

    sideEffect.flush(disposerID);

    await sideEffect.finished;

    expect(window.console.error).toBeCalledTimes(1);
    expect(window.console.error).toBeCalledWith(error);

    spy.mockRestore();
  });

  it("should wait and flush previous effect when adding", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposeID = sideEffect.add(() => {
      executer("execute1");
      return () => disposer("dispose1");
    });

    sideEffect.flush(disposeID);

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute1");
    expect(disposer).toBeCalledTimes(1);
    expect(disposer).lastCalledWith("dispose1");
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should wait and flush previous effect when flushing", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();

    const disposeID = sideEffect.add(() => {
      executer("execute1");
      return () => disposer("dispose1");
    });

    sideEffect.flush(disposeID);

    sideEffect.flush(disposeID);

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(1);
    expect(executer).lastCalledWith("execute1");
    expect(disposer).toBeCalledTimes(1);
    expect(disposer).lastCalledWith("dispose1");
    expect(sideEffect.disposers.size).toBe(0);
  });
});

describe("flushAll", () => {
  it("should flush all side effects", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const executer = jest.fn();
    const disposer = jest.fn();
    const count = 100;

    for (let i = 0; i < count; i++) {
      sideEffect.add(() => {
        executer("execute");
        return disposer;
      });
    }

    await sideEffect.finished;

    expect(executer).toBeCalledTimes(100);
    expect(disposer).toBeCalledTimes(0);
    expect(sideEffect.disposers.size).toBe(count);

    sideEffect.flushAll();
    expect(sideEffect.disposers.size).toBe(0);

    sideEffect.flushAll();
    expect(sideEffect.disposers.size).toBe(0);
  });

  it("should catch error in disposer", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const spy = jest.spyOn(window.console, "error").mockImplementation();
    const error1 = new Error();
    const error2 = new Error();

    sideEffect.add(() => {
      return async () => {
        throw error1;
      };
    });

    await sideEffect.finished;

    sideEffect.add(() => {
      return async () => {
        throw error2;
      };
    });

    await sideEffect.finished;

    expect(window.console.error).toBeCalledTimes(0);

    sideEffect.flushAll();

    await sideEffect.finished;

    expect(window.console.error).toBeCalledTimes(2);
    expect(window.console.error).toBeCalledWith(error1);
    expect(window.console.error).toBeCalledWith(error2);

    spy.mockRestore();
  });

  it("should catch continuous error in disposer", async () => {
    const sideEffect = new AsyncSideEffectManager();
    const spy = jest.spyOn(window.console, "error").mockImplementation();
    const error1 = new Error();
    const error2 = new Error();

    const disposerID = sideEffect.add(() => {
      return async () => {
        throw error1;
      };
    });

    sideEffect.add(() => {
      return async () => {
        throw error2;
      };
    }, disposerID);

    expect(window.console.error).toBeCalledTimes(0);

    await sideEffect.finished;

    expect(window.console.error).toBeCalledTimes(1);
    expect(window.console.error).lastCalledWith(error1);

    sideEffect.flushAll();

    await sideEffect.finished;

    expect(window.console.error).toBeCalledTimes(2);
    expect(window.console.error).lastCalledWith(error2);

    spy.mockRestore();
  });
});

describe("genUID", () => {
  it("should gen uid", () => {
    const sideEffect = new AsyncSideEffectManager();
    const count = 10000;
    for (let i = 0; i < count; i++) {
      sideEffect.add(() => () => void 0, sideEffect.genUID());
    }
    expect(sideEffect.disposers.size === count);
  });
});
