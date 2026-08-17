import {isDevMode, NgModule} from '@angular/core';
import {ServiceWorkerModule} from '@angular/service-worker';
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
import {BuildingComponent} from './components/building/building.component';
import {V100} from '@/components/whats-new/history/v100';
import {V101} from '@/components/whats-new/history/v101';
import {V102} from '@/components/whats-new/history/v102';
import {V103} from '@/components/whats-new/history/v103';
import {V104} from '@/components/whats-new/history/v104';
import {V105} from '@/components/whats-new/history/v105';
import {V106} from '@/components/whats-new/history/v106';
import {V107} from '@/components/whats-new/history/v107';
import {V108} from '@/components/whats-new/history/v108';
import {V109} from '@/components/whats-new/history/v109';
import {V110} from '@/components/whats-new/history/v110';
import { QuantenInvasionComponent } from './components/qi/quanten-invasion/quanten-invasion.component';

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
    QuantenInvasionComponent,
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
    V100,
    V101,
    V102,
    V103,
    V104,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    V105,
    V106,
    V107,
    V108,
    V109,
    V110
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {autoFocus: 'dialog', restoreFocus: true}}
  ]
})
export class AppModule {
}
