import {Component, Inject, OnInit} from '@angular/core';
import {DlgBaseComponent} from '@/classes/base/dlg-base-component';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {EnvironmentService} from '@/_services/environment.service';
import {MessageService} from '@/_services/message.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogData, DialogResultButton} from '@/_model/dialog-data';
import {BuildingService} from '@/_services/building.service';
import {LanguageService} from '@/_services/language.service';

@Component({
  selector: 'app-edit-factor',
  standalone: false,
  templateUrl: './edit-factor.component.html',
  styleUrl: './edit-factor.component.scss',
})
export class EditFactorComponent extends DlgBaseComponent implements OnInit {
  closeData: CloseButtonData = {
    viewInfo: this.name,
    colorKey: 'help',
    showClose: true
  };

  factor: any;

  constructor(globals: GlobalsService,
              public env: EnvironmentService,
              public msg: MessageService,
              public bs: BuildingService,
              public ls: LanguageService,
              private dialogRef: MatDialogRef<EditFactorComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    super(globals, 'EditFactor');
  }

  get isGold() {
    return (this.data as any).isGold;
  }

  ngOnInit(): void {
    this.factor = this.ls.formatNumber(this.isGold ? GLOBALS.user.editFactorGold : GLOBALS.user.editFactor);
  }

  protected clickArche(evt: PointerEvent) {
    evt.preventDefault();
    const factor = this.bs.calcArcheFactor(GLOBALS.user.listGb['The-Arc']?.level ?? 1, (this.data as any).isGold);
    this.factor = this.ls.formatNumber(factor);
  }

  protected clickSave(_evt: PointerEvent) {
    const temp = Number.parseFloat(`${this.factor}`.replace(/,/g, '.'));
    const limits = this.isGold ? {min: 1.0, max: 1.4} : {min: 1.0, max: 2.0};
    if (!isNaN(temp) && temp >= limits.min && temp <= limits.max) {
      if (this.isGold) {
        GLOBALS.user.editFactorGold = temp;
      } else {
        GLOBALS.user.editFactor = temp;
      }
      GLOBALS.saveSharedData();
      this.dialogRef.close({btn: DialogResultButton.ok, factor: this.factor});
    } else {
      this.msg.error($localize`Der Faktor muss zwischen ${limits.min} und ${limits.max} liegen`);
    }
  }
}
