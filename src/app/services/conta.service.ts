import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContaService {

  constructor(private api: ApiService) {}

  listar(): Observable<any[]> {
    return this.api.get<any[]>('/contas');
  }

  criar(conta: any): Observable<any> {
    return this.api.post('/contas', conta);
  }

  atualizar(id: number, conta: any): Observable<any> {
    return this.api.put(`/contas/${id}`, conta);
  }

  deletar(id: number): Observable<any> {
    return this.api.delete(`/contas/${id}`);
  }
}
