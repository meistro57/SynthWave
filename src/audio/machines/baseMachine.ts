import type { MachineType } from "./types";

export abstract class Machine {
  readonly id: string;
  readonly type: MachineType;
  name: string;

  protected constructor(id: string, type: MachineType, name: string) {
    this.id = id;
    this.type = type;
    this.name = name;
  }

  abstract init(): Promise<void>;
  abstract dispose(): void;
  abstract setOutputLevel(level: number): void;
}
