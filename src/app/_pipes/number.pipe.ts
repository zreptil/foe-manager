import {inject, Pipe, PipeTransform} from '@angular/core';
import {LanguageService} from '@/_services/language.service';
import {formatNumber} from '@angular/common';

@Pipe({
  name: 'number',
  standalone: false,
  pure: false
})
export class NumberPipe implements PipeTransform {
  private lngService = inject(LanguageService);

  transform(
    value: number | string | null | undefined,
    digitsInfo?: string
  ): string | null {
    if (value == null) {
      return null;
    }
    return formatNumber(
      Number(value),
      this.lngService.locale(),
      digitsInfo
    );
  }
}
