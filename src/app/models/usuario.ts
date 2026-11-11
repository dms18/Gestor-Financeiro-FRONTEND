export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  cnpj?: string;
  perfil: string;
  ativo: boolean;
  fotoPerfil?: string | null;
  interfaceInicial?: string | null;
  /** Administrador (flag ic_adm no banco). O painel /admin só aparece na versão web. */
  admin?: boolean;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  usuario: Usuario;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  cnpj?: string;
  perfil: string;
  aceiteTermos: boolean;
}
