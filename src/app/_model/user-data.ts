import {BaseData} from '@/_model/base-data';
import {GbUserData} from '@/_model/gb-user-data';
import {signal} from '@angular/core';

export enum EnumPermission {
  keepUserToken
}

export enum EnumSitemode {
  select,
  manage,
  buildings
}

export enum EnumSortmode {
  none,
  alpha,
  level,
  timeCopied
}

export class UserData extends BaseData {
  username: string;
  userzoom: number;
  permissions: number[];
  usertype: number;
  readonly _siteMode = signal<EnumSitemode>(EnumSitemode.select);
  gbSort: { [key: string]: EnumSortmode };
  listGb: { [key: string]: GbUserData };
  readonly _activeGbKey = signal<string>(null);
  activeUserGb: GbUserData;

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
  }
}
