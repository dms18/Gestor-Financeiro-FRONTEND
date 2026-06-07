export type TipoConta = 'CORRENTE' | 'POUPANCA' | 'CAIXA';
export type TipoPessoa = 'PF' | 'PJ';

export interface Conta {
  id?: number;
  nome: string;
  tipo: TipoConta;
  saldo: number;
  tipoPessoa: TipoPessoa;
  usuarioId?: number;
}
