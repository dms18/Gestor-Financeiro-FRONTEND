import { environment as producao } from '../environments/environment.prod';
import { environment as mobile } from '../environments/environment.mobile';

/**
 * Guarda de segurança: senha, token e dados financeiros nunca podem voltar a trafegar em HTTP puro.
 * (Achado "fe.transport.cleartext-http-credentials" da auditoria de segurança.)
 */
describe('Ambientes de produção', () => {
  it('o app Android fala com a API somente por HTTPS', () => {
    expect(mobile.apiUrl.startsWith('https://')).toBeTrue();
  });

  it('o app Android usa o domínio e não um IP', () => {
    expect(mobile.apiUrl).not.toMatch(/^https?:\/\/\d{1,3}(\.\d{1,3}){3}/);
  });

  it('o site de produção usa caminho relativo, herdando o HTTPS da página', () => {
    expect(producao.apiUrl).toBe('/api');
  });

  it('o Sentry só é ativado com um DSN https', () => {
    for (const env of [producao, mobile]) {
      expect(env.sentryDsn === '' || env.sentryDsn.startsWith('https://')).toBeTrue();
    }
  });
});
