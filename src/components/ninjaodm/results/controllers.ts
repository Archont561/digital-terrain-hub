import { AlpineController } from "@/lib/client";
import { Result, type ResultProps } from "./models";

export type ResultManagerProps = {
  results?: ResultProps[];
  downloadResultUrlTemplate: string;
  shareResultUrlTemplate: string;
};

export class ResultManager extends AlpineController<ResultManager> {
  private results: Result[];
  private downloadResultUrlTemplate: string;
  private shareResultUrlTemplate: string;

  constructor({
    results = [],
    downloadResultUrlTemplate,
    shareResultUrlTemplate,
  }: ResultManagerProps) {
    super();
    this.downloadResultUrlTemplate = downloadResultUrlTemplate;
    this.shareResultUrlTemplate = shareResultUrlTemplate;
    this.results = results.map((data: ResultProps) =>
      this.createResultFromData(data),
    );
  }

  protected onInit() {
    this.ctx.$dispatch("starwind:init");
  }

  get isEmpty() {
    return this.results.length === 0;
  }

  private createResultFromData(data: ResultProps): Result {
    return new Result({
      data,
      downloadResultUrlTemplate: this.downloadResultUrlTemplate,
      shareResultUrlTemplate: this.shareResultUrlTemplate,
    });
  }

  removeResult(uuid: string) {
    this.results = this.results.filter((result) => result.uuid !== uuid);
  }

  addResult(data: ResultProps) {
    this.results = [...this.results, this.createResultFromData(data)];
  }

  async deleteResult(result: Result) {
    const deleted = await result.delete();

    if (!deleted) return;
    this.removeResult(result.uuid);
  }
}
