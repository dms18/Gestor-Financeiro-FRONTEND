import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoginResponse, Usuario } from '../models/usuario';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const usuario: Usuario = { id: 1, nome: 'Maria', email: 'maria@exemplo.com', perfil: 'PF', ativo: true };
  const resposta: LoginResponse = { token: 'jwt-123', expiresIn: 3600, usuario };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('login envia as credenciais, guarda o token e publica o usuário', () => {
    let atual: Usuario | null = null;
    service.usuario$.subscribe(u => (atual = u));

    service.login({ email: 'maria@exemplo.com', senha: 'Senha@123' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'maria@exemplo.com', senha: 'Senha@123' });
    req.flush(resposta);

    expect(service.getToken()).toBe('jwt-123');
    expect(service.isLoggedIn()).toBeTrue();
    expect(JSON.parse(localStorage.getItem('usuario') as string).nome).toBe('Maria');
    expect(atual).toEqual(usuario);
  });

  it('login com erro não guarda token', () => {
    service.login({ email: 'x@y.com', senha: 'errada' }).subscribe({ error: () => undefined });

    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ message: 'Credenciais inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('register também autentica o usuário', () => {
    service.register({ nome: 'Maria', email: 'maria@exemplo.com', senha: 'Senha@123', perfil: 'PF', aceiteTermos: true } as any).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(resposta);

    expect(service.getToken()).toBe('jwt-123');
  });

  it('logout apaga token e usuário e avisa os assinantes', () => {
    localStorage.setItem('auth_token', 'jwt-123');
    localStorage.setItem('usuario', JSON.stringify(usuario));
    let atual: Usuario | null = usuario;
    service.usuario$.subscribe(u => (atual = u));

    service.logout();

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(atual).toBeNull();
  });

  it('atualizarUsuarioLocal persiste e notifica', () => {
    let atual: Usuario | null = null;
    service.usuario$.subscribe(u => (atual = u));

    service.atualizarUsuarioLocal({ ...usuario, nome: 'Maria Silva' });

    expect(atual!.nome).toBe('Maria Silva');
    expect(JSON.parse(localStorage.getItem('usuario') as string).nome).toBe('Maria Silva');
  });

  it('solicitarCodigo e redefinirSenha chamam os endpoints de recuperação', () => {
    service.solicitarCodigo('maria@exemplo.com').subscribe();
    const r1 = http.expectOne(`${environment.apiUrl}/auth/esqueci-senha`);
    expect(r1.request.body).toEqual({ email: 'maria@exemplo.com' });
    r1.flush({ message: 'ok' });

    service.redefinirSenha({ email: 'maria@exemplo.com', codigo: '123456', novaSenha: 'Nova@1234' }).subscribe();
    const r2 = http.expectOne(`${environment.apiUrl}/auth/redefinir-senha`);
    expect(r2.request.body.codigo).toBe('123456');
    r2.flush({ message: 'ok' });
  });
});
