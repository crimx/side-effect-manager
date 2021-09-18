# side-effect-manager

<p align="center">
  <img width="200" src="https://raw.githubusercontent.com/crimx/side-effect-manager/main/assets/side-effect-manager.svg">
</p>

[![Build Status](https://github.com/crimx/side-effect-manager/actions/workflows/build.yml/badge.svg)](https://github.com/crimx/side-effect-manager/actions/workflows/build.yml)
[![npm-version](https://img.shields.io/npm/v/side-effect-manager.svg)](https://www.npmjs.com/package/side-effect-manager)
[![Coverage Status](https://img.shields.io/coveralls/github/crimx/side-effect-manager/main)](https://coveralls.io/github/crimx/side-effect-manager?branch=main)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?maxAge=2592000)](http://commitizen.github.io/cz-cli/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg?maxAge=2592000)](https://conventionalcommits.org)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A tiny library to encapsulate side effects in a compact, reusable and testable style.

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

    // or simply like this
    this.sideEffect.addEventListener(window, "resize", () => {
      console.log("resize");
    });
  }

  destroy() {
    this.sideEffect.flushAll();
  }
}
```

Not only the code is more compact and readable, variables can now be compressed as they are not properties.

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
