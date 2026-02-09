import { actions } from "astro:actions";
import { toast } from "@/components/starwind/toast";
import { runAction } from "@/lib/client";

export type ResultProps = {
  uuid: string;
  workspace_uuid: string;
  result_type: string;
  created_at: string;
};

export type ResultMode = "view" | "delete" | "downloading" | "sharing";

export type ResultConfig = {
  data: ResultProps;
  downloadResultUrlTemplate: string;
  shareResultUrlTemplate: string;
};

export class Result {
  uuid: string;
  workspaceUuid: string;
  resultType: string;
  createdAt: string;

  private downloadResultUrlTemplate: string;
  private shareResultUrlTemplate: string;

  // UI State
  private mode: ResultMode = "view";
  private shared = false;
  private sharedKey: string | null = null;

  constructor(config: ResultConfig) {
    this.uuid = config.data.uuid;
    this.workspaceUuid = config.data.workspace_uuid;
    this.resultType = config.data.result_type;
    this.createdAt = config.data.created_at;
    this.downloadResultUrlTemplate = config.downloadResultUrlTemplate;
    this.shareResultUrlTemplate = config.shareResultUrlTemplate;
  }

  get humanType() {
    return this.resultType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  get humanDate() {
    if (!this.createdAt) return "-";
    return new Date(this.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  get downloadUrl() {
    return `${this.downloadResultUrlTemplate.replace(":uuid", this.uuid)}`;
  }

  get shareUrl() {
    if (!this.sharedKey) return null;
    return this.shareResultUrlTemplate
      .replace(":uuid", this.uuid)
      .replace(":api_key", this.sharedKey);
  }

  isMode(mode: ResultMode) {
    return this.mode === mode;
  }

  setMode(mode: ResultMode) {
    this.mode = mode;
  }

  get isShared() {
    return this.shared;
  }

  async share() {
    if (this.shared && this.sharedKey) {
      this.copyShareLinkToClipboard();
      return true;
    }

    this.setMode("sharing");

    return await runAction(actions.shareTaskResult({ uuid: this.uuid }), {
      successMessage: "Result shared successfully",
      onSuccess: (data: { share_api_key: string }) => {
        this.shared = true;
        this.sharedKey = data.share_api_key;
        this.setMode("view");
        this.copyShareLinkToClipboard();
      },
      onError: () => {
        this.setMode("view");
      },
    });
  }

  copyShareLinkToClipboard() {
    if (!this.shareUrl) return;

    window.navigator.clipboard.writeText(this.shareUrl);
    toast.success("Share link copied to clipboard", { duration: 2000 });
  }

  async delete() {
    this.setMode("delete");

    try {
      await toast.promise(
        actions.deleteTaskResult.orThrow({ uuid: this.uuid }),
        {
          loading: `Deleting ${this.humanType}`,
          success: {
            title: "Result deleted successfully",
            duration: 2000,
          },
          error: {
            title: "Failed to delete result!",
            duration: 2000,
          },
        },
      );

      return true;
    } catch (_error) {
      this.setMode("view");
      return false;
    }
  }
}
