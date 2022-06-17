# side-effect-manager

<p align="center">
  <img width="200" src="https://raw.githubusercontent.com/crimx/side-effect-manager/main/assets/side-effect-manager.svg">
</p>

[![Build Status](https://github.com/crimx/side-effect-manager/actions/workflows/build.yml/badge.svg)](https://github.com/crimx/side-effect-manager/actions/workflows/build.yml)
[![npm-version](https://img.shields.io/npm/v/side-effect-manager.svg)](https://www.npmjs.com/package/side-effect-manager)
[![Coverage Status](https://img.shields.io/coveralls/github/crimx/side-effect-manager/main)](https://coveralls.io/github/crimx/side-effect-manager?branch=main)
[![minified-size](https://img.shields.io/bundlephobia/minzip/side-effect-manager)](https://bundlephobia.com/package/side-effect-manager)
[![tree-shakable](https://badgen.net/bundlephobia/tree-shaking/side-effect-manager)](https://bundlephobia.com/package/side-effect-manager)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?maxAge=2592000)](http://commitizen.github.io/cz-cli/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg?maxAge=2592000)](https://conventionalcommits.org)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A tiny library to encapsulate side effects in a compact, reusable, testable and TypeScript-friendly style.

## Install

```bash
npm add side-effect-manager
```

## Why

Conventionally we write side effects like this:

```js
class MyClass {
  constructor() {
    this.handleResize = () => {
      console.log("resize");
    };
    window.addEventListener("resize", this.handleResize);
  }

  destroy() {
    // cleanup side effects
    window.removeEventListener("resize", this.handleResize);
  }
}
```

This code style is scattered and hard-to-follow. The side effect handler has to be exposed to `this` which leaves us many unwanted and uncompressible properties.

With `side-effect-manager` we may write the same logic like this instead:

```js
import { SideEffectManager } from "side-effect-manager";

class MyClass {
  constructor() {
    this.sideEffect = new SideEffectManager();

    this.sideEffect.add(() => {
      const handleResize = () => {
        console.log("resize");
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    });
  }

  destroy() {
    this.sideEffect.flushAll();
  }
}
```

Or simply like this:

```js
this.sideEffect.addEventListener(window, "resize", () => {
  console.log("resize");
});
```

Not only the code is more compact and readable, variables can now be compressed as they are not properties.

Also the typing of listener can now be inferred from method so it is also more TypeScript friendly without the need to declare listener type specifically.

## Usage

Add a side effect:

```js
sideEffect.add(() => {
  const subscription = observable$.subscribe(value => {
    console.log(value);
  });
  return () => subscription.unsubscribe();
});
```

If the side effect returns a disposer function directly you can also:

```js
import Emittery from "emittery";
import { Remitter } from "remitter";

const emittery = new Emittery();
const remitter = new Remitter();

sideEffect.addDisposer(
  remitter.on("event1", eventData => console.log(eventData))
);

// Or an array of disposers
sideEffect.addDisposer([
  remitter.on("event1", eventData => console.log(eventData)),
  remitter.on("event2", eventData => console.log(eventData)),
  emittery.on("event3", eventData => console.log(eventData)),
]);
```

There are also sugars for `addEventListener`, `setTimeout` and `setInterval`.

```js
sideEffect.setTimeout(() => {
  console.log("timeout");
}, 2000);
```

Adding a side effect returns a `disposerID` which can be used to `remove` or `flush` a side effect.

```js
const disposerID = sideEffect.addEventListener(window, "resize", () => {
  console.log("resize");
});

// Remove the side effect without running the disposer callback
sideEffect.remove(disposerID);

// Remove the side effect then run the disposer callback
sideEffect.flush(disposerID);
```

A `disposerID` can also be set deliberately. Side effects with the same ID will be flushed before adding a new one.

```js
function debounce(handler, timeout) {
  sideEffect.setTimeout(handler, timeout, "my-timeout");
}
```

### Async Side Effects

Similar to `SideEffectManager`, `AsyncSideEffectManager` can also handle async side effect cleanup nicely.

```js
import { AsyncSideEffectManager } from "side-effect-manager";

const asyncSideEffect = new AsyncSideEffectManager();

asyncSideEffect.add(async () => {
  // async side effect

  return async () => {
    // async cleanup
  };
});
```

Yon can add or flush side effects with the same ID repeatably. `AsyncSideEffectManager` will correctly schedule tasks and skip unnecessary tasks automatically.

```js
const disposerID = asyncSideEffect.add(async () => {
  // async side effect

  return async () => {
    // async cleanup
  };
});

// Add side effect with same ID
asyncSideEffect.add(async () => {
  // async side effect

  return async () => {
    // async cleanup
  };
}, disposerID);

asyncSideEffect.flush(disposerID);
```

You can always `await asyncSideEffect.finished` which will be updated and resolved after all tasks are finished.

```js
await asyncSideEffect.finished;
```
