import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AdminResumo {
  geradoEm: string;
  usuarios: {
    total: number; ativos: number; inativos: number; novos7Dias: number; novos30Dias: number;
    aceitaramTermos: number; porPerfil: Record<string, number>;
  };
  atividade: {
    transacoes: number; transacoes30Dias: number; contas: number; categorias: number;
    sazonalidades: number; investimentos: number; investimentosPorStatus: Record<string, number>;
    usuariosAtivos30Dias: number;
  };
  cadastrosPorDia: { data: string; quantidade: number }[];
  usuariosRecentes: {
    id: number; nome: string; email: string; perfil: string; ativo: boolean; admin: boolean;
    criadoEm: string; transacoes: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  obterResumo(): Observable<AdminResumo> {
    return this.api.get<AdminResumo>('/admin/resumo');
  }

  obterInfra(): Observable<AdminInfra> {
    return this.api.get<AdminInfra>('/admin/infra');
  }
}

export interface AdminInfra {
  geradoEm: string;
  vps: {
    cpus: number | null; cpuPercentual: number | null; load1: number | null; load5: number | null; load15: number | null;
    memoriaTotalBytes: number | null; memoriaUsadaBytes: number | null;
    swapTotalBytes: number | null; swapUsadaBytes: number | null;
    discoTotalBytes: number | null; discoUsadoBytes: number | null; uptimeSegundos: number | null;
  };
  containersDisponiveis: boolean;
  containersErro: string | null;
  containers: {
    id: string; nome: string; imagem: string | null; estado: string | null; situacao: string | null;
    cpuPercentual: number | null; memoriaUsadaBytes: number | null; memoriaLimiteBytes: number | null;
    redeRxBytes: number | null; redeTxBytes: number | null; discoLeituraBytes: number | null; discoEscritaBytes: number | null;
  }[];
}
