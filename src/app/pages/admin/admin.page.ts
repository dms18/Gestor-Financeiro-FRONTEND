import { Component, OnDestroy } from '@angular/core';
import { AdminInfra, AdminResumo, AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnDestroy {
  /** Aba aberta: visão geral dos dados ou uso do servidor e dos containers. */
  aba: 'geral' | 'servidor' = 'geral';

  resumo: AdminResumo | null = null;
  infra: AdminInfra | null = null;
  carregandoInfra = false;
  erroInfra = '';
  private temporizador: any;
  carregando = false;
  erro = '';

  readonly rotuloStatus: Record<string, string> = {
    IDEIA: 'Ideias', EM_ANALISE: 'Em análise', APROVADO: 'Aprovados', DESCARTADO: 'Descartados'
  };
  readonly rotuloPerfil: Record<string, string> = { PF: 'Pessoa física', PJ: 'Pessoa jurídica', AMBOS: 'Ambos' };

  constructor(private adminService: AdminService) {}

  ionViewWillEnter() {
    this.carregar();
    this.iniciarAtualizacaoInfra();
  }

  ionViewWillLeave() {
    this.pararAtualizacaoInfra();
  }

  ngOnDestroy() {
    this.pararAtualizacaoInfra();
  }

  mudarAba() {
    if (this.aba === 'servidor') {
      this.carregarInfra();
    }
  }

  /** Na aba Servidor, atualiza sozinho a cada 10 s (para ao sair da tela). */
  private iniciarAtualizacaoInfra() {
    this.pararAtualizacaoInfra();
    if (this.aba === 'servidor') {
      this.carregarInfra();
    }
    this.temporizador = setInterval(() => {
      if (this.aba === 'servidor' && !this.carregandoInfra) {
        this.carregarInfra();
      }
    }, 10000);
  }

  private pararAtualizacaoInfra() {
    clearInterval(this.temporizador);
  }

  carregarInfra() {
    this.carregandoInfra = true;
    this.erroInfra = '';
    this.adminService.obterInfra().subscribe({
      next: (i) => {
        this.infra = i;
        this.carregandoInfra = false;
      },
      error: (e) => {
        this.carregandoInfra = false;
        this.erroInfra = e?.status === 403 ? 'Acesso restrito a administradores.' : 'Não foi possível medir o servidor.';
      }
    });
  }

  /** Bytes em unidade legível (KB, MB, GB). */
  bytes(v: number | null | undefined): string {
    if (v === null || v === undefined) { return '—'; }
    const un = ['B', 'KB', 'MB', 'GB', 'TB'];
    let n = v;
    let i = 0;
    while (n >= 1024 && i < un.length - 1) { n /= 1024; i++; }
    return n.toLocaleString('pt-BR', { maximumFractionDigits: n >= 100 || i === 0 ? 0 : 1 }) + ' ' + un[i];
  }

  /** Segundos em "3d 4h", "5h 12min" ou "8min". */
  duracao(seg: number | null | undefined): string {
    if (seg === null || seg === undefined) { return '—'; }
    const d = Math.floor(seg / 86400);
    const h = Math.floor((seg % 86400) / 3600);
    const m = Math.floor((seg % 3600) / 60);
    if (d > 0) { return `${d}d ${h}h`; }
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  pct(parte: number | null | undefined, total: number | null | undefined): number {
    return parte != null && total ? Math.min(100, Math.round((parte / total) * 100)) : 0;
  }

  /** Cor da barra: verde, amarelo (>=70%) ou vermelho (>=90%). */
  corBarra(p: number | null | undefined): string {
    const v = p ?? 0;
    return v >= 90 ? 'danger' : v >= 70 ? 'warning' : 'ok';
  }

  /** Containers sem limite de memória reportam o total do servidor: não mostrar como limite. */
  limiteMemoria(c: { memoriaLimiteBytes: number | null }): number | null {
    const total = this.infra?.vps.memoriaTotalBytes;
    return c.memoriaLimiteBytes && total && c.memoriaLimiteBytes < total ? c.memoriaLimiteBytes : null;
  }

  carregar(event?: any) {
    this.carregando = true;
    this.erro = '';
    this.adminService.obterResumo().subscribe({
      next: (r) => {
        this.resumo = r;
        this.carregando = false;
        event?.target?.complete();
      },
      error: (e) => {
        this.carregando = false;
        this.erro = e?.status === 403 ? 'Acesso restrito a administradores.' : 'Não foi possível carregar o painel.';
        event?.target?.complete();
      }
    });
  }

  /** Maior cadastro diário, para dimensionar as barras do gráfico. */
  get maxCadastros(): number {
    return Math.max(1, ...(this.resumo?.cadastrosPorDia || []).map(d => d.quantidade));
  }

  alturaBarra(qtd: number): number {
    return qtd === 0 ? 2 : Math.max(8, (qtd / this.maxCadastros) * 100);
  }

  get perfis(): { chave: string; qtd: number }[] {
    return Object.entries(this.resumo?.usuarios.porPerfil || {}).map(([chave, qtd]) => ({ chave, qtd }));
  }

  get statusInvestimentos(): { chave: string; qtd: number }[] {
    return Object.entries(this.resumo?.atividade.investimentosPorStatus || {}).map(([chave, qtd]) => ({ chave, qtd }));
  }

  percentual(parte: number, total: number): number {
    return total > 0 ? Math.round((parte / total) * 100) : 0;
  }

  /** yyyy-MM-dd → dd/MM, sem passar por fuso horário. */
  diaMes(iso: string): string {
    const [, m, d] = iso.substring(0, 10).split('-');
    return `${d}/${m}`;
  }
}
