import {BaseData} from '@/_model/base-data';

export class EventConfig extends BaseData {
  eventIdx: number;
  eventCount: number;
  progressIdx: number;

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    return {
      a: this.eventIdx,
      b: this.eventCount,
      c: this.progressIdx
    };
  }

  override _fillFromJson(json: any, def?: any): void {
    this.eventIdx = json?.a ?? def?.eventIdx ?? 0;
    this.eventCount = json?.b ?? def?.eventCount ?? 0;
    this.progressIdx = json?.c ?? def?.progressIdx ?? 0;
  }
}
