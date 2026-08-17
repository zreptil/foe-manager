import {QiData} from '@/_model/qi-data';

export class QiBuilding {
  constructor(public x: number,
              public y: number,
              public qiData: QiData) {
  }

  get type(): string {
    return this.qiData?.key?.split('-')?.[0];
  }

  get width() {
    return this.qiData?.w;
  }

  get height() {
    return this.qiData?.h;
  }

  get name() {
    return this.qiData?.name;
  }

  get asJson() {
    return {
      x: this.x,
      y: this.y,
      key: this.qiData.key
    };
  }
}

