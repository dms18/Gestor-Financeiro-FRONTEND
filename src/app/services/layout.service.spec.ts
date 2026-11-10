import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  let ouvintes: Array<(e: { matches: boolean }) => void>;

  /** Simula window.matchMedia para uma largura de tela. */
  const simularLargura = (largura: number) => {
    ouvintes = [];
    spyOn(window, 'matchMedia').and.callFake((consulta: string) => {
      const minimo = Number((consulta.match(/min-width:\s*(\d+)px/) || [])[1] || 0);
      return {
        matches: largura >= minimo,
        media: consulta,
        addEventListener: (_: string, cb: any) => ouvintes.push(cb),
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        onchange: null,
        dispatchEvent: () => false
      } as unknown as MediaQueryList;
    });
  };

  const criar = (nativo: boolean): LayoutService => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(nativo);
    return TestBed.inject(LayoutService);
  };

  beforeEach(() => document.body.classList.remove('plataforma-web', 'web-largo'));
  afterEach(() => document.body.classList.remove('plataforma-web', 'web-largo'));

  describe('app instalado (nativo)', () => {
    it('não adiciona classe nenhuma: a interface do app fica exatamente como era', () => {
      simularLargura(1600);
      const servico = criar(true);

      servico.init();

      expect(servico.web).toBeFalse();
      expect(document.body.classList.contains('plataforma-web')).toBeFalse();
      expect(document.body.classList.contains('web-largo')).toBeFalse();
    });

    it('nem sequer consulta o tamanho da tela', () => {
      simularLargura(1600);
      const servico = criar(true);

      servico.init();

      expect(window.matchMedia).not.toHaveBeenCalled();
    });
  });

  describe('navegador', () => {
    it('marca o body como plataforma-web', () => {
      simularLargura(500);
      const servico = criar(false);

      servico.init();

      expect(servico.web).toBeTrue();
      expect(document.body.classList.contains('plataforma-web')).toBeTrue();
    });

    it('tela estreita (celular): sem barra lateral', () => {
      simularLargura(390);
      const servico = criar(false);
      let barra: boolean | undefined;
      servico.barraLateral$.subscribe(v => (barra = v));

      servico.init();

      expect(document.body.classList.contains('web-largo')).toBeFalse();
      expect(barra).toBeFalse();
    });

    it('tablet (768 a 1023 px): continua sem barra lateral', () => {
      simularLargura(1023);
      const servico = criar(false);

      servico.init();

      expect(document.body.classList.contains('web-largo')).toBeFalse();
    });

    it('a partir de 1024 px liga a barra lateral', () => {
      simularLargura(1024);
      const servico = criar(false);
      let barra: boolean | undefined;
      servico.barraLateral$.subscribe(v => (barra = v));

      servico.init();

      expect(document.body.classList.contains('web-largo')).toBeTrue();
      expect(barra).toBeTrue();
    });

    it('acompanha o redimensionamento da janela, nos dois sentidos', () => {
      simularLargura(1400);
      const servico = criar(false);
      let barra: boolean | undefined;
      servico.barraLateral$.subscribe(v => (barra = v));
      servico.init();
      expect(barra).toBeTrue();

      ouvintes.forEach(cb => cb({ matches: false })); // janela encolheu
      expect(barra).toBeFalse();
      expect(document.body.classList.contains('web-largo')).toBeFalse();
      expect(document.body.classList.contains('plataforma-web')).toBeTrue(); // continua sendo navegador

      ouvintes.forEach(cb => cb({ matches: true })); // janela cresceu
      expect(barra).toBeTrue();
      expect(document.body.classList.contains('web-largo')).toBeTrue();
    });
  });
});
