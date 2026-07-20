import {Injectable} from '@angular/core';
import {Utils} from '@/classes/utils';
import {Log} from '@/_services/log.service';
import {HttpClient, HttpRequest} from '@angular/common/http';
import {lastValueFrom, throwError, timeout} from 'rxjs';
import {oauth2SyncType} from '@/_services/sync/oauth2pkce';
import {LangData} from '@/_model/lang-data';
import {SyncService} from '@/_services/sync/sync.service';
import {LanguageService} from '@/_services/language.service';
import {EnvironmentService} from '@/_services/environment.service';
import {MessageService} from '@/_services/message.service';
import {AppData, TypeUser, UserType} from '@/_model/app-data';
import {MatFormFieldAppearance} from '@angular/material/form-field';
import {VERSION} from '@/version';
import {ImgurService} from '@/_services/oauth2/imgur.service';
import {FormConfig} from '@/forms/form-config';
import {EnumSitemode, EnumSortmode, UserData} from '@/_model/user-data';
import {GbUserData} from '@/_model/gb-user-data';
import {GbData} from '@/_model/gb-data';
import {AssistService} from '@/_services/assist.service';
import {BuildingService} from '@/_services/building.service';

class CustomTimeoutError extends Error {
  constructor() {
    super('It was too slow');
    this.name = 'CustomTimeoutError';
  }
}

export let GLOBALS: GlobalsService;

@Injectable({
  providedIn: 'root'
})
export class GlobalsService {
  version = VERSION;
  skipStorageClear = false;
  devSupport = false;
  debugFlag = 'debug';
  debugActive = 'yes';
  isConfigured = false;
  dragPos: any = {};
  themeChanged = false;
  editColors = false;
  maxLogEntries = 20;
  storageVersion: string;
  currentPage: string;
  language: LangData;
  _syncType: oauth2SyncType;
  oauth2AccessToken: string = null;
  listConfig: FormConfig[] = [];
  listConfigOrg: FormConfig[] = [];
  ownTheme: any;
  appearance: MatFormFieldAppearance = 'fill';
  currentUserType: TypeUser;
  themeList: any = {
    null: GlobalsService.msgThemeAuto,
    standard: GlobalsService.msgThemeStandard,
    xmas: GlobalsService.msgThemeXmas,
    own: GlobalsService.msgThemeOwn,
  }
  titles: any = {
    settings: $localize`Settings`,
    password: $localize`Passwordchange`,
    plan: $localize`Plan`,
    tasks: $localize`Tasks`,
    day: $localize`Daily Schedule`,
    dsgvo: $localize`Dataprotection`,
    help: $localize`Information`,
    impressum: $localize`Impressum`,
    welcome: $localize`Welcome to foe-manager`,
    whatsnew: $localize`Once upon a time...`,
    linkPicture: $localize`Link Picture`,
    imgurSelector: $localize`Imgur Picture Selector`,
  };
  siteConfig: any = {
    pdfTarget: '',
    pdfData: null,
    ppPdfSameWindow: false,
    editField: '',
    delayTimer: 0,
    repeatTimer: 0,
    sniperValue: 0,
    levelGbKey: '',
    levelValue: 0
  }
  urlPlayground = 'http://pdf.zreptil.de/playground.php';
  appData: AppData;
  user: UserData;
  saveImmediately = true;
  showCompleted = false;
  _styleForPanels: any = {};
  formListParams: any;
  private flags = '';

  constructor(public http: HttpClient,
              public bs: BuildingService,
              public assist: AssistService,
              public sync: SyncService,
              public ls: LanguageService,
              public msg: MessageService,
              public imgur: ImgurService,
              public env: EnvironmentService) {
    GLOBALS = this;
    this.loadWebData();
    const elem = document.querySelector('head>title');
    if (elem != null && this.isLocal) {
      elem.innerHTML = `${elem.innerHTML} (local)`;
    }
    this.loadSharedData().then(_ => {
      this.appData = new AppData();
      this.imgur.init();
    });
  }

  static _msgThemeOwn = $localize`:theme selection - own|:Own`;

  static get msgThemeOwn(): string {
    return GlobalsService._msgThemeOwn;
  }

  static set msgThemeOwn(value: string) {
    GlobalsService._msgThemeOwn = value;
  }

  static get msgThemeAuto(): string {
    return $localize`:theme selection - automatic|:Automatic`;
  }

  static get msgThemeStandard(): string {
    return $localize`:theme selection - standard|:Standard`;
  }

  static get msgThemeXmas(): string {
    return $localize`:theme selection - christmas|:X-Mas`;
  }

  get currentUserTypeName(): string {
    for (const key of Object.keys(AppData.UserTypes)) {
      if (this.currentUserType?.value === AppData.UserTypes[key].value) {
        return AppData.UserTypes[key].name;
      }
    }
    return 'Unknown';
  }

  _isDebug = false;

  get isDebug(): boolean {
    return this._isDebug && Log.mayDebug;
  }

  set isDebug(value: boolean) {
    if (!Log.mayDebug) {
      value = false;
    }
    this._isDebug = value;
  }

  get mayDebug(): boolean {
    return Log.mayDebug;
  }

  get mayEdit(): boolean {
    return this.may('edit');
  }

  get isAdmin(): boolean {
    return this.may('admin');
  }

  get runsLocal(): boolean {
    return window.location.href.indexOf('/localhost:') >= 0;
  }

  _isLocal = window.location.href.indexOf('/localhost:') >= 0;

  get isLocal(): boolean {
    return this._isLocal;
  }

  set isLocal(value: boolean) {
    this._isLocal = value;
  }

  get appTitle(): string {
    return document.querySelector('head>title').innerHTML;
  }

  get themeName(): string {
    return this.themeList[this._theme];
  }

  _theme: string;

  get theme(): string {
    let ret = this.baseThemeName(this._theme);
    if (ret === 'own') {
      return GlobalsService.msgThemeOwn;
    }
    return ret;
  }

  set theme(value: string) {
    if (this.themeList[value] != null) {
      this._theme = value;
    } else {
      this._theme = 'own';
      GlobalsService.msgThemeOwn = value;
    }
  }

  get themeKey(): string {
    if (Utils.isEmpty(this._theme)) {
      const ret = this.baseThemeName(this._theme);
      if (!Utils.isEmpty(ret)) {
        return ret;
      }
    }
    if (this.themeList[this._theme] != null) {
      return this._theme;
    }
    return 'own';
  }

  get usertypeList(): TypeUser[] {
    const ret: TypeUser[] = [];
    for (const key of Object.keys(AppData.UserTypes)) {
      const type = AppData.UserTypes[key];
      if (GLOBALS.appData?.usertype & type.value) {
        ret.push(type);
      }
    }
    return ret;
  }

  get currentUsertypes(): string {
    const ret: string[] = [];
    for (const key of Object.keys(AppData.UserTypes)) {
      const type = AppData.UserTypes[key];
      if (GLOBALS.appData?.usertype & type.value) {
        ret.push(type.label);
      }
    }
    return Utils.join(ret, ', ');
  }

  get usertypes(): any[] {
    const ret: any[] = [];
    for (const key of Object.keys(AppData.UserTypes)) {
      const type = AppData.UserTypes[key];
      if (type.value !== UserType.Admin) {
        ret.push(type);
      }
    }
    return ret;
  }

  get listPeriodShift(): PeriodShift[] {
    return [
      new PeriodShift($localize`Selected Period`, 0),
      new PeriodShift($localize`One Month ago`, 1),
      new PeriodShift($localize`Two Months ago`, 2),
      new PeriodShift($localize`Three Months ago`, 3),
      new PeriodShift($localize`Six Months ago`, 6),
      new PeriodShift($localize`One Year ago`, 12)
    ];
  }

  _currPeriodShift: PeriodShift;

  get currPeriodShift(): PeriodShift {
    if (this._currPeriodShift == null) {
      this._currPeriodShift = this.listPeriodShift[0];
    }
    return this._currPeriodShift;
  }

  _gbList: GbData[];

  get gbList() {
    if (this.bs.isModeBuildings && GLOBALS.user.activeGbKey != null) {
      if (this._gbList == null) {
        this._gbList = this.assist.gbList;
      }
      const gb = this._gbList.find(gb => gb.key === GLOBALS.user.activeGbKey);
      if (gb != null) {
        return [gb];
      } else {
        GLOBALS.user.activeGbKey = null;
        GLOBALS.user.activeUserGb = null;
      }
    }
    if (this._gbList == null) {
      switch (GLOBALS.user.siteMode) {
        case EnumSitemode.manage:
          this._gbList = this.assist.gbList.filter(gb => GLOBALS.user.listGb[gb.key] != null);
          break;
        default:
          this._gbList = this.assist.gbList;
      }
    }
    switch (GLOBALS.user.gbSort[GLOBALS.user.siteMode]) {
      case EnumSortmode.none:
        break;
      case EnumSortmode.alpha:
        this._gbList = [...this._gbList].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case EnumSortmode.level:
        this._gbList = [...this._gbList].sort((a, b) =>
          -Utils.compare(this.bs.gbForUser(a)?.level, this.bs.gbForUser(b)?.level));
        break;
      case EnumSortmode.timeCopied:
        this._gbList = [...this._gbList].sort((a, b) =>
          -Utils.compare(this.bs.gbForUser(a)?.timeCopied ?? 0, this.bs.gbForUser(b)?.timeCopied ?? 0));
        break;
    }
    return this._gbList;
  }

  loadAppData() {
    this.appData = new AppData();
  }

  async loadSharedData() {
    GLOBALS.user = new UserData();
    let storage: any = {};
    try {
      storage = JSON.parse(localStorage.getItem('sharedData')) ?? {};
    } catch {
    }
    let syncData: any = await this.sync.downloadFile(this.env.settingsFilename);
    if (syncData != null) {
      try {
        if (+syncData.s0 > +storage.s0) {
          storage = syncData;
        }
      } catch {
      }
    }

    this.storageVersion = storage.s1;
    GLOBALS.user.listGb = {};
    if (Array.isArray(storage.s2)) {
      const src = storage.s2;
      storage.s2 = {};
      for (const item of src) {
        storage.s2[item.a] = {a: item.b, b: item.c};
      }
    }
    const src = storage.s2 ?? {};
    for (const key of Object.keys(src)) {
      GLOBALS.user.listGb[key] = new GbUserData(src[key]);
    }
    GLOBALS.user.siteMode = storage.s3 ?? EnumSitemode.select;
    GLOBALS.user.username = storage.s4 ?? 'Bitte Name eingeben';
    if (typeof (storage.s5) !== 'object') {
      storage.s5 = {0: EnumSortmode.timeCopied, 1: EnumSortmode.alpha, 2: EnumSortmode.alpha};
    }
    GLOBALS.user.gbSort = storage.s5 ?? {0: EnumSortmode.timeCopied, 1: EnumSortmode.alpha, 2: EnumSortmode.alpha};
    GLOBALS.user.activeGbKey = storage.s6;
    if (storage.s7 != null) {
      GLOBALS.user.activeUserGb = new GbUserData(storage.s7);
    } else {
      GLOBALS.user.activeUserGb = null;
    }
    GLOBALS.user.userzoom = storage.s8 ?? 0;

    // validate values
  }

  saveSharedData(): void {
    const storage: any = {
      s0: Date.now(),
      s1: this.version,
      s2: {},
      s3: GLOBALS.user.siteMode,
      s4: this.user.username,
      s5: this.user.gbSort,
      s6: GLOBALS.user.activeGbKey,
      s7: GLOBALS.user.activeUserGb?.asJson,
      s8: GLOBALS.user.userzoom
    };
    for (const key of Object.keys(GLOBALS.user.listGb)) {
      storage.s2[key] = GLOBALS.user.listGb[key].asJson;
    }
    const data = JSON.stringify(storage);
    localStorage.setItem('sharedData', data);
    if (this.sync.hasSync) {
      this.sync.uploadFile(this.env.settingsFilename, data);
    }
  }

  loadWebData(): void {
    let storage: any = {};
    try {
      storage = JSON.parse(localStorage.getItem('webData')) ?? {};
    } catch {
    }

    const code = storage.w0 ?? 'en-GB';
    this.language = this.ls.languageList.find((lang) => lang.code === code);
    this._syncType = storage.w1 ?? oauth2SyncType.none;
    this.oauth2AccessToken = storage.w2;
    this.theme = storage.w3 ?? 'standard';
    this.devSupport = storage.w4 ?? false;

    // validate values
    if (this.oauth2AccessToken == null) {
      this._syncType = oauth2SyncType.none;
    }
  }

  saveWebData(): void {
    const storage: any = {
      w0: this.language.code ?? 'de_DE',
      w1: this._syncType,
      w2: this.oauth2AccessToken,
      w3: this.theme,
      w4: this.devSupport
    };
    localStorage.setItem('webData', JSON.stringify(storage));
  }

  async requestJson(url: string, params?: { method?: string, options?: any, body?: any, showError?: boolean, asJson?: boolean, timeout?: number }) {
    return this.request(url, params).then(response => {
      return response?.body;
    });
  }

  async request(url: string, params?: { method?: string, options?: any, body?: any, showError?: boolean, asJson?: boolean, timeout?: number }) {
    params ??= {};
    params.method ??= 'get';
    params.showError ??= true;
    params.asJson ??= false;
    params.timeout ??= 1000;
    let response;
    const req = new HttpRequest(params.method, url,
      null,
      params.options);
    try {
      switch (params.method.toLowerCase()) {
        case 'post':
          response = await lastValueFrom(this.http.post(url, params.body, params.options).pipe(timeout({
            each: params.timeout,
            with: () => throwError(() => new CustomTimeoutError())
          })));
          break;
        default:
          response = await lastValueFrom(this.http.request(req).pipe(timeout({
            each: params.timeout,
            with: () => throwError(() => new CustomTimeoutError())
          })));
          break;
      }
    } catch (ex: any) {
      if (ex instanceof CustomTimeoutError) {
        response = $localize`There was no answer within ${params.timeout / 1000} seconds at ${url}`;
      } else if (ex?.messge != null) {
        response = ex.message;
      } else {
        response = ex;
      }
    }
    return params.asJson ? response.body : response;
  }

  baseThemeName(name: string): string {
    if (Utils.isEmpty(name)) {
      if (Utils.now.getMonth() === 11) {
        return 'xmas';
      } else {
        return 'standard';
      }
    }
    return name;
  }

  saveImmediate(saveToAppData?: () => void, _onDone?: () => void) {
    if (this.saveImmediately) {
      saveToAppData?.();
    }
  }

  openLink(url: string) {
    window.open(url, '_blank');
  }

  loadFormListParams(): void {
    if (this.formListParams != null) {
      for (const cfg of this.listConfig) {
        cfg.fillFromString(this.formListParams[cfg.form.dataId] ?? {});
      }
      for (const cfg of this.listConfigOrg) {
        cfg.fillFromString(this.formListParams[cfg.form.dataId] ?? {});
      }
    }
  }

  removeFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }
  }

  private may(key: string): boolean {
    return this.flags.indexOf(`|${key}|`) >= 0;
  }
}

export class PeriodShift {
  constructor(public title: string, public months: number) {
  }
}

