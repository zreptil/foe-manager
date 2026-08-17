import {BaseData} from '@/_model/base-data';

export class QiData extends BaseData {
  key: string;
  name: string;
  w: number;
  h: number;

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    return {
      a: this.key,
      b: this.name,
      c: this.w,
      d: this.h
    };
  }

  override _fillFromJson(json: any, def?: any): void {
    this.key = json?.a ?? def?.key;
    this.name = json?.b ?? def?.name;
    this.w = json?.c ?? def?.w ?? 0;
    this.h = json?.d ?? def?.h ?? 0;
  }
}
