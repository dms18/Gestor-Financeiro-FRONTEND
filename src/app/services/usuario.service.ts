import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(private api: ApiService) {}

  obterPerfil(): Observable<Usuario> {
    return this.api.get<Usuario>('/usuarios/perfil');
  }

  atualizarPerfil(dados: Partial<Usuario>): Observable<Usuario> {
    return this.api.put<Usuario>('/usuarios/perfil', dados);
  }
}
