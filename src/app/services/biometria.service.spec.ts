import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { BiometriaService, NATIVE_BIOMETRIC } from './biometria.service';

describe('BiometriaService', () => {
  let service: BiometriaService;
  let plugin: jasmine.SpyObj<any>;

  beforeEach(() => {
    localStorage.clear();
    plugin = jasmine.createSpyObj('NativeBiometric', [
      'isAvailable', 'verifyIdentity', 'setCredentials', 'getCredentials', 'deleteCredentials'
    ]);
    plugin.isAvailable.and.resolveTo({ isAvailable: true });
    plugin.verifyIdentity.and.resolveTo();
    plugin.setCredentials.and.resolveTo();
    plugin.deleteCredentials.and.resolveTo();
    plugin.getCredentials.and.resolveTo({ username: 'maria@exemplo.com', password: 'Senha@123' });

    TestBed.configureTestingModule({ providers: [{ provide: NATIVE_BIOMETRIC, useValue: plugin }] });
    service = TestBed.inject(BiometriaService);
  });

  afterEach(() => localStorage.clear());

  describe('disponivel', () => {
    it('é false no navegador (fora de plataforma nativa), sem consultar o plugin', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      expect(await service.disponivel()).toBeFalse();
      expect(plugin.isAvailable).not.toHaveBeenCalled();
    });

    it('é true no aparelho com biometria cadastrada', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      expect(await service.disponivel()).toBeTrue();
    });

    it('é false se o aparelho não tem biometria', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      plugin.isAvailable.and.resolveTo({ isAvailable: false });
      expect(await service.disponivel()).toBeFalse();
    });

    it('é false se o plugin lançar erro', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      plugin.isAvailable.and.rejectWith(new Error('falha'));
      expect(await service.disponivel()).toBeFalse();
    });
  });

  describe('ativar', () => {
    it('confirma a biometria, guarda as credenciais no cofre e marca como ativa', async () => {
      const ok = await service.ativar('maria@exemplo.com', 'Senha@123');

      expect(ok).toBeTrue();
      expect(plugin.verifyIdentity).toHaveBeenCalled();
      expect(plugin.setCredentials).toHaveBeenCalledWith(
        jasmine.objectContaining({ username: 'maria@exemplo.com', password: 'Senha@123' })
      );
      expect(service.ativa()).toBeTrue();
    });

    it('não guarda nada se o usuário cancelar a biometria', async () => {
      plugin.verifyIdentity.and.rejectWith(new Error('cancelado'));

      expect(await service.ativar('maria@exemplo.com', 'Senha@123')).toBeFalse();
      expect(plugin.setCredentials).not.toHaveBeenCalled();
      expect(service.ativa()).toBeFalse();
    });

    it('nunca grava a senha em localStorage', async () => {
      await service.ativar('maria@exemplo.com', 'Senha@123');

      const tudo = JSON.stringify(Object.assign({}, localStorage));
      expect(tudo).not.toContain('Senha@123');
    });

    it('limpa a marca de convite recusado', async () => {
      service.recusarConvite();
      await service.ativar('a@b.com', 'x');
      expect(service.conviteRecusado()).toBeFalse();
    });
  });

  describe('obterCredenciais', () => {
    it('devolve null sem biometria ativa, sem nem pedir a digital', async () => {
      expect(await service.obterCredenciais()).toBeNull();
      expect(plugin.verifyIdentity).not.toHaveBeenCalled();
    });

    it('pede a biometria e devolve as credenciais salvas', async () => {
      await service.ativar('maria@exemplo.com', 'Senha@123');
      plugin.verifyIdentity.calls.reset();

      const cred = await service.obterCredenciais();

      expect(plugin.verifyIdentity).toHaveBeenCalledTimes(1);
      expect(cred).toEqual({ email: 'maria@exemplo.com', senha: 'Senha@123' });
    });

    it('devolve null se a biometria for recusada (e não lê o cofre)', async () => {
      await service.ativar('maria@exemplo.com', 'Senha@123');
      plugin.verifyIdentity.and.rejectWith(new Error('digital não reconhecida'));

      expect(await service.obterCredenciais()).toBeNull();
      expect(plugin.getCredentials).not.toHaveBeenCalled();
    });
  });

  it('atualizarCredenciais regrava o cofre sem pedir biometria', async () => {
    await service.atualizarCredenciais('maria@exemplo.com', 'NovaSenha@1');

    expect(plugin.verifyIdentity).not.toHaveBeenCalled();
    expect(plugin.setCredentials).toHaveBeenCalledWith(jasmine.objectContaining({ password: 'NovaSenha@1' }));
  });

  it('desativar remove a marca e apaga as credenciais do cofre', async () => {
    await service.ativar('maria@exemplo.com', 'Senha@123');

    await service.desativar();

    expect(service.ativa()).toBeFalse();
    expect(plugin.deleteCredentials).toHaveBeenCalled();
  });

  it('desativar não falha se o cofre já estava vazio', async () => {
    plugin.deleteCredentials.and.rejectWith(new Error('inexistente'));
    await expectAsync(service.desativar()).toBeResolved();
  });

  it('lembra que o convite foi recusado', () => {
    expect(service.conviteRecusado()).toBeFalse();
    service.recusarConvite();
    expect(service.conviteRecusado()).toBeTrue();
  });
});
