import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { InputMoedaComponent } from './input-moeda.component';

describe('InputMoedaComponent (máscara de reais)', () => {
  let c: InputMoedaComponent;
  let emitido: (number | null)[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputMoedaComponent],
      imports: [IonicModule.forRoot()]
    }).compileComponents();
    c = TestBed.createComponent(InputMoedaComponent).componentInstance;
    emitido = [];
    c.registerOnChange(v => emitido.push(v));
  });

  const digitar = (texto: string) => {
    const evento = { target: { value: texto } };
    c.aoDigitar(evento);
    return evento.target.value;
  };

  it('mostra o valor do formulário com cifrão, milhar e centavos', () => {
    c.writeValue(1234.5);
    expect(c.texto).toBe('R$ 1.234,50');
  });

  it('valor vazio ou nulo deixa o campo em branco (aparece o placeholder)', () => {
    c.writeValue(null);
    expect(c.texto).toBe('');
    c.writeValue('');
    expect(c.texto).toBe('');
  });

  it('os dígitos entram pelos centavos: 150000 vira R$ 1.500,00 e o formulário recebe 1500', () => {
    expect(digitar('150000')).toBe('R$ 1.500,00');
    expect(emitido).toEqual([1500]);
  });

  it('um dígito vira centavos: 5 -> R$ 0,05', () => {
    expect(digitar('5')).toBe('R$ 0,05');
    expect(emitido).toEqual([0.05]);
  });

  it('ignora o que não é número (letras, símbolos já formatados)', () => {
    expect(digitar('R$ 12a3,45')).toBe('R$ 123,45');
    expect(emitido).toEqual([123.45]);
  });

  it('apagar tudo emite null (campo obrigatório volta a acusar erro)', () => {
    digitar('100');
    expect(digitar('')).toBe('');
    expect(emitido[emitido.length - 1]).toBeNull();
  });

  it('limita o tamanho para não estourar a precisão do banco (DECIMAL 15,2)', () => {
    // só os 12 primeiros dígitos valem: 123456789012 centavos = R$ 1.234.567.890,12
    expect(digitar('1234567890123456789')).toBe('R$ 1.234.567.890,12');
    expect(emitido).toEqual([1234567890.12]);
  });
});
