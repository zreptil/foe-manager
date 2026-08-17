import {BaseData} from '@/_model/base-data';

export type QiSource = { x: number, y: number, key: string };

export class QiDef extends BaseData {
  name: string;
  area: QiSource[];

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    return {
      a: this.name,
      b: this.area
    };
  }

  override _fillFromJson(json: any, def?: any): void {
    this.name = json?.a ?? def?.name;
    this.area = json?.b ?? def?.area ?? [];
  }
}
