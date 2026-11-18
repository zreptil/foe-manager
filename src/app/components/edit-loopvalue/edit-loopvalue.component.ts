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
  templateUrl: './edit-loopvalue.component.html',
  styleUrl: './edit-loopvalue.component.scss',
})
export class EditLoopvalueComponent extends DlgBaseComponent implements OnInit {
  closeData: CloseButtonData = {
    viewInfo: this.name,
    colorKey: 'help',
    showClose: true
  };

  value: number;

  constructor(globals: GlobalsService,
              public env: EnvironmentService,
              public msg: MessageService,
              public bs: BuildingService,
              public ls: LanguageService,
              private dialogRef: MatDialogRef<EditLoopvalueComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    super(globals, 'EditLoopvalue');
  }

  ngOnInit(): void {
    this.value = GLOBALS.user.loopValue;
  }

  protected clickSave(_evt: PointerEvent) {
    const temp = Number.parseFloat(`${this.value}`.replace(/,/g, '.'));
    GLOBALS.user.loopValue = temp;
    GLOBALS.saveSharedData();
    this.dialogRef.close({btn: DialogResultButton.ok, value: temp});
  }
}
