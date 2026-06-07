import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.registerForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmacaoSenha: ['', [Validators.required]],
      cpf: [''],
      cnpj: [''],
      perfil: ['PF', Validators.required]
    }, { validators: this.senhasIguais });
  }

  ngOnInit() {}

  senhasIguais(group: FormGroup) {
    const senha = group.get('senha')?.value;
    const confirmacao = group.get('confirmacaoSenha')?.value;
    return senha === confirmacao ? null : { senhasNaoIguais: true };
  }

  async registrar() {
    if (this.registerForm.invalid) {
      this.mostrarToast('Por favor, preencha todos os campos corretamente');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando...'
    });
    await loading.present();

    const { confirmacaoSenha, ...request } = this.registerForm.value;

    this.authService.register(request).subscribe({
      next: () => {
        loading.dismiss();
        this.mostrarToast('Cadastro realizado com sucesso!');
        this.router.navigate(['/tabs/dashboard']);
      },
      error: (error) => {
        loading.dismiss();
        const mensagem = error?.error?.message || 'Erro ao registrar';
        this.mostrarToast(mensagem);
      }
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

  irParaLogin() {
    this.router.navigate(['/login']);
  }
}
