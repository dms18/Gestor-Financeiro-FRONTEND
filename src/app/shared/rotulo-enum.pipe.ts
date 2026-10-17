import { Pipe, PipeTransform } from '@angular/core';

const ROTULOS: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
  IDEIA: 'Ideia',
  EM_ANALISE: 'Em análise',
  APROVADO: 'Aprovado',
  DESCARTADO: 'Descartado',
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
  CORRENTE: 'Conta corrente',
  POUPANCA: 'Poupança',
  CAIXA: 'Caixa',
};

/** Converte valores de enum do backend (ex.: EM_ANALISE) em texto legível em português. */
@Pipe({ name: 'rotuloEnum' })
export class RotuloEnumPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) {
      return '';
    }
    if (ROTULOS[valor]) {
      return ROTULOS[valor];
    }
    const texto = valor.replace(/_/g, ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
