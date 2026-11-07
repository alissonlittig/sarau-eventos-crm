// Regras de negócio puras (testadas em test/lib.test.js). Todos os dados são fictícios.
export const ETAPAS = ['Lead', 'Orçamento enviado', 'Negociação', 'Contrato assinado', 'Realizado'];
export const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dataBR = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '').replace(/ de /g, ' ');

export const MENU = [
  { id: 'm1', nome: 'Mini coxinha de costela', cat: 'Entradas', preco: 14, custo: 5.2 },
  { id: 'm2', nome: 'Tartelete de queijo da serra', cat: 'Entradas', preco: 12, custo: 4.1 },
  { id: 'm3', nome: 'Carpaccio de abóbora', cat: 'Entradas', preco: 16, custo: 5.9 },
  { id: 'm4', nome: 'Risoto de funghi', cat: 'Pratos', preco: 58, custo: 21 },
  { id: 'm5', nome: 'Filé ao molho de vinho', cat: 'Pratos', preco: 74, custo: 31 },
  { id: 'm6', nome: 'Bacalhau com crosta de ervas', cat: 'Pratos', preco: 92, custo: 44 },
  { id: 'm7', nome: 'Moqueca de palmito', cat: 'Pratos', preco: 52, custo: 17 },
  { id: 'm8', nome: 'Pudim de leite em calda', cat: 'Sobremesas', preco: 15, custo: 4.4 },
  { id: 'm9', nome: 'Mesa de doces finos', cat: 'Sobremesas', preco: 28, custo: 9.8 },
  { id: 'm10', nome: 'Open bar de cervejas', cat: 'Bebidas', preco: 49, custo: 24 },
  { id: 'm11', nome: 'Drinks autorais (3 opções)', cat: 'Bebidas', preco: 62, custo: 26 },
  { id: 'm12', nome: 'Sucos e refrigerantes', cat: 'Bebidas', preco: 18, custo: 6.5 },
  { id: 'm13', nome: 'Equipe de garçons e copa', cat: 'Estrutura', preco: 32, custo: 20 },
  { id: 'm14', nome: 'Louça, talheres e toalhas', cat: 'Estrutura', preco: 21, custo: 9 },
];

const r2 = (n) => Math.round(n * 100) / 100;
const sel = (ev, menu) => menu.filter((m) => ev.itens.includes(m.id));

// Total: soma por convidado × convidados, menos desconto %, mais taxa fixa de montagem.
export function totalOrcamento(ev, menu = MENU) {
  const pp = sel(ev, menu).reduce((s, m) => s + m.preco, 0);
  return r2(pp * ev.convidados * (1 - ev.desconto / 100) + ev.taxa);
}
export function custoEvento(ev, menu = MENU) {
  const c = sel(ev, menu).reduce((s, m) => s + m.custo, 0);
  return r2(c * ev.convidados + ev.taxa * 0.4);
}
// Parcelas: 30% de entrada no aceite, o resto em n parcelas mensais (a última absorve os centavos).
export function gerarParcelas(total, n, dataBase) {
  const entrada = r2(total * 0.3);
  const resto = r2(total - entrada);
  const cada = Math.floor((resto / n) * 100) / 100;
  const out = [{ desc: 'Entrada (30%)', valor: entrada, venc: dataBase }];
  for (let i = 1; i <= n; i++) {
    const d = new Date(dataBase + 'T12:00:00');
    d.setMonth(d.getMonth() + i);
    out.push({ desc: `Parcela ${i}/${n}`, valor: i === n ? r2(resto - cada * (n - 1)) : cada, venc: d.toISOString().slice(0, 10) });
  }
  return out;
}
export const margem = (ev, menu) => {
  const t = totalOrcamento(ev, menu);
  return t ? Math.round(((t - custoEvento(ev, menu)) / t) * 100) : 0;
};

export const HOJE = '2026-11-07';
const D = (off) => { const d = new Date(HOJE + 'T12:00:00'); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };

export function seed() {
  const eventos = [
    { id: 'e1', cliente: 'Helena & Davi', tipo: 'Casamento', data: D(63), convidados: 140, local: 'Chácara Pé de Ipê', etapa: 'Contrato assinado', itens: ['m1','m3','m5','m9','m11','m13','m14'], desconto: 5, taxa: 3800, parcelas: 4 },
    { id: 'e2', cliente: 'Nortec Logística', tipo: 'Corporativo', data: D(12), convidados: 80, local: 'Auditório Nortec', etapa: 'Contrato assinado', itens: ['m2','m4','m8','m12','m13'], desconto: 0, taxa: 900, parcelas: 2 },
    { id: 'e3', cliente: 'Formandos Direito 2026', tipo: 'Formatura', data: D(96), convidados: 220, local: 'Clube Vila Verde', etapa: 'Negociação', itens: ['m1','m2','m5','m9','m10','m13','m14'], desconto: 8, taxa: 5200, parcelas: 6 },
    { id: 'e4', cliente: 'Marta Albuquerque', tipo: 'Aniversário', data: D(25), convidados: 45, local: 'Casa da família', etapa: 'Orçamento enviado', itens: ['m2','m7','m8','m12'], desconto: 0, taxa: 450, parcelas: 2 },
    { id: 'e5', cliente: 'Rubens Tavares', tipo: 'Bodas de ouro', data: D(41), convidados: 90, local: 'Salão Santa Clara', etapa: 'Lead', itens: ['m3','m4','m9','m12'], desconto: 0, taxa: 1200, parcelas: 3 },
    { id: 'e6', cliente: 'Studio Ânima', tipo: 'Corporativo', data: D(-18), convidados: 60, local: 'Rooftop Ânima', etapa: 'Realizado', itens: ['m1','m3','m11','m13'], desconto: 3, taxa: 700, parcelas: 2 },
    { id: 'e7', cliente: 'Júlia & Pedro', tipo: 'Casamento', data: D(150), convidados: 110, local: 'Vinícola Serra Alta', etapa: 'Orçamento enviado', itens: ['m1','m3','m6','m9','m11','m13','m14'], desconto: 0, taxa: 4200, parcelas: 5 },
  ];
  const pagamentos = [];
  let k = 1;
  for (const ev of eventos.filter((e) => ['Contrato assinado', 'Realizado'].includes(e.etapa))) {
    const base = ev.etapa === 'Realizado' ? D(-70) : D(-25);
    gerarParcelas(totalOrcamento(ev), ev.parcelas, base).forEach((p) =>
      pagamentos.push({ id: 'p' + k++, evento: ev.id, ...p, pago: p.venc <= HOJE && !(ev.id === 'e2' && p.desc.startsWith('Entrada')) }));
  }
  return { eventos, menu: MENU.map((m) => ({ ...m })), pagamentos };
}
