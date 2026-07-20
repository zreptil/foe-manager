import {NgModule} from '@angular/core';
import {MAT_DIALOG_DEFAULT_OPTIONS} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {DialogComponent} from '@/components/dialog/dialog.component';
import {ColorPickerComponent} from '@/controls/color-picker/color-picker.component';
import {ColorPickerImageComponent} from '@/controls/color-picker/color-picker-image/color-picker-image.component';
import {ColorPickerMixerComponent} from '@/controls/color-picker/color-picker-mixer/color-picker-mixer.component';
import {ColorPickerBaseComponent} from '@/controls/color-picker/color-picker-base.component';
import {WelcomeComponent} from '@/components/welcome/welcome.component';
import {MainComponent} from '@/components/main/main.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from '@/material.module';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {LogComponent} from '@/components/log/log.component';
import {WhatsNewComponent} from '@/components/whats-new/whats-new.component';
import {ImpressumComponent} from '@/components/impressum/impressum.component';
import {ProgressComponent} from '@/components/progress/progress.component';
import {AutofocusDirective} from '@/_directives/autofocus.directive';
import {ColorPickerDialog} from '@/controls/color-picker/color-picker-dialog/color-picker-dialog';
import {ColorCfgComponent} from '@/controls/color-cfg/color-cfg.component';
import {ColorCfgDialogComponent} from '@/controls/color-cfg/color-cfg-dialog/color-cfg-dialog.component';
import {CloseButtonComponent} from '@/controls/close-button/close-button.component';
import {ColorPickerSliderComponent} from '@/controls/color-picker/color-picker-slider/color-picker-slider.component';
import {ColorPickerHslComponent} from '@/controls/color-picker/color-picker-hsl/color-picker-hsl.component';
import {SettingsComponent} from '@/components/settings/settings.component';
import {PersonFormComponent} from '@/controls/person-form/person-form.component';
import {DatepickerComponent} from '@/controls/datepicker/datepicker.component';
import {DatepickerDialogComponent} from '@/controls/datepicker/datepicker-dialog/datepicker-dialog.component';
import {DatepickerMonthComponent} from '@/controls/datepicker/datepicker-month/datepicker-month.component';
import {TextareaAutoresizeDirective} from '@/_directives/textarea-autoresize.directive';
import {TypeAdminComponent} from '@/components/type-admin/type-admin.component';
import {TypeUserComponent} from '@/components/type-user/type-user.component';
import {DsgvoComponent} from '@/components/dsgvo/dsgvo.component';
import {LinkPictureComponent} from './components/link-picture/link-picture.component';
import {HideMissingImageDirective} from '@/_directives/hide-missing-image.directive';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {ImageListComponent} from './controls/image-list/image-list.component';
import {OAuthModule} from 'angular-oauth2-oidc';
import {ScrollShadowDirective} from '@/_directives/scroll-shadow.directive';
import { BuildingComponent } from './components/building/building.component';

@NgModule({
  declarations: [
    AutofocusDirective,
    AppComponent,
    DialogComponent,
    ColorPickerComponent,
    ColorPickerDialog,
    ColorPickerImageComponent,
    ColorPickerMixerComponent,
    ColorPickerBaseComponent,
    ColorPickerSliderComponent,
    ColorPickerHslComponent,
    ColorCfgComponent,
    ColorCfgDialogComponent,
    CloseButtonComponent,
    DatepickerComponent,
    DatepickerDialogComponent,
    DatepickerMonthComponent,
    WhatsNewComponent,
    MainComponent,
    WelcomeComponent,
    SettingsComponent,
    ImpressumComponent,
    DsgvoComponent,
    PersonFormComponent,
    TypeUserComponent,
    TypeAdminComponent,
    LinkPictureComponent,
    ImageListComponent,
    BuildingComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    DragDropModule,
    LogComponent,
    ProgressComponent,
    TextareaAutoresizeDirective,
    HideMissingImageDirective,
    ScrollShadowDirective,
    OAuthModule.forRoot(),
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {autoFocus: 'dialog', restoreFocus: true}}
  ]
})
export class AppModule {
}
