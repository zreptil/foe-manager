import {Component, Input} from '@angular/core';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {UserType} from '@/_model/app-data';
import {Utils} from '@/classes/utils';
import {PictureData} from '@/_model/picture-data';
import {LinkPictureComponent} from '@/components/link-picture/link-picture.component';
import {DialogResultButton} from '@/_model/dialog-data';
import {MessageService} from '@/_services/message.service';
import {DlgBaseComponent} from '@/classes/base/dlg-base-component';

@Component({
  selector: 'app-image-list',
  templateUrl: './image-list.component.html',
  styleUrl: './image-list.component.scss',
  standalone: false
})
export class ImageListComponent extends DlgBaseComponent {
  @Input() userType: UserType;
  @Input() mayEdit: boolean;

  protected readonly Utils = Utils;

  constructor(globals: GlobalsService,
              public msg: MessageService) {
    super(globals, 'ImageList');
  }

  _imageList: PictureData[];

  get imageList(): PictureData[] {
    if (this._imageList == null && this.userType != null) {
      this._imageList = this.pictures.filter(e => (e.userType & this.userType) === this.userType);
    }
    return this._imageList;
  }

  get pictures(): PictureData[] {
    return null;
  }

  get mayEditImage(): boolean {
    return this.mayEdit && this.userType === UserType.User;
  }

  get classForInfo(): string[] {
    const ret: string[] = [];
    if (this.userType !== UserType.User) {
      ret.push('userInfo');
    }

    return ret;
  }

  clickImageMove(evt: MouseEvent, image: PictureData, diff: number) {
    evt.stopPropagation();
    const idx = this.pictures.findIndex(e => e.id === image.id);
    if (idx >= 0) {
      this.pictures.splice(idx, 1);
      this.pictures.splice(idx + diff, 0, image);
      this._imageList = null;
    }
  }

  reloadFromJson() {
  }

  clickAddImage(evt: MouseEvent) {
    evt.stopPropagation();
    const data = new PictureData({c: this.userType});
    this.msg.showPopup(LinkPictureComponent, 'settings', data).subscribe(result => {
      if (result?.btn === DialogResultButton.ok) {
        if (Array.isArray(result.data)) {
          this.pictures.push(...result.data);
        } else {
          const picture = new PictureData(result.data.asJson);
          this.pictures.push(picture);
        }
        this.reloadFromJson();
        this._imageList = null;
      }
    })
  }

  clickOpenImage(evt: MouseEvent, picture: PictureData) {
    evt.stopPropagation();
    GLOBALS.openLink(picture.url)
  }
}
