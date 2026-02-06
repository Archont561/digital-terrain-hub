import { actions } from "astro:actions";
import { toast } from "@/components/starwind/toast";
import { runAction } from "@/lib/client";

export type TaskProps = {
  uuid: string;
  workspace_uuid: string;
  name: string;
  status: TaskStatus;
  step: TaskStep | null;
  created_at: string;
  options?: Record<string, any> | null;
};

export type TaskStatus =
  | "queued"
  | "running"
  | "pausing"
  | "paused"
  | "resuming"
  | "cancelling"
  | "finishing"
  | "completed"
  | "failed"
  | "cancelled";

export type TaskStep =
  | "dataset"
  | "split"
  | "merge"
  | "opensfm"
  | "openmvs"
  | "odm_filterpoints"
  | "odm_meshing"
  | "mvs_texturing"
  | "odm_georeferencing"
  | "odm_dem"
  | "odm_orthophoto"
  | "odm_report"
  | "odm_postprocess";

export type TaskMode = "view" | "pausing" | "resuming" | "cancelling" | "deleting";

export type TaskConfig = {
  data: TaskProps;
};

export class Task {
  uuid: string;
  workspaceUuid: string;
  name: string;
  status: TaskStatus;
  step: TaskStep | null;
  createdAt: string;
  options?: Record<string, any> | null;

  // UI State
  private mode: TaskMode = "view";
  private bufferStatus: TaskStatus;

  constructor(config: TaskConfig) {
    this.uuid = config.data.uuid;
    this.workspaceUuid = config.data.workspace_uuid;
    this.name = config.data.name;
    this.status = config.data.status;
    this.step = config.data.step;
    this.createdAt = config.data.created_at;
    this.options = config.data.options;
    this.bufferStatus = this.status;
  }

  // Display properties always use bufferStatus
  get humanStatus() {
    return this.bufferStatus
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  get humanStep() {
    if (!this.step) return "N/A";
    return this.step
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  get humanDate() {
    if (!this.createdAt) return "-";
    return new Date(this.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  isMode(mode: TaskMode) {
    return this.mode === mode;
  }

  private setMode(mode: TaskMode) {
    this.mode = mode;
  }

  get canPause() {
    return this.status === "running";
  }

  get canResume() {
    return this.status === "paused";
  }

  get canCancel() {
    return !this.canDelete;
  }

  get canDelete() {
    return ["completed", "cancelled", "failed"].includes(this.status);
  }

  async pause() {
    if (!this.canPause) return false;

    this.setMode("pausing");
    const oldBuffer = this.bufferStatus;

    // Optimistic UI
    this.bufferStatus = "pausing";

    return await runAction(
      actions.callTaskAction({
        uuid: this.uuid,
        action: "pause",
      }),
      {
        successMessage: "Task paused successfully",
        onSuccess: (data: TaskProps) => {
          this.status = "paused";
          this.bufferStatus = "paused";
          this.step = data.step;
          this.setMode("view");
        },
        onError: () => {
          this.bufferStatus = oldBuffer;
          this.setMode("view");
        },
      }
    );
  }

  async resume() {
    if (!this.canResume) return false;

    this.setMode("resuming");
    const oldBuffer = this.bufferStatus;

    // Optimistic UI
    this.bufferStatus = "resuming";

    return await runAction(
      actions.callTaskAction({
        uuid: this.uuid,
        action: "resume",
      }),
      {
        successMessage: "Task resumed successfully",
        onSuccess: (data: TaskProps) => {
          this.status = "running";
          this.bufferStatus = "running";
          this.step = data.step;
          this.setMode("view");
        },
        onError: () => {
          this.bufferStatus = oldBuffer;
          this.setMode("view");
        },
      }
    );
  }

  async cancel() {
    if (!this.canCancel) return false;

    this.setMode("cancelling");
    const oldBuffer = this.bufferStatus;

    // Optimistic UI
    this.bufferStatus = "cancelling";

    return await runAction(
      actions.callTaskAction({
        uuid: this.uuid,
        action: "cancel",
      }),
      {
        successMessage: "Task cancelled successfully",
        onSuccess: (data: TaskProps) => {
          this.status = "cancelled";
          this.bufferStatus = "cancelled";
          this.step = data.step;
          this.setMode("view");
        },
        onError: () => {
          this.bufferStatus = oldBuffer;
          this.setMode("view");
        },
      }
    );
  }

  async delete() {
    if (!this.canDelete) return false;

    this.setMode("deleting");

    try {
      await toast.promise(actions.deleteTask.orThrow({ uuid: this.uuid }), {
        loading: `Deleting task ${this.name}`,
        success: {
          title: "Task deleted successfully",
          duration: 2000,
        },
        error: {
          title: "Failed to delete task!",
          duration: 2000,
        },
      });

      return true;
    } catch (error) {
      this.setMode("view");
      return false;
    }
  }
}
