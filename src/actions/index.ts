import { actions as resultActions } from "./result";
import { actions as taskActions } from "./task";
import { actions as workspaceActions } from "./workspace";
import { actions as taskActions } from "./task";

export const server = {
  ...workspaceActions,
  ...resultActions,
  ...taskActions,
};
