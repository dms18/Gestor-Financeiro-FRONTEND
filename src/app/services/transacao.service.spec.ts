import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransacaoService } from './transacao.service';
import { environment } from '../../environments/environment';

describe('TransacaoService', () => {
  let service: TransacaoService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/transacoes`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TransacaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar sem filtro chama /transacoes', () => {
    service.listar().subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listar com tipoPessoa envia o filtro na query', () => {
    service.listar('PJ').subscribe();
    http.expectOne(`${base}?tipoPessoa=PJ`).flush([]);
  });

  it('obterResumo monta a query com tipoPessoa, mês e ano', () => {
    service.obterResumo('PF', 11, 2026).subscribe();
    http.expectOne(`${base}/resumo?tipoPessoa=PF&mes=11&ano=2026`).flush({});
  });

  it('obterResumo sem parâmetros não inclui query string', () => {
    service.obterResumo().subscribe();
    http.expectOne(`${base}/resumo`).flush({});
  });

  it('obterResumo ignora mês sem ano', () => {
    service.obterResumo(undefined, 11, undefined).subscribe();
    http.expectOne(`${base}/resumo`).flush({});
  });

  it('criar parcelada envia o montante e a quantidade de parcelas', () => {
    service.criar({ descricao: 'Notebook', valor: 3000, parcelado: true, numeroParcelas: 6 }).subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.valor).toBe(3000);
    expect(req.request.body.numeroParcelas).toBe(6);
    req.flush([]);
  });

  it('atualizar usa PUT no id', () => {
    service.atualizar(7, { descricao: 'x' }).subscribe();
    const req = http.expectOne(`${base}/7`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deletar sem escopo chama apenas o id', () => {
    service.deletar(7).subscribe();
    const req = http.expectOne(`${base}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('deletar parcela envia o escopo escolhido', () => {
    service.deletar(7, 'PROXIMAS').subscribe();
    http.expectOne(`${base}/7?escopo=PROXIMAS`).flush(null);
  });
});
