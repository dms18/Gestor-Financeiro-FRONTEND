import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-redefinir-senha',
  templateUrl: './redefinir-senha.page.html',
  styleUrls: ['./redefinir-senha.page.scss'],
})
export class RedefinirSenhaPage implements OnInit {
  form: FormGroup;
  loading = false;
  mostrarSenha = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      novaSenha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72)]],
      confirmacaoSenha: ['', [Validators.required]]
    }, { validators: this.senhasIguais });
  }

  ngOnInit() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.patchValue({ email });
    }
  }

  senhasIguais(group: FormGroup) {
    const senha = group.get('novaSenha')?.value;
    const confirmacao = group.get('confirmacaoSenha')?.value;
    return senha === confirmacao ? null : { senhasNaoIguais: true };
  }

  async redefinir() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mostrarToast('Por favor, preencha todos os campos corretamente');
      return;
    }

    const { email, codigo, novaSenha } = this.form.value;
    const loading = await this.loadingController.create({ message: 'Redefinindo senha...' });
    await loading.present();

    this.authService.redefinirSenha({ email: email.trim(), codigo, novaSenha }).subscribe({
      next: () => {
        loading.dismiss();
        this.mostrarToast('Senha redefinida! Faça login com a nova senha.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        loading.dismiss();
        this.mostrarToast(error?.error?.message || 'Não foi possível redefinir a senha. Tente novamente.');
      }
    });
  }

  reenviar() {
    const emailCtrl = this.form.get('email');
    if (!emailCtrl || emailCtrl.invalid) {
      emailCtrl?.markAsTouched();
      this.mostrarToast('Informe um e-mail válido');
      return;
    }
    this.loading = true;
    this.authService.solicitarCodigo(emailCtrl.value.trim()).subscribe({
      next: () => {
        this.loading = false;
        this.mostrarToast('Se o e-mail estiver cadastrado, enviamos um novo código.');
      },
      error: (error) => {
        this.loading = false;
        this.mostrarToast(error?.error?.message || 'Não foi possível reenviar o código.');
      }
    });
  }

  private async mostrarToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'top' });
    await toast.present();
  }
}
