import { FormControl, Validators } from '@angular/forms';
import { CampoErroComponent } from './campo-erro.component';

describe('CampoErroComponent', () => {
  let componente: CampoErroComponent;

  const comControle = (valor: any, validadores: any[], tocar = true): CampoErroComponent => {
    const c = new CampoErroComponent();
    c.control = new FormControl(valor, validadores);
    if (tocar) {
      c.control.markAsTouched();
    }
    return c;
  };

  beforeEach(() => {
    componente = new CampoErroComponent();
  });

  it('sem controle não há mensagem', () => {
    expect(componente.mensagem).toBeNull();
  });

  it('só mostra erro depois que o campo foi tocado', () => {
    expect(comControle('', [Validators.required], false).mensagem).toBeNull();
    expect(comControle('', [Validators.required], true).mensagem).toBe('Campo obrigatório');
  });

  it('campo válido não mostra mensagem', () => {
    expect(comControle('ok', [Validators.required]).mensagem).toBeNull();
  });

  it('e-mail inválido', () => {
    expect(comControle('x', [Validators.email]).mensagem).toBe('Informe um e-mail válido');
  });

  it('tamanho mínimo de texto', () => {
    expect(comControle('ab', [Validators.minLength(6)]).mensagem).toBe('Mínimo de 6 caracteres');
  });

  it('valor mínimo numérico, formatado em pt-BR', () => {
    expect(comControle(0, [Validators.min(0.01)]).mensagem).toBe('O valor mínimo é 0,01');
  });

  it('valor máximo numérico (ex.: máximo de parcelas)', () => {
    expect(comControle(61, [Validators.max(60)]).mensagem).toBe('O valor máximo é 60');
  });

  it('padrão inválido pede número inteiro', () => {
    expect(comControle('2.5', [Validators.pattern(/^\d+$/)]).mensagem).toBe('Informe um número inteiro');
  });

  it('erro desconhecido cai na mensagem genérica', () => {
    const c = new CampoErroComponent();
    c.control = new FormControl('x', [() => ({ qualquer: true })]);
    c.control.markAsTouched();
    expect(c.mensagem).toBe('Valor inválido');
  });
});
