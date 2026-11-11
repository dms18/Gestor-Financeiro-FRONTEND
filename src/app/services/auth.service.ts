import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, Usuario } from '../models/usuario';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {
    this.carregarUsuario();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.salvarToken(response)),
      tap(response => this.usuarioSubject.next(response.usuario))
    );
  }

  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.salvarToken(response)),
      tap(response => this.usuarioSubject.next(response.usuario))
    );
  }

  solicitarCodigo(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/esqueci-senha`, { email });
  }

  verificarCodigo(email: string, codigo: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/verificar-codigo`, { email, codigo });
  }

  redefinirSenha(request: { email: string; codigo: string; novaSenha: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/redefinir-senha`, request);
  }

  private salvarToken(response: LoginResponse): void {
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('usuario', JSON.stringify(response.usuario));
  }

  /** Atualiza o usuário guardado localmente e notifica os assinantes. */
  atualizarUsuarioLocal(usuario: Usuario): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
  }

  getToken(): string | null {
    const token = localStorage.getItem('auth_token');
    return token;
  }

  private carregarUsuario(): void {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        this.usuarioSubject.next(usuario);
      } catch (e) {
        console.error('Erro ao carregar usuário', e);
      }
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario');
    this.usuarioSubject.next(null);
  }

  getUsuarioAtual(): Observable<Usuario | null> {
    return this.usuario$;
  }

  /**
   * O perfil do usuário define se o app mostra PF, PJ ou os dois (abas e campos de vínculo).
   * Sem perfil conhecido, mostra os dois (comportamento anterior).
   */
  get perfilAmbos(): boolean {
    const p = this.usuarioSubject.value?.perfil;
    return p !== 'PF' && p !== 'PJ';
  }

  /** Vínculo único do usuário (PF ou PJ) quando o perfil não é AMBOS; senão PF. */
  get vinculoPadrao(): 'PF' | 'PJ' {
    return this.usuarioSubject.value?.perfil === 'PJ' ? 'PJ' : 'PF';
  }
}
