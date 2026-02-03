import { actions as resultActions } from "./result";
import { actions as workspaceActions } from "./workspace";

export const server = {
  ...workspaceActions,
  ...resultActions,
};
