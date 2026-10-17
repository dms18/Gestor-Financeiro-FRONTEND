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
  periodo: 'mes' | 'anterior' | 'tudo' = 'mes';

  resumo: ResumoFinanceiro = {
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    porConta: []
  };

  ultimasTransacoes: Transacao[] = [];
  alertasAtivos: Sazonalidade[] = [];
  carregando = false;
  private interfaceAplicada = false;

  constructor(
    private transacaoService: TransacaoService,
    private sazonalidadeService: SazonalidadeService,
    private authService: AuthService
  ) {}

  ionViewWillEnter() {
    this.authService.getUsuarioAtual().subscribe(u => {
      this.usuario = u;
      // Aplica a interface inicial preferida apenas uma vez (ao entrar após o login).
      // Depois, respeita o filtro que o usuário selecionar durante a sessão.
      if (!this.interfaceAplicada && u) {
        this.filtroTipoPessoa = this.mapInterfaceParaFiltro(u.interfaceInicial);
        this.interfaceAplicada = true;
      }
    });
    this.carregarDados();
  }

  private mapInterfaceParaFiltro(interfaceInicial?: string | null): '' | TipoPessoa {
    if (interfaceInicial === 'PF' || interfaceInicial === 'PJ') {
      return interfaceInicial;
    }
    return ''; // AMBOS ou não definido → visão geral
  }

  onFiltroChange() {
    this.carregarDados();
  }

  carregarDados(event?: any) {
    this.carregando = true;
    const tipoPessoa = this.filtroTipoPessoa || undefined;

    const ref = this.referenciaPeriodo();
    this.transacaoService.obterResumo(tipoPessoa, ref?.mes, ref?.ano).subscribe({
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

  /** Mês/ano do período escolhido; null = todo o histórico. */
  private referenciaPeriodo(): { mes: number; ano: number } | null {
    if (this.periodo === 'tudo') {
      return null;
    }
    const data = new Date();
    if (this.periodo === 'anterior') {
      data.setDate(1);
      data.setMonth(data.getMonth() - 1);
    }
    return { mes: data.getMonth() + 1, ano: data.getFullYear() };
  }

  get rotuloPeriodo(): string {
    const ref = this.referenciaPeriodo();
    if (!ref) {
      return 'todo o período';
    }
    return new Date(ref.ano, ref.mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
