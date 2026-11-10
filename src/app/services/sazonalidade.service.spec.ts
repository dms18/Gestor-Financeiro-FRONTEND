import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SazonalidadeService } from './sazonalidade.service';
import { environment } from '../../environments/environment';

describe('SazonalidadeService', () => {
  let service: SazonalidadeService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/sazonalidade`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SazonalidadeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obterReservas consulta a comparação de caixa', () => {
    service.obterReservas().subscribe(r => expect(r.length).toBe(1));
    const req = http.expectOne(`${base}/reservas`);
    expect(req.request.method).toBe('GET');
    req.flush([{ sazonalidadeId: 1 }]);
  });

  it('obterAletasAtivos consulta os alertas do mês', () => {
    service.obterAletasAtivos().subscribe();
    http.expectOne(`${base}/alertas-ativos`).flush([]);
  });

  it('criar envia a reserva de caixa junto com o período', () => {
    const periodo = { nome: 'Natal', mesInicio: 11, mesFim: 12, nivelImpacto: 'ALTO',
      dataAlvo: '2026-11-01', valorNecessario: 5000, contaDebitoId: 3 };
    service.criar(periodo).subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(periodo);
    req.flush({});
  });

  it('atualizar usa PUT no id do período', () => {
    service.atualizar(4, { nome: 'x' }).subscribe();
    const req = http.expectOne(`${base}/4`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deletar usa DELETE no id do período', () => {
    service.deletar(4).subscribe();
    const req = http.expectOne(`${base}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
