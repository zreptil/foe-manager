import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {DropboxService} from '@/_services/sync/dropbox.service';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {GlobalsService} from '@/_services/globals.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MessageService} from '@/_services/message.service';
import {EnvironmentService} from '@/_services/environment.service';
import {UserType} from '@/_model/app-data';
import {DlgBaseComponent} from '@/classes/base/dlg-base-component';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: false
})
export class WelcomeComponent extends DlgBaseComponent implements OnInit, AfterViewInit {
  closeData: CloseButtonData = {
    viewInfo: this.name,
    colorKey: 'welcome',
    showClose: false
  };
  username: string;
  password: string;
  hide = true;
  form?: FormGroup;
  usertype: number;
  controls: any = {
    username: {label: $localize`Username`},
    password: {label: $localize`Password`},
    firstname: {label: $localize`Firstname`},
    lastname: {label: $localize`Lastname`},
    email: {label: $localize`E-Mail`, validators: Validators.email},
    address1: {label: $localize`Address Line 1`},
    address2: {label: $localize`Address Line 2`},
    zip: {label: $localize`ZIP`},
    city: {label: $localize`City`},
    usertype: {label: $localize`I am`},
  };

  constructor(globals: GlobalsService,
              public env: EnvironmentService,
              public dbs: DropboxService,
              public msg: MessageService) {
    super(globals, 'Welcome');
  }

  private _mode = 'login';

  get mode(): string {
    return this._mode;
  }

  set mode(value: string) {
    this._mode = value;
    this.focusUsername();
  }

  get btnSendTitle(): string {
    const titles: any = {
      login: $localize`Login`,
      register: $localize`Register`
    };
    return titles[this._mode] ?? 'doit';
  }

  get classForLogin(): string[] {
    const ret: string[] = [];
    if (this._mode === 'login') {
      ret.push('current');
    }
    return ret;
  };

  get classForRegister(): string[] {
    const ret: string[] = [];
    if (this._mode === 'register') {
      ret.push('current');
    }
    return ret;
  };

  hasUsertype(type: number): boolean {
//form.get('usertype').value.includes(fruit
    return (+this.controls.usertype.value & type) === type;
  }

  focusUsername(timeout = 0): void {
    setTimeout(() => {
      (document.querySelector('#username') as HTMLInputElement)?.focus();
    }, timeout);
  }

  ngAfterViewInit() {
    this.focusUsername(200);
  }

  ngOnInit() {
    const controls: any = {};
    for (const key of Object.keys(this.controls)) {
      const ctrl = this.controls[key];
      controls[key] = new FormControl(this.env.defaultLogin?.[key] ?? '', ctrl.validators);
    }
    controls.usertype.value = UserType.User;
    this.controls.usertype.value = controls.usertype.value;
    this.form = new FormGroup(controls);
  }

  doSync() {
    this.dbs.connect();
  }

  clickHide(_evt: MouseEvent) {
    this.hide = !this.hide;
  }

  classForArea(mode: string): string[] {
    const ret: string[] = []
    if (this.mode !== mode) {
      ret.push('hidden');
    }
    return ret;
  }

  onSend() {
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(evt: KeyboardEvent): void {
    evt.stopPropagation();
    if (evt.key === 'Enter') {
      this.onSend();
    }
  }

  toggleUsertype(value: number) {
    this.usertype = (+this.usertype) ^ +value;
  }
}
