import Koa from "koa";
import body from "koa-bodyparser";
import "reflect-metadata";
import { loadRoutes } from "./loadRoutes";

const app = new Koa();

app.use(body());
loadRoutes(app);

app.listen(3000, () => {
  console.log("server is running...");
});
