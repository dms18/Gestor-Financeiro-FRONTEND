import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { of } from 'rxjs';
import { ContasPage } from './contas.page';
import { SharedModule } from '../../shared/shared.module';
import { ContaService } from '../../services/conta.service';
import { AuthService } from '../../services/auth.service';
import { TransacaoService } from '../../services/transacao.service';
import { Conta } from '../../models/conta';
import { simularOverlays } from '../../testing/ionic-fakes';

describe('ContasPage', () => {
  let fixture: ComponentFixture<ContasPage>;
  let page: ContasPage;
  let contaService: jasmine.SpyObj<ContaService>;
  let transacaoService: jasmine.SpyObj<TransacaoService>;
  let overlays: ReturnType<typeof simularOverlays>;

  const conta = (extra: Partial<Conta> = {}): Conta => ({
    id: 1, nome: 'Principal', tipo: 'CORRENTE', saldo: 1000, tipoPessoa: 'PF', ...extra
  });

  beforeEach(async () => {
    contaService = jasmine.createSpyObj('ContaService', ['listar', 'criar', 'atualizar', 'deletar']);
    contaService.listar.and.returnValue(of([]));
    contaService.criar.and.returnValue(of({}));
    transacaoService = jasmine.createSpyObj('TransacaoService', ['obterResumo']);
    transacaoService.obterResumo.and.returnValue(of({ porConta: [] }));

    await TestBed.configureTestingModule({
      declarations: [ContasPage],
      imports: [IonicModule.forRoot(), FormsModule, ReactiveFormsModule, SharedModule],
      providers: [
        { provide: ContaService, useValue: contaService },
        { provide: TransacaoService, useValue: transacaoService },
        { provide: AuthService, useValue: { perfilAmbos: true, vinculoPadrao: 'PF' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContasPage);
    page = fixture.componentInstance;
    overlays = simularOverlays(
      TestBed.inject(LoadingController), TestBed.inject(ToastController), TestBed.inject(AlertController)
    );
  });

  describe('ícone do vínculo', () => {
    it('PF usa pessoa e PJ usa empresa', () => {
      expect(page.iconeVinculo('PF')).toBe('person-outline');
      expect(page.iconeVinculo('PJ')).toBe('business-outline');
    });

    it('a lista mostra ícones diferentes para PF e PJ', () => {
      contaService.listar.and.returnValue(of([
        conta({ id: 1, nome: 'Pessoal', tipoPessoa: 'PF' }),
        conta({ id: 2, nome: 'Empresa', tipoPessoa: 'PJ' })
      ]));
      page.carregarContas();
      fixture.detectChanges();

      const icones = Array.from(fixture.nativeElement.querySelectorAll('ion-item ion-icon[slot="start"]')) as HTMLElement[];
      const nomes = icones.map(i => (i as any).name); // propriedade do Stencil, não atributo
      expect(nomes).toContain('person-outline');
      expect(nomes).toContain('business-outline');
    });
  });

  describe('saldo inicial no formulário', () => {
    it('começa vazio (sem "0" para apagar)', () => {
      page.abrirModalNova();
      expect(page.contaForm.get('saldo')!.value).toBeNull();
    });

    it('continua obrigatório: vazio é inválido, 0 é válido', () => {
      page.abrirModalNova();
      page.contaForm.patchValue({ nome: 'Caixa' });
      expect(page.contaForm.valid).toBeFalse();

      page.contaForm.patchValue({ saldo: 0 });
      expect(page.contaForm.valid).toBeTrue();
    });

    it('recusa saldo negativo', () => {
      page.abrirModalNova();
      page.contaForm.patchValue({ nome: 'Caixa', saldo: -1 });
      expect(page.contaForm.get('saldo')!.hasError('min')).toBeTrue();
    });

    it('editar mostra o saldo inicial cadastrado', () => {
      page.abrirModalEditar(conta({ saldo: 1234.5 }));
      expect(page.contaForm.get('saldo')!.value).toBe(1234.5);
    });

    it('salvar envia o saldo informado', fakeAsync(() => {
      page.abrirModalNova();
      page.contaForm.patchValue({ nome: 'Caixa', saldo: 250.75 });

      page.salvar();
      flushMicrotasks();

      expect(contaService.criar).toHaveBeenCalledWith(jasmine.objectContaining({ nome: 'Caixa', saldo: 250.75 }));
      expect(overlays.toasts).toContain('Conta cadastrada');
    }));

    it('não salva com saldo vazio', fakeAsync(() => {
      page.abrirModalNova();
      page.contaForm.patchValue({ nome: 'Caixa' });

      page.salvar();
      flushMicrotasks();

      expect(contaService.criar).not.toHaveBeenCalled();
    }));
  });

  describe('saldo atual', () => {
    const carregar = (contas: Conta[], porConta: any[]) => {
      contaService.listar.and.returnValue(of(contas));
      transacaoService.obterResumo.and.returnValue(of({ porConta }));
      page.carregarContas();
    };

    it('usa o saldo atual calculado pelo servidor (até hoje)', () => {
      carregar([conta()], [{ contaId: 1, saldo: 1000, receitas: 500, despesas: 50, saldoAtual: 1150 }]);
      expect(page.saldoAtual(page.contas[0])).toBe(1150);
    });

    it('sem resumo, cai no saldo inicial', () => {
      carregar([conta({ saldo: 800 })], []);
      expect(page.saldoAtual(page.contas[0])).toBe(800);
    });

    it('conta de outro id no resumo não interfere', () => {
      carregar([conta({ id: 1, saldo: 100 })], [{ contaId: 2, saldoAtual: 9999 }]);
      expect(page.saldoAtual(page.contas[0])).toBe(100);
    });

    it('saldo atual zero é respeitado (não confunde com ausente)', () => {
      carregar([conta({ saldo: 500 })], [{ contaId: 1, saldoAtual: 0 }]);
      expect(page.saldoAtual(page.contas[0])).toBe(0);
    });
  });

  describe('filtro por vínculo', () => {
    beforeEach(() => {
      page.contas = [conta({ id: 1, tipoPessoa: 'PF' }), conta({ id: 2, tipoPessoa: 'PJ' }), conta({ id: 3, tipoPessoa: 'PJ' })];
    });

    it('sem filtro mostra todas', () => {
      page.filtroTipoPessoa = '';
      expect(page.contasFiltradas.length).toBe(3);
    });

    it('filtra por PJ e por PF', () => {
      page.filtroTipoPessoa = 'PJ';
      expect(page.contasFiltradas.map(c => c.id)).toEqual([2, 3]);
      page.filtroTipoPessoa = 'PF';
      expect(page.contasFiltradas.map(c => c.id)).toEqual([1]);
    });
  });

  it('rotuloTipo traduz os tipos de conta', () => {
    expect(page.rotuloTipo('CORRENTE')).toBe('Conta Corrente');
    expect(page.rotuloTipo('POUPANCA')).toBe('Poupança');
    expect(page.rotuloTipo('CAIXA')).toBe('Caixa');
  });
});
