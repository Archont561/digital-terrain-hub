import { actions as gcpActions } from "./gcp";
import { actions as imageActions } from "./image";
import { actions as resultActions } from "./result";
import { actions as taskActions } from "./task";
import { actions as tokenActions } from "./token";
import { actions as workspaceActions } from "./workspace";

export const server = {
  ...workspaceActions,
  ...resultActions,
  ...taskActions,
  ...imageActions,
  ...gcpActions,
  ...tokenActions,
};
