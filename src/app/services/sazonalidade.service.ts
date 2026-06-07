import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SazonalidadeService {

  constructor(private api: ApiService) {}

  listar(): Observable<any[]> {
    return this.api.get<any[]>('/sazonalidade');
  }

  obterAletasAtivos(): Observable<any[]> {
    return this.api.get<any[]>('/sazonalidade/alertas-ativos');
  }

  criar(sazonalidade: any): Observable<any> {
    return this.api.post('/sazonalidade', sazonalidade);
  }

  atualizar(id: number, sazonalidade: any): Observable<any> {
    return this.api.put(`/sazonalidade/${id}`, sazonalidade);
  }

  deletar(id: number): Observable<any> {
    return this.api.delete(`/sazonalidade/${id}`);
  }
}
