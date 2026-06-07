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
}

export interface ResumoPorConta {
  contaId: number;
  contaNome: string;
  saldo: number;
  receitas: number;
  despesas: number;
}

export interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  porConta: ResumoPorConta[];
}
