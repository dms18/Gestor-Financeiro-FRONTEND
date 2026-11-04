import { Component } from '@angular/core';
import { buildInfo } from '../../../environments/build-info';

/** Versão do app. Atualize ao publicar uma nova versão. */
export const APP_VERSION = '1.0.0';

@Component({
  selector: 'app-versao-badge',
  template: `
    <span class="versao-badge" [attr.title]="detalhe" [attr.aria-label]="'Versão ' + texto">{{ texto }}</span>
  `,
  styles: [`
    :host { display: block; text-align: center; }
    .versao-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      color: var(--app-text-muted);
      border: 1px solid var(--ion-color-step-200, rgba(128, 128, 128, 0.4));
    }
  `]
})
export class VersaoBadgeComponent {
  readonly texto = buildInfo.sha === 'dev'
    ? `v${APP_VERSION} · dev`
    : `v${APP_VERSION} · ${buildInfo.sha.substring(0, 7)}`;
  readonly detalhe = buildInfo.date ? `Build de ${buildInfo.date}` : 'Build local';
}
