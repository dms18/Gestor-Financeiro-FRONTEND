import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage {
  usuario: Usuario | null = null;
  carregando = false;
  temaMode: ThemeMode = 'auto';

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ionViewWillEnter() {
    this.carregarPerfil();
    this.temaMode = this.themeService.getMode();
  }

  onTemaChange(mode: ThemeMode) {
    this.temaMode = mode;
    this.themeService.setMode(mode);
  }

  onInterfaceChange(valor: string) {
    if (!this.usuario || !valor || valor === this.usuario.interfaceInicial) {
      return;
    }
    const anterior = this.usuario.interfaceInicial;
    this.usuario.interfaceInicial = valor;
    this.usuarioService.atualizarInterface(valor).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.authService.atualizarUsuarioLocal(usuario);
        this.mostrarToast('Interface inicial atualizada');
      },
      error: (erro) => {
        if (this.usuario) {
          this.usuario.interfaceInicial = anterior;
        }
        this.mostrarToast(erro?.error?.message || 'Erro ao atualizar interface');
      }
    });
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

  async gerenciarFoto() {
    const botoes: any[] = [
      {
        text: 'Tirar foto',
        icon: 'camera-outline',
        handler: () => this.capturarFoto(CameraSource.Camera)
      },
      {
        text: 'Escolher da galeria',
        icon: 'image-outline',
        handler: () => this.capturarFoto(CameraSource.Photos)
      }
    ];

    if (this.usuario?.fotoPerfil) {
      botoes.push({
        text: 'Remover foto',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => this.enviarFoto(null)
      });
    }

    botoes.push({ text: 'Cancelar', icon: 'close', role: 'cancel' });

    const actionSheet = await this.actionSheetController.create({
      header: 'Foto de perfil',
      buttons: botoes
    });
    await actionSheet.present();
  }

  private async capturarFoto(source: CameraSource) {
    try {
      const foto = await Camera.getPhoto({
        quality: 70,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        width: 512,
        height: 512,
        source
      });

      if (foto?.dataUrl) {
        this.enviarFoto(foto.dataUrl);
      }
    } catch (erro) {
      // usuário cancelou a seleção — não é erro
    }
  }

  private async enviarFoto(foto: string | null) {
    const loading = await this.loadingController.create({
      message: foto ? 'Enviando foto...' : 'Removendo foto...'
    });
    await loading.present();

    this.usuarioService.atualizarFoto(foto).subscribe({
      next: (usuario) => {
        loading.dismiss();
        this.usuario = usuario;
        this.mostrarToast(foto ? 'Foto atualizada' : 'Foto removida');
      },
      error: (erro) => {
        loading.dismiss();
        this.mostrarToast(erro?.error?.message || 'Erro ao atualizar foto');
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
      error: (erro) => {
        loading.dismiss();
        this.mostrarToast(erro?.error?.message || 'Erro ao atualizar perfil');
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
