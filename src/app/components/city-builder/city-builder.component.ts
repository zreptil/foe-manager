import {Component, HostListener} from '@angular/core';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {MatFormFieldAppearance} from '@angular/material/form-field';
import {MessageService} from '@/_services/message.service';
import {EnvironmentService} from '@/_services/environment.service';
import {PageService} from '@/_services/page.service';
import {DlgBaseComponent} from '@/classes/base/dlg-base-component';
import {FoeImportService} from '@/_services/foe-import.service';
import {DialogResultButton} from '@/_model/dialog-data';

@Component({
  selector: 'app-settings',
  templateUrl: './city-builder.component.html',
  styleUrls: ['./city-builder.component.scss'],
  standalone: false
})
export class CityBuilderComponent extends DlgBaseComponent {
  closeData: CloseButtonData = {
    viewInfo: this.name,
    colorKey: 'settings',
    showClose: true
  };
  password: string;
  info: string;
  error: string;
  appearance: MatFormFieldAppearance = 'fill';
  enterCredentials = false;
  activationLink: string;
  defaultEmail = 'foe-manager@zreptil.de';

  constructor(globals: GlobalsService,
              public ps: PageService,
              public env: EnvironmentService,
              public msg: MessageService,
              public fis: FoeImportService) {
    super(globals, 'Settings');
    this.fis.getCredentials((result) => {
      this._email = result?.email;
      this.fis.compareCities();
    });
  }

  _email: string;

  get email() {
    if (!this.isEmail(this._email)) {
      return this.defaultEmail;
    }
    return this._email;
  }

  isFirebaseLoginLink(text: string): boolean {
    try {
      let url = new URL(text.trim());
      // Firebase-Links können eine verschachtelte URL enthalten
      for (let i = 0; i < 3; i++) {
        const params = url.searchParams;
        if (params.get('mode') === 'signIn' &&
          params.has('oobCode') &&
          params.get('oobCode')!.length > 0) {
          return true;
        }
        const nested = params.get('link') ?? params.get('continueUrl');
        if (!nested) {
          return false;
        }
        url = new URL(nested);
      }
    } catch {
      // Keine gültige URL
    }
    return false;
  }

  @HostListener('window:focus')
  async onWindowFocus() {
    try {
      const text = await navigator.clipboard.readText();
      if (this.isFirebaseLoginLink(text)) {
        this.activationLink = text;
      }
    } catch {
    }
  }

  isEmail(text: string): boolean {
    const match = text?.match(
      /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+/
    );
    return match?.[0] != null;
  }

  clickSave(evt?: PointerEvent) {
    evt?.stopPropagation();
    this.info = null;
    this.error = null;
    this.msg.confirm($localize`Hiermit wird die Stadt @${GLOBALS.user.worldName}@ von @${GLOBALS.user.username}@ nach City Builder übertragen. Soll das ausgeführt werden?`).subscribe({
      next: (result) => {
        if (result?.btn === DialogResultButton.yes) {
          this.fis.importCity(GLOBALS.user.username, this.password, GLOBALS.user.worldName,
            (result) => {
              this.password = null;
              if (result?.success) {
                this.info = $localize`Die Stadt wurde als ${result.name} exportiert.`;
              } else {
                console.error(result);
                this.error = result.error.text;
              }
            });
        }
      }
    });
  }

  clickCityBuilder(evt: PointerEvent) {
    evt.stopPropagation();
    window.open('https://foe-city-builder.web.app/', '_blank', 'noopener,noreferrer');
  }

  protected clickEmail(evt: PointerEvent) {
    evt.stopPropagation();
    this.enterCredentials = !this.enterCredentials;
  }

  protected clickActivationLink(evt: PointerEvent) {
    evt.stopPropagation();
    if (this.isFirebaseLoginLink(this.activationLink) && this.isEmail(this.email)) {
      this.fis.loginCityBuilder(
        this.email,
        this.activationLink,
        (result) => {
          if (result.success) {
            console.log('city builder login successful');
            GLOBALS.saveSharedData();
            this.enterCredentials = false;
          } else {
            console.error('city builder login failed:', result.error);
          }
        }
      );
    } else {
      this.onWindowFocus();
    }
  }
}
