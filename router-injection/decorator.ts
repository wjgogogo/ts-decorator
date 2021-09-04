// 装饰器类型
export enum DecoratorKey {
  Controller = "controller",
  Method = "method",
  Param = "param",
  Body = "body",
}

// 请求类型
export enum MethodType {
  Get = "get",
  Post = "post",
}

// 请求装饰器元数据类型
export interface MethodMetadata {
  method: MethodType;
  route: string;
  fn: Function;
}

// 请求参数装饰器元数据类型
export interface ParamMetadata {
  idx: number;
  key: string;
}

// controller 只用于收集路由前缀
export const controller = (prefix: string) => (target: any) => {
  Reflect.defineMetadata(DecoratorKey.Controller, prefix, target);
};

// method 工厂用于收集路由方法，路径，和回调方法
export const method =
  (method: string) =>
  (route: string) =>
  (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      DecoratorKey.Method,
      {
        method,
        route,
        fn: descriptor.value,
      },
      target,
      key
    );
  };

// 通过工厂生成 get 和 post 装饰器工厂
export const get = method(MethodType.Get);
export const post = method(MethodType.Post);

// 请求参数装饰器用于收集所有参数映射信息
export const param =
  (paramKey: string) => (target: any, key: string, idx: number) => {
    // 所有参数信息用数组存储，因为一个方法中可以使用多个参数映射
    const params = Reflect.getMetadata(DecoratorKey.Param, target, key) ?? [];

    params.push({
      idx,
      key: paramKey,
    });

    Reflect.defineMetadata(DecoratorKey.Param, params, target, key);
  };

// body参数装饰器用于收集所有参数映射信息
export const body = (target: any, key: string, idx: number) => {
  // 因为body信息一般赋值给一个参数就可以了，所有存储一下是第几个参数即可
  Reflect.defineMetadata(DecoratorKey.Body, idx, target, key);
};
