import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { LayoutService } from '../services/layout.service';

describe('AdminGuard', () => {
  let router: jasmine.SpyObj<Router>;

  const criar = (web: boolean, admin: boolean) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { isAdmin: admin } },
        { provide: LayoutService, useValue: { web } }
      ]
    });
    return TestBed.inject(AdminGuard);
  };

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);
  });

  it('libera o administrador na versão web', () => {
    expect(criar(true, true).canActivate()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('bloqueia o administrador no app instalado', () => {
    expect(criar(false, true).canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/dashboard']);
  });

  it('bloqueia quem não é administrador', () => {
    expect(criar(true, false).canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/dashboard']);
  });
});
