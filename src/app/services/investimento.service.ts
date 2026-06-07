import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvestimentoService {

  constructor(private api: ApiService) {}

  listar(status?: string): Observable<any[]> {
    let endpoint = '/investimentos';
    if (status) {
      endpoint += `?status=${status}`;
    }
    return this.api.get<any[]>(endpoint);
  }

  criar(investimento: any): Observable<any> {
    return this.api.post('/investimentos', investimento);
  }

  atualizar(id: number, investimento: any): Observable<any> {
    return this.api.put(`/investimentos/${id}`, investimento);
  }

  deletar(id: number): Observable<any> {
    return this.api.delete(`/investimentos/${id}`);
  }
}
