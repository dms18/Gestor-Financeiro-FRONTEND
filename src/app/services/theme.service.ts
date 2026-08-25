import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Gerencia o tema da aplicação (claro / escuro / automático).
 *
 * - 'auto'  → segue a configuração do dispositivo (prefers-color-scheme) e
 *             reage a mudanças em tempo real.
 * - 'light' → força tema claro (adiciona body.light).
 * - 'dark'  → força tema escuro (adiciona body.dark).
 *
 * A preferência é persistida em localStorage (síncrono, sem flash no boot).
 * As classes no <body> são interpretadas pelo global.scss.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'theme_mode';
  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');

  /** Chamado no boot da aplicação (AppComponent). */
  init(): void {
    this.aplicar(this.getMode());

    // Em modo automático, reaplica quando o dispositivo troca de tema.
    const onChange = () => {
      if (this.getMode() === 'auto') {
        this.aplicarClasses('auto');
      }
    };
    if (this.media.addEventListener) {
      this.media.addEventListener('change', onChange);
    } else {
      // Safari antigo
      this.media.addListener(onChange);
    }
  }

  getMode(): ThemeMode {
    const salvo = localStorage.getItem(this.KEY) as ThemeMode | null;
    return salvo === 'light' || salvo === 'dark' || salvo === 'auto' ? salvo : 'auto';
  }

  setMode(mode: ThemeMode): void {
    localStorage.setItem(this.KEY, mode);
    this.aplicar(mode);
  }

  /** true se o tema efetivo (considerando 'auto') estiver escuro. */
  estaEscuro(): boolean {
    const mode = this.getMode();
    if (mode === 'dark') { return true; }
    if (mode === 'light') { return false; }
    return this.media.matches;
  }

  private aplicar(mode: ThemeMode): void {
    this.aplicarClasses(mode);
  }

  private aplicarClasses(mode: ThemeMode): void {
    const body = document.body.classList;
    // Remove ambas e reaplica conforme o modo.
    body.remove('dark');
    body.remove('light');

    if (mode === 'dark') {
      body.add('dark');
    } else if (mode === 'light') {
      body.add('light');
    }
    // 'auto' → sem classe: o global.scss usa prefers-color-scheme.
  }
}
