import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { of } from 'rxjs';
import { SazonalidadePage } from './sazonalidade.page';
import { SharedModule } from '../../shared/shared.module';
import { SazonalidadeService } from '../../services/sazonalidade.service';
import { ContaService } from '../../services/conta.service';
import { Sazonalidade } from '../../models/sazonalidade';
import { simularOverlays } from '../../testing/ionic-fakes';

describe('SazonalidadePage', () => {
  let fixture: ComponentFixture<SazonalidadePage>;
  let page: SazonalidadePage;
  let service: jasmine.SpyObj<SazonalidadeService>;
  let overlays: ReturnType<typeof simularOverlays>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('SazonalidadeService', ['listar', 'criar', 'atualizar', 'deletar']);
    service.listar.and.returnValue(of([]));
    service.criar.and.returnValue(of({}));
    service.atualizar.and.returnValue(of({}));
    const contaService = jasmine.createSpyObj('ContaService', ['listar']);
    contaService.listar.and.returnValue(of([{ id: 3, nome: 'Principal', instituicao: 'Nubank' }]));

    await TestBed.configureTestingModule({
      declarations: [SazonalidadePage],
      imports: [IonicModule.forRoot(), FormsModule, ReactiveFormsModule, SharedModule],
      providers: [
        { provide: SazonalidadeService, useValue: service },
        { provide: ContaService, useValue: contaService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SazonalidadePage);
    page = fixture.componentInstance;
    overlays = simularOverlays(
      TestBed.inject(LoadingController), TestBed.inject(ToastController), TestBed.inject(AlertController)
    );
    page.abrirModalNovo();
    page.sazonalidadeForm.patchValue({ nome: 'Alta temporada', mesInicio: 11, mesFim: 12 });
  });

  describe('reserva de caixa: data, caixa necessário e conta andam juntos', () => {
    const erroReserva = () => page.sazonalidadeForm.hasError('reservaIncompleta');

    it('sem nenhum dos três campos o período é válido (reserva é opcional)', () => {
      expect(erroReserva()).toBeFalse();
      expect(page.sazonalidadeForm.valid).toBeTrue();
      expect(page.reservaPreenchida).toBeFalse();
    });

    it('com os três preenchidos é válido', () => {
      page.sazonalidadeForm.patchValue({ dataAlvo: '2026-11-05', valorNecessario: 2000, contaDebitoId: 3 });
      expect(erroReserva()).toBeFalse();
      expect(page.sazonalidadeForm.valid).toBeTrue();
    });

    it('com apenas um ou dois campos fica inválido', () => {
      const combinacoes = [
        { dataAlvo: '2026-11-05' },
        { valorNecessario: 2000 },
        { contaDebitoId: 3 },
        { dataAlvo: '2026-11-05', valorNecessario: 2000 },
        { dataAlvo: '2026-11-05', contaDebitoId: 3 },
        { valorNecessario: 2000, contaDebitoId: 3 }
      ];
      for (const parcial of combinacoes) {
        page.limparReserva();
        page.sazonalidadeForm.patchValue(parcial);
        expect(erroReserva()).withContext(JSON.stringify(parcial)).toBeTrue();
        expect(page.sazonalidadeForm.valid).toBeFalse();
      }
    });

    it('caixa necessário precisa ser maior que zero', () => {
      page.sazonalidadeForm.patchValue({ dataAlvo: '2026-11-05', valorNecessario: 0, contaDebitoId: 3 });
      expect(page.sazonalidadeForm.get('valorNecessario')!.hasError('min')).toBeTrue();
    });

    it('limparReserva zera os três campos e volta a ser válido', () => {
      page.sazonalidadeForm.patchValue({ dataAlvo: '2026-11-05', valorNecessario: 2000 });
      expect(page.reservaPreenchida).toBeTrue();

      page.limparReserva();

      expect(page.reservaPreenchida).toBeFalse();
      expect(page.sazonalidadeForm.valid).toBeTrue();
      expect(page.sazonalidadeForm.dirty).toBeTrue();
    });

    it('novo período sempre abre sem reserva', () => {
      page.sazonalidadeForm.patchValue({ dataAlvo: '2026-11-05', valorNecessario: 2000, contaDebitoId: 3 });
      page.abrirModalNovo();
      expect(page.reservaPreenchida).toBeFalse();
    });
  });

  describe('salvar', () => {
    it('envia a reserva com a data em yyyy-MM-dd', fakeAsync(() => {
      page.sazonalidadeForm.patchValue({
        dataAlvo: '2026-11-05T09:30:00.000Z', valorNecessario: 2000, contaDebitoId: 3
      });

      page.salvar();
      flushMicrotasks();

      const payload = service.criar.calls.mostRecent().args[0];
      expect(payload.dataAlvo).toBe('2026-11-05');
      expect(payload.valorNecessario).toBe(2000);
      expect(payload.contaDebitoId).toBe(3);
      expect(overlays.toasts).toContain('Período criado');
    }));

    it('sem reserva envia os três campos nulos (compatível com períodos antigos)', fakeAsync(() => {
      page.salvar();
      flushMicrotasks();

      const payload = service.criar.calls.mostRecent().args[0];
      expect(payload.dataAlvo).toBeNull();
      expect(payload.valorNecessario).toBeNull();
      expect(payload.contaDebitoId).toBeNull();
    }));

    it('reserva incompleta não chega ao servidor', fakeAsync(() => {
      page.sazonalidadeForm.patchValue({ dataAlvo: '2026-11-05' });

      page.salvar();
      flushMicrotasks();

      expect(service.criar).not.toHaveBeenCalled();
      expect(overlays.toasts).toContain('Preencha os campos obrigatórios');
    }));

    it('editar carrega a reserva existente', () => {
      const periodo: Sazonalidade = {
        id: 5, nome: 'Natal', mesInicio: 11, mesFim: 12, nivelImpacto: 'ALTO',
        dataAlvo: '2026-11-01', valorNecessario: 5000, contaDebitoId: 3, contaDebitoNome: 'Principal'
      };
      page.abrirModalEditar(periodo);

      expect(page.sazonalidadeForm.value.dataAlvo).toBe('2026-11-01');
      expect(page.sazonalidadeForm.value.valorNecessario).toBe(5000);
      expect(page.sazonalidadeForm.value.contaDebitoId).toBe(3);
    });

    it('editar período antigo (sem reserva) deixa os campos vazios', () => {
      page.abrirModalEditar({ id: 6, nome: 'Verão', mesInicio: 1, mesFim: 3, nivelImpacto: 'BAIXO' });
      expect(page.reservaPreenchida).toBeFalse();
    });
  });

  describe('formatarData', () => {
    it('converte yyyy-MM-dd para dd/MM/yyyy sem mudar o dia por fuso horário', () => {
      expect(page.formatarData('2026-11-05')).toBe('05/11/2026');
      expect(page.formatarData('2026-01-31T23:59:00Z')).toBe('31/01/2026');
    });

    it('vazio ou nulo devolve texto vazio', () => {
      expect(page.formatarData(null)).toBe('');
      expect(page.formatarData(undefined)).toBe('');
    });
  });

  describe('período ativo agora', () => {
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    // instalar o relógio falso duas vezes no mesmo teste lança erro; aqui só se troca a data
    const noMes = (mes: number) => jasmine.clock().mockDate(new Date(2026, mes - 1, 15));
    const periodo = (mesInicio: number, mesFim: number): Sazonalidade =>
      ({ nome: 'p', mesInicio, mesFim, nivelImpacto: 'MEDIO' });

    it('período dentro do ano', () => {
      noMes(4);
      expect(page.estaAtivo(periodo(3, 5))).toBeTrue();
      expect(page.estaAtivo(periodo(6, 8))).toBeFalse();
    });

    it('período que vira o ano (nov → fev) vale em dezembro e janeiro, não em junho', () => {
      noMes(12);
      expect(page.estaAtivo(periodo(11, 2))).toBeTrue();
      noMes(1);
      expect(page.estaAtivo(periodo(11, 2))).toBeTrue();
      noMes(6);
      expect(page.estaAtivo(periodo(11, 2))).toBeFalse();
    });

    it('limites do período são inclusivos', () => {
      noMes(3);
      expect(page.estaAtivo(periodo(3, 5))).toBeTrue();
      noMes(5);
      expect(page.estaAtivo(periodo(3, 5))).toBeTrue();
    });
  });

  it('corImpacto devolve a cor do nível', () => {
    expect(page.corImpacto('ALTO')).toBe('danger');
    expect(page.corImpacto('MEDIO')).toBe('warning');
    expect(page.corImpacto('BAIXO')).toBe('success');
  });
});
