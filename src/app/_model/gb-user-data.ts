import {BaseData} from '@/_model/base-data';

export class GbUserData extends BaseData {
  level: number;
  timeCopied: number;
  colorIdx: number;
  ownerValue: number;
  levelMarked: boolean[];
  sniperValues: number[];
  active: boolean;
  player: string;

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    return {
      a: this.level,
      b: this.timeCopied,
      c: this.colorIdx,
      d: this.levelMarked,
      e: this.active,
      f: this.player,
      g: +this.ownerValue,
      h: this.sniperValues
    };
  }

  override _fillFromJson(json: any, def?: any): void {
    this.level = json?.a ?? def?.level;
    this.timeCopied = json?.b ?? def?.timeCopied;
    this.colorIdx = json?.c ?? def?.marked ?? 0;
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
    this.player = json?.f ?? def?.user;
    this.ownerValue = +(json?.g ?? def?.ownerValue ?? 0);
    this.sniperValues = json?.h ?? def?.sniperValues ?? [];
  }
}

