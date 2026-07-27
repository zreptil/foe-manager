import {BaseData} from '@/_model/base-data';

export class LevelData extends BaseData {
  level: number;
  cost: number;
  rewards: number[];
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
      d: this.ownerCost,
      e: this.ownerPercent,
      f: this.ownerSum
    };
  }

  override _fillFromJson(json: any, def?: any): void {
    this.level = json?.a ?? def?.level;
    this.cost = json?.b ?? def?.cost;
    this.rewards = json?.c ?? def?.rewards;
    this.ownerCost = json?.d ?? def?.ownerCost;
    this.ownerPercent = json?.e ?? def?.ownerPercent;
    this.ownerSum = json?.f ?? def?.ownerSum;
  }
}

