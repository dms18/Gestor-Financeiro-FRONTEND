import { Directive, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';

/**
 * Acessibilidade do painel de formulário (.form-painel):
 * move o foco para dentro ao abrir, mantém o Tab dentro do painel
 * e devolve o foco ao elemento que o abriu quando fecha.
 * Os atributos role="dialog", aria-modal e aria-labelledby ficam no template.
 */
@Directive({ selector: '[appModalA11y]' })
export class ModalA11yDirective implements OnInit, OnDestroy {
  private elementoAnterior: HTMLElement | null = null;
  private temporizador: any;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    this.elementoAnterior = document.activeElement as HTMLElement | null;
    const painel = this.el.nativeElement;
    painel.setAttribute('tabindex', '-1');

    // Foco no próprio painel (não no 1º campo): leitores de tela anunciam o diálogo,
    // o teclado virtual não abre sozinho e nenhum campo é marcado como "tocado".
    this.temporizador = setTimeout(() => painel.focus({ preventScroll: true }), 280);
  }

  ngOnDestroy() {
    clearTimeout(this.temporizador);
    const anterior = this.elementoAnterior;
    if (anterior && document.body.contains(anterior)) {
      anterior.focus({ preventScroll: true });
    }
  }

  @HostListener('keydown', ['$event'])
  prenderFoco(evento: KeyboardEvent) {
    if (evento.key !== 'Tab') {
      return;
    }
    const focaveis = Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), ion-select, ion-datetime, ion-button:not([disabled]), button:not([disabled])'
      )
    );
    if (focaveis.length === 0) {
      return;
    }
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    const ativo = document.activeElement;

    if (evento.shiftKey && (ativo === primeiro || ativo === this.el.nativeElement)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && ativo === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }
}
