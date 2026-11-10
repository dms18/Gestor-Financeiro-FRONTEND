export type NivelImpacto = 'BAIXO' | 'MEDIO' | 'ALTO';

export interface Sazonalidade {
  id?: number;
  nome: string;
  mesInicio: number; // 1-12
  mesFim: number; // 1-12
  descricao?: string;
  nivelImpacto: NivelImpacto;
  usuarioId?: number;
  /** Reserva de caixa (opcional; os três campos andam juntos). */
  dataAlvo?: string | null; // yyyy-MM-dd
  valorNecessario?: number | null;
  contaDebitoId?: number | null;
  contaDebitoNome?: string | null;
}

/** Comparação entre o saldo da conta de débito e o caixa necessário (vem de /sazonalidade/reservas). */
export interface ReservaSazonal {
  sazonalidadeId: number;
  nome: string;
  nivelImpacto: NivelImpacto;
  dataAlvo: string;
  fimDoPeriodo: string;
  valorNecessario: number;
  contaId: number;
  contaNome: string;
  saldoConta: number;
  /** saldoConta − valorNecessario: positivo = folga, negativo = falta. */
  diferenca: number;
  suficiente: boolean;
  /** 0 a 100 */
  percentualCobertura: number;
}
