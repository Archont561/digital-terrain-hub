import { actions } from "astro:actions";
import { AlpineController, runAction } from "@/lib/client";
import { Workspace, type WorkspaceProps } from "./models";

export type WorkspaceManagerProps = {
  workspaces?: WorkspaceProps[];
  baseEditUrl: string;
  workspaceImageUploadUrlTemplate: string;
};

export class WorkspaceManager extends AlpineController<
  WorkspaceManager,
  {
    workspaceImageUploadDialogTrigger: HTMLButtonElement;
    tusImageUploader: HTMLDivElement;
  }
> {
  private workspaces: Workspace[];
  private baseEditUrl = "";
  private workspaceImageUploadUrlTemplate = "";

  constructor({ workspaces = [], baseEditUrl, workspaceImageUploadUrlTemplate }: WorkspaceManagerProps) {
    super();
    this.baseEditUrl = baseEditUrl;
    this.workspaceImageUploadUrlTemplate = workspaceImageUploadUrlTemplate;
    this.workspaces = workspaces.map((data: any) =>
      this.createWorkspaceFromData(data),
    );
  }

  protected onInit() {
    this.ctx.$dispatch("starwind:init");
  }

  get isEmpty() {
    return this.workspaces.length === 0;
  }

  private createWorkspaceFromData(data: WorkspaceProps): Workspace {
    return new Workspace({
      data,
      baseEditUrl: this.baseEditUrl,
    });
  }

  async createWorkspace() {
    return await runAction(actions.createWorkspace({}), {
      successMessage: "Workspace created successfully",
      onSuccess: (data: WorkspaceProps) => {
        this.addWorkspace(data);
      },
    });
  }

  removeWorkspace(uuid: string) {
    this.workspaces = this.workspaces.filter((ws) => ws.uuid !== uuid);
  }

  addWorkspace(data: WorkspaceProps) {
    this.workspaces = [...this.workspaces, this.createWorkspaceFromData(data)];
  }

  async deleteWorkspace(workspace: Workspace) {
    const deleted = await workspace.delete();

    if (!deleted) return;
    this.removeWorkspace(workspace.uuid);
  }

  handleWorkspaceImagesUpload(workspace: Workspace) {
    this.ctx.$refs.workspaceImageUploadDialogTrigger.click();
    this.ctx.$refs.tusImageUploader.dataset.uploadUrl = this.workspaceImageUploadUrlTemplate.replace("uuid", workspace.uuid);    
  }
}
