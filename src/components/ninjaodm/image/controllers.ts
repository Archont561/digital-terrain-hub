import { AlpineController } from "@/lib/client";
import * as tus from "tus-js-client";
import { toast } from "@/components/starwind/toast";

type UploadStateStatus = "pending" | "uploading" | "paused" | "completed" | "error";

interface UploadState {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadStateStatus;
  error: string | null;
  url: string | null;
}

export class TusImageUploaderManager extends AlpineController<
  TusImageUploaderManager,
  {
    dropzoneForm: HTMLFormElement;
    dropzone: HTMLInputElement;
    progressTabTrigger: HTMLButtonElement;
  }
> {
  private uploadUrl!: string;
  private activeUploads: Map<string, tus.Upload> = new Map();

  // Reactive state (exposed to Alpine)
  uploads: UploadState[] = [];
  isUploading = false;

  constructor() {
    super();
  }

  protected onInit() {
    this.uploadUrl = this.ctx.$root.dataset.uploadUrl as string;
    this.ctx.$dispatch("starwind:init");
  }

  // ============================================
  // Computed Properties
  // ============================================

  get totalProgress(): number {
    if (this.uploads.length === 0) return 0;
    const sum = this.uploads.reduce((acc, u) => acc + u.progress, 0);
    return Math.round(sum / this.uploads.length);
  }

  get hasActiveUploads(): boolean {
    return this.uploads.some(
      (u) => u.status === "uploading" || u.status === "pending"
    );
  }

  get completedCount(): number {
    return this.uploads.filter((u) => u.status === "completed").length;
  }

  // ============================================
  // Main Form Handler
  // ============================================

  handleFormSubmition() {
    const files = this.getFilesFromDropzone();

    if (!files.length) {
      toast.error("No files selected", { duration: 2000 });
      return;
    }

    this.initializeUploadStates(files);
    const uploadPromise = this.uploadAllFiles(files);
    this.ctx.$refs.progressTabTrigger.click();

    toast.promise(uploadPromise, {
      loading: `Uploading ${files.length} image${files.length > 1 ? "s" : ""}...`,
      success: {
        title: `Successfully uploaded ${files.length} image${files.length > 1 ? "s" : ""}`,
        duration: 2000,
      },
      error: {
        title: "Some uploads failed",
        duration: 3000,
      },
    });
  }

  // ============================================
  // File Retrieval
  // ============================================

  private getFilesFromDropzone(): File[] {
    const form = this.ctx.$refs.dropzoneForm;
    const formData = new FormData(form);
    const files = formData.getAll("dropzone-files") as File[];
    return files.filter((file) => file instanceof File && file.size > 0);
  }

  // ============================================
  // State Management
  // ============================================

  private initializeUploadStates(files: File[]): void {
    this.uploads = files.map((file) => this.createUploadState(file));
  }

  private createUploadState(file: File): UploadState {
    return {
      id: this.generateUploadId(file),
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: "pending",
      error: null,
      url: null,
    };
  }

  private generateUploadId(file: File): string {
    return `${file.name}-${file.size}-${Date.now()}`;
  }

  private findUploadState(fileName: string): UploadState | undefined {
    return this.uploads.find((u) => u.fileName === fileName);
  }

  private updateUploadState(
    fileName: string,
    updates: Partial<UploadState>
  ): void {
    const state = this.findUploadState(fileName);
    if (state) {
      Object.assign(state, updates);
    }
  }

  // ============================================
  // Upload Orchestration
  // ============================================

  private async uploadAllFiles(files: File[]): Promise<void> {
    this.isUploading = true;

    try {
      const results = await Promise.allSettled(
        files.map((file) => this.uploadSingleFile(file))
      );

      this.handleSettledResults(results, files);
    } finally {
      this.isUploading = false;
      this.clearDropzone();
    }
  }

  private uploadSingleFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = this.createTusUpload(file, {
        onSuccess: () => {
          this.handleUploadSuccess(file, upload.url);
          resolve(upload.url!);
        },
        onError: (error: Error) => {
          this.handleUploadError(file, error);
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          this.handleUploadProgress(file, bytesUploaded, bytesTotal);
        },
      });

      this.activeUploads.set(file.name, upload);
      this.startUploadWithResume(upload);
    });
  }

  // ============================================
  // TUS Upload Creation
  // ============================================

  private createTusUpload(
    file: File,
    callbacks: {
      onSuccess: () => void;
      onError: (error: Error) => void;
      onProgress: (bytesUploaded: number, bytesTotal: number) => void;
    }
  ): tus.Upload {
    return new tus.Upload(file, {
      endpoint: this.uploadUrl,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type,
      },
      onError: callbacks.onError,
      onProgress: callbacks.onProgress,
      onSuccess: callbacks.onSuccess,
      onShouldRetry: this.handleShouldRetry.bind(this),
    });
  }

  // ============================================
  // Upload Lifecycle
  // ============================================

  private async startUploadWithResume(upload: tus.Upload): Promise<void> {
    const previousUploads = await upload.findPreviousUploads();

    if (previousUploads.length > 0) {
      upload.resumeFromPreviousUpload(previousUploads[0]);
    }

    upload.start();
  }

  // ============================================
  // Event Handlers
  // ============================================

  private handleUploadProgress(
    file: File,
    bytesUploaded: number,
    bytesTotal: number
  ): void {
    const progress = this.calculatePercentage(bytesUploaded, bytesTotal);
    this.updateUploadState(file.name, {
      progress,
      status: "uploading",
    });
  }

  private handleUploadSuccess(file: File, url: string | null): void {
    this.activeUploads.delete(file.name);
    this.updateUploadState(file.name, {
      progress: 100,
      status: "completed",
      url,
    });
  }

  private handleUploadError(file: File, error: Error): void {
    this.activeUploads.delete(file.name);
    this.updateUploadState(file.name, {
      status: "error",
      error: error.message,
    });
  }

  private handleShouldRetry(
    err: tus.DetailedError,
    _retryAttempt: number,
    _options: tus.UploadOptions
  ): boolean {
    const status = err.originalResponse?.getStatus() ?? 0;
    const nonRetryableStatuses = [401, 403, 404, 422];
    return !nonRetryableStatuses.includes(status);
  }

  private handleSettledResults(
    results: PromiseSettledResult<string>[],
    files: File[]
  ): void {
    const successful = results.filter(
      (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled"
    );

    this.ctx.$dispatch("uploads-complete", {
      total: files.length,
      successful: successful.length,
      failed: results.length - successful.length,
      uploads: this.uploads
        .filter((u) => u.status === "completed")
        .map((u) => ({ name: u.fileName, url: u.url })),
    });

    const dropzoneFileList = this.ctx.$refs.dropzoneForm.querySelector(`[data-slot="dropzone-files-list"]`)!;
    dropzoneFileList.classList.add("invisible");
    dropzoneFileList.innerHTML = "";
  }

  // ============================================
  // Upload Control
  // ============================================

  pauseUpload(fileName: string): void {
    const upload = this.activeUploads.get(fileName);
    if (upload) {
      upload.abort();
      this.updateUploadState(fileName, { status: "paused" });
    }
  }

  resumeUpload(fileName: string): void {
    const upload = this.activeUploads.get(fileName);
    if (upload) {
      upload.start();
      this.updateUploadState(fileName, { status: "uploading" });
    }
  }

  removeUpload(fileName: string): void {
    this.abortUpload(fileName);
    this.uploads = this.uploads.filter((u) => u.fileName !== fileName);
  }

  abortUpload(fileName: string): void {
    const upload = this.activeUploads.get(fileName);
    if (upload) {
      upload.abort();
      this.activeUploads.delete(fileName);
    }
  }

  abortAllUploads(): void {
    this.activeUploads.forEach((upload) => upload.abort());
    this.activeUploads.clear();
    this.isUploading = false;
  }

  // ============================================
  // Cleanup
  // ============================================

  private clearDropzone(): void {
    const dropzone = this.ctx.$refs.dropzone;
    if (dropzone) {
      dropzone.value = "";
    }
  }

  clearCompleted(): void {
    this.uploads = this.uploads.filter((u) => u.status !== "completed");
  }

  clearAll(): void {
    this.abortAllUploads();
    this.uploads = [];
  }

  // ============================================
  // Utilities
  // ============================================

  private calculatePercentage(uploaded: number, total: number): number {
    return Math.round((uploaded / total) * 100);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}