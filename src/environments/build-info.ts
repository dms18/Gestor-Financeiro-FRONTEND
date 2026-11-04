// Valores padrão para desenvolvimento. O Dockerfile sobrescreve este arquivo no build
// (argumentos GIT_SHA e BUILD_DATE), que a pipeline preenche com o commit e a data.
export const buildInfo = {
  sha: 'dev',
  date: ''
};
