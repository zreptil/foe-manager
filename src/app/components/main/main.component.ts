import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {SyncService} from '@/_services/sync/sync.service';
import {MessageService} from '@/_services/message.service';
import {WhatsNewComponent} from '@/components/whats-new/whats-new.component';
import {ImpressumComponent} from '@/components/impressum/impressum.component';
import {WelcomeComponent} from '@/components/welcome/welcome.component';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {SettingsComponent} from '@/components/settings/settings.component';
import {TypeUser} from '@/_model/app-data';
import {Utils} from '@/classes/utils';
import {DsgvoComponent} from '@/components/dsgvo/dsgvo.component';
import {EnvironmentService} from '@/_services/environment.service';
import {ImgurService} from '@/_services/oauth2/imgur.service';
import {GoogleService} from '@/_services/oauth2/google.service';
import {AssistService} from '@/_services/assist.service';
import {EnumSitemode, EnumSortmode} from '@/_model/user-data';
import {BuildingService} from '@/_services/building.service';
import {GbUserData} from '@/_model/gb-user-data';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: false
})
export class MainComponent implements OnInit {
  closeData: CloseButtonData = {
    viewInfo: 'Main',
    colorKey: 'main',
    showClose: false
  };
  editPlayer: string;
  protected readonly Utils = Utils;
  protected readonly EnumSitemode = EnumSitemode;

  constructor(public globals: GlobalsService,
              public msg: MessageService,
              public sync: SyncService,
              public imgur: ImgurService,
              public google: GoogleService,
              public assist: AssistService,
              public bs: BuildingService,
              public env: EnvironmentService) {
    this.assist.loadFromAsset();
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
    let ret: any = {version: this.assist.assistVersion, list: []};
    for (const gb of this.assist.gbList) {
      ret.list.push(gb.asJson);
    }
    return JSON.stringify(ret);
  }

  get classForContent() {
    // GLOBALS.user.siteMode === EnumSitemode.buildings &&
    if (GLOBALS.user.activeUserGb != null) {
      return 'building';
    }
    return '';
  }

  get iconForSort() {
    switch (GLOBALS.user?.gbSort?.[GLOBALS.user.siteMode]) {
      case EnumSortmode.none:
        return 'mobiledata_off';
      case EnumSortmode.alpha:
        return 'sort_by_alpha';
      case EnumSortmode.level:
        return 'format_list_numbered';
      case EnumSortmode.timeCopied:
        return 'access_time';
      case EnumSortmode.type:
        return 'swords';
    }
  }

  get toolbarTitle() {
    /*      @if (globals.user.siteMode < 2) {
        @switch (globals.user.siteMode) {
          @case (0) {
            <div i18n>Bitte die Gebäude auswählen, die in Deiner Stadt stehen</div>
          }
          @case (1) {
            <div i18n>Liste der Gebäude in der Stadt</div>
          }
          @default {
            <div i18n>Liste der Gebäude in der Stadt</div>
          }
        }
*/
    switch (GLOBALS.user.siteMode) {
      case EnumSitemode.manage:
        if (GLOBALS.user.activeUserGb != null) {
          return null;
        }
        return $localize`Liste der Gebäude in der Stadt`;
      case EnumSitemode.select:
        return $localize`Bitte die Gebäude auswählen, die in Deiner Stadt stehen`;
      case EnumSitemode.buildings:
        return $localize`Gebäude`;
      case EnumSitemode.players:
        return $localize`Gebäude anderer Spieler`;
      default:
        return $localize`Liste der Gebäude in der Stadt`;
    }
  }

  iconForMode(mode?: number) {
    mode ??= GLOBALS.user.siteMode;
    switch (mode) {
      case EnumSitemode.select:
        return 'check';
      case EnumSitemode.manage:
        return 'edit';
      case EnumSitemode.players:
        return 'group';
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

  clickType(type: TypeUser) {
    GLOBALS.currentUserType = type;
  }

  classForType(type: TypeUser): string[] {
    const ret: string[] = [];
    if (type.value === GLOBALS.currentUserType?.value) {
      ret.push('current');
    }
    return ret;
  }

  protected clickImport(evt: PointerEvent) {
    evt.preventDefault();
    this.assist.importData();
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

  protected clickName(evt: PointerEvent) {
    evt.preventDefault();
    GLOBALS.siteConfig.editField = 'user';
  }

  protected saveName() {
    GLOBALS.saveSharedData();
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

  protected clickSort(evt: PointerEvent) {
    evt.preventDefault();
    let sort = GLOBALS.user.gbSort[GLOBALS.user.siteMode] + 1;
    if (sort >= Object.keys(EnumSortmode).filter(key => isNaN(Number(key))).length) {
      sort = 0;
    }
    GLOBALS.user.gbSort[GLOBALS.user.siteMode] = sort;
    GLOBALS._gbList = null;
    GLOBALS.saveSharedData();
  }

  protected clickZoom(evt: PointerEvent) {
    evt.preventDefault();
    GLOBALS.user.userzoom = 1 - GLOBALS.user.userzoom;
    GLOBALS.saveSharedData();
  }

  protected showWhatsNew() {
    this.msg.showPopup(WhatsNewComponent, 'whatsnew', {});
  }

  protected clickPlayersAdd(evt: PointerEvent) {
    evt.preventDefault();
    this.editPlayer = $localize`Name eingeben`;
  }

  protected savePlayer() {
    if (!Utils.isEmpty(this.editPlayer)) {
      GLOBALS._playerList = null;
      const list = GLOBALS.playerList;
      if (GLOBALS.user.activePlayer != null) {
        const playerList = list.filter((player) => player.player === GLOBALS.user.activePlayer);
        for (const entry of playerList) {
          entry.player = this.editPlayer;
        }
      } else {
        GLOBALS.user.activePlayer = this.editPlayer;
        list.push(new GbUserData({}));
      }
    }
  }

  protected clickCopy(evt: PointerEvent) {
    evt.preventDefault();
    navigator.clipboard.writeText(JSON.stringify(GLOBALS.sharedData));
  }
}
