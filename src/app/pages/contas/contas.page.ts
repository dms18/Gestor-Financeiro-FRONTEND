import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ContaService } from '../../services/conta.service';
import { TransacaoService } from '../../services/transacao.service';
import { ResumoPorConta } from '../../models/transacao';
import { Conta } from '../../models/conta';

@Component({
  selector: 'app-contas',
  templateUrl: './contas.page.html',
  styleUrls: ['./contas.page.scss'],
})
export class ContasPage {
  contas: Conta[] = [];
  private resumoPorConta = new Map<number, ResumoPorConta>();
  carregando = false;

  filtroTipoPessoa: '' | 'PF' | 'PJ' = '';

  modalAberto = false;
  editandoId: number | null = null;
  contaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private contaService: ContaService,
    private transacaoService: TransacaoService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.contaForm = this.fb.group({
      nome: ['', [Validators.required]],
      instituicao: [''],
      numeroConta: [''],
      tipo: ['CORRENTE', [Validators.required]],
      saldo: [0, [Validators.required, Validators.min(0)]],
      tipoPessoa: ['PF', [Validators.required]]
    });
  }

  ionViewWillEnter() {
    this.carregarContas();
  }

  get contasFiltradas(): Conta[] {
    if (!this.filtroTipoPessoa) {
      return this.contas;
    }
    return this.contas.filter(c => c.tipoPessoa === this.filtroTipoPessoa);
  }

  carregarContas(event?: any) {
    this.carregando = true;
    this.transacaoService.obterResumo().subscribe({
      next: (resumo) => {
        this.resumoPorConta = new Map((resumo?.porConta || []).map((r: ResumoPorConta) => [r.contaId, r]));
      },
      error: () => (this.resumoPorConta = new Map())
    });
    this.contaService.listar().subscribe({
      next: (contas) => {
        this.contas = contas || [];
        this.carregando = false;
        if (event) { event.target.complete(); }
      },
      error: () => {
        this.carregando = false;
        if (event) { event.target.complete(); }
        this.mostrarToast('Erro ao carregar contas');
      }
    });
  }

  /** Saldo atual = saldo inicial + receitas − despesas lançadas nesta conta. */
  saldoAtual(conta: Conta): number {
    const r = conta.id != null ? this.resumoPorConta.get(conta.id) : undefined;
    return r ? conta.saldo + r.receitas - r.despesas : conta.saldo;
  }

  rotuloTipo(tipo: string): string {
    switch (tipo) {
      case 'CORRENTE': return 'Conta Corrente';
      case 'POUPANCA': return 'Poupança';
      case 'CAIXA': return 'Caixa';
      default: return tipo;
    }
  }

  abrirModalNova() {
    this.editandoId = null;
    this.contaForm.reset({
      nome: '',
      instituicao: '',
      numeroConta: '',
      tipo: 'CORRENTE',
      saldo: 0,
      tipoPessoa: 'PF'
    });
    this.contaForm.markAsPristine();
    this.contaForm.markAsUntouched();
    this.modalAberto = true;
  }

  abrirModalEditar(conta: Conta) {
    this.editandoId = conta.id ?? null;
    this.contaForm.patchValue({
      nome: conta.nome,
      instituicao: conta.instituicao ?? '',
      numeroConta: conta.numeroConta ?? '',
      tipo: conta.tipo,
      saldo: conta.saldo,
      tipoPessoa: conta.tipoPessoa
    });
    this.contaForm.markAsPristine();
    this.contaForm.markAsUntouched();
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  /** Fecha o painel; se houver dados digitados, pede confirmação antes de descartar. */
  async tentarFechar() {
    if (!this.contaForm.dirty) {
      this.fecharModal();
      return;
    }
    const alert = await this.alertController.create({
      header: 'Descartar alterações?',
      message: 'Os dados preenchidos serão perdidos.',
      buttons: [
        { text: 'Continuar editando', role: 'cancel' },
        { text: 'Descartar', role: 'destructive', handler: () => this.fecharModal() }
      ]
    });
    await alert.present();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.modalAberto) {
      this.tentarFechar();
    }
  }

  async salvar() {
    if (this.contaForm.invalid) {
      this.contaForm.markAllAsTouched();
      this.mostrarToast('Preencha os campos obrigatórios');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Salvando...' });
    await loading.present();

    const payload: Conta = this.contaForm.value;
    const requisicao = this.editandoId
      ? this.contaService.atualizar(this.editandoId, payload)
      : this.contaService.criar(payload);

    requisicao.subscribe({
      next: () => {
        loading.dismiss();
        this.modalAberto = false;
        this.mostrarToast(this.editandoId ? 'Conta atualizada' : 'Conta cadastrada');
        this.carregarContas();
      },
      error: (erro) => {
        loading.dismiss();
        this.mostrarToast(erro?.error?.message || 'Erro ao salvar conta');
      }
    });
  }

  /** Exclusão a partir do painel de edição (alternativa ao gesto de arrastar). */
  async excluirEditando() {
    const conta = this.contas.find(c => c.id === this.editandoId);
    if (!conta) {
      return;
    }
    this.fecharModal();
    await this.confirmarExclusao(conta);
  }

  async confirmarExclusao(conta: Conta) {
    const alert = await this.alertController.create({
      header: 'Excluir',
      message: `Deseja excluir a conta "${conta.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.excluir(conta) }
      ]
    });
    await alert.present();
  }

  private excluir(conta: Conta) {
    if (!conta.id) { return; }
    this.contaService.deletar(conta.id).subscribe({
      next: () => {
        this.mostrarToast('Conta excluída');
        this.carregarContas();
      },
      error: (erro) => this.mostrarToast(erro?.error?.message || 'Erro ao excluir conta')
    });
  }

  private async mostrarToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }
}
