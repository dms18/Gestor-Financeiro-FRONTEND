import { AlertController, LoadingController, ToastController } from '@ionic/angular';

/** Overlay falso do Ionic (loading/toast/alert): não toca no DOM e resolve na hora. */
export function overlayFalso(extra: object = {}) {
  return {
    present: () => Promise.resolve(),
    dismiss: () => Promise.resolve(true),
    onDidDismiss: () => Promise.resolve({}),
    ...extra
  };
}

/** Troca `create` dos controllers do Ionic por dublês e devolve o que foi pedido a cada um. */
export function simularOverlays(
  loading: LoadingController,
  toast: ToastController,
  alerta: AlertController
) {
  const toasts: string[] = [];
  const alertas: any[] = [];

  spyOn(loading, 'create').and.callFake((() => Promise.resolve(overlayFalso())) as any);
  spyOn(toast, 'create').and.callFake(((opts: any) => {
    toasts.push(opts.message);
    return Promise.resolve(overlayFalso());
  }) as any);
  spyOn(alerta, 'create').and.callFake(((opts: any) => {
    alertas.push(opts);
    return Promise.resolve(overlayFalso());
  }) as any);

  return { toasts, alertas };
}
