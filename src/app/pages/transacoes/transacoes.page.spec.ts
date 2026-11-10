import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AlertController, IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { TransacoesPage } from './transacoes.page';
import { SharedModule } from '../../shared/shared.module';
import { TransacaoService } from '../../services/transacao.service';
import { CategoriaService } from '../../services/categoria.service';
import { ContaService } from '../../services/conta.service';
import { Transacao } from '../../models/transacao';
import { simularOverlays } from '../../testing/ionic-fakes';

describe('TransacoesPage', () => {
  let fixture: ComponentFixture<TransacoesPage>;
  let page: TransacoesPage;
  let transacaoService: jasmine.SpyObj<TransacaoService>;
  let overlays: ReturnType<typeof simularOverlays>;

  const semEspacoDuro = (s: string | null) => (s ?? '').replace(/ /g, ' ');

  beforeEach(async () => {
    transacaoService = jasmine.createSpyObj('TransacaoService', ['listar', 'criar', 'atualizar', 'deletar']);
    transacaoService.listar.and.returnValue(of([]));
    transacaoService.criar.and.returnValue(of({}));
    transacaoService.atualizar.and.returnValue(of({}));
    transacaoService.deletar.and.returnValue(of(null));

    const categoriaService = jasmine.createSpyObj('CategoriaService', ['listar']);
    categoriaService.listar.and.returnValue(of([]));
    const contaService = jasmine.createSpyObj('ContaService', ['listar']);
    contaService.listar.and.returnValue(of([{ id: 1, nome: 'Principal' }]));

    await TestBed.configureTestingModule({
      declarations: [TransacoesPage],
      imports: [IonicModule.forRoot(), FormsModule, ReactiveFormsModule, SharedModule, RouterTestingModule],
      providers: [
        { provide: TransacaoService, useValue: transacaoService },
        { provide: CategoriaService, useValue: categoriaService },
        { provide: ContaService, useValue: contaService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransacoesPage);
    page = fixture.componentInstance;
    overlays = simularOverlays(
      TestBed.inject(LoadingController), TestBed.inject(ToastController), TestBed.inject(AlertController)
    );
  });

  const preencherAvista = () =>
    page.transacaoForm.patchValue({ descricao: 'Venda', valor: 100, tipo: 'RECEITA', tipoPessoa: 'PF' });

  describe('prévia do parcelamento', () => {
    beforeEach(() => page.abrirModalNova());

    it('não aparece enquanto "Parcelado" está desligado', () => {
      page.transacaoForm.patchValue({ valor: 1000, numeroParcelas: 4 });
      expect(page.previaParcelas).toBeNull();
    });

    it('parcelas iguais quando a divisão é exata', () => {
      page.transacaoForm.patchValue({ valor: 1000, parcelado: true, numeroParcelas: 4 });
      expect(semEspacoDuro(page.previaParcelas)).toBe('4 parcelas de R$ 250,00');
    });

    it('a diferença de centavos vai na última parcela (100 em 3x)', () => {
      page.transacaoForm.patchValue({ valor: 100, parcelado: true, numeroParcelas: 3 });
      expect(semEspacoDuro(page.previaParcelas)).toBe('2 parcelas de R$ 33,33 + a última de R$ 33,34');
    });

    it('a soma da prévia sempre fecha com o montante', () => {
      for (const [valor, n] of [[100, 3], [10, 3], [0.1, 3], [999.99, 7], [5000, 12], [1, 60]]) {
        page.transacaoForm.patchValue({ valor, parcelado: true, numeroParcelas: n });
        const centavos = Math.round((valor as number) * 100);
        const parcela = Math.floor(centavos / (n as number));
        const ultima = centavos - parcela * ((n as number) - 1);
        expect(parcela * ((n as number) - 1) + ultima).toBe(centavos, `${valor} em ${n}x`);
      }
    });

    it('sem prévia para quantidade fora de 2..60 ou valor inválido', () => {
      page.transacaoForm.patchValue({ valor: 100, parcelado: true, numeroParcelas: 1 });
      expect(page.previaParcelas).toBeNull();
      page.transacaoForm.patchValue({ numeroParcelas: 61 });
      expect(page.previaParcelas).toBeNull();
      page.transacaoForm.patchValue({ numeroParcelas: 2.5 });
      expect(page.previaParcelas).toBeNull();
      page.transacaoForm.patchValue({ numeroParcelas: 6, valor: 0 });
      expect(page.previaParcelas).toBeNull();
    });
  });

  describe('validação da quantidade de parcelas', () => {
    beforeEach(() => {
      page.abrirModalNova();
      preencherAvista();
    });

    it('o formulário à vista é válido sem informar parcelas', () => {
      expect(page.transacaoForm.valid).toBeTrue();
    });

    it('ligar "Parcelado" passa a exigir a quantidade', () => {
      page.transacaoForm.patchValue({ parcelado: true });
      expect(page.transacaoForm.get('numeroParcelas')!.hasError('required')).toBeTrue();
      expect(page.transacaoForm.valid).toBeFalse();
    });

    it('aceita de 2 a 60 parcelas inteiras', () => {
      page.transacaoForm.patchValue({ parcelado: true });
      for (const n of [2, 6, 60]) {
        page.transacaoForm.patchValue({ numeroParcelas: n });
        expect(page.transacaoForm.valid).toBeTrue();
      }
    });

    it('recusa 1, 61 e decimais', () => {
      page.transacaoForm.patchValue({ parcelado: true });
      const campo = page.transacaoForm.get('numeroParcelas')!;
      campo.setValue(1);
      expect(campo.hasError('min')).toBeTrue();
      campo.setValue(61);
      expect(campo.hasError('max')).toBeTrue();
      campo.setValue('2.5');
      expect(campo.hasError('pattern')).toBeTrue();
    });

    it('desligar "Parcelado" limpa a quantidade e volta a ser válido', () => {
      page.transacaoForm.patchValue({ parcelado: true, numeroParcelas: 6 });
      page.transacaoForm.patchValue({ parcelado: false });

      expect(page.transacaoForm.get('numeroParcelas')!.value).toBeNull();
      expect(page.transacaoForm.valid).toBeTrue();
    });

    it('nova transação sempre começa à vista', () => {
      page.transacaoForm.patchValue({ parcelado: true, numeroParcelas: 6 });
      page.abrirModalNova();
      expect(page.parcelado).toBeFalse();
      expect(page.transacaoForm.get('numeroParcelas')!.value).toBeNull();
    });
  });

  describe('salvar', () => {
    it('à vista: envia parcelado=false e sem quantidade', fakeAsync(() => {
      page.abrirModalNova();
      preencherAvista();

      page.salvar();
      flushMicrotasks();

      const payload = transacaoService.criar.calls.mostRecent().args[0];
      expect(payload.parcelado).toBeFalse();
      expect(payload.numeroParcelas).toBeNull();
      expect(payload.valor).toBe(100);
      expect(overlays.toasts).toContain('Transação criada');
    }));

    it('parcelado: envia o montante, a quantidade e a data no formato yyyy-MM-dd', fakeAsync(() => {
      page.abrirModalNova();
      page.transacaoForm.patchValue({
        descricao: 'Notebook', valor: 3000, tipo: 'DESPESA', tipoPessoa: 'PJ',
        data: '2026-11-10T13:45:00.000Z', parcelado: true, numeroParcelas: '6'
      });

      page.salvar();
      flushMicrotasks();

      const payload = transacaoService.criar.calls.mostRecent().args[0];
      expect(payload.parcelado).toBeTrue();
      expect(payload.numeroParcelas).toBe(6);
      expect(payload.valor).toBe(3000);
      expect(payload.data).toBe('2026-11-10');
      expect(overlays.toasts).toContain('6 parcelas criadas');
      expect(page.modalAberto).toBeFalse();
    }));

    it('não envia nada com o formulário inválido', fakeAsync(() => {
      page.abrirModalNova();
      page.transacaoForm.patchValue({ parcelado: true }); // faltam descrição, valor e parcelas

      page.salvar();
      flushMicrotasks();

      expect(transacaoService.criar).not.toHaveBeenCalled();
      expect(overlays.toasts).toContain('Preencha os campos obrigatórios');
    }));

    it('mostra a mensagem de erro devolvida pelo servidor', fakeAsync(() => {
      transacaoService.criar.and.returnValue(
        throwError({ error: { message: 'Montante muito baixo para 12 parcelas' } })
      );
      page.abrirModalNova();
      page.transacaoForm.patchValue({ descricao: 'x', valor: 0.05, parcelado: true, numeroParcelas: 12 });

      page.salvar();
      flushMicrotasks();

      expect(overlays.toasts).toContain('Montante muito baixo para 12 parcelas');
    }));

    it('editar uma parcela nunca reenvia parcelamento', fakeAsync(() => {
      const parcela: Transacao = {
        id: 9, descricao: 'Notebook', valor: 500, data: '2026-12-10', tipo: 'DESPESA', tipoPessoa: 'PF',
        grupoParcelas: 'g1', parcelaNumero: 2, totalParcelas: 6
      };
      page.abrirModalEditar(parcela);

      page.salvar();
      flushMicrotasks();

      expect(page.parcelaEditando).toBe(parcela);
      const [id, payload] = transacaoService.atualizar.calls.mostRecent().args;
      expect(id).toBe(9);
      expect(payload.parcelado).toBeFalse();
      expect(payload.numeroParcelas).toBeNull();
    }));
  });

  describe('exclusão', () => {
    const avulsa: Transacao = { id: 1, descricao: 'Venda', valor: 10, data: '2026-11-10', tipo: 'RECEITA', tipoPessoa: 'PF' };
    const parcela: Transacao = { ...avulsa, id: 2, descricao: 'Notebook', grupoParcelas: 'g1', parcelaNumero: 2, totalParcelas: 6 };

    it('transação avulsa: confirmação simples, apaga só ela', fakeAsync(() => {
      page.confirmarExclusao(avulsa);
      flushMicrotasks();

      const botoes = overlays.alertas[0].buttons;
      expect(botoes.map((b: any) => b.text)).toEqual(['Cancelar', 'Excluir']);
      botoes[1].handler();
      expect(transacaoService.deletar).toHaveBeenCalledWith(1, undefined);
    }));

    it('parcela: oferece só esta, esta e as próximas, ou todas', fakeAsync(() => {
      page.confirmarExclusao(parcela);
      flushMicrotasks();

      const alerta = overlays.alertas[0];
      expect(alerta.message).toContain('parcela 2 de 6');
      const botoes = alerta.buttons;
      expect(botoes.map((b: any) => b.text)).toEqual([
        'Só esta parcela', 'Esta e as próximas', 'Todas as parcelas', 'Cancelar'
      ]);

      botoes[0].handler();
      botoes[1].handler();
      botoes[2].handler();
      expect(transacaoService.deletar.calls.allArgs()).toEqual([[2, 'UMA'], [2, 'PROXIMAS'], [2, 'TODAS']]);
    }));

    it('apagar várias parcelas avisa no plural', fakeAsync(() => {
      page.confirmarExclusao(parcela);
      flushMicrotasks();

      overlays.alertas[0].buttons[2].handler();
      flushMicrotasks();

      expect(overlays.toasts).toContain('Parcelas excluídas');
    }));
  });

  describe('lista', () => {
    it('mostra a etiqueta "2/6" apenas nas parcelas', () => {
      // os dados passam pelo serviço: o ionChange do segmento recarrega a lista na 1ª renderização
      transacaoService.listar.and.returnValue(of([
        { id: 1, descricao: 'Venda', valor: 10, data: '2026-11-10', tipo: 'RECEITA', tipoPessoa: 'PF' },
        { id: 2, descricao: 'Notebook', valor: 500, data: '2026-12-10', tipo: 'DESPESA', tipoPessoa: 'PF',
          grupoParcelas: 'g1', parcelaNumero: 2, totalParcelas: 6 }
      ]));
      page.carregarTransacoes();
      fixture.detectChanges();

      const etiquetas = Array.from(fixture.nativeElement.querySelectorAll('.badge-parcela')) as HTMLElement[];
      expect(etiquetas.length).toBe(1);
      expect(etiquetas[0].textContent!.replace(/\s+/g, '')).toContain('2/6');
    });
  });
});
