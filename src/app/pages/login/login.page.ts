import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BiometriaService } from '../../services/biometria.service';
import { Router } from '@angular/router';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  loginForm: FormGroup;
  loading = false;
  mostrarSenha = false;
  biometriaAtiva = false;
  private biometriaTentada = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private biometria: BiometriaService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async ionViewWillEnter() {
    this.biometriaAtiva = this.biometria.ativa() && (await this.biometria.disponivel());
    this.biometriaTentada = false;
  }

  /** Ao abrir a tela já pergunta a biometria (uma vez por visita). */
  async ionViewDidEnter() {
    if (this.biometriaAtiva && !this.biometriaTentada) {
      this.biometriaTentada = true;
      await this.entrarComBiometria();
    }
  }

  async entrarComBiometria() {
    const cred = await this.biometria.obterCredenciais();
    if (!cred) {
      return; // cancelou: segue com e-mail e senha
    }
    await this.autenticar(cred.email, cred.senha, true);
  }

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.mostrarToast('Por favor, preencha todos os campos corretamente');
      return;
    }
    const { email, senha } = this.loginForm.value;
    await this.autenticar(email, senha, false);
  }

  private async autenticar(email: string, senha: string, viaBiometria: boolean) {
    const loading = await this.loadingController.create({ message: 'Entrando...' });
    await loading.present();

    this.authService.login({ email, senha }).subscribe({
      next: async () => {
        await loading.dismiss();
        if (!viaBiometria) {
          await this.oferecerBiometria(email, senha);
        }
        this.loginForm.reset();
        this.router.navigate(['/tabs/dashboard'], { replaceUrl: true });
      },
      error: async (error) => {
        await loading.dismiss();
        if (viaBiometria && (error?.status === 400 || error?.status === 401 || error?.status === 403)) {
          // senha mudou desde que a biometria foi ativada: credencial salva ficou inválida
          await this.biometria.desativar();
          this.biometriaAtiva = false;
          this.mostrarToast('Sua senha mudou. Entre com a senha para reativar a biometria.');
          return;
        }
        const mensagem = error?.error?.message || 'Email ou senha incorretos';
        this.mostrarToast(mensagem);
      }
    });
  }

  /** Após o login com senha, convida a ativar a biometria (se o aparelho suporta). */
  private async oferecerBiometria(email: string, senha: string) {
    if (this.biometria.ativa()) {
      // já ativa: mantém a credencial sincronizada com a senha digitada
      await this.biometria.atualizarCredenciais(email, senha);
      return;
    }
    if (this.biometria.conviteRecusado() || !(await this.biometria.disponivel())) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Entrar com biometria?',
      message: 'Nos próximos acessos você poderá entrar com sua digital ou rosto, sem digitar a senha.',
      backdropDismiss: false,
      buttons: [
        { text: 'Agora não', role: 'cancel', handler: () => this.biometria.recusarConvite() },
        {
          text: 'Ativar',
          handler: async () => {
            const ok = await this.biometria.ativar(email, senha);
            this.mostrarToast(ok ? 'Biometria ativada' : 'Não foi possível ativar a biometria');
          }
        }
      ]
    });
    await alert.present();
    await alert.onDidDismiss();
  }

  private async mostrarToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }

  irParaEsqueciSenha() {
    this.router.navigate(['/esqueci-senha']);
  }

  irParaCadastro() {
    this.router.navigate(['/register']);
  }
}
