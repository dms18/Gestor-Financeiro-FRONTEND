import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { TransacaoService } from '../../services/transacao.service';
import { CategoriaService } from '../../services/categoria.service';
import { ContaService } from '../../services/conta.service';
import { Transacao, TipoPessoa, EscopoExclusao } from '../../models/transacao';
import { Categoria } from '../../models/categoria';
import { Conta } from '../../models/conta';
import { AuthService } from '../../services/auth.service';

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
  /** Parcela que está sendo editada (para avisar que a alteração vale só para ela). */
  parcelaEditando: Transacao | null = null;
  transacaoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private transacaoService: TransacaoService,
    private categoriaService: CategoriaService,
    private contaService: ContaService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.transacaoForm = this.fb.group({
      descricao: ['', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      data: [new Date().toISOString(), [Validators.required]],
      tipo: ['RECEITA', [Validators.required]],
      tipoPessoa: ['PF', [Validators.required]],
      categoriaId: [null],
      contaId: [null],
      // parcelamento (só na criação): "valor" passa a ser o montante total
      parcelado: [false],
      numeroParcelas: [null]
    });

    // Parcelado exige a quantidade de parcelas (2 a 60, inteiro)
    this.transacaoForm.get('parcelado')?.valueChanges.subscribe((ligado: boolean) => {
      const campo = this.transacaoForm.get('numeroParcelas');
      campo?.setValidators(ligado ? [Validators.required, Validators.min(2), Validators.max(60), Validators.pattern(/^\d+$/)] : []);
      if (!ligado) {
        campo?.setValue(null);
      }
      campo?.updateValueAndValidity();
    });

    // Ao trocar receita/despesa, descarta a categoria escolhida se ela não serve para o novo tipo.
    this.transacaoForm.get('tipo')?.valueChanges.subscribe(() => {
      const atual = this.transacaoForm.get('categoriaId')?.value;
      if (atual != null && !this.categoriasDoTipo.some(c => c.id === atual)) {
        this.transacaoForm.get('categoriaId')?.setValue(null);
      }
    });
  }

  get categoriasDoTipo(): Categoria[] {
    const tipo = this.transacaoForm.get('tipo')?.value;
    return this.categorias.filter(c => !c.tipo || c.tipo === tipo);
  }

  /** O servidor aceita datas até 10 anos à frente. */
  readonly anoMaximo = String(new Date().getFullYear() + 10);

  get parcelado(): boolean {
    return !!this.transacaoForm.get('parcelado')?.value;
  }

  /** Prévia "12 parcelas de R$ 83,33" (a diferença de centavos vai na última, como no servidor). */
  get previaParcelas(): string | null {
    const valor = Number(this.transacaoForm.get('valor')?.value);
    const n = Number(this.transacaoForm.get('numeroParcelas')?.value);
    if (!this.parcelado || !(valor > 0) || !Number.isInteger(n) || n < 2 || n > 60) {
      return null;
    }
    const centavos = Math.round(valor * 100);
    const parcela = Math.floor(centavos / n);
    const ultima = centavos - parcela * (n - 1);
    const moeda = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return ultima === parcela
      ? `${n} parcelas de ${moeda(parcela)}`
      : `${n - 1} parcelas de ${moeda(parcela)} + a última de ${moeda(ultima)}`;
  }

  /**
   * Cria uma categoria sem sair do formulário: o tipo (receita/despesa) é o da transação em edição
   * e a nova categoria já fica selecionada, sem perder o que foi digitado.
   */
  async novaCategoria() {
    const tipo = this.transacaoForm.get('tipo')?.value === 'RECEITA' ? 'RECEITA' : 'DESPESA';
    const alert = await this.alertController.create({
      header: `Nova categoria de ${tipo === 'RECEITA' ? 'receita' : 'despesa'}`,
      inputs: [{ name: 'nome', type: 'text', placeholder: 'Ex: Fornecedores', attributes: { maxlength: 60 } }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Criar',
          handler: (dados: { nome?: string }) => {
            const nome = (dados?.nome || '').trim();
            if (!nome) { return false; } // mantém o alerta aberto
            this.criarCategoria(nome, tipo);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private criarCategoria(nome: string, tipo: 'RECEITA' | 'DESPESA') {
    this.categoriaService.criar({ nome, tipo, cor: '#0f766e' }).subscribe({
      next: (criada) => {
        this.categorias = [...this.categorias, criada];
        this.transacaoForm.patchValue({ categoriaId: criada?.id ?? null });
        this.transacaoForm.get('categoriaId')?.markAsDirty();
        this.mostrarToast('Categoria criada');
      },
      error: (erro) => this.mostrarToast(erro?.error?.message || 'Erro ao criar categoria')
    });
  }

  /** Abas PF/PJ e o campo "Pessoa" só fazem sentido para quem tem perfil AMBOS. */
  get mostrarAbasVinculo(): boolean {
    return this.authService.perfilAmbos;
  }

  ionViewWillEnter() {
    if (!this.authService.perfilAmbos) { this.filtroTipoPessoa = ''; }
    this.carregarDadosAuxiliares();
    this.carregarTransacoes();
    this.aplicarPrefillInvestimento();
  }

  /** Vindo de um investimento aprovado: abre o formulário de nova transação já preenchido. */
  private aplicarPrefillInvestimento() {
    const q = this.route.snapshot.queryParamMap;
    const descricao = q.get('descricao');
    if (descricao === null) { return; }
    const valor = Number(q.get('valor'));
    this.abrirModalNova();
    this.transacaoForm.patchValue({
      descricao,
      valor: valor > 0 ? valor : null,
      tipo: 'DESPESA'
    });
    this.transacaoForm.markAsDirty();
    // limpa os parâmetros para não reabrir o formulário ao voltar para esta aba
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
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
    this.parcelaEditando = null;
    this.transacaoForm.reset({
      descricao: '',
      valor: null,
      data: new Date().toISOString(),
      tipo: 'RECEITA',
      tipoPessoa: this.authService.vinculoPadrao,
      categoriaId: null,
      contaId: null,
      parcelado: false,
      numeroParcelas: null
    });
    this.transacaoForm.markAsPristine();
    this.transacaoForm.markAsUntouched();
    this.modalAberto = true;
  }

  abrirModalEditar(transacao: Transacao) {
    this.editandoId = transacao.id ?? null;
    this.parcelaEditando = transacao.grupoParcelas ? transacao : null;
    this.transacaoForm.patchValue({
      descricao: transacao.descricao,
      valor: transacao.valor,
      data: transacao.data,
      tipo: transacao.tipo,
      tipoPessoa: transacao.tipoPessoa,
      categoriaId: transacao.categoriaId ?? null,
      contaId: transacao.contaId ?? null,
      parcelado: false,
      numeroParcelas: null
    });
    this.transacaoForm.markAsPristine();
    this.transacaoForm.markAsUntouched();
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  /** Fecha o painel; se houver dados digitados, pede confirmação antes de descartar. */
  async tentarFechar() {
    if (!this.transacaoForm.dirty) {
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
    if (this.transacaoForm.invalid) {
      this.transacaoForm.markAllAsTouched();
      this.mostrarToast('Preencha os campos obrigatórios');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Salvando...' });
    await loading.present();

    const valores = this.transacaoForm.value;
    const parcelar = !this.editandoId && !!valores.parcelado;
    const payload: Transacao = {
      ...valores,
      data: (valores.data || '').substring(0, 10), // yyyy-MM-dd
      parcelado: parcelar,
      numeroParcelas: parcelar ? Number(valores.numeroParcelas) : null
    };

    const requisicao = this.editandoId
      ? this.transacaoService.atualizar(this.editandoId, payload)
      : this.transacaoService.criar(payload);

    requisicao.subscribe({
      next: () => {
        loading.dismiss();
        this.modalAberto = false;
        this.mostrarToast(
          this.editandoId ? 'Transação atualizada' : parcelar ? `${payload.numeroParcelas} parcelas criadas` : 'Transação criada'
        );
        this.carregarTransacoes();
      },
      error: (erro) => {
        loading.dismiss();
        this.mostrarToast(erro?.error?.message || 'Erro ao salvar transação');
      }
    });
  }

  /** Exclusão a partir do painel de edição (alternativa ao gesto de arrastar). */
  async excluirEditando() {
    const transacao = this.transacoes.find(t => t.id === this.editandoId);
    if (!transacao) {
      return;
    }
    this.fecharModal();
    await this.confirmarExclusao(transacao);
  }

  async confirmarExclusao(transacao: Transacao) {
    if (transacao.grupoParcelas) {
      await this.confirmarExclusaoParcela(transacao);
      return;
    }
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

  /** Parcela: pergunta se apaga só esta, esta e as próximas, ou todo o parcelamento. */
  private async confirmarExclusaoParcela(transacao: Transacao) {
    const alert = await this.alertController.create({
      header: 'Excluir parcela',
      message: `"${transacao.descricao}" é a parcela ${transacao.parcelaNumero} de ${transacao.totalParcelas}. O que deseja excluir?`,
      buttons: [
        { text: 'Só esta parcela', handler: () => this.excluir(transacao, 'UMA') },
        { text: 'Esta e as próximas', handler: () => this.excluir(transacao, 'PROXIMAS') },
        { text: 'Todas as parcelas', role: 'destructive', handler: () => this.excluir(transacao, 'TODAS') },
        { text: 'Cancelar', role: 'cancel' }
      ]
    });
    await alert.present();
  }

  private excluir(transacao: Transacao, escopo?: EscopoExclusao) {
    if (!transacao.id) {
      return;
    }
    this.transacaoService.deletar(transacao.id, escopo).subscribe({
      next: () => {
        this.mostrarToast(escopo && escopo !== 'UMA' ? 'Parcelas excluídas' : 'Transação excluída');
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
