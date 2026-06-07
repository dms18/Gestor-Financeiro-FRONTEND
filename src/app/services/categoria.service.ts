import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  constructor(private api: ApiService) {}

  listar(): Observable<any[]> {
    return this.api.get<any[]>('/categorias');
  }

  criar(categoria: any): Observable<any> {
    return this.api.post('/categorias', categoria);
  }

  atualizar(id: number, categoria: any): Observable<any> {
    return this.api.put(`/categorias/${id}`, categoria);
  }

  deletar(id: number): Observable<any> {
    return this.api.delete(`/categorias/${id}`);
  }
}
