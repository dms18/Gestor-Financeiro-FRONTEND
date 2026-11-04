import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-esqueci-senha',
  templateUrl: './esqueci-senha.page.html',
  styleUrls: ['./esqueci-senha.page.scss'],
})
export class EsqueciSenhaPage {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mostrarToast('Informe um e-mail válido');
      return;
    }

    const email = this.form.value.email.trim();
    const loading = await this.loadingController.create({ message: 'Enviando código...' });
    await loading.present();

    this.authService.solicitarCodigo(email).subscribe({
      next: () => {
        loading.dismiss();
        this.mostrarToast('Se o e-mail estiver cadastrado, enviamos um código.');
        this.router.navigate(['/redefinir-senha'], { queryParams: { email } });
      },
      error: (error) => {
        loading.dismiss();
        this.mostrarToast(error?.error?.message || 'Não foi possível enviar o código. Tente novamente.');
      }
    });
  }

  voltar() {
    this.router.navigate(['/login']);
  }

  private async mostrarToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'top' });
    await toast.present();
  }
}
