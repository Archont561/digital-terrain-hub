
import { actions } from "astro:actions";
import { toast } from "@/components/starwind/toast";
import { runAction } from "@/lib/client";

export type WorkspaceProps = {
  uuid: string;
  name: string;
  created_at: string;
};

export type WorkspaceMode = "view" | "edit" | "delete";

export type WorkspaceConfig = {
  data: WorkspaceProps;
  baseEditUrl: string;
};

export class Workspace {
  uuid: string;
  name: string;
  createdAt: string;

  private baseEditUrl: string;

  // UI State
  private mode: WorkspaceMode = "view";
  private bufferName = "";

  constructor(config: WorkspaceConfig) {
    this.uuid = config.data.uuid;
    this.name = config.data.name;
    this.createdAt = config.data.created_at;
    this.baseEditUrl = config.baseEditUrl;
  }

  get editUrl() {
    return `${this.baseEditUrl}/${this.uuid}`;
  }

  get inputId() {
    return `input-${this.uuid}`;
  }

  get humanDate() {
    if (!this.createdAt) return "-";
    return new Date(this.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  isMode(mode: WorkspaceMode) {
    return this.mode === mode;
  }

  private setMode(mode: WorkspaceMode) {
    this.mode = mode;
  }

  startEdit() {
    this.setMode("edit");
    this.bufferName = this.name;
    document.getElementById(this.inputId)?.focus();
  }

  cancelEdit() {
    this.setMode("view");
    this.bufferName = "";
  }

  async save() {
    const newName = this.bufferName.trim();
    if (!newName) {
      toast.error("Name cannot be empty", { duration: 2000 });
      return false;
    }
    if (newName === this.name) {
      this.cancelEdit();
      return false;
    }

    const oldName = this.name;

    // Optimistic Update
    this.name = newName;
    this.setMode("view");

    return await runAction(
      actions.updateWorkspace({
        uuid: this.uuid,
        payload: { name: newName },
      }),
      {
        successMessage: "Workspace updated successfully",
        onError: () => {
          // Revert on failure
          this.name = oldName;
          this.setMode("edit");
          document.getElementById(this.inputId)?.focus();
        },
      },
    );
  }

  async delete() {
    this.setMode("delete");

    try {
      await toast.promise(
        actions.deleteWorkspace.orThrow({ uuid: this.uuid }),
        {
          loading: `Deleting workspace ${this.name}`,
          success: {
            title: "Workspace deleted successfully",
            duration: 2000,
          },
          error: {
            title: "Failed to delete workspace!",
            duration: 2000,
          },
        },
      );

      return true;
    } catch (error) {
      this.setMode("view");
      return false;
    }
  }

}