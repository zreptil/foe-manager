import {Component, effect, OnInit} from '@angular/core';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {SyncService} from '@/_services/sync/sync.service';
import {MessageService} from '@/_services/message.service';
import {WhatsNewComponent} from '@/components/whats-new/whats-new.component';
import {ImpressumComponent} from '@/components/impressum/impressum.component';
import {WelcomeComponent} from '@/components/welcome/welcome.component';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {SettingsComponent} from '@/components/settings/settings.component';
import {Utils} from '@/classes/utils';
import {DsgvoComponent} from '@/components/dsgvo/dsgvo.component';
import {EnvironmentService} from '@/_services/environment.service';
import {ImgurService} from '@/_services/oauth2/imgur.service';
import {GoogleService} from '@/_services/oauth2/google.service';
import {GbDataService} from '@/_services/gb-data.service';
import {EnumDisplaymode, EnumSitemode, EnumSortmode} from '@/_model/user-data';
import {BuildingService} from '@/_services/building.service';
import {DialogResult, DialogResultButton} from '@/_model/dialog-data';
import {FoeImportService} from '@/_services/foe-import.service';

class FactorDefinition {
  constructor(public list: number[],
              public cssClass: string,
              public isGold: boolean) {
  }

  get factor(): number {
    return this.isGold ? GLOBALS.user.factorGold : GLOBALS.user.factor;
  }

  set factor(value: number) {
    if (this.isGold) {
      GLOBALS.user.factorGold = value;
    } else {
      GLOBALS.user.factor = value;
    }
  }

  get factorEdit(): number {
    return this.isGold ? GLOBALS.user.editFactorGold : GLOBALS.user.editFactor;
  }

  set factorEdit(value: number) {
    if (this.isGold) {
      GLOBALS.user.editFactorGold = value;
    } else {
      GLOBALS.user.editFactor = value;
    }
  }
}

/*
* Listenansicht für Gebäude
* - Name
* - Level
* - konfigurierbare Spalten
* */
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: false
})
class MainComponent implements OnInit {
  closeData: CloseButtonData = {
    viewInfo: 'Main',
    colorKey: 'main',
    showClose: false
  };
  defaultWorldName = 'Stadt';
  password: string;
  protected readonly Utils = Utils;
  protected readonly EnumSitemode = EnumSitemode;
  protected readonly EnumSortmode = EnumSortmode;

  constructor(public globals: GlobalsService,
              public msg: MessageService,
              public sync: SyncService,
              public imgur: ImgurService,
              public google: GoogleService,
              public gbsrv: GbDataService,
              public bs: BuildingService,
              public env: EnvironmentService,
              public fis: FoeImportService) {
    this.gbsrv.loadFromAsset();
    effect(() => {
      GLOBALS._user();
      GLOBALS.user._siteMode();
      GLOBALS.force();
      GLOBALS._gbList = null;
    });
  }

  _factorDefinitions: FactorDefinition[] = [
    new FactorDefinition(GLOBALS.factorList, '', false),
    new FactorDefinition(GLOBALS.factorGoldList, 'gold', true)
  ];

  get factorDefinitions() {
    return this._factorDefinitions.filter((d: any) => GLOBALS.isCurrentData ? true : !d.isGold)
  }

  get iconForDisplayMode() {
    switch (GLOBALS.user.displayMode) {
      case EnumDisplaymode.tiles:
        return 'grid_view';
      case EnumDisplaymode.list:
        return 'list';
    }
  }

  get styleForContent(): any {
    return {fontSize: `${GLOBALS.user.userzoom + 1}em`};
  };

  get classForHeader(): string[] {
    const ret = ['mat-elevation-z4'];
    if (GLOBALS.isDebug) {
      ret.push('debug');
    }
    return ret;
  }

  get gbJson(): string {
    let ret: any = {version: this.gbsrv.assistVersion, list: []};
    for (const gb of this.gbsrv.gbList) {
      ret.list.push(gb.asJson);
    }
    return JSON.stringify(ret);
  }

  get classForContent() {
    const ret: string[] = [];
    // GLOBALS.user.siteMode === EnumSitemode.buildings &&
    if (!GLOBALS.isCurrentData) {
      ret.push('historic');
    }
    if (GLOBALS.user.activeUserGb != null) {
      ret.push('building');
    }
    if (GLOBALS.user.siteMode === EnumSitemode.analysis) {
      ret.push('analysis');
    }
    return ret;
  }

  get toolbarTitle() {
    switch (GLOBALS.user.siteMode) {
      case EnumSitemode.manage:
        if (GLOBALS.user.activeUserGb != null) {
          return null;
        }
        return $localize`Gebäude in`;
      case EnumSitemode.select:
        return $localize`Bitte die Gebäude auswählen, die in ${GLOBALS.user.worldName ?? $localize` Deiner Stadt`} stehen`;
      case EnumSitemode.buildings:
        return $localize`Gebäude`;
      case EnumSitemode.qi:
        return $localize`Quanteninvasion`;
      case EnumSitemode.events:
        return $localize`Ereignisse`;
      case EnumSitemode.analysis:
        return $localize`Auswertung für`;
      default:
        return $localize`Gebäude in`;
    }
  }

  get classForGbList() {
    const ret: string[] = [];
    if (this.showNavigation) {
      ret.push('navigate');
    } else if (this.bs.isModeManage && GLOBALS.user.displayMode === EnumDisplaymode.list) {
      ret.push('display_list');
    }

    ret.push(EnumSortmode[GLOBALS.user?.gbSort[GLOBALS.user?.siteMode].mode]);
    return ret;
  }

  get showNavigation() {
    return GLOBALS.user.activeGbKey != null;
  }

  get dsLabel() {
    return GLOBALS.isCurrentData
      ? $localize`Aktuelle Daten`
      : $localize`Historische Daten`;
  }

  get dsIcon() {
    return GLOBALS.isCurrentData ? 'check' : 'history';
  }

  labelForMode(mode?: number) {
    mode ??= GLOBALS.user.siteMode;
    switch (mode) {
      case EnumSitemode.select:
        return null;
      case EnumSitemode.manage:
        return $localize`Auswahl`;
      case EnumSitemode.qi:
        return $localize`Quanteninvasion`;
      case EnumSitemode.events:
        return $localize`Ereignisse`;
      case EnumSitemode.analysis:
        return $localize`Auswertung`;
    }
    return $localize`Gebäude`;
  }

  iconForMode(mode?: number) {
    mode ??= GLOBALS.user.siteMode;
    switch (mode) {
      case EnumSitemode.select:
        return 'check';
      case EnumSitemode.manage:
        return 'select_check_box';
      case EnumSitemode.qi:
        return 'map';
      case EnumSitemode.events:
        return 'event';
      case EnumSitemode.analysis:
        return 'bar_chart';
    }
    return 'apartment';
  }

  ngOnInit(): void {
    if (GLOBALS.isNewVersion) {
      this.msg.showPopup(WhatsNewComponent, 'whatsnew', {});
    }
  }

  clickLocalTitle() {
    GLOBALS.isLocal = !GLOBALS.isLocal;
  }

  onClick(key: string) {
    switch (key) {
      case 'whatsnew':
        this.msg.showPopup(WhatsNewComponent, 'whatsnew', {});
        break;
      case 'impressum':
        this.msg.showPopup(ImpressumComponent, 'impressum', {});
        break;
      case 'dsgvo':
        this.msg.showPopup(DsgvoComponent, 'dsgvo', {});
        break;
      case 'welcome':
        this.msg.showPopup(WelcomeComponent, 'welcome', {});
        break;
      case 'settings':
        this.msg.showPopup(SettingsComponent, 'settings', {});
        break;
      case 'logout':
        GLOBALS.saveSharedData();
        this.msg.showPopup(WelcomeComponent, 'welcome', {});
        break;
    }
  }

  protected clickImport(evt: PointerEvent) {
    evt.preventDefault();
    this.gbsrv.importData();
  }

  protected toggleMode(evt: PointerEvent, mode?: number) {
    evt.preventDefault();
    GLOBALS.user.activeUserGb = null;
    GLOBALS.user.activeGbKey = null;
    if (mode != null) {
      GLOBALS.user.siteMode = mode;
    } else {
      switch (GLOBALS.user.siteMode) {
        case EnumSitemode.select:
          GLOBALS.user.siteMode = EnumSitemode.manage;
          break;
        case EnumSitemode.manage:
          GLOBALS.user.siteMode = EnumSitemode.select;
          break;
      }
    }
    GLOBALS._gbList = null;
    GLOBALS.saveSharedData();
  }

  protected clickWorld(evt: PointerEvent, idx: number) {
    evt.preventDefault();
    GLOBALS.user.worldIdx = idx;
    GLOBALS._gbList = null;
    GLOBALS.force.set(!GLOBALS.force());
    GLOBALS.saveSharedData();
  }

  protected clickAddWorld(evt: PointerEvent) {
    evt.preventDefault();
    GLOBALS.user.listWorld.push({name: $localize`Neue Welt`, listGb: {}});
    GLOBALS.user.worldIdx = GLOBALS.user.listWorld.length - 1;
    GLOBALS._gbList = null;
    GLOBALS.siteConfig.editField = 'world';
  }

  protected clickDeleteWorld(evt: PointerEvent, idx: number) {
    evt.preventDefault();
    if (GLOBALS.user.listWorld.length > 1) {
      GLOBALS.msg.confirm(`Soll @${GLOBALS.user.listWorld[idx].name}@ wirklich entfernt werden?`).subscribe((result: DialogResult) => {
        if (result.btn === DialogResultButton.yes) {
          GLOBALS.user.listWorld.splice(idx, 1);
          GLOBALS.saveSharedData();
        }
      });
    }
  }

  protected clickEdit(evt: PointerEvent, key: string) {
    evt.preventDefault();
    GLOBALS.siteConfig.editField = key;
  }

  protected saveEdit() {
    switch (GLOBALS.siteConfig.editField) {
      case 'world':
        if (Utils.isEmpty(GLOBALS.user.worldName)) {
          GLOBALS.user.worldName = null;
        }
        GLOBALS.saveSharedData();
        break;
      case 'cityBuilder':
        this.fis.importCity(GLOBALS.user.username, this.password, GLOBALS.user.worldName,
          (result) => {
            if (result?.success) {
              this.msg.info($localize`Die Stadt wurde als ${result.name} exportiert.`).subscribe({
                next: (ret: DialogResult) => {
                  if (ret.btn === DialogResultButton.ok) {
                    window.open(result.cityBuilderUrl, '_blank', 'noopener,noreferrer');
                  }
                }
              });
            } else {
              console.error(result);
              this.msg.error(result.error.text);
            }
          });
        break;
    }
    GLOBALS.siteConfig.editField = null;
  }

  protected clickBuildingsBack(evt: PointerEvent) {
    evt.preventDefault();
    if (GLOBALS.user.activeGbKey == null) {
      GLOBALS.user.siteMode = EnumSitemode.manage;
    } else {
      GLOBALS.user.activeGbKey = null;
      GLOBALS.user.activeUserGb = null;
    }
    GLOBALS._gbList = null;
    GLOBALS.saveSharedData();
  }

  protected clickSort(evt: PointerEvent, sort: any) {
    evt.preventDefault();
    evt.stopPropagation();
    if (GLOBALS.user.gbSort[GLOBALS.user.siteMode].mode === sort) {
      GLOBALS.user.gbSort[GLOBALS.user.siteMode].asc = !GLOBALS.user.gbSort[GLOBALS.user.siteMode].asc;
    } else {
      GLOBALS.user.gbSort[GLOBALS.user.siteMode] = {mode: sort, asc: true};
    }
    // let sort = GLOBALS.user.gbSort[GLOBALS.user.siteMode] + 1;
    // if (sort >= Object.keys(EnumSortmode).filter(key => isNaN(Number(key))).length) {
    //   sort = 0;
    // }
    // GLOBALS.user.gbSort[GLOBALS.user.siteMode] = sort;
    GLOBALS._gbList = null;
    GLOBALS.force.set(!GLOBALS.force());
    GLOBALS.saveSharedData();
  }

  protected clickZoom(evt: PointerEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    GLOBALS.user.userzoom = 1 - GLOBALS.user.userzoom;
    GLOBALS.saveSharedData();
  }

  protected showWhatsNew() {
    this.msg.showPopup(WhatsNewComponent, 'whatsnew', {});
  }

  protected clickCopy(evt: PointerEvent) {
    evt.preventDefault();
    navigator.clipboard.writeText(JSON.stringify(GLOBALS.sharedData));
  }

  protected clickInfo(evt: PointerEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    GLOBALS.user.showInfoGb = !GLOBALS.user.showInfoGb;
    GLOBALS.saveSharedData();
  }

  protected clickShowLevelArrows(evt: PointerEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    GLOBALS.user.showLevelArrows = !GLOBALS.user.showLevelArrows;
    GLOBALS.saveSharedData();
  }

  protected clickResetLevelColor(evt: PointerEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    GLOBALS.user.resetLevelColor = !GLOBALS.user.resetLevelColor;
    GLOBALS.saveSharedData();
  }

  protected clickNav(evt: PointerEvent, diff: number) {
    evt.preventDefault();
    const list = GLOBALS.gbListInternal;
    let idx = list.findIndex((gb) => gb.key === GLOBALS.user.activeGbKey);
    idx += diff;
    if (idx < 0) {
      idx = list.length - 1;
    }
    if (idx >= list.length) {
      idx = 0;
    }
    GLOBALS.user.activeGbKey = list[idx].key;
    GLOBALS.user.activeUserGb = this.bs.gbForUser(list[idx]);
    GLOBALS.saveSharedData();
  }

  protected hasGbForEpoch(epoch: number) {
    return GLOBALS.gbList.some(gb => gb.epoch === epoch);
  }

  protected classForFactor(def: FactorDefinition, factor: number) {
    const ret: string[] = [];
    if (factor === def.factor) {
      ret.push('current');
    }
    return ret;
  }

  protected clickFactor(evt: PointerEvent, def: FactorDefinition, factor?: number) {
    evt?.preventDefault();
    if (factor == null) {
      factor = def.factorEdit;
    }
    def.factor = factor;
    GLOBALS.saveSharedData();
  }

  protected clickDisplayMode(evt: PointerEvent) {
    evt.stopPropagation();
    switch (GLOBALS.user.displayMode) {
      case EnumDisplaymode.tiles:
        GLOBALS.user.displayMode = EnumDisplaymode.list;
        break;
      case EnumDisplaymode.list:
        GLOBALS.user.displayMode = EnumDisplaymode.tiles;
        break;
    }
    GLOBALS.saveSharedData();
  }

  protected clickDataSource(evt: PointerEvent) {
    evt.preventDefault();
    GLOBALS.isCurrentData = !GLOBALS.isCurrentData;
    this.gbsrv.loadFromAsset(() => {
      GLOBALS.force.set(!GLOBALS.force());
    });
  }
}

export default MainComponent
