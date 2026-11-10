import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Adapta a interface ao NAVEGADOR de computador, sem mexer no app instalado.
 *
 * - `plataforma-web` (classe no <body>): só existe quando NÃO é o app nativo (Capacitor).
 *   Todo o CSS de navegador fica atrás dessa classe, então o app nunca é afetado.
 * - `web-largo`: navegador com 1024 px ou mais. Nesse caso o menu vira uma barra lateral.
 *
 * Em navegador estreito (celular) nada muda: continua igual ao app.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  static readonly LARGURA_MINIMA_BARRA_LATERAL = 1024;

  /** true = rodando num navegador; false = app instalado (Android/iOS) */
  readonly web: boolean = !Capacitor.isNativePlatform();

  private readonly largo = new BehaviorSubject<boolean>(false);
  /** true quando o menu deve aparecer como barra lateral */
  readonly barraLateral$ = this.largo.asObservable();

  constructor(private zone: NgZone) {}

  init(): void {
    if (!this.web) {
      return; // app instalado: não adiciona classe nenhuma
    }
    document.body.classList.add('plataforma-web');

    const consulta = window.matchMedia(`(min-width: ${LayoutService.LARGURA_MINIMA_BARRA_LATERAL}px)`);
    const aplicar = (largo: boolean) =>
      this.zone.run(() => {
        document.body.classList.toggle('web-largo', largo);
        this.largo.next(largo);
      });

    aplicar(consulta.matches);
    if (consulta.addEventListener) {
      consulta.addEventListener('change', (e) => aplicar(e.matches));
    } else {
      consulta.addListener((e) => aplicar(e.matches)); // navegadores antigos
    }
  }
}
