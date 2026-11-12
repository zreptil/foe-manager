import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {ProgressService} from '@/_services/progress.service';
import {ThemeService} from '@/_services/theme.service';

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
  error: IFoeImportError;
}

@Injectable({providedIn: 'root'})
export class FoeImportService {
  private readonly http = inject(HttpClient);

  constructor(public ps: ProgressService,
              public ts: ThemeService) {
  }

  importCity(username: string, password: string, world: string, onDone?: (result: FoeImportResult) => void) {
    this.ps.init({
      progressPanelBack: this.ts.currTheme.outputparamsHeadBack,
      progressPanelFore: this.ts.currTheme.outputparamsHeadFore,
      progressBarColor: this.ts.currTheme.outputparamsBodyBack
    });
    this.ps.max = 1;
    this.ps.value = 0;
    this.ps.indefinite = true;
    this.ps.text = $localize`${world} wird nach Foe City Builder importiert....`;
    let result: FoeImportResult;
    this.http.post<FoeImportResult>(
      '/foe_city_import_iis.php',
      {username, password, world}
    ).subscribe({
      next: (res) => {
        result = res;
      },
      error: (err: HttpErrorResponse) => {
        const result = {
          success: false,
          error: err.error.error as IFoeImportError
        } as FoeImportResult;
        result.error.text = this.errorText(result.error, username, password, world);
        this.ps.clear();
        onDone?.(result);
      },
      complete: () => {
        this.ps.clear();
        onDone?.(result);
      }
    });
  }

  errorText(error: IFoeImportError, username: string, password: string, world: string) {
    switch (error.code) {
      case 'FOE_LOGIN_REJECTED':
      case 'REQUIRED_FIELDS_MISSING':
        return $localize`Benutzername und Passwort müssen dem Login bei Forge Of Empires entsprechen.`;
      case 'FOE_WORLD_NOT_FOUND':
        return $localize`Die Welt ${world} konnte nicht gefunden werden.`;
    }
    return $localize`Fehlercode ${error.code}`;
  }
}
