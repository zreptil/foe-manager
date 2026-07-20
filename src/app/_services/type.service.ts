import {Injectable} from '@angular/core';
import {GlobalsService} from '@/_services/globals.service';
import {MessageService} from '@/_services/message.service';

@Injectable({
  providedIn: 'root'
})
export class TypeService {

  constructor(public globals: GlobalsService,
              public msg: MessageService) {
  }
}
