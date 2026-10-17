import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { CategoriaService } from '../../services/categoria.service';
import { Categoria, TipoCategoria } from '../../models/categoria';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
})
export class CategoriasPage {
  categorias: Categoria[] = [];
  carregando = false;

  modalAberto = false;
  editandoId: number | null = null;
  categoriaForm: FormGroup;

  readonly cores = ['#0f766e', '#0e7490', '#4f46e5', '#16a34a', '#d97706', '#dc2626', '#db2777', '#6b7280'];

  private readonly sugeridas: Categoria[] = [
    { nome: 'Vendas', tipo: 'RECEITA', cor: '#16a34a' },
    { nome: 'Serviços prestados', tipo: 'RECEITA', cor: '#0f766e' },
    { nome: 'Outras receitas', tipo: 'RECEITA', cor: '#0e7490' },
    { nome: 'Fornecedores', tipo: 'DESPESA', cor: '#d97706' },
    { nome: 'Impostos e taxas', tipo: 'DESPESA', cor: '#dc2626' },
    { nome: 'Aluguel e contas fixas', tipo: 'DESPESA', cor: '#4f46e5' },
    { nome: 'Transporte', tipo: 'DESPESA', cor: '#0e7490' },
    { nome: 'Alimentação', tipo: 'DESPESA', cor: '#db2777' },
    { nome: 'Outras despesas', tipo: 'DESPESA', cor: '#6b7280' }
  ];

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.categoriaForm = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(60)]],
      tipo: ['DESPESA', [Validators.required]],
      cor: [this.cores[0], [Validators.required]]
    });
  }

  ionViewWillEnter() {
    this.carregarCategorias();
  }

  get receitas(): Categoria[] {
    return this.categorias.filter(c => c.tipo === 'RECEITA');
  }

  get despesas(): Categoria[] {
    return this.categorias.filter(c => c.tipo === 'DESPESA');
  }

  carregarCategorias(event?: any) {
    this.carregando = true;
    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias = (categorias || []).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        this.carregando = false;
        if (event) { event.target.complete(); }
      },
      error: () => {
        this.carregando = false;
        if (event) { event.target.complete(); }
        this.mostrarToast('Erro ao carregar categorias');
      }
    });
  }

  abrirModalNova(tipo: TipoCategoria = 'DESPESA') {
    this.editandoId = null;
    this.categoriaForm.reset({ nome: '', tipo, cor: this.cores[0] });
    this.modalAberto = true;
  }

  abrirModalEditar(categoria: Categoria) {
    this.editandoId = categoria.id ?? null;
    this.categoriaForm.reset({
      nome: categoria.nome,
      tipo: categoria.tipo,
      cor: categoria.cor || this.cores[0]
    });
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  /** Fecha o painel; se houver dados digitados, pede confirmação antes de descartar. */
  async tentarFechar() {
    if (!this.categoriaForm.dirty) {
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

  escolherCor(cor: string) {
    this.categoriaForm.patchValue({ cor });
    this.categoriaForm.markAsDirty();
  }

  async salvar() {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      this.mostrarToast('Preencha os campos obrigatórios');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Salvando...' });
    await loading.present();

    const payload = { ...this.categoriaForm.value, nome: this.categoriaForm.value.nome.trim() };
    const requisicao = this.editandoId
      ? this.categoriaService.atualizar(this.editandoId, payload)
      : this.categoriaService.criar(payload);

    requisicao.subscribe({
      next: () => {
        loading.dismiss();
        this.modalAberto = false;
        this.mostrarToast(this.editandoId ? 'Categoria atualizada' : 'Categoria criada');
        this.carregarCategorias();
      },
      error: (erro) => {
        loading.dismiss();
        this.mostrarToast(erro?.error?.message || 'Erro ao salvar categoria');
      }
    });
  }

  async adicionarSugeridas() {
    const loading = await this.loadingController.create({ message: 'Criando categorias...' });
    await loading.present();
    forkJoin(this.sugeridas.map(c => this.categoriaService.criar(c))).subscribe({
      next: () => {
        loading.dismiss();
        this.mostrarToast('Categorias sugeridas adicionadas');
        this.carregarCategorias();
      },
      error: (erro) => {
        loading.dismiss();
        this.mostrarToast(erro?.error?.message || 'Erro ao criar categorias');
        this.carregarCategorias();
      }
    });
  }

  /** Exclusão a partir do painel de edição. */
  async excluirEditando() {
    const categoria = this.categorias.find(c => c.id === this.editandoId);
    if (!categoria) {
      return;
    }
    this.fecharModal();
    await this.confirmarExclusao(categoria);
  }

  async confirmarExclusao(categoria: Categoria) {
    const alert = await this.alertController.create({
      header: 'Excluir',
      message: `Deseja excluir a categoria "${categoria.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.excluir(categoria) }
      ]
    });
    await alert.present();
  }

  private excluir(categoria: Categoria) {
    if (!categoria.id) {
      return;
    }
    this.categoriaService.deletar(categoria.id).subscribe({
      next: () => {
        this.mostrarToast('Categoria excluída');
        this.carregarCategorias();
      },
      error: (erro) => this.mostrarToast(erro?.error?.message || 'Erro ao excluir categoria')
    });
  }

  private async mostrarToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'top' });
    await toast.present();
  }
}
