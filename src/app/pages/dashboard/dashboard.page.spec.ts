import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DashboardPage } from './dashboard.page';
import { SharedModule } from '../../shared/shared.module';
import { TransacaoService } from '../../services/transacao.service';
import { SazonalidadeService } from '../../services/sazonalidade.service';
import { AuthService } from '../../services/auth.service';
import { ReservaSazonal } from '../../models/sazonalidade';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let page: DashboardPage;
  let transacaoService: jasmine.SpyObj<TransacaoService>;
  let sazonalidadeService: jasmine.SpyObj<SazonalidadeService>;

  const resumo = (extra: object = {}) => ({
    totalReceitas: 500, totalDespesas: 150, saldo: 1050, porConta: [], semConta: 0, semContaQtd: 0, ...extra
  });

  const reserva = (extra: Partial<ReservaSazonal> = {}): ReservaSazonal => ({
    sazonalidadeId: 1, nome: 'Alta temporada', nivelImpacto: 'ALTO',
    dataAlvo: '2026-11-05', fimDoPeriodo: '2026-12-31', valorNecessario: 2000,
    contaId: 1, contaNome: 'Principal', saldoConta: 1150, diferenca: -850,
    suficiente: false, percentualCobertura: 57, ...extra
  });

  /**
   * Renderiza o Dashboard com estes dados. Eles passam pelos serviços falsos porque o
   * <ion-segment> dispara ionChange na primeira renderização e a página recarrega tudo:
   * atribuir direto em page.resumo / page.reservas seria sobrescrito (corrida).
   */
  const renderizar = (res: object = {}, reservas: ReservaSazonal[] = []) => {
    transacaoService.obterResumo.and.returnValue(of(resumo(res)));
    sazonalidadeService.obterReservas.and.returnValue(of(reservas));
    page.carregarDados();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    transacaoService = jasmine.createSpyObj('TransacaoService', ['obterResumo', 'listar']);
    transacaoService.obterResumo.and.returnValue(of(resumo()));
    transacaoService.listar.and.returnValue(of([]));
    sazonalidadeService = jasmine.createSpyObj('SazonalidadeService', ['obterAletasAtivos', 'obterReservas']);
    sazonalidadeService.obterAletasAtivos.and.returnValue(of([]));
    sazonalidadeService.obterReservas.and.returnValue(of([]));
    const auth = { getUsuarioAtual: () => new BehaviorSubject(null), perfilAmbos: true, vinculoPadrao: 'PF' };

    await TestBed.configureTestingModule({
      declarations: [DashboardPage],
      imports: [IonicModule.forRoot(), FormsModule, SharedModule],
      providers: [
        { provide: TransacaoService, useValue: transacaoService },
        { provide: SazonalidadeService, useValue: sazonalidadeService },
        { provide: AuthService, useValue: auth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    page = fixture.componentInstance;
  });

  describe('carregarDados', () => {
    it('busca resumo, últimas transações, alertas e reservas', () => {
      page.carregarDados();

      expect(transacaoService.obterResumo).toHaveBeenCalled();
      expect(transacaoService.listar).toHaveBeenCalled();
      expect(sazonalidadeService.obterAletasAtivos).toHaveBeenCalled();
      expect(sazonalidadeService.obterReservas).toHaveBeenCalled();
    });

    it('guarda as reservas devolvidas pelo servidor', () => {
      sazonalidadeService.obterReservas.and.returnValue(of([reserva()]));
      page.carregarDados();
      expect(page.reservas.length).toBe(1);
    });

    it('falha ao buscar reservas não derruba o Dashboard (lista vazia)', () => {
      sazonalidadeService.obterReservas.and.returnValue(throwError({ status: 500 }));
      page.reservas = [reserva()];

      page.carregarDados();

      expect(page.reservas).toEqual([]);
    });

    it('pede o resumo do mês atual por padrão e todo o histórico em "tudo"', () => {
      page.periodo = 'mes';
      page.carregarDados();
      const hoje = new Date();
      expect(transacaoService.obterResumo.calls.mostRecent().args.slice(1)).toEqual([hoje.getMonth() + 1, hoje.getFullYear()]);

      page.periodo = 'tudo';
      page.carregarDados();
      expect(transacaoService.obterResumo.calls.mostRecent().args.slice(1)).toEqual([undefined, undefined]);
    });

    it('"anterior" pede o mês passado (inclusive em janeiro, virando o ano)', () => {
      page.periodo = 'anterior';
      page.carregarDados();
      const [, mes, ano] = transacaoService.obterResumo.calls.mostRecent().args;
      const esperado = new Date();
      esperado.setDate(1);
      esperado.setMonth(esperado.getMonth() - 1);
      expect([mes, ano]).toEqual([esperado.getMonth() + 1, esperado.getFullYear()]);
    });
  });

  describe('aviso de lançamentos sem conta', () => {
    const texto = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');

    it('aparece quando há lançamentos sem conta vinculada', () => {
      renderizar({ semConta: -100, semContaQtd: 1 });

      expect(texto()).toContain('sem conta vinculada');
      expect(texto()).toContain('1 lançamento');
      expect(texto()).toContain('já incluído no saldo');
    });

    it('usa o plural para mais de um lançamento', () => {
      renderizar({ semConta: -250, semContaQtd: 3 });
      expect(texto()).toContain('3 lançamentos');
    });

    it('não aparece quando todos os lançamentos têm conta', () => {
      renderizar({ semConta: 0, semContaQtd: 0 });
      expect(texto()).not.toContain('sem conta vinculada');
    });
  });

  describe('card de caixa para sazonalidade', () => {
    const texto = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');

    it('não aparece sem reservas ativas', () => {
      renderizar({}, []);
      expect(texto()).not.toContain('Caixa para sazonalidade');
    });

    it('saldo menor que o necessário: "insuficiente" e quanto falta', () => {
      renderizar({}, [reserva()]);

      expect(texto()).toContain('Caixa para sazonalidade');
      expect(texto()).toContain('Alta temporada');
      expect(texto()).toContain('Saldo insuficiente');
      expect(texto()).toContain('Faltam');
      expect(fixture.nativeElement.querySelector('.reserva.insuficiente')).not.toBeNull();
    });

    it('saldo maior que o necessário: "suficiente" e a folga', () => {
      renderizar({}, [reserva({ saldoConta: 3000, diferenca: 1000, suficiente: true, percentualCobertura: 100 })]);

      expect(texto()).toContain('Saldo suficiente');
      expect(texto()).toContain('Folga de');
      expect(fixture.nativeElement.querySelector('.reserva.insuficiente')).toBeNull();
    });

    it('a barra reflete o percentual de cobertura e é acessível', () => {
      renderizar({}, [reserva({ percentualCobertura: 57 })]);

      const barra = fixture.nativeElement.querySelector('progress.reserva-barra') as HTMLProgressElement;
      expect(barra.value).toBe(57);
      expect(barra.getAttribute('aria-label')).toContain('57%');
    });

    it('mostra uma linha por período', () => {
      renderizar({}, [reserva({ sazonalidadeId: 1 }), reserva({ sazonalidadeId: 2, nome: 'Dia das Mães' })]);

      expect(fixture.nativeElement.querySelectorAll('.reserva').length).toBe(2);
    });
  });

  it('formatarData converte yyyy-MM-dd para dd/MM/yyyy', () => {
    expect(page.formatarData('2026-12-31')).toBe('31/12/2026');
    expect(page.formatarData(null)).toBe('');
  });

  it('rótulo do período', () => {
    page.periodo = 'tudo';
    expect(page.rotuloPeriodo).toBe('todo o período');
  });

  it('percentuais de receitas e despesas somam 100 e tratam resumo vazio', () => {
    page.resumo = { totalReceitas: 300, totalDespesas: 100, saldo: 200, porConta: [] };
    expect(page.percentualReceitas + page.percentualDespesas).toBeCloseTo(100);
    expect(page.percentualReceitas).toBe(75);

    page.resumo = { totalReceitas: 0, totalDespesas: 0, saldo: 0, porConta: [] };
    expect(page.percentualReceitas).toBe(0);
    expect(page.percentualDespesas).toBe(0);
  });
});
