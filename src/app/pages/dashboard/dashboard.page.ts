import { Component } from '@angular/core';
import { TransacaoService } from '../../services/transacao.service';
import { SazonalidadeService } from '../../services/sazonalidade.service';
import { AuthService } from '../../services/auth.service';
import { ResumoFinanceiro, Transacao, TipoPessoa } from '../../models/transacao';
import { Sazonalidade } from '../../models/sazonalidade';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  usuario: Usuario | null = null;
  filtroTipoPessoa: '' | TipoPessoa = '';

  resumo: ResumoFinanceiro = {
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    porConta: []
  };

  ultimasTransacoes: Transacao[] = [];
  alertasAtivos: Sazonalidade[] = [];
  carregando = false;

  constructor(
    private transacaoService: TransacaoService,
    private sazonalidadeService: SazonalidadeService,
    private authService: AuthService
  ) {}

  ionViewWillEnter() {
    this.authService.getUsuarioAtual().subscribe(u => (this.usuario = u));
    this.carregarDados();
  }

  onFiltroChange() {
    this.carregarDados();
  }

  carregarDados(event?: any) {
    this.carregando = true;
    const tipoPessoa = this.filtroTipoPessoa || undefined;

    this.transacaoService.obterResumo(tipoPessoa).subscribe({
      next: (resumo) => {
        this.resumo = resumo || this.resumo;
      },
      error: () => {}
    });

    this.transacaoService.listar(tipoPessoa).subscribe({
      next: (transacoes) => {
        this.ultimasTransacoes = (transacoes || [])
          .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
          .slice(0, 5);
        this.carregando = false;
        if (event) {
          event.target.complete();
        }
      },
      error: () => {
        this.carregando = false;
        if (event) {
          event.target.complete();
        }
      }
    });

    this.sazonalidadeService.obterAletasAtivos().subscribe({
      next: (alertas) => (this.alertasAtivos = alertas || []),
      error: () => (this.alertasAtivos = [])
    });
  }

  get percentualReceitas(): number {
    const total = this.resumo.totalReceitas + this.resumo.totalDespesas;
    if (total === 0) {
      return 0;
    }
    return (this.resumo.totalReceitas / total) * 100;
  }

  get percentualDespesas(): number {
    const total = this.resumo.totalReceitas + this.resumo.totalDespesas;
    if (total === 0) {
      return 0;
    }
    return (this.resumo.totalDespesas / total) * 100;
  }

  corImpacto(nivel: string): string {
    switch (nivel) {
      case 'ALTO': return 'danger';
      case 'MEDIO': return 'warning';
      case 'BAIXO': return 'success';
      default: return 'medium';
    }
  }
}
