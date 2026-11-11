import { Component } from '@angular/core';
import { TransacaoService } from '../../services/transacao.service';
import { SazonalidadeService } from '../../services/sazonalidade.service';
import { AuthService } from '../../services/auth.service';
import { ResumoFinanceiro, Transacao, TipoPessoa } from '../../models/transacao';
import { ReservaSazonal, Sazonalidade } from '../../models/sazonalidade';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  usuario: Usuario | null = null;
  filtroTipoPessoa: '' | TipoPessoa = '';
  periodo: 'mes' | 'anterior' | 'tudo' | 'personalizado' = 'mes';

  /** Filtro personalizado: um dia específico ou um período (datas yyyy-MM-dd). */
  modoPersonalizado: 'dia' | 'periodo' = 'dia';
  dataInicio = DashboardPage.hojeIso();
  dataFim = DashboardPage.hojeIso();
  readonly meses = 'janeiro,fevereiro,março,abril,maio,junho,julho,agosto,setembro,outubro,novembro,dezembro';
  readonly mesesCurtos = 'jan,fev,mar,abr,mai,jun,jul,ago,set,out,nov,dez';

  private static hojeIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  resumo: ResumoFinanceiro = {
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    porConta: []
  };

  ultimasTransacoes: Transacao[] = [];
  alertasAtivos: Sazonalidade[] = [];
  reservas: ReservaSazonal[] = [];
  carregando = false;
  private interfaceAplicada = false;

  constructor(
    private transacaoService: TransacaoService,
    private sazonalidadeService: SazonalidadeService,
    private authService: AuthService
  ) {}

  /** Abas PF/PJ só aparecem para perfil AMBOS. */
  get mostrarAbasVinculo(): boolean {
    return this.authService.perfilAmbos;
  }

  ionViewWillEnter() {
    this.authService.getUsuarioAtual().subscribe(u => {
      this.usuario = u;
      // Aplica a interface inicial preferida apenas uma vez (ao entrar após o login).
      // Depois, respeita o filtro que o usuário selecionar durante a sessão.
      if (!this.interfaceAplicada && u) {
        this.filtroTipoPessoa = this.authService.perfilAmbos ? this.mapInterfaceParaFiltro(u.interfaceInicial) : '';
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
    const intervalo = this.intervaloPersonalizado();
    this.transacaoService.obterResumo(tipoPessoa, ref?.mes, ref?.ano, intervalo?.inicio, intervalo?.fim).subscribe({
      next: (resumo) => {
        this.resumo = resumo || this.resumo;
      },
      error: () => {}
    });

    this.transacaoService.listar(tipoPessoa).subscribe({
      next: (transacoes) => {
        this.ultimasTransacoes = (transacoes || [])
          .filter(t => !intervalo || this.dentroDoIntervalo(t.data, intervalo))
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

    // caixa necessário x saldo da conta, a partir da data-alvo de cada período sazonal
    this.sazonalidadeService.obterReservas().subscribe({
      next: (reservas) => (this.reservas = reservas || []),
      error: () => (this.reservas = [])
    });
  }

  /** Ao escolher a data inicial, a final nunca fica antes dela (e, no modo dia, é a mesma). */
  onDataInicioChange() {
    this.dataInicio = (this.dataInicio || '').substring(0, 10);
    if (!this.dataFim || this.dataFim.substring(0, 10) < this.dataInicio) {
      this.dataFim = this.dataInicio;
    }
    this.onFiltroChange();
  }

  private dentroDoIntervalo(data: string | undefined, intervalo: { inicio: string; fim: string }): boolean {
    const dia = (data || '').substring(0, 10);
    return dia >= intervalo.inicio && dia <= intervalo.fim;
  }

  /** Intervalo do filtro personalizado (inclusivo); null nos demais períodos. */
  private intervaloPersonalizado(): { inicio: string; fim: string } | null {
    if (this.periodo !== 'personalizado' || !this.dataInicio) {
      return null;
    }
    const inicio = this.dataInicio.substring(0, 10);
    const fimBruto = this.modoPersonalizado === 'dia' ? inicio : (this.dataFim || inicio).substring(0, 10);
    return { inicio, fim: fimBruto < inicio ? inicio : fimBruto };
  }

  /** Mês/ano do período escolhido; null = todo o histórico. */
  private referenciaPeriodo(): { mes: number; ano: number } | null {
    if (this.periodo === 'tudo' || this.periodo === 'personalizado') {
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
    const intervalo = this.intervaloPersonalizado();
    if (intervalo) {
      return intervalo.inicio === intervalo.fim
        ? this.formatarData(intervalo.inicio)
        : `${this.formatarData(intervalo.inicio)} a ${this.formatarData(intervalo.fim)}`;
    }
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

  /** Data yyyy-MM-dd no formato dd/MM/yyyy, sem passar por fuso horário. */
  formatarData(iso?: string | null): string {
    if (!iso) {
      return '';
    }
    const [a, m, d] = iso.substring(0, 10).split('-');
    return `${d}/${m}/${a}`;
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
