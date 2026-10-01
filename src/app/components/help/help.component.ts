import {Component, Inject, OnInit} from '@angular/core';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {MessageService} from '@/_services/message.service';
import {EnvironmentService} from '@/_services/environment.service';
import {DlgBaseComponent} from '@/classes/base/dlg-base-component';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {DialogData} from '@/_model/dialog-data';
import {HttpClient, HttpRequest} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Component({
  selector: 'app-welcome',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
  standalone: false
})
export class HelpComponent extends DlgBaseComponent implements OnInit {
  closeData: CloseButtonData = {
    viewInfo: this.name,
    colorKey: 'help',
    showClose: true
  };
  loadDone = false;
  content: SafeHtml;

  constructor(globals: GlobalsService,
              public env: EnvironmentService,
              public msg: MessageService,
              public http: HttpClient,
              public sanitizer: DomSanitizer,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    super(globals, 'Help');
  }

  ngOnInit(): void {
    this.loadAsset();
  }

  loadAsset() {
    let req = new HttpRequest(
      'GET',
      `assets/help/${this.data.title}.html?v=${GLOBALS.version}`,
      null,
      {responseType: 'text'});
    let body: any;
    this.loadDone = false;
    this.http.request(req).subscribe({
      next: (data: any) => {
        body = data;
      }, error: (err) => {
        console.error(err);
      }, complete: () => {
        this.content = this.sanitizer.bypassSecurityTrustHtml(body.body);
        this.loadDone = true;
      }
    });
  }
}
