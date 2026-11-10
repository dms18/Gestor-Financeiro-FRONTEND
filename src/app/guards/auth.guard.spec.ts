import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: auth }]
    });
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('libera a rota para usuário autenticado', () => {
    auth.isLoggedIn.and.returnValue(true);

    expect(guard.canActivate({} as any, {} as any)).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('bloqueia e redireciona para o login quando não há sessão', () => {
    auth.isLoggedIn.and.returnValue(false);

    expect(guard.canActivate({} as any, {} as any)).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
