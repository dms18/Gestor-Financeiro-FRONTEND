import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransacaoService {

  constructor(private api: ApiService) {}

  listar(tipoPessoa?: string): Observable<any[]> {
    let endpoint = '/transacoes';
    if (tipoPessoa) {
      endpoint += `?tipoPessoa=${tipoPessoa}`;
    }
    return this.api.get<any[]>(endpoint);
  }

  obterResumo(tipoPessoa?: string, mes?: number, ano?: number): Observable<any> {
    const params: string[] = [];
    if (tipoPessoa) {
      params.push(`tipoPessoa=${tipoPessoa}`);
    }
    if (mes && ano) {
      params.push(`mes=${mes}`, `ano=${ano}`);
    }
    const endpoint = '/transacoes/resumo' + (params.length ? '?' + params.join('&') : '');
    return this.api.get<any>(endpoint);
  }

  criar(transacao: any): Observable<any> {
    return this.api.post('/transacoes', transacao);
  }

  atualizar(id: number, transacao: any): Observable<any> {
    return this.api.put(`/transacoes/${id}`, transacao);
  }

  /** escopo (só para parcelas): UMA (padrão), PROXIMAS (esta e as seguintes) ou TODAS. */
  deletar(id: number, escopo?: string): Observable<any> {
    return this.api.delete(`/transacoes/${id}${escopo ? '?escopo=' + escopo : ''}`);
  }
}
