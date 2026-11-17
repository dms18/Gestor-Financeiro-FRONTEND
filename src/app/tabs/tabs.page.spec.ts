import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TabsPage } from './tabs.page';
import { AuthService } from '../services/auth.service';
import { LayoutService } from '../services/layout.service';
import { UsuarioService } from '../services/usuario.service';

describe('TabsPage', () => {
  let component: TabsPage;
  let fixture: ComponentFixture<TabsPage>;
  let auth: { isAdmin: boolean; getUsuarioLocal: jasmine.Spy; atualizarUsuarioLocal: jasmine.Spy };
  let layout: { web: boolean; barraLateral$: any };
  let usuarioService: jasmine.SpyObj<UsuarioService>;

  const montar = () => {
    fixture = TestBed.createComponent(TabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async(() => {
    auth = { isAdmin: false, getUsuarioLocal: jasmine.createSpy().and.returnValue(null), atualizarUsuarioLocal: jasmine.createSpy() };
    layout = { web: true, barraLateral$: of(false) };
    usuarioService = jasmine.createSpyObj('UsuarioService', ['obterPerfil']);
    usuarioService.obterPerfil.and.returnValue(of({ admin: false } as any));

    TestBed.configureTestingModule({
      declarations: [TabsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: LayoutService, useValue: layout },
        { provide: UsuarioService, useValue: usuarioService }
      ]
    }).compileComponents();
  }));

  it('should create', () => {
    montar();
    expect(component).toBeTruthy();
  });

  it('não mostra a aba Admin para quem não é administrador', () => {
    montar();
    expect(component.abas.some(a => a.tab === 'admin')).toBeFalse();
  });

  it('mostra a aba Admin para administrador na versão web', () => {
    auth.isAdmin = true;
    montar();
    expect(component.abas.some(a => a.tab === 'admin')).toBeTrue();
  });

  it('nunca mostra a aba Admin no app instalado, mesmo para administrador', () => {
    auth.isAdmin = true;
    layout.web = false;
    montar();
    expect(component.abas.some(a => a.tab === 'admin')).toBeFalse();
    expect(usuarioService.obterPerfil).not.toHaveBeenCalled();
  });

  it('atualiza a flag de administrador guardada quando o servidor informa mudança', () => {
    auth.getUsuarioLocal.and.returnValue({ id: 1, admin: false });
    usuarioService.obterPerfil.and.returnValue(of({ admin: true } as any));
    montar();
    expect(auth.atualizarUsuarioLocal).toHaveBeenCalledWith(jasmine.objectContaining({ admin: true }));
  });
});
