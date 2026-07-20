import {BaseData} from '@/_model/base-data';

export class LevelData extends BaseData {
  level: number;
  cost: number;
  rewards: number[];
  blocks: Array<number | null>;
  ownerCost: number;
  ownerPercent: number;
  ownerSum: number;

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    return {
      a: this.level,
      b: this.cost,
      c: this.rewards,
      d: this.blocks,
      e: this.ownerCost,
      f: this.ownerPercent,
      g: this.ownerSum
    };
  }

  override _fillFromJson(json: any, def?: any): void {
    this.level = json?.a ?? def?.level;
    this.cost = json?.b ?? def?.cost;
    this.rewards = json?.c ?? def?.rewards;
    this.blocks = json?.d ?? def?.blocks;
    this.ownerCost = json?.e ?? def?.ownerCost;
    this.ownerPercent = json?.f ?? def?.ownerPercent;
    this.ownerSum = json?.g ?? def?.ownerSum;
  }
}

