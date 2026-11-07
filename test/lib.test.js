import { describe, it, expect } from 'vitest';
import { totalOrcamento, gerarParcelas, seed, MENU } from '../src/lib.js';

describe('orçamento', () => {
  it('soma itens × convidados, aplica desconto e taxa', () => {
    const ev = { itens: ['m1', 'm4'], convidados: 10, desconto: 10, taxa: 100 };
    expect(totalOrcamento(ev, MENU)).toBe(748);
  });
});
describe('parcelas', () => {
  it('fecha exatamente no total e começa com 30% de entrada', () => {
    const p = gerarParcelas(10000.01, 3, '2026-11-07');
    expect(p[0].valor).toBe(3000);
    expect(Math.round(p.reduce((s, x) => s + x.valor, 0) * 100) / 100).toBe(10000.01);
    expect(p).toHaveLength(4);
  });
});
describe('seed', () => {
  it('contratos assinados têm parcelas', () => {
    expect(seed().pagamentos.some((x) => x.evento === 'e1')).toBe(true);
  });
});
