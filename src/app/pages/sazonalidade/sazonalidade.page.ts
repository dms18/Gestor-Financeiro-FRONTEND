import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { SazonalidadeService } from '../../services/sazonalidade.service';
import { Sazonalidade } from '../../models/sazonalidade';

@Component({
  selector: 'app-sazonalidade',
  templateUrl: './sazonalidade.page.html',
  styleUrls: ['./sazonalidade.page.scss'],
})
export class SazonalidadePage {
  periodos: Sazonalidade[] = [];
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
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.sazonalidadeForm = this.fb.group({
      nome: ['', [Validators.required]],
      mesInicio: [1, [Validators.required]],
      mesFim: [12, [Validators.required]],
      descricao: [''],
      nivelImpacto: ['MEDIO', [Validators.required]]
    });
  }

  ionViewWillEnter() {
    this.carregarPeriodos();
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
      nivelImpacto: 'MEDIO'
    });
    this.modalAberto = true;
  }

  abrirModalEditar(periodo: Sazonalidade) {
    this.editandoId = periodo.id ?? null;
    this.sazonalidadeForm.patchValue({
      nome: periodo.nome,
      mesInicio: periodo.mesInicio,
      mesFim: periodo.mesFim,
      descricao: periodo.descricao || '',
      nivelImpacto: periodo.nivelImpacto
    });
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  async salvar() {
    if (this.sazonalidadeForm.invalid) {
      this.mostrarToast('Preencha os campos obrigatórios');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Salvando...' });
    await loading.present();

    const payload: Sazonalidade = this.sazonalidadeForm.value;
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
      error: () => {
        loading.dismiss();
        this.mostrarToast('Erro ao salvar período');
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
