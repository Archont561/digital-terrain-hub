import { actions } from "astro:actions";
import { AlpineController, runAction } from "@/lib/client";
import { Workspace, type WorkspaceProps } from "./models";
import { toast } from "@/components/starwind/toast";

export type WorkspaceManagerProps = {
  workspaces?: WorkspaceProps[];
  baseGCPEditUrlTemplate: string;
  workspaceImageUploadUrlTemplate: string;
};

export class WorkspaceManager extends AlpineController<
  WorkspaceManager,
  {
    workspaceImageUploadDialogTrigger: HTMLButtonElement;
    tusImageUploader: HTMLDivElement;
    workspaceTaskCreationDialogTrigger: HTMLButtonElement;
    workspaceTaskCreationDialogCloseBtn: HTMLButtonElement;
    taskCreationForm: HTMLFormElement;
  }
> {
  private workspaces: Workspace[];
  private baseGCPEditUrlTemplate = "";
  private workspaceImageUploadUrlTemplate = "";
  private currentWorkspace: Workspace | null = null;

  constructor({ workspaces = [], baseGCPEditUrlTemplate, workspaceImageUploadUrlTemplate }: WorkspaceManagerProps) {
    super();
    this.baseGCPEditUrlTemplate = baseGCPEditUrlTemplate;
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
      baseGCPEditUrlTemplate: this.baseGCPEditUrlTemplate,
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

    console.log("DELETED", deleted)

    if (!deleted) return;
    this.removeWorkspace(workspace.uuid);
  }

  handleWorkspaceImagesUpload(workspace: Workspace) {
    this.ctx.$refs.workspaceImageUploadDialogTrigger.click();
    const imageUploader = document.querySelector(`[x-ref="tusImageUploader"]`) as HTMLElement;
    imageUploader.dataset.uploadUrl = this.workspaceImageUploadUrlTemplate.replace("uuid", workspace.uuid);
  }

  handleWorkspaceTaskCreation(workspace: Workspace) {
    this.ctx.$refs.taskCreationForm.reset();
    this.ctx.$refs.workspaceTaskCreationDialogTrigger.click();
    this.currentWorkspace = workspace;
  }

  validateTaskForm() {
    const formData = new FormData(this.ctx.$refs.taskCreationForm);

    const name = (formData.get("name") as string | null)?.trim();
    const quality = formData.get("quality");

    if (!name) {
      toast.error("Task name cannot be empty", { duration: 2000 });
      return false;
    }

    if (!quality) {
      toast.error("Define task results quality", { duration: 2000 });
      return false;
    }

    return { name, quality };
  }

  async handleTaskCreationSubmit() {
    if (!this.currentWorkspace) return;
    const validated = this.validateTaskForm();
    if (!validated) return;

    await runAction(
      actions.createTask({
        workspace_uuid: this.currentWorkspace.uuid,
        name: validated.name as any,
        quality: validated.quality as any,
      }),
      {
        successMessage: "Task created successfully",
        onSuccess: () => {
          this.ctx.$refs.workspaceTaskCreationDialogCloseBtn.click();
          this.currentWorkspace = null;
        }
      },
    );
  }
}
