import { actions as imageActions } from "./image";
import { actions as resultActions } from "./result";
import { actions as taskActions } from "./task";
import { actions as workspaceActions } from "./workspace";

export const server = {
  ...workspaceActions,
  ...resultActions,
  ...taskActions,
  ...imageActions,
};
