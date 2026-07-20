import {AfterViewInit, ChangeDetectorRef, Component} from '@angular/core';
import {GlobalsService} from '@/_services/globals.service';
import {MessageService} from '@/_services/message.service';
import {TypeService} from '@/_services/type.service';
import {PdfService} from '@/_services/pdf.service';
import {Utils} from '@/classes/utils';
import {UserType} from '@/_model/app-data';

@Component({
  selector: 'app-type-user',
  templateUrl: './type-user.component.html',
  styleUrls: ['../type.component.scss'],
  standalone: false
})
export class TypeUserComponent implements AfterViewInit {

  protected readonly Utils = Utils;
  protected readonly UserType = UserType;

  constructor(public globals: GlobalsService,
              public msg: MessageService,
              public ts: TypeService,
              public pdf: PdfService,
              public cr: ChangeDetectorRef) {
  }

  ngAfterViewInit(): void {
  }
}
