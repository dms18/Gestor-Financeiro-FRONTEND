export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  cnpj?: string;
  perfil: string;
  ativo: boolean;
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
}
