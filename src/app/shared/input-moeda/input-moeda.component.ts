import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Campo de valor em reais com máscara (R$ 1.234,56). O usuário digita só números e os dígitos
 * entram pelos centavos; o valor do formulário é um number (ou null se vazio).
 */
@Component({
  selector: 'app-input-moeda',
  template: `
    <ion-item>
      <ion-label position="stacked">{{ rotulo }}</ion-label>
      <ion-input type="text" inputmode="numeric" autocomplete="off"
        [value]="texto" [placeholder]="placeholder" [disabled]="desabilitado"
        (ionInput)="aoDigitar($event)" (ionBlur)="aoSair()"></ion-input>
    </ion-item>
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputMoedaComponent), multi: true }],
})
export class InputMoedaComponent implements ControlValueAccessor {
  @Input() rotulo = '';
  @Input() placeholder = 'R$ 0,00';

  texto = '';
  desabilitado = false;

  private static readonly MAX_DIGITOS = 12;
  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  private static formatar(valor: number): string {
    return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  writeValue(valor: number | string | null): void {
    const n = valor === null || valor === undefined || valor === '' ? null : Number(valor);
    this.texto = n === null || isNaN(n) ? '' : InputMoedaComponent.formatar(n);
  }

  registerOnChange(fn: (v: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(desabilitado: boolean): void { this.desabilitado = desabilitado; }

  aoDigitar(evento: any): void {
    const digitos = String(evento?.target?.value ?? '').replace(/\D/g, '').slice(0, InputMoedaComponent.MAX_DIGITOS);
    if (!digitos) {
      this.atualizar('', null, evento);
      return;
    }
    const valor = Number(digitos) / 100;
    this.atualizar(InputMoedaComponent.formatar(valor), valor, evento);
  }

  aoSair(): void { this.onTouched(); }

  private atualizar(texto: string, valor: number | null, evento: any): void {
    this.texto = texto;
    // reescreve o texto formatado no próprio campo (o ion-input mantém o que foi digitado)
    if (evento?.target) { evento.target.value = texto; }
    this.onChange(valor);
  }
}
