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

  obterResumo(tipoPessoa?: string): Observable<any> {
    let endpoint = '/transacoes/resumo';
    if (tipoPessoa) {
      endpoint += `?tipoPessoa=${tipoPessoa}`;
    }
    return this.api.get<any>(endpoint);
  }

  criar(transacao: any): Observable<any> {
    return this.api.post('/transacoes', transacao);
  }

  atualizar(id: number, transacao: any): Observable<any> {
    return this.api.put(`/transacoes/${id}`, transacao);
  }

  deletar(id: number): Observable<any> {
    return this.api.delete(`/transacoes/${id}`);
  }
}
