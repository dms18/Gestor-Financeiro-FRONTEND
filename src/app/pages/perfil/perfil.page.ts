import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage {
  usuario: Usuario | null = null;
  carregando = false;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ionViewWillEnter() {
    this.carregarPerfil();
  }

  carregarPerfil() {
    this.carregando = true;
    this.usuarioService.obterPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.mostrarToast('Erro ao carregar perfil');
      }
    });
  }

  descricaoPerfil(perfil?: string): string {
    switch (perfil) {
      case 'PF': return 'Pessoa Física';
      case 'PJ': return 'Pessoa Jurídica';
      case 'AMBOS': return 'Pessoa Física e Jurídica';
      default: return perfil || '-';
    }
  }

  async editar() {
    if (!this.usuario) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Editar Perfil',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome',
          value: this.usuario.nome
        },
        {
          name: 'cpf',
          type: 'text',
          placeholder: 'CPF',
          value: this.usuario.cpf || ''
        },
        {
          name: 'cnpj',
          type: 'text',
          placeholder: 'CNPJ',
          value: this.usuario.cnpj || ''
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: (data) => {
            this.salvar(data);
          }
        }
      ]
    });

    await alert.present();
  }

  private async salvar(data: any) {
    const loading = await this.loadingController.create({ message: 'Salvando...' });
    await loading.present();

    this.usuarioService.atualizarPerfil({
      nome: data.nome,
      cpf: data.cpf || undefined,
      cnpj: data.cnpj || undefined
    }).subscribe({
      next: (usuario) => {
        loading.dismiss();
        this.usuario = usuario;
        this.mostrarToast('Perfil atualizado com sucesso');
      },
      error: () => {
        loading.dismiss();
        this.mostrarToast('Erro ao atualizar perfil');
      }
    });
  }

  async confirmarLogout() {
    const alert = await this.alertController.create({
      header: 'Sair',
      message: 'Tem certeza que deseja sair?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          handler: () => this.logout()
        }
      ]
    });

    await alert.present();
  }

  private logout() {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
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
