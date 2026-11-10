import { Component, HostListener } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { SazonalidadeService } from '../../services/sazonalidade.service';
import { ContaService } from '../../services/conta.service';
import { Conta } from '../../models/conta';
import { Sazonalidade } from '../../models/sazonalidade';

@Component({
  selector: 'app-sazonalidade',
  templateUrl: './sazonalidade.page.html',
  styleUrls: ['./sazonalidade.page.scss'],
})
export class SazonalidadePage {
  periodos: Sazonalidade[] = [];
  contas: Conta[] = [];
  carregando = false;

  modalAberto = false;
  editandoId: number | null = null;
  sazonalidadeForm: FormGroup;

  meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];

  constructor(
    private fb: FormBuilder,
    private sazonalidadeService: SazonalidadeService,
    private contaService: ContaService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.sazonalidadeForm = this.fb.group({
      nome: ['', [Validators.required]],
      mesInicio: [1, [Validators.required]],
      mesFim: [12, [Validators.required]],
      descricao: [''],
      nivelImpacto: ['MEDIO', [Validators.required]],
      // reserva de caixa (opcional): data, valor e conta andam juntos
      dataAlvo: [null],
      valorNecessario: [null, [Validators.min(0.01)]],
      contaDebitoId: [null]
    }, { validators: reservaCompleta });
  }

  ionViewWillEnter() {
    this.carregarPeriodos();
    this.contaService.listar().subscribe({
      next: (contas) => (this.contas = contas || []),
      error: () => (this.contas = [])
    });
  }

  /** Algum campo da reserva foi preenchido (mostra o botão de limpar). */
  get reservaPreenchida(): boolean {
    const v = this.sazonalidadeForm.value;
    return v.dataAlvo != null || v.valorNecessario != null || v.contaDebitoId != null;
  }

  limparReserva() {
    this.sazonalidadeForm.patchValue({ dataAlvo: null, valorNecessario: null, contaDebitoId: null });
    this.sazonalidadeForm.markAsDirty();
  }

  carregarPeriodos(event?: any) {
    this.carregando = true;
    this.sazonalidadeService.listar().subscribe({
      next: (periodos) => {
        this.periodos = periodos || [];
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
        this.mostrarToast('Erro ao carregar períodos');
      }
    });
  }

  nomeMes(valor: number): string {
    const mes = this.meses.find(m => m.valor === valor);
    return mes ? mes.nome : '-';
  }

  estaAtivo(periodo: Sazonalidade): boolean {
    const mesAtual = new Date().getMonth() + 1;
    if (periodo.mesInicio <= periodo.mesFim) {
      return mesAtual >= periodo.mesInicio && mesAtual <= periodo.mesFim;
    }
    return mesAtual >= periodo.mesInicio || mesAtual <= periodo.mesFim;
  }

  /** Data yyyy-MM-dd no formato dd/MM/yyyy, sem passar por fuso horário. */
  formatarData(iso?: string | null): string {
    if (!iso) {
      return '';
    }
    const [a, m, d] = iso.substring(0, 10).split('-');
    return `${d}/${m}/${a}`;
  }

  corImpacto(nivel: string): string {
    switch (nivel) {
      case 'ALTO': return 'danger';
      case 'MEDIO': return 'warning';
      case 'BAIXO': return 'success';
      default: return 'medium';
    }
  }

  abrirModalNovo() {
    this.editandoId = null;
    this.sazonalidadeForm.reset({
      nome: '',
      mesInicio: 1,
      mesFim: 12,
      descricao: '',
      nivelImpacto: 'MEDIO',
      dataAlvo: null,
      valorNecessario: null,
      contaDebitoId: null
    });
    this.sazonalidadeForm.markAsPristine();
    this.sazonalidadeForm.markAsUntouched();
    this.modalAberto = true;
  }

  abrirModalEditar(periodo: Sazonalidade) {
    this.editandoId = periodo.id ?? null;
    this.sazonalidadeForm.patchValue({
      nome: periodo.nome,
      mesInicio: periodo.mesInicio,
      mesFim: periodo.mesFim,
      descricao: periodo.descricao || '',
      nivelImpacto: periodo.nivelImpacto,
      dataAlvo: periodo.dataAlvo ?? null,
      valorNecessario: periodo.valorNecessario ?? null,
      contaDebitoId: periodo.contaDebitoId ?? null
    });
    this.sazonalidadeForm.markAsPristine();
    this.sazonalidadeForm.markAsUntouched();
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  /** Fecha o painel; se houver dados digitados, pede confirmação antes de descartar. */
  async tentarFechar() {
    if (!this.sazonalidadeForm.dirty) {
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
    if (this.sazonalidadeForm.invalid) {
      this.sazonalidadeForm.markAllAsTouched();
      this.mostrarToast('Preencha os campos obrigatórios');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Salvando...' });
    await loading.present();

    const valores = this.sazonalidadeForm.value;
    const payload: Sazonalidade = {
      ...valores,
      dataAlvo: valores.dataAlvo ? String(valores.dataAlvo).substring(0, 10) : null, // yyyy-MM-dd
      valorNecessario: valores.valorNecessario ?? null,
      contaDebitoId: valores.contaDebitoId ?? null
    };
    const requisicao = this.editandoId
      ? this.sazonalidadeService.atualizar(this.editandoId, payload)
      : this.sazonalidadeService.criar(payload);

    requisicao.subscribe({
      next: () => {
        loading.dismiss();
        this.modalAberto = false;
        this.mostrarToast(this.editandoId ? 'Período atualizado' : 'Período criado');
        this.carregarPeriodos();
      },
      error: (erro) => {
        loading.dismiss();
        this.mostrarToast(erro?.error?.message || 'Erro ao salvar período');
      }
    });
  }

  async confirmarExclusao(periodo: Sazonalidade) {
    const alert = await this.alertController.create({
      header: 'Excluir',
      message: `Deseja excluir "${periodo.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluir(periodo)
        }
      ]
    });
    await alert.present();
  }

  private excluir(periodo: Sazonalidade) {
    if (!periodo.id) {
      return;
    }
    this.sazonalidadeService.deletar(periodo.id).subscribe({
      next: () => {
        this.mostrarToast('Período excluído');
        this.carregarPeriodos();
      },
      error: () => this.mostrarToast('Erro ao excluir período')
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

/** Data, caixa necessário e conta para débito: ou os três preenchidos, ou nenhum. */
function reservaCompleta(grupo: AbstractControl): ValidationErrors | null {
  const { dataAlvo, valorNecessario, contaDebitoId } = grupo.value;
  const informados = [dataAlvo, valorNecessario, contaDebitoId].filter(v => v != null && v !== '').length;
  return informados === 0 || informados === 3 ? null : { reservaIncompleta: true };
}
