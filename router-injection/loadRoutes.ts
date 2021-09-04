import Router from "@koa/router";
import Application from "koa";
// 从简原则，我们这里通过手动 import，而不是通过读取文件的方法，其效果一致
import * as Controllers from "./controller";
import { DecoratorKey, MethodMetadata, ParamMetadata } from "./decorator";

// app 代表 koa 实例
export function loadRoutes(app: Application) {
  // 遍历所有的 controller
  Object.keys(Controllers).forEach((name) => {
    // 每一个 controller 代表一组独立的路由配置
    const router = new Router();

    const Controller = Controllers[name];
    // 获取当前类装饰器的 prefix 原数据
    const prefix = Reflect.getMetadata(DecoratorKey.Controller, Controller);
    // 新建 router 实例用于配置路由
    router.prefix(prefix);

    const Prototype = Controller.prototype;
    // 遍历类中的所有方法，获取其中的配置元数据
    Object.keys(Prototype).forEach((key) => {
      const config: MethodMetadata = Reflect.getMetadata(
        DecoratorKey.Method,
        Prototype,
        key
      );
      // 分别获取请求参数和 body 信息
      const params = Reflect.getMetadata(DecoratorKey.Param, Prototype, key);
      const bodyIdx = Reflect.getMetadata(DecoratorKey.Body, Prototype, key);
      console.log(config, params, bodyIdx);
      // 配置路由信息
      router[config.method](config.route, (ctx, next) => {
        // 处理参数映射，别忘了最后将 ctx 和 next 传入
        config.fn(...handleArgs(ctx, params, bodyIdx), ctx, next);
      });
    });
    //
    app.use(router.routes());
  });
}

function handleArgs(ctx, params: ParamMetadata[] = [], bodyIdx?: number) {
  const args = [];

  params.forEach(({ idx, key }) => {
    // 请求的参数均在 params对象上，将其映射到对应的参数位置上
    args[idx] = ctx.params[key];
  });
  if (bodyIdx) {
    // 当使用 bodyparser 后，请求的 body 信息在 request.body 上
    args[bodyIdx] = ctx.request.body;
  }
  return args;
}
