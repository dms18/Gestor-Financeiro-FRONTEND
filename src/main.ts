import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import * as Sentry from '@sentry/angular';

if (environment.production) {
  enableProdMode();
}

// Só liga o Sentry quando há DSN configurado em environment*.ts
if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.sentryEnv,
    // app financeiro: não envia IP/cabeçalhos/cookies do usuário
    sendDefaultPii: false,
    integrations: [
      // performance de navegação/rotas (precisa do TraceService no app.module)
      Sentry.browserTracingIntegration(),
      // replay só de sessões com erro; texto, campos e mídia mascarados (app financeiro)
      Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true })
    ],
    tracesSampleRate: 0.1,
    // não injeta sentry-trace/baggage nas chamadas à API: o CORS da API não os permite
    tracePropagationTargets: [],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(evento) {
      // nunca envia o token JWT nem dados de formulário por engano
      if (evento.request?.headers) {
        delete evento.request.headers['Authorization'];
      }
      return evento;
    }
  });
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

// Call the element loader after the platform has been bootstrapped
defineCustomElements(window);