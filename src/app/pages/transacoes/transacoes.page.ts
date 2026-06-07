import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { TransacaoService } from '../../services/transacao.service';
import { CategoriaService } from '../../services/categoria.service';
import { ContaService } from '../../services/conta.service';
import { Transacao, TipoPessoa } from '../../models/transacao';
import { Categoria } from '../../models/categoria';
import { Conta } from '../../models/conta';

@Component({
  selector: 'app-transacoes',
  templateUrl: './transacoes.page.html',
  styleUrls: ['./transacoes.page.scss'],
})
export class TransacoesPage {
  transacoes: Transacao[] = [];
  categorias: Categoria[] = [];
  contas: Conta[] = [];

  filtroTipoPessoa: '' | TipoPessoa = '';
  carregando = false;

  modalAberto = false;
  editandoId: number | null = null;
  transacaoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private transacaoService: TransacaoService,
    private categoriaService: CategoriaService,
    private contaService: ContaService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.transacaoForm = this.fb.group({
      descricao: ['', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      data: [new Date().toISOString(), [Validators.required]],
      tipo: ['RECEITA', [Validators.required]],
      tipoPessoa: ['PF', [Validators.required]],
      categoriaId: [null],
      contaId: [null]
    });
  }

  ionViewWillEnter() {
    this.carregarDadosAuxiliares();
    this.carregarTransacoes();
  }

  carregarDadosAuxiliares() {
    this.categoriaService.listar().subscribe({
      next: (cats) => (this.categorias = cats || []),
      error: () => (this.categorias = [])
    });
    this.contaService.listar().subscribe({
      next: (contas) => (this.contas = contas || []),
      error: () => (this.contas = [])
    });
  }

  carregarTransacoes(event?: any) {
    this.carregando = true;
    const tipoPessoa = this.filtroTipoPessoa || undefined;
    this.transacaoService.listar(tipoPessoa).subscribe({
      next: (transacoes) => {
        this.transacoes = (transacoes || []).sort((a, b) =>
          (b.data || '').localeCompare(a.data || '')
        );
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
        this.mostrarToast('Erro ao carregar transações');
      }
    });
  }

  onFiltroChange() {
    this.carregarTransacoes();
  }

  nomeCategoria(id?: number): string {
    const cat = this.categorias.find(c => c.id === id);
    return cat ? cat.nome : 'Sem categoria';
  }

  nomeConta(id?: number): string {
    const conta = this.contas.find(c => c.id === id);
    return conta ? conta.nome : 'Sem conta';
  }

  abrirModalNova() {
    this.editandoId = null;
    this.transacaoForm.reset({
      descricao: '',
      valor: null,
      data: new Date().toISOString(),
      tipo: 'RECEITA',
      tipoPessoa: 'PF',
      categoriaId: null,
      contaId: null
    });
    this.modalAberto = true;
  }

  abrirModalEditar(transacao: Transacao) {
    this.editandoId = transacao.id ?? null;
    this.transacaoForm.patchValue({
      descricao: transacao.descricao,
      valor: transacao.valor,
      data: transacao.data,
      tipo: transacao.tipo,
      tipoPessoa: transacao.tipoPessoa,
      categoriaId: transacao.categoriaId ?? null,
      contaId: transacao.contaId ?? null
    });
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  async salvar() {
    if (this.transacaoForm.invalid) {
      this.mostrarToast('Preencha os campos obrigatórios');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Salvando...' });
    await loading.present();

    const valores = this.transacaoForm.value;
    const payload: Transacao = {
      ...valores,
      data: (valores.data || '').substring(0, 10) // yyyy-MM-dd
    };

    const requisicao = this.editandoId
      ? this.transacaoService.atualizar(this.editandoId, payload)
      : this.transacaoService.criar(payload);

    requisicao.subscribe({
      next: () => {
        loading.dismiss();
        this.modalAberto = false;
        this.mostrarToast(this.editandoId ? 'Transação atualizada' : 'Transação criada');
        this.carregarTransacoes();
      },
      error: () => {
        loading.dismiss();
        this.mostrarToast('Erro ao salvar transação');
      }
    });
  }

  async confirmarExclusao(transacao: Transacao) {
    const alert = await this.alertController.create({
      header: 'Excluir',
      message: `Deseja excluir "${transacao.descricao}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluir(transacao)
        }
      ]
    });
    await alert.present();
  }

  private excluir(transacao: Transacao) {
    if (!transacao.id) {
      return;
    }
    this.transacaoService.deletar(transacao.id).subscribe({
      next: () => {
        this.mostrarToast('Transação excluída');
        this.carregarTransacoes();
      },
      error: () => this.mostrarToast('Erro ao excluir transação')
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
