import {ChangeDetectorRef, Component, inject} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';
import {filter} from 'rxjs';
import {SyncService} from '@/_services/sync/sync.service';
import {EnvironmentService} from '@/_services/environment.service';
import {GLOBALS} from '@/_services/globals.service';
import {LogService} from '@/_services/log.service';
import {ThemeService} from '@/_services/theme.service';
import {StorageService} from '@/_services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {
  constructor(ss: StorageService,
              cr: ChangeDetectorRef,
              sync: SyncService,
              ts: ThemeService,
              public env: EnvironmentService) {
    LogService.cr = cr;
    sync.onSetCredentialsToStorage = (value, _isRefreshing) => {
      GLOBALS.oauth2AccessToken = value;
      GLOBALS.saveWebData();
    };
    sync.onGetCredentialsFromStorage = (): string => {
      GLOBALS.loadWebData();
      ts.setTheme(GLOBALS.theme, false, false);
      ts.restoreTheme();
      return GLOBALS.oauth2AccessToken;
    };
    sync.init();
    GLOBALS.loadSharedData();
    this.setupUpdates();
  }

  private setupUpdates() {
    const swUpdate = inject(SwUpdate);
    if (!swUpdate.isEnabled) {
      return;
    }

    swUpdate.versionUpdates
      .pipe(filter(evt => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        // Automatically reload the page to apply the update
        document.location.reload();
      });

    // Check for updates every now and then (e.g., when the app starts)
    swUpdate.checkForUpdate().then(found => {
      if (found) {
        console.log('New version found and being downloaded...');
      }
    });
  }
}
