import {BaseData} from '@/_model/base-data';
import {GbUserData} from '@/_model/gb-user-data';
import {signal} from '@angular/core';
import {QiDef} from '@/_model/qi-def';
import {EnumEpoch} from '@/_model/gb-data';
import {EventConfig} from '@/_model/event-config-data';

export enum EnumPermission {
  keepUserToken
}

export enum EnumSitemode {
  select,
  manage,
  buildings,
  qi,
  events
}

export enum EnumSortmode {
  none,
  alpha,
  level,
  timeCopied,
  type,
  own,
  epoch,
}

export class UserData extends BaseData {
  username: string;
  showLevelArrows: boolean;
  resetLevelColor: boolean;
  userzoom: number;
  permissions: number[];
  usertype: number;
  listQi: QiDef[];
  readonly _siteMode = signal<EnumSitemode>(EnumSitemode.select);
  readonly _factor = signal<number>(1.9);
  gbSort: { [key: string]: { mode: EnumSortmode, asc: boolean } };
  listWorld: {
    name: string;
    listGb: { [key: string]: GbUserData };
  }[];
  qiGroupIdx: number;
  eventConfig: EventConfig;
  readonly _activeGbKey = signal<string>(null);
  activeUserGb: GbUserData;
  showInfoGb: boolean;
  copyColorIdx: number;
  worldIdx: number;

  constructor(json?: any) {
    super(json);
  }

  get factor() {
    return this._factor?.() ?? 1.9;
  }

  set factor(value: number) {
    this._factor?.set?.(value);
  }

  get listGb() {
    return this.listWorld?.[this.worldIdx]?.listGb ?? {};
  }

  get worldName(): string {
    if (this.worldIdx > this.listWorld?.length) {
      this.worldIdx = 0;
    }
    return this.listWorld?.[this.worldIdx]?.name;
  }

  set worldName(value: string) {
    const world = this.listWorld[this.worldIdx];
    if (world != null) {
      world.name = value;
    }
  }

  _epochList: number[];

  get epochList(): number[] {
    if (this._epochList == null) {
      this._epochList = [];
      for (let i = 0; i < Object.keys(EnumEpoch).length; i++) {
        this._epochList.push(i);
      }
    }
    return this._epochList;
  }

  get siteMode(): EnumSitemode {
    return this._siteMode?.();
  }

  set siteMode(value: EnumSitemode) {
    this._siteMode?.set(value);
  }

  get activeGbKey(): string {
    return this._activeGbKey?.();
  }

  set activeGbKey(value: string) {
    this._activeGbKey?.set(value);
  }

  override get _asJson(): any {
    const ret: any = {
      a: this.username,
      b: this.permissions.filter(entry => (+(entry ?? 0)) !== 0),
      c: this.usertype,
      e: this.siteMode,
      f: this.activeGbKey,
      g: this.activeUserGb?.asJson,
      h: this.showInfoGb,
      i: this.showLevelArrows,
      j: this.qiGroupIdx,
      k: this.resetLevelColor,
      l: this._epochList,
      m: this.factor,
    };

    ret.f = {};
    for (const key of Object.keys(this.listGb)) {
      ret.f[key] = this.listGb[key].asJson;
    }
    return ret;
  }

  override _fillFromJson(json: any, def?: any): void {
    this.username = json?.a ?? def?.username ?? 'Bitte Name eingeben';
    this.permissions = (json?.b ?? def?.permission ?? []).map((entry: string) => +entry);
    this.usertype = json?.c ?? def?.usertype;
    this.siteMode = json?.e ?? def?.siteMode ?? EnumSitemode.select;
    let src = json?.f ?? def?.listGb ?? {};
    for (const key of Object.keys(src)) {
      this.listGb[key] = new GbUserData(src[key]);
    }
    this.activeGbKey = json?.g?.a ?? def?.activeGbKey;
    src = json?.g?.b ?? def?.activeUserGb;
    if (src != null) {
      this.activeUserGb = new GbUserData(src);
    } else {
      this.activeUserGb = null;
    }
    this.showInfoGb = json?.h ?? def?.showInfo ?? false;
    this.showLevelArrows = json?.i ?? def?.showLevelArrows ?? true;
    this.qiGroupIdx = json?.j ?? def?.qiGroupIdx ?? 0;
    this.resetLevelColor = json?.k ?? def?.resetLevelColor ?? false;
    this._epochList = json?.l ?? def?.epochList;
    this.factor = json?.m ?? def?.factor ?? 1.9;
  }
}
