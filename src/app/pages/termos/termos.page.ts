import { Component } from '@angular/core';

@Component({
  selector: 'app-termos',
  templateUrl: './termos.page.html',
  styleUrls: ['./termos.page.scss'],
})
export class TermosPage {
  /** Versão vigente — deve espelhar AuthResource.TERMOS_VERSAO no backend. */
  readonly versao = '1.0 (2026-08-24)';
}
