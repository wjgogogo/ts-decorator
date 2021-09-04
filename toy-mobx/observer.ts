import "reflect-metadata";

enum DecoratorType {
  Observable = "observable",
  Computed = "computed",
}
interface ComputedMetadata {
  key: string;
  fn: Function;
}

// Effect 类型
interface Effect {
  execute: Function;
  deps: Set<Set<Effect>>;
}

let runningEffect: Effect = null;
let runningComputed: Effect = null;

function subscribe(observer: Set<Effect>, effect: Effect) {
  observer.add(effect); // 收集 effect 回调信息
  effect.deps.add(observer); // effect 也需要和 observer 建立联系，用于后续解绑操作
}

function injectObservableKeys(obj, keys: string[] = []) {
  keys.forEach((key) => {
    let value = obj[key];
    let subscribes = new Set<Effect>();
    Object.defineProperty(obj, key, {
      get() {
        // 依赖收集，runningComputed 优先
        subscribe(subscribes, runningComputed || runningEffect);
        return value;
      },
      set(updated) {
        value = updated;
        // 复制一份新的依赖队列遍历，千万不要在原对象上遍历，因为在执行回调时，又会绑定新的依赖项，造成无限循环
        [...subscribes].forEach((effect) => effect.execute());
      },
    });
  });
}

function injectComputedKeys(obj, keys: ComputedMetadata[] = []) {
  keys.forEach((computed) => {
    let subscribes = new Set<Effect>();

    const executeComputedGetter = () => {
      cleanup(effect);
      // 用另个标识标记 computed effect
      runningComputed = effect;
      try {
        return computed.fn.call(obj);
      } finally {
        runningComputed = null;
      }
    };
    // computed 的 execute 就是让其依赖回调都执行一遍
    const execute = () => {
      [...subscribes].forEach((effect) => effect.execute());
    };

    const effect: Effect = {
      execute,
      deps: new Set(),
    };

    Object.defineProperty(obj, computed.key, {
      get() {
        subscribe(subscribes, runningEffect);
        return executeComputedGetter();
      },
    });
  });
}

// observer
export function observer(target): any {
  // 拿到所有的 observable 属性名
  const observableKeys: string[] = Reflect.getMetadata(
    DecoratorType.Observable,
    target.prototype
  );
  const computedKeys: ComputedMetadata[] = Reflect.getMetadata(
    DecoratorType.Computed,
    target.prototype
  );

  // 返回一个新的类
  return class extends target {
    constructor() {
      super(); // 调用 super 方法完成属性初始化
      injectObservableKeys(this, observableKeys); // 处理其中的 observable keys
      injectComputedKeys(this, computedKeys);
    }
  };
}

// observable 用于收集所有响应式属性
export const observable = (target, key) => {
  const keys = Reflect.getMetadata(DecoratorType.Observable, target) ?? [];
  keys.push(key);
  Reflect.defineMetadata(DecoratorType.Observable, keys, target);
};

export const computed = (target, key, descriptor) => {
  const keys = Reflect.getMetadata(DecoratorType.Computed, target) ?? [];
  // 假定所有 computed 都是 getter
  keys.push({ key, fn: descriptor.get });
  Reflect.defineMetadata(DecoratorType.Computed, keys, target);
};

function cleanup(effect: Effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });

  effect.deps.clear();
}

export function autoRun(fn: Function) {
  const execute = () => {
    // 双向解绑
    cleanup(effect);
    // 设置当前effect变量
    runningEffect = effect;
    try {
      fn();
    } finally {
      runningEffect = null;
    }
  };

  // 每一个 effect 需要包含一个需要在依赖属性变化执行的回调，以及它所依赖的属性的subscribe几何
  const effect: Effect = {
    execute,
    deps: new Set(),
  };
  // 先执行依次，建立依赖关系
  execute();
}
