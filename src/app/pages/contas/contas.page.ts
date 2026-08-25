import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ContaService } from '../../services/conta.service';
import { Conta } from '../../models/conta';

@Component({
  selector: 'app-contas',
  templateUrl: './contas.page.html',
  styleUrls: ['./contas.page.scss'],
})
export class ContasPage {
  contas: Conta[] = [];
  carregando = false;

  filtroTipoPessoa: '' | 'PF' | 'PJ' = '';

  modalAberto = false;
  editandoId: number | null = null;
  contaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private contaService: ContaService,
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
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.modalAberto) {
      this.fecharModal();
    }
  }

  async salvar() {
    if (this.contaForm.invalid) {
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
