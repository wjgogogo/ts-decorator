import type { Context } from "koa";
import { body, controller, get, param, post } from "../decorator";

@controller("/users")
export class User {
  @get("/")
  getUsers(ctx: Context) {
    ctx.body = "get all users";
  }

  @get("/:id/:name")
  getUserById(
    @param("id") id: string,
    @param("name") name: string,
    ctx: Context
  ) {
    ctx.body = `get user by id: ${id}, ${name}`;
  }
  @post("/:id")
  updateUserById(@param("id") id: string, @body body: any, ctx: Context) {
    ctx.body = `update user by id: ${id}, ${JSON.stringify(body)}`;
  }
}
