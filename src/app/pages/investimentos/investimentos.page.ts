import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { InvestimentoService } from '../../services/investimento.service';
import { Investimento, StatusInvestimento } from '../../models/investimento';

@Component({
  selector: 'app-investimentos',
  templateUrl: './investimentos.page.html',
  styleUrls: ['./investimentos.page.scss'],
})
export class InvestimentosPage {
  todos: Investimento[] = [];
  carregando = false;

  filtroStatus: StatusInvestimento = 'IDEIA';

  statusList: { valor: StatusInvestimento; label: string }[] = [
    { valor: 'IDEIA', label: 'Ideias' },
    { valor: 'EM_ANALISE', label: 'Em Análise' },
    { valor: 'APROVADO', label: 'Aprovados' },
    { valor: 'DESCARTADO', label: 'Descartados' }
  ];

  modalAberto = false;
  editandoId: number | null = null;
  investimentoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private investimentoService: InvestimentoService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.investimentoForm = this.fb.group({
      titulo: ['', [Validators.required]],
      descricao: [''],
      valorEstimado: [null],
      retornoEstimado: [null],
      status: ['IDEIA', [Validators.required]],
      prioridade: ['MEDIA', [Validators.required]]
    });
  }

  ionViewWillEnter() {
    this.carregarInvestimentos();
  }

  carregarInvestimentos(event?: any) {
    this.carregando = true;
    this.investimentoService.listar().subscribe({
      next: (investimentos) => {
        this.todos = investimentos || [];
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
        this.mostrarToast('Erro ao carregar investimentos');
      }
    });
  }

  get filtrados(): Investimento[] {
    return this.todos.filter(i => i.status === this.filtroStatus);
  }

  corPrioridade(prioridade: string): string {
    switch (prioridade) {
      case 'ALTA': return 'danger';
      case 'MEDIA': return 'warning';
      case 'BAIXA': return 'success';
      default: return 'medium';
    }
  }

  abrirModalNovo() {
    this.editandoId = null;
    this.investimentoForm.reset({
      titulo: '',
      descricao: '',
      valorEstimado: null,
      retornoEstimado: null,
      status: this.filtroStatus,
      prioridade: 'MEDIA'
    });
    this.modalAberto = true;
  }

  abrirModalEditar(investimento: Investimento) {
    this.editandoId = investimento.id ?? null;
    this.investimentoForm.patchValue({
      titulo: investimento.titulo,
      descricao: investimento.descricao || '',
      valorEstimado: investimento.valorEstimado ?? null,
      retornoEstimado: investimento.retornoEstimado ?? null,
      status: investimento.status,
      prioridade: investimento.prioridade
    });
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  async salvar() {
    if (this.investimentoForm.invalid) {
      this.mostrarToast('Preencha os campos obrigatórios');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Salvando...' });
    await loading.present();

    const payload: Investimento = this.investimentoForm.value;
    const requisicao = this.editandoId
      ? this.investimentoService.atualizar(this.editandoId, payload)
      : this.investimentoService.criar(payload);

    requisicao.subscribe({
      next: () => {
        loading.dismiss();
        this.modalAberto = false;
        this.mostrarToast(this.editandoId ? 'Investimento atualizado' : 'Investimento criado');
        this.carregarInvestimentos();
      },
      error: () => {
        loading.dismiss();
        this.mostrarToast('Erro ao salvar investimento');
      }
    });
  }

  async confirmarExclusao(investimento: Investimento) {
    const alert = await this.alertController.create({
      header: 'Excluir',
      message: `Deseja excluir "${investimento.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluir(investimento)
        }
      ]
    });
    await alert.present();
  }

  private excluir(investimento: Investimento) {
    if (!investimento.id) {
      return;
    }
    this.investimentoService.deletar(investimento.id).subscribe({
      next: () => {
        this.mostrarToast('Investimento excluído');
        this.carregarInvestimentos();
      },
      error: () => this.mostrarToast('Erro ao excluir investimento')
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
