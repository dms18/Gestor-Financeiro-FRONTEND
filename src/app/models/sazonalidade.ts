export type NivelImpacto = 'BAIXO' | 'MEDIO' | 'ALTO';

export interface Sazonalidade {
  id?: number;
  nome: string;
  mesInicio: number; // 1-12
  mesFim: number; // 1-12
  descricao?: string;
  nivelImpacto: NivelImpacto;
  usuarioId?: number;
}
