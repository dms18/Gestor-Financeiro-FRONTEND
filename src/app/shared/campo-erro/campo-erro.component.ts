import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Mensagem de erro de validação exibida abaixo do campo, só depois de tocado.
 * Usa ícone + texto (não depende só de cor) e role="alert" para leitores de tela.
 */
@Component({
  selector: 'app-campo-erro',
  template: `
    <div class="campo-erro" role="alert" *ngIf="mensagem">
      <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
      <span>{{ mensagem }}</span>
    </div>
  `,
  styleUrls: ['./campo-erro.component.scss'],
})
export class CampoErroComponent {
  @Input() control: AbstractControl | null = null;

  get mensagem(): string | null {
    const erros = this.control?.touched ? this.control.errors : null;
    if (!erros) {
      return null;
    }
    if (erros.required) {
      return 'Campo obrigatório';
    }
    if (erros.email) {
      return 'Informe um e-mail válido';
    }
    if (erros.minlength) {
      return `Mínimo de ${erros.minlength.requiredLength} caracteres`;
    }
    if (erros.min) {
      const minimo = Number(erros.min.min).toLocaleString('pt-BR');
      return `O valor mínimo é ${minimo}`;
    }
    return 'Valor inválido';
  }
}
