import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LayoutService } from '../services/layout.service';
import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit {
  private readonly abasBase = [
    { tab: 'dashboard', icone: 'home', rotulo: 'Dashboard' },
    { tab: 'transacoes', icone: 'swap-vertical', rotulo: 'Transações' },
    { tab: 'contas', icone: 'card', rotulo: 'Contas' },
    { tab: 'sazonalidade', icone: 'analytics', rotulo: 'Sazonalidade' },
    { tab: 'investimentos', icone: 'trending-up', rotulo: 'Investimentos' },
    { tab: 'perfil', icone: 'person', rotulo: 'Perfil' }
  ];

  private readonly abaAdmin = { tab: 'admin', icone: 'shield-checkmark', rotulo: 'Admin' };

  /** Navegador largo: o menu vira barra lateral e o ícone fica ao lado do texto. */
  readonly barraLateral$ = this.layout.barraLateral$;

  constructor(
    private layout: LayoutService,
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) {}

  /** A aba Admin existe só na versão web e só para administrador; o app instalado nunca a mostra. */
  get abas() {
    return this.layout.web && this.authService.isAdmin ? [...this.abasBase, this.abaAdmin] : this.abasBase;
  }

  ngOnInit() {
    if (!this.layout.web) {
      return;
    }
    // A flag pode mudar no banco depois do login: confere de novo para mostrar/ocultar a aba.
    this.usuarioService.obterPerfil().subscribe({
      next: (u) => {
        const atual = this.authService.getUsuarioLocal();
        if (atual && (atual.admin === true) !== (u.admin === true)) {
          this.authService.atualizarUsuarioLocal({ ...atual, admin: u.admin === true });
        }
      },
      error: () => {}
    });
  }
}
