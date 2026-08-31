import {BaseData} from '@/_model/base-data';
import {GbUserData} from '@/_model/gb-user-data';
import {signal} from '@angular/core';
import {QiDef} from '@/_model/qi-def';

export enum EnumPermission {
  keepUserToken
}

export enum EnumSitemode {
  select,
  manage,
  buildings,
  players,
  qi
}

export enum EnumSortmode {
  none,
  alpha,
  level,
  timeCopied,
  type,
  own
}

export class UserData extends BaseData {
  username: string;
  showLevelArrows: boolean;
  resetLevelColor: boolean;
  userzoom: number;
  permissions: number[];
  usertype: number;
  readonly _siteMode = signal<EnumSitemode>(EnumSitemode.select);
  gbSort: { [key: string]: { mode: EnumSortmode, asc: boolean } };
  listGb: { [key: string]: GbUserData };
  listQi: QiDef[];
  qiGroupIdx: number;
  readonly _activeGbKey = signal<string>(null);
  activeUserGb: GbUserData;
  activePlayer: string;
  showInfoGb: boolean;

  constructor(json?: any) {
    super(json);
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
      k: this.resetLevelColor
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
    this.listGb = {};
    let src = json?.d ?? def?.gbList;
    if (src != null) {
      json.f = {};
      for (const entry of src) {
        json.f[entry.a] = {a: entry.b, b: entry.c};
      }
    }
    this.siteMode = json?.e ?? def?.siteMode ?? EnumSitemode.select;
    src = json?.f ?? def?.listGb ?? {};
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
  }
}
