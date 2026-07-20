import {BaseData} from '@/_model/base-data';

export class UserGbData extends BaseData {
  key: string;
  level: number;
  timeCopied: number;

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    return {
      a: this.key,
      b: this.level,
      c: this.timeCopied
    };
  }

  override _fillFromJson(json: any, def?: any): void {
    this.key = json?.a ?? def?.key;
    this.level = json?.b ?? def?.level;
    this.timeCopied = json?.c ?? def?.timeCopied;
  }
}

