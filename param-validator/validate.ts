import "reflect-metadata";

function validate(target: any, key: string, descriptor: PropertyDescriptor) {
  const origin = descriptor.value;
  descriptor.value = function (...args: unknown[]) {
    // 获取目标元数组
    const paramTypes = Reflect.getMetadata("design:paramtypes", target, key);
    if (!paramTypes) {
      return origin.apply(this, args);
    }
    paramTypes.forEach((paramType, idx) => {
      if (
        !(args[idx].constructor === paramType || args[idx] instanceof paramType)
      ) {
        throw new TypeError(`Type validate failed for ${args[idx]}`);
      }
    });
    // 所有校验通过后再运行原方法
    return origin.apply(this, args);
  };
}

class Person {
  @validate
  saySomething(a: string, b: number) {
    console.log("a: ", a, "b: ", b);
  }
}

new Person().saySomething("str", 12); // a:  str b:  12
// @ts-ignore
new Person().saySomething(12); // Type validate failed for 12
// @ts-ignore
new Person().saySomething("str", "other str"); // Type validate failed for other str
