import { render } from 'solid-js/web';
import { createSignal, createEffect, createMemo, For, Show, Switch, Match, onCleanup } from 'solid-js';
import { ETAPAS, brl, dataBR, totalOrcamento, custoEvento, margem, gerarParcelas, seed, HOJE } from './lib.js';
import './style.css';

const KEY = 'sarau-demo-v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { return seed(); } };

const NAV = [
  ['painel', 'Painel', 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10'],
  ['funil', 'Funil', 'M4 5h16l-6 8v6l-4-2v-4z'],
  ['orcamentos', 'Orçamentos', 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7'],
  ['contratos', 'Contratos', 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h4'],
  ['cardapio', 'Cardápio', 'M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 3c-2 2-3 5-3 8h3v10'],
  ['pagamentos', 'Pagamentos', 'M3 7h18v12H3zM3 11h18M7 16h3'],
];
const Ico = (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={p.d} /></svg>;

function App() {
  const [db, setDb] = createSignal(load());
  const [view, setView] = createSignal(location.hash.slice(1) || 'painel');
  const [sel, setSel] = createSignal(null);
  createEffect(() => localStorage.setItem(KEY, JSON.stringify(db())));
  const onHash = () => setView(location.hash.slice(1) || 'painel');
  window.addEventListener('hashchange', onHash);
  onCleanup(() => window.removeEventListener('hashchange', onHash));

  const menu = () => db().menu;
  const total = (e) => totalOrcamento(e, menu());
  const patchEv = (id, p) => setDb({ ...db(), eventos: db().eventos.map((e) => (e.id === id ? { ...e, ...p } : e)) });
  const go = (v, id) => { if (id) setSel(id); location.hash = v; };
  const evById = (id) => db().eventos.find((e) => e.id === id);

  function avancar(e) {
    const i = ETAPAS.indexOf(e.etapa);
    if (i >= ETAPAS.length - 1) return;
    const etapa = ETAPAS[i + 1];
    let pagamentos = db().pagamentos;
    if (etapa === 'Contrato assinado' && !pagamentos.some((p) => p.evento === e.id)) {
      const n = pagamentos.length;
      pagamentos = [...pagamentos, ...gerarParcelas(total(e), e.parcelas, HOJE).map((p, k) => ({ id: 'p' + (n + k + 1) + e.id, evento: e.id, ...p, pago: false }))];
    }
    setDb({ ...db(), pagamentos, eventos: db().eventos.map((x) => (x.id === e.id ? { ...x, etapa } : x)) });
  }
  function novoLead() {
    const id = 'e' + Date.now();
    const ev = { id, cliente: 'Novo cliente', tipo: 'Aniversário', data: '2027-02-20', convidados: 50, local: 'A definir', etapa: 'Lead', itens: [], desconto: 0, taxa: 500, parcelas: 3 };
    setDb({ ...db(), eventos: [ev, ...db().eventos] });
    setSel(id); location.hash = 'orcamentos';
  }
  const reset = () => { if (confirm('Restaurar os dados de demonstração?')) { setDb(seed()); setSel(null); } };

  const current = createMemo(() => evById(sel()) || db().eventos[0]);
  const ativos = () => db().eventos.filter((e) => e.etapa !== 'Realizado');
  const fechados = () => db().eventos.filter((e) => ['Contrato assinado', 'Realizado'].includes(e.etapa));
  const recebido = () => db().pagamentos.filter((p) => p.pago).reduce((s, p) => s + p.valor, 0);
  const aReceber = () => db().pagamentos.filter((p) => !p.pago).reduce((s, p) => s + p.valor, 0);
  const atrasados = () => db().pagamentos.filter((p) => !p.pago && p.venc < HOJE);
  const pipeline = () => db().eventos.filter((e) => ['Orçamento enviado', 'Negociação'].includes(e.etapa)).reduce((s, e) => s + total(e), 0);
  const proximos = () => [...db().eventos].filter((e) => e.data >= HOJE && e.etapa !== 'Lead').sort((a, b) => a.data.localeCompare(b.data));

  const Badge = (p) => <span class={'badge e' + ETAPAS.indexOf(p.t)}>{p.t}</span>;

  const Painel = () => {
    const meses = createMemo(() => {
      const m = {};
      db().pagamentos.forEach((p) => { const k = p.venc.slice(0, 7); m[k] = (m[k] || 0) + p.valor; });
      return Object.entries(m).sort().slice(-7);
    });
    const max = () => Math.max(...meses().map((x) => x[1]), 1);
    return (
      <>
        <div class="kpis">
          <div class="kpi"><span>Recebido</span><b>{brl(recebido())}</b><small>{db().pagamentos.filter((p) => p.pago).length} parcelas pagas</small></div>
          <div class="kpi"><span>A receber</span><b>{brl(aReceber())}</b><small class={atrasados().length ? 'warn' : ''}>{atrasados().length} em atraso</small></div>
          <div class="kpi"><span>Em negociação</span><b>{brl(pipeline())}</b><small>orçamentos abertos</small></div>
          <div class="kpi"><span>Eventos fechados</span><b>{fechados().length}</b><small>{fechados().reduce((s, e) => s + e.convidados, 0)} convidados</small></div>
        </div>
        <div class="grid2">
          <section class="card">
            <h2>Vencimentos por mês</h2>
            <div class="bars" role="img" aria-label="Gráfico de barras com valores a vencer por mês">
              <For each={meses()}>{([k, v]) => (
                <div class="bar"><i style={{ height: (v / max()) * 100 + '%' }} /><em>{k.slice(5)}/{k.slice(2, 4)}</em><u>{brl(Math.round(v)).replace(',00', '')}</u></div>
              )}</For>
            </div>
          </section>
          <section class="card">
            <h2>Próximos eventos</h2>
            <ul class="list">
              <For each={proximos().slice(0, 5)}>{(e) => (
                <li><button class="row" onClick={() => go('orcamentos', e.id)}>
                  <span class="date"><b>{e.data.slice(8)}</b>{dataBR(e.data).split(' ')[1]}</span>
                  <span class="grow"><strong>{e.cliente}</strong><small>{e.tipo} · {e.convidados} convidados</small></span>
                  <Badge t={e.etapa} />
                </button></li>
              )}</For>
            </ul>
          </section>
        </div>
      </>
    );
  };

  const Funil = () => (
    <div class="kanban">
      <For each={ETAPAS}>{(et) => (
        <section class="col">
          <h2><Badge t={et} /> <small>{db().eventos.filter((e) => e.etapa === et).length}</small></h2>
          <For each={db().eventos.filter((e) => e.etapa === et)}>{(e) => (
            <article class="deal">
              <button class="link" onClick={() => go('orcamentos', e.id)}><strong>{e.cliente}</strong></button>
              <small>{e.tipo} · {dataBR(e.data)}</small>
              <div class="deal-foot"><b>{brl(total(e))}</b>
                <Show when={e.etapa !== 'Realizado'}><button class="mini" onClick={() => avancar(e)} aria-label={'Avançar ' + e.cliente}>Avançar →</button></Show>
              </div>
            </article>
          )}</For>
        </section>
      )}</For>
    </div>
  );

  const Orcamentos = () => {
    const e = current;
    const cats = () => [...new Set(menu().map((m) => m.cat))];
    const toggle = (id) => patchEv(e().id, { itens: e().itens.includes(id) ? e().itens.filter((x) => x !== id) : [...e().itens, id] });
    const num = (k) => (ev) => patchEv(e().id, { [k]: Math.max(0, parseFloat(ev.target.value) || 0) });
    const pp = () => menu().filter((m) => e().itens.includes(m.id)).reduce((s, m) => s + m.preco, 0);
    return (
      <div class="split">
        <aside class="card picker">
          <div class="head"><h2>Eventos</h2><button class="btn small" onClick={novoLead}>+ Novo lead</button></div>
          <ul class="list">
            <For each={db().eventos}>{(x) => (
              <li><button classList={{ row: true, on: x.id === e().id }} onClick={() => setSel(x.id)}>
                <span class="grow"><strong>{x.cliente}</strong><small>{x.tipo} · {x.convidados} conv.</small></span><b>{brl(total(x))}</b>
              </button></li>
            )}</For>
          </ul>
        </aside>
        <section class="card">
          <div class="head"><div><h2>{e().cliente}</h2><small>{e().tipo} · {dataBR(e().data)} · {e().local}</small></div><Badge t={e().etapa} /></div>
          <div class="fields">
            <label>Cliente<input value={e().cliente} onInput={(ev) => patchEv(e().id, { cliente: ev.target.value })} /></label>
            <label>Data<input type="date" value={e().data} onInput={(ev) => ev.target.value && patchEv(e().id, { data: ev.target.value })} /></label>
            <label>Convidados<input type="number" min="1" value={e().convidados} onInput={num('convidados')} /></label>
            <label>Desconto (%)<input type="number" min="0" max="30" value={e().desconto} onInput={num('desconto')} /></label>
            <label>Taxa de montagem (R$)<input type="number" min="0" value={e().taxa} onInput={num('taxa')} /></label>
            <label>Parcelas após entrada<input type="number" min="1" max="12" value={e().parcelas} onInput={num('parcelas')} /></label>
          </div>
          <For each={cats()}>{(c) => (
            <fieldset><legend>{c}</legend>
              <For each={menu().filter((m) => m.cat === c)}>{(m) => (
                <label class="check"><input type="checkbox" checked={e().itens.includes(m.id)} onChange={() => toggle(m.id)} /><span>{m.nome}</span><b>{brl(m.preco)}</b></label>
              )}</For>
            </fieldset>
          )}</For>
          <div class="sum">
            <div><span>Por convidado</span><b>{brl(pp())}</b></div>
            <div><span>Margem estimada</span><b>{margem(e(), menu())}%</b></div>
            <div class="big"><span>Total do orçamento</span><b>{brl(total(e()))}</b></div>
          </div>
          <div class="actions">
            <Show when={e().etapa !== 'Realizado'}><button class="btn" onClick={() => avancar(e())}>Avançar para “{ETAPAS[ETAPAS.indexOf(e().etapa) + 1]}”</button></Show>
            <Show when={['Contrato assinado', 'Realizado'].includes(e().etapa)}><button class="btn ghost" onClick={() => go('contratos', e().id)}>Ver contrato</button></Show>
          </div>
        </section>
      </div>
    );
  };

  const Contratos = () => {
    const e = () => (fechados().find((x) => x.id === sel()) || fechados()[0]);
    return (
      <div class="split">
        <aside class="card picker">
          <h2>Contratos</h2>
          <ul class="list"><For each={fechados()}>{(x) => (
            <li><button classList={{ row: true, on: x.id === e()?.id }} onClick={() => setSel(x.id)}><span class="grow"><strong>{x.cliente}</strong><small>{dataBR(x.data)}</small></span><b>{brl(total(x))}</b></button></li>
          )}</For></ul>
        </aside>
        <Show when={e()} fallback={<section class="card empty">Nenhum contrato ainda. Avance um orçamento para “Contrato assinado”.</section>}>
          <section class="card doc">
            <div class="head noprint"><h2>Contrato nº {e().id.toUpperCase()}/2026</h2><button class="btn small" onClick={() => window.print()}>Imprimir / PDF</button></div>
            <article>
              <h3>Contrato de prestação de serviços de buffet</h3>
              <p><b>CONTRATADA:</b> Sarau Buffet &amp; Eventos Ltda. (empresa fictícia).</p>
              <p><b>CONTRATANTE:</b> {e().cliente}.</p>
              <p><b>1. Objeto.</b> Buffet completo para {e().tipo.toLowerCase()} em {dataBR(e().data)}, local: {e().local}, para {e().convidados} convidados.</p>
              <p><b>2. Cardápio.</b></p>
              <ul><For each={db().menu.filter((m) => e().itens.includes(m.id))}>{(m) => <li>{m.nome}</li>}</For></ul>
              <p><b>3. Valor.</b> {brl(total(e()))}, com desconto de {e().desconto}% e taxa de montagem de {brl(e().taxa)}.</p>
              <p><b>4. Pagamento.</b></p>
              <ul><For each={db().pagamentos.filter((p) => p.evento === e().id)}>{(p) => <li>{p.desc}: {brl(p.valor)} — {dataBR(p.venc)} {p.pago ? '(pago)' : ''}</li>}</For></ul>
              <p><b>5. Cancelamento.</b> Até 60 dias antes do evento, devolução de 70% do valor pago; depois disso, a entrada não é reembolsável.</p>
              <p class="sign"><span>Contratada</span><span>{e().cliente}</span></p>
              <p class="fake">Documento de demonstração com dados fictícios.</p>
            </article>
          </section>
        </Show>
      </div>
    );
  };

  const Cardapio = () => {
    const edit = (id, p) => setDb({ ...db(), menu: menu().map((m) => (m.id === id ? { ...m, ...p } : m)) });
    return (
      <div class="grid3">
        <For each={[...new Set(menu().map((m) => m.cat))]}>{(c) => (
          <section class="card"><h2>{c}</h2>
            <For each={menu().filter((m) => m.cat === c)}>{(m) => (
              <div class="dish">
                <span class="grow"><strong>{m.nome}</strong><small>custo {brl(m.custo)} · margem {Math.round(((m.preco - m.custo) / m.preco) * 100)}%</small></span>
                <label class="price"><span class="sr">Preço de {m.nome}</span>R$<input type="number" min="0" step="0.5" value={m.preco} onInput={(ev) => edit(m.id, { preco: Math.max(0, parseFloat(ev.target.value) || 0) })} /></label>
              </div>
            )}</For>
          </section>
        )}</For>
      </div>
    );
  };

  const [filtro, setFiltro] = createSignal('todos');
  const Pagamentos = () => {
    const lista = () => db().pagamentos.filter((p) => filtro() === 'todos' || (filtro() === 'abertos' && !p.pago) || (filtro() === 'pagos' && p.pago) || (filtro() === 'atraso' && !p.pago && p.venc < HOJE)).sort((a, b) => a.venc.localeCompare(b.venc));
    const baixa = (id) => setDb({ ...db(), pagamentos: db().pagamentos.map((p) => (p.id === id ? { ...p, pago: !p.pago } : p)) });
    return (
      <section class="card">
        <div class="head"><h2>Parcelas</h2>
          <div class="seg" role="group" aria-label="Filtro">
            <For each={[['todos', 'Todas'], ['abertos', 'Abertas'], ['atraso', 'Atrasadas'], ['pagos', 'Pagas']]}>{([k, l]) => <button aria-pressed={filtro() === k} onClick={() => setFiltro(k)}>{l}</button>}</For>
          </div>
        </div>
        <div class="table" role="table" aria-label="Parcelas">
          <For each={lista()}>{(p) => {
            const ev = evById(p.evento);
            const atr = !p.pago && p.venc < HOJE;
            return (
              <div class="tr" role="row">
                <span class="grow"><strong>{ev?.cliente}</strong><small>{p.desc} · vence {dataBR(p.venc)}</small></span>
                <b>{brl(p.valor)}</b>
                <span classList={{ st: true, ok: p.pago, late: atr }}>{p.pago ? 'Pago' : atr ? 'Atrasado' : 'Aberto'}</span>
                <button class="mini" onClick={() => baixa(p.id)}>{p.pago ? 'Estornar' : 'Dar baixa'}</button>
              </div>
            );
          }}</For>
        </div>
      </section>
    );
  };

  const titulo = () => (NAV.find((n) => n[0] === view()) || NAV[0])[1];
  return (
    <div class="app">
      <nav class="side" aria-label="Principal">
        <div class="brand"><span class="logo">S</span><div><b>Sarau</b><small>buffet &amp; eventos</small></div></div>
        <For each={NAV}>{([k, l, d]) => <a href={'#' + k} classList={{ on: view() === k }} aria-current={view() === k ? 'page' : undefined}><Ico d={d} /><span>{l}</span></a>}</For>
        <button class="reset" onClick={reset}>Restaurar demo</button>
      </nav>
      <main>
        <header class="top"><div><h1>{titulo()}</h1><p>Demo com dados fictícios · salvos só neste navegador</p></div><button class="btn" onClick={novoLead}>+ Novo lead</button></header>
        <Switch>
          <Match when={view() === 'painel'}><Painel /></Match>
          <Match when={view() === 'funil'}><Funil /></Match>
          <Match when={view() === 'orcamentos'}><Orcamentos /></Match>
          <Match when={view() === 'contratos'}><Contratos /></Match>
          <Match when={view() === 'cardapio'}><Cardapio /></Match>
          <Match when={view() === 'pagamentos'}><Pagamentos /></Match>
        </Switch>
      </main>
    </div>
  );
}
render(() => <App />, document.getElementById('root'));
