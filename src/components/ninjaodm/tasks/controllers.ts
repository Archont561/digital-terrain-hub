import { actions } from "astro:actions";
import { AlpineController, runAction } from "@/lib/client";
import { Task, type TaskProps } from "./models";

export type TaskManagerProps = {
  tasks?: TaskProps[];
  workspaceUuid?: string;
};

export class TaskManager extends AlpineController<TaskManager> {
  private tasks: Task[];
  private workspaceUuid?: string;

  constructor({ tasks = [], workspaceUuid }: TaskManagerProps) {
    super();
    this.workspaceUuid = workspaceUuid;
    this.tasks = tasks.map((data: TaskProps) => this.createTaskFromData(data));
  }

  protected onInit() {
    this.ctx.$dispatch("starwind:init");
  }

  get isEmpty() {
    return this.tasks.length === 0;
  }

  private createTaskFromData(data: TaskProps): Task {
    return new Task({ data });
  }

  removeTask(uuid: string) {
    this.tasks = this.tasks.filter((task) => task.uuid !== uuid);
  }

  addTask(data: TaskProps) {
    this.tasks = [...this.tasks, this.createTaskFromData(data)];
  }

  async deleteTask(task: Task) {
    const deleted = await task.delete();

    if (!deleted) return;
    this.removeTask(task.uuid);
  }
}