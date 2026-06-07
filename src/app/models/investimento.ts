export type StatusInvestimento = 'IDEIA' | 'EM_ANALISE' | 'APROVADO' | 'DESCARTADO';
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA';

export interface Investimento {
  id?: number;
  titulo: string;
  descricao?: string;
  valorEstimado?: number;
  retornoEstimado?: number;
  status: StatusInvestimento;
  prioridade: Prioridade;
  usuarioId?: number;
}
