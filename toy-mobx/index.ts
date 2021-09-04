import { autoRun, computed, observable, observer } from "./observer";

// 响应式的类
@observer
class Order {
  id = 0;
  // 需要响应变化的数据
  @observable
  price = 0;
  @observable
  count = 0;

  // 类似于衍生数据
  @computed
  get amount() {
    return this.price * this.count;
  }
}

const order = new Order();

// 通过 autoRun 收集回调方法和数据的依赖关系
autoRun(function idFn() {
  console.log("id:", order.id);
});

autoRun(function priceFn() {
  console.log("price:", order.price);
});

autoRun(function princeAndCountFn() {
  console.log(
    `price(${order.price}) x count(${order.count}): ${
      order.price * order.count
    }`
  );
});
autoRun(function amountFn() {
  console.log("amount: ", order.amount);
});

// 希望在所有 observable 属性值发生改变时，自动运行依赖该数据的回调方法
order.id = 12323; // 不是响应式属性，啥也不会发生

setTimeout(() => {
  order.price = 10; // 运行 priceFn, priceAndCountFn, 以及 amountFn
}, 1000);

setTimeout(() => {
  order.count = 100; // 运行 priceAndCountFn, 以及 amountFn
}, 1000);
