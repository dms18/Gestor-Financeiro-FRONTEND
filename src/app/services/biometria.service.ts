import { Inject, Injectable, InjectionToken } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from 'capacitor-native-biometric';

/** Plugin nativo injetável (o Proxy do Capacitor não aceita spyOn; nos testes entra um dublê). */
export const NATIVE_BIOMETRIC = new InjectionToken<typeof NativeBiometric>('NativeBiometric', {
  providedIn: 'root',
  factory: () => NativeBiometric
});

const SERVER = 'com.diegomarques.gestorfinanceiro';
const CHAVE_ATIVA = 'biometria_ativa';
const CHAVE_RECUSADA = 'biometria_recusada';

export interface CredenciaisSalvas {
  email: string;
  senha: string;
}

/**
 * Login por biometria. As credenciais ficam no Keystore (Android) / Keychain (iOS)
 * via capacitor-native-biometric — nunca em localStorage. O localStorage guarda
 * apenas flags (ativa / recusada) para decidir o que mostrar na tela.
 */
@Injectable({ providedIn: 'root' })
export class BiometriaService {
  constructor(@Inject(NATIVE_BIOMETRIC) private readonly nativeBiometric: typeof NativeBiometric) {}

  /** Há sensor/biometria cadastrada neste aparelho? (sempre false no navegador) */
  async disponivel(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    try {
      const resultado = await this.nativeBiometric.isAvailable();
      return resultado.isAvailable;
    } catch {
      return false;
    }
  }

  ativa(): boolean {
    return localStorage.getItem(CHAVE_ATIVA) === '1';
  }

  /** O usuário já disse "agora não" ao convite para ativar? */
  conviteRecusado(): boolean {
    return localStorage.getItem(CHAVE_RECUSADA) === '1';
  }

  recusarConvite(): void {
    localStorage.setItem(CHAVE_RECUSADA, '1');
  }

  /** Confirma a biometria e guarda as credenciais no cofre do sistema. */
  async ativar(email: string, senha: string): Promise<boolean> {
    try {
      await this.nativeBiometric.verifyIdentity({
        reason: 'Confirme sua identidade para ativar a biometria',
        title: 'Ativar biometria',
        negativeButtonText: 'Cancelar'
      });
      await this.nativeBiometric.setCredentials({ username: email, password: senha, server: SERVER });
      localStorage.setItem(CHAVE_ATIVA, '1');
      localStorage.removeItem(CHAVE_RECUSADA);
      return true;
    } catch {
      return false;
    }
  }

  /** Atualiza a credencial guardada, sem pedir biometria (usuário acabou de digitar a senha). */
  async atualizarCredenciais(email: string, senha: string): Promise<void> {
    try {
      await this.nativeBiometric.setCredentials({ username: email, password: senha, server: SERVER });
    } catch {
      // mantém a credencial anterior
    }
  }

  /** Pede a biometria e devolve as credenciais salvas; null se cancelou ou falhou. */
  async obterCredenciais(): Promise<CredenciaisSalvas | null> {
    if (!this.ativa()) {
      return null;
    }
    try {
      await this.nativeBiometric.verifyIdentity({
        reason: 'Entre no Gestor Financeiro',
        title: 'Entrar com biometria',
        negativeButtonText: 'Usar senha'
      });
      const cred = await this.nativeBiometric.getCredentials({ server: SERVER });
      return { email: cred.username, senha: cred.password };
    } catch {
      return null;
    }
  }

  /** Remove as credenciais (desativar nas configurações ou senha alterada). */
  async desativar(): Promise<void> {
    localStorage.removeItem(CHAVE_ATIVA);
    try {
      await this.nativeBiometric.deleteCredentials({ server: SERVER });
    } catch {
      // já não existia
    }
  }
}
