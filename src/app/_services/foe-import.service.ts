import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {ProgressService} from '@/_services/progress.service';
import {ThemeService} from '@/_services/theme.service';
import {GLOBALS} from '@/_services/globals.service';
import {firstValueFrom} from 'rxjs';

export interface IFoeImportError {
  code: string;
  text: string;
  category: string;
  retryable: boolean;
  details: Record<string, unknown>;
}

export interface FoeImportResult {
  success: boolean;
  name: string;
  documentId: string;
  action: 'created' | 'updated';
  world: string;
  buildings: number;
  roads: number;
  expansions: number;
  writeTime: string | null;
  cityBuilderUrl: string;
  credentials?: string;
  error?: IFoeImportError;
}

export interface FoeCityBuilderLoginResult {
  success: boolean;
  credentials?: string;
  error?: IFoeImportError;
}

@Injectable({providedIn: 'root'})
export class FoeImportService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/foe_city_import_iis.php';

  constructor(public ps: ProgressService,
              public ts: ThemeService) {
  }

  get hasCityBuilderLogin(): boolean {
    return this.credentials != null;
  }

  private get credentials(): string | null {
    return GLOBALS.user.cityBuilderCredentials;
  }

  private set credentials(value: string | null) {
    if (GLOBALS.user != null) {
      GLOBALS.user.cityBuilderCredentials = value;
    }
  }

  async compareCities() {
    const result = await firstValueFrom(
      this.http.post<any>(this.endpoint, {
        action: 'compareCities',
        credentials: GLOBALS.user.cityBuilderCredentials
      })
    );

    console.log(result.roadRequiredDifferences);
    console.log(result.allDifferences);
  }

  getCredentials(onDone: (result: { success: boolean, credentials: string, email: string }) => void) {
    this.http.post<{
      success: boolean;
      email: string;
      credentials: string;
    }>('/foe_city_import_iis.php', {
      action: 'accountInfo',
      credentials: GLOBALS.user.cityBuilderCredentials
    }).subscribe(result => {
      GLOBALS.user.cityBuilderCredentials = result.credentials;
      onDone?.(result);
    });
  }

  /** Uses a fresh, one-time Firebase email sign-in link. No localStorage persistence. */
  loginCityBuilder(email: string, link: string,
                   onDone?: (result: FoeCityBuilderLoginResult) => void): void {
    console.log('aufi', email, link);
    this.http.post<FoeCityBuilderLoginResult>(this.endpoint, {
      action: 'login', email, link
    }).subscribe({
      next: (result) => {
        if (result.success && result.credentials) {
          this.credentials = result.credentials;
        }
        onDone?.(result);
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        onDone?.({success: false, error: this.extractError(err)});
      }
    });
  }

  /** Forget the optional City Builder account; subsequent imports use the default account. */
  logoutCityBuilder(): void {
    this.credentials = null;
  }

  importCity(username: string, password: string, world: string,
             onDone?: (result: FoeImportResult) => void): void {
    this.ps.init({
      progressPanelBack: this.ts.currTheme.outputparamsHeadBack,
      progressPanelFore: this.ts.currTheme.outputparamsHeadFore,
      progressBarColor: this.ts.currTheme.outputparamsBodyBack
    });
    this.ps.max = 1;
    this.ps.value = 0;
    this.ps.indefinite = true;
    this.ps.text = $localize`${world} wird nach Foe City Builder importiert....`;

    const credentials = this.credentials;
    const payload = credentials
      ? {username, password, world, credentials}
      : {username, password, world};

    this.http.post<FoeImportResult>(this.endpoint, payload).subscribe({
      next: (result) => {
        if (result.success && result.credentials) {
          this.credentials = result.credentials;
        }
        this.ps.clear();
        onDone?.(result);
      },
      error: (err: HttpErrorResponse) => {
        const error = this.extractError(err);
        error.text = this.errorText(error, username, password, world);
        this.ps.clear();
        onDone?.({success: false, error} as FoeImportResult);
      }
    });
  }

  errorText(error: IFoeImportError, username: string, password: string, world: string): string {
    switch (error.code) {
      case 'FOE_LOGIN_REJECTED':
      case 'REQUIRED_FIELDS_MISSING':
        return $localize`Benutzername und Passwort müssen dem Login bei Forge Of Empires entsprechen.`;
      case 'FOE_WORLD_NOT_FOUND':
        return $localize`Die Welt ${world} konnte nicht gefunden werden.`;
      case 'CREDENTIALS_INVALID':
        return $localize`Die City-Builder-Anmeldung ist ungültig. Bitte erneut anmelden.`;
    }
    if (error.code != null && error.code !== 'BACKEND_UNAVAILABLE') {
      return $localize`Fehlercode ${error.code}`;
    }
    return $localize`Das Backend ist aktuell nicht verfügbar`;
  }

  private extractError(err: HttpErrorResponse): IFoeImportError {
    const error = err.error?.error;
    return {
      code: typeof error?.code === 'string' ? error.code : 'BACKEND_UNAVAILABLE',
      text: typeof error?.text === 'string' ? error.text : '',
      category: typeof error?.category === 'string' ? error.category : 'NETWORK',
      retryable: error?.retryable === true,
      details: error?.details && typeof error.details === 'object' ? error.details : {}
    };
  }
}
