import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LayoutService } from '../services/layout.service';

/**
 * Painel do administrador: só na versão web e só para quem tem a flag de administrador.
 * (O servidor confere a permissão de novo em cada chamada; isto só evita mostrar a tela.)
 */
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService, private layout: LayoutService) {}

  canActivate(): boolean {
    if (this.layout.web && this.auth.isAdmin) {
      return true;
    }
    this.router.navigate(['/tabs/dashboard']);
    return false;
  }
}
