import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  async login() {
    if (this.loginForm.invalid) {
      this.mostrarToast('Por favor, preencha todos os campos corretamente');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Entrando...'
    });
    await loading.present();

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        loading.dismiss();
        this.router.navigate(['/tabs/dashboard']);
      },
      error: (error) => {
        loading.dismiss();
        this.mostrarToast('Email ou senha incorretos');
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

  irParaCadastro() {
    this.router.navigate(['/register']);
  }
}
