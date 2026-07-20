import {BaseData} from '@/_model/base-data';

export class GbUserData extends BaseData {
  level: number;
  timeCopied: number;
  marked: boolean;
  ownerValue: number;
  levelMarked: boolean[];
  sniperValues: number[] = [];
  active: boolean;

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    return {
      a: this.level,
      b: this.timeCopied,
      c: this.marked,
      d: this.levelMarked,
      e: this.active,
    };
  }

  override _fillFromJson(json: any, def?: any): void {
    this.level = json?.a ?? def?.level;
    this.timeCopied = json?.b ?? def?.timeCopied;
    this.marked = json?.c ?? def?.marked ?? false;
    const src = json?.d ?? def?.levelMarked;
    this.levelMarked = [];
    for (let i = 0; i < 5; i++) {
      let v = src?.[i];
      if (v == null) {
        v = true;
      }
      this.levelMarked.push(v);
    }
    this.active = json?.e ?? def?.active ?? true;
  }
}

