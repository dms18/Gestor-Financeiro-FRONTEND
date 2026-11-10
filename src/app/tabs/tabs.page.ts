import { Component } from '@angular/core';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  readonly abas = [
    { tab: 'dashboard', icone: 'home', rotulo: 'Dashboard' },
    { tab: 'transacoes', icone: 'swap-vertical', rotulo: 'Transações' },
    { tab: 'contas', icone: 'card', rotulo: 'Contas' },
    { tab: 'sazonalidade', icone: 'analytics', rotulo: 'Sazonalidade' },
    { tab: 'investimentos', icone: 'trending-up', rotulo: 'Investimentos' },
    { tab: 'perfil', icone: 'person', rotulo: 'Perfil' }
  ];

  /** Navegador largo: o menu vira barra lateral e o ícone fica ao lado do texto. */
  readonly barraLateral$ = this.layout.barraLateral$;

  constructor(private layout: LayoutService) {}
}
