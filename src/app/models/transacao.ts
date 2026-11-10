export type TipoTransacao = 'RECEITA' | 'DESPESA';
export type TipoPessoa = 'PF' | 'PJ';

export interface Transacao {
  id?: number;
  descricao: string;
  valor: number;
  data: string; // ISO date (yyyy-MM-dd)
  tipo: TipoTransacao;
  tipoPessoa: TipoPessoa;
  categoriaId?: number;
  contaId?: number;
  usuarioId?: number;
  /** Entrada: se true, `valor` é o montante total, dividido em `numeroParcelas` parcelas mensais. */
  parcelado?: boolean;
  numeroParcelas?: number | null;
  /** Saída: dados da parcela (null em transações avulsas). */
  grupoParcelas?: string | null;
  parcelaNumero?: number | null;
  totalParcelas?: number | null;
}

/** O que apagar ao excluir uma parcela. */
export type EscopoExclusao = 'UMA' | 'PROXIMAS' | 'TODAS';

export interface ResumoPorConta {
  contaId: number;
  contaNome: string;
  saldo: number;
  receitas: number;
  despesas: number;
  /** Saldo inicial + movimentações até hoje (calculado no servidor). */
  saldoAtual: number;
}

export interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  porConta: ResumoPorConta[];
  /** Resultado dos lançamentos sem conta vinculada (já incluído em `saldo`). */
  semConta?: number;
  semContaQtd?: number;
}
