import {BaseData} from '@/_model/base-data';
import {LevelData} from '@/_model/level-data';

export class GbData extends BaseData {
  key: string;
  name: string;
  levels: LevelData[];

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    const ret: any = {
      a: this.key,
      b: this.name
    };
    ret.c = [];
    for (const level of this.levels) {
      ret.c.push(level.asJson);
    }
    return ret;
  }

  override _fillFromJson(json: any, def?: any): void {
    this.key = json?.a ?? def?.key;
    this.name = json?.b ?? def?.name;
    this.levels = [];
    const src = json?.c ?? def?.levels ?? [];
    for (const level of src) {
      this.levels.push(new LevelData(level));
    }
  }
}

