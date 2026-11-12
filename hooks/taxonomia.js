#!/usr/bin/env node
// Hook PreToolUse de Claude Code que asigna el nivel de autonomia con la taxonomia.
// Antes de cada edicion o despliegue: identifica los componentes, su tipo de cambio (T),
// sus dependientes (D, con MetadataComponentDependency) y si hay cambios pendientes (C);
// toma la capacidad del perfil del agente y aplica la Tabla 4.
//   N4 -> allow   N3 -> ask   N2 -> deny despliegue   N1 -> deny edicion y despliegue
// Si no puede clasificar la accion, pide confirmacion (ask).
// Sin dependencias externas: solo Node y la Salesforce CLI (sf).

'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CONF_DIR = path.join(PROJECT, '.claude');
const LOG = path.join(PROJECT, 'registros', 'hook_decisiones.jsonl');
const MOCK = process.env.TAXONOMIA_MOCK; // solo para pruebas sin sandbox

// ---------- Tabla 4 ----------
const TABLA4 = {
  Completa: { Bajo: 'N4', Medio: 'N3', Alto: 'N2' },
  Parcial: { Bajo: 'N3', Medio: 'N2', Alto: 'N1' },
  Minima: { Bajo: 'N2', Medio: 'N1', Alto: 'N1' },
};
const PERFILES = {
  completo: 'Completa',
  sin_consulta_dependencias: 'Parcial',
  sin_herramienta_despliegue: 'Minima',
};
const ORDEN_RIESGO = { Bajo: 0, Medio: 1, Alto: 2 };

function leerJson(p, porDefecto) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch { return porDefecto; } // quita el BOM de PowerShell
}

function responder(decision, razon, extra) {
  const salida = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: razon,
    },
  };
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, JSON.stringify({ fecha: new Date().toISOString(), decision, razon, ...extra }) + '\n');
  } catch { /* el registro no debe bloquear la decision */ }
  process.stdout.write(JSON.stringify(salida));
  process.exit(0);
}

function silencio() { process.exit(0); } // sin decision: sigue el flujo normal de permisos

// ---------- Consultas a la organizacion ----------
const config = leerJson(path.join(CONF_DIR, 'taxonomia.json'), {});
let ORG = config.org || ''; // vacio = la organizacion por defecto de la CLI; si la accion dice --target-org, se usa esa

function soql(query) {
  if (MOCK) {
    const mock = leerJson(MOCK, {});
    for (const [clave, filas] of Object.entries(mock)) if (query.includes(clave)) return filas;
    return [];
  }
  const cmd = `sf data query --query "${query}" --use-tooling-api${ORG ? ' --target-org ' + ORG : ''} --json`;
  let out;
  try {
    out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 });
  } catch (e) {
    // sf devuelve el error en JSON por stdout: se muestra ese mensaje y no el comando
    let msg = (e.stderr || e.message || '').toString();
    try { const j = JSON.parse(e.stdout); msg = `${j.name || ''}: ${j.message || msg}`; } catch { /* nada */ }
    throw new Error(msg.trim());
  }
  const json = JSON.parse(out);
  if (json.status !== 0) throw new Error(json.message || 'Error en sf data query');
  return json.result.records || [];
}

const esc = (s) => String(s).replace(/'/g, "\\'");

// Devuelve { existe, dependientes } para un componente { tipo, nombre }
function consultarComponente(c) {
  if (c.tipo === 'CustomField') {
    const [obj, campo] = c.nombre.split('.');
    let tabla = obj;
    if (obj.endsWith('__c')) {
      const o = soql(`SELECT Id FROM CustomObject WHERE DeveloperName = '${esc(obj.replace(/__c$/, ''))}'`);
      if (!o.length) return { existe: false, dependientes: 0 };
      tabla = o[0].Id;
    }
    const f = soql(`SELECT Id FROM CustomField WHERE TableEnumOrId = '${esc(tabla)}' AND DeveloperName = '${esc(campo.replace(/__c$/, ''))}'`);
    if (!f.length) return { existe: false, dependientes: 0 };
    const d = soql(`SELECT MetadataComponentName, MetadataComponentType FROM MetadataComponentDependency WHERE RefMetadataComponentId = '${f[0].Id}'`);
    return { existe: true, dependientes: d.length, lista: d.map((r) => `${r.MetadataComponentType}:${r.MetadataComponentName}`) };
  }
  if (c.tipo === 'ApexClass') {
    const a = soql(`SELECT Id FROM ApexClass WHERE Name = '${esc(c.nombre)}'`);
    if (!a.length) return { existe: false, dependientes: 0 };
    const d = soql(`SELECT MetadataComponentName, MetadataComponentType FROM MetadataComponentDependency WHERE RefMetadataComponentId = '${a[0].Id}'`);
    return { existe: true, dependientes: d.length, lista: d.map((r) => `${r.MetadataComponentType}:${r.MetadataComponentName}`) };
  }
  if (c.tipo === 'Flow') {
    const f = soql(`SELECT Id, ActiveVersionId, LatestVersionId FROM FlowDefinition WHERE DeveloperName = '${esc(c.nombre)}'`);
    if (!f.length) return { existe: false, dependientes: 0 };
    // MetadataComponentDependency no deja filtrar por nombre: se busca por los Id del flujo y de sus versiones
    const ids = [f[0].Id, f[0].ActiveVersionId, f[0].LatestVersionId].filter(Boolean).map((x) => `'${x}'`).join(', ');
    const d = soql(`SELECT MetadataComponentName, MetadataComponentType FROM MetadataComponentDependency WHERE RefMetadataComponentId IN (${ids})`);
    return { existe: true, dependientes: d.length, lista: d.map((r) => `${r.MetadataComponentType}:${r.MetadataComponentName}`) };
  }
  return null; // tipo no soportado
}

// ---------- Identificar componentes ----------
// Carpetas de metadatos del proyecto (packageDirectories de sfdx-project.json), por ejemplo force-app o unpackaged
const PAQUETES = ((leerJson(path.join(PROJECT, 'sfdx-project.json'), {}).packageDirectories) || [])
  .map((d) => String(d.path || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, ''))
  .filter(Boolean);
if (!PAQUETES.length) PAQUETES.push('force-app');
const esDePaquete = (ruta) => {
  const r = ruta.replace(/\\/g, '/');
  return PAQUETES.some((p) => r === p || r.startsWith(p + '/') || r.includes('/' + p + '/') || r.endsWith('/' + p));
};

function componenteDeRuta(ruta) {
  const p = ruta.replace(/\\/g, '/');
  let m = p.match(/objects\/([^/]+)\/fields\/([^/]+)\.field-meta\.xml$/);
  if (m) return { tipo: 'CustomField', nombre: `${m[1]}.${m[2]}` };
  m = p.match(/flows\/([^/]+)\.flow-meta\.xml$/);
  if (m) return { tipo: 'Flow', nombre: m[1] };
  m = p.match(/classes\/([^/]+)\.cls(-meta\.xml)?$/);
  if (m) return { tipo: 'ApexClass', nombre: m[1] };
  return { tipo: 'Desconocido', nombre: p };
}

function componentesDeCarpeta(dir) {
  const abs = path.isAbsolute(dir) ? dir : path.join(PROJECT, dir);
  const res = [];
  const recorrer = (d) => {
    let st; try { st = fs.statSync(d); } catch { return; }
    if (st.isFile()) { res.push(componenteDeRuta(d)); return; }
    for (const h of fs.readdirSync(d)) recorrer(path.join(d, h));
  };
  recorrer(abs);
  return res.filter((c) => !c.nombre.endsWith('.gitkeep'));
}

function componentesDeManifiesto(archivo) {
  const abs = path.isAbsolute(archivo) ? archivo : path.join(PROJECT, archivo);
  let xml;
  try { xml = fs.readFileSync(abs, 'utf8'); } catch { return [{ tipo: 'Desconocido', nombre: archivo }]; } // no se pudo leer el manifiesto
  xml = xml.replace(/^\uFEFF/, '');
  const res = [];
  for (const bloque of xml.split('<types>').slice(1)) {
    const tipo = (bloque.match(/<name>([^<]+)<\/name>/) || [])[1];
    for (const m of bloque.matchAll(/<members>([^<]+)<\/members>/g)) {
      res.push(m[1] === '*' ? { tipo: 'Desconocido', nombre: `${tipo}:*` } : { tipo, nombre: m[1] });
    }
  }
  return res;
}

function componenteDeMetadata(valor) {
  const [tipo, ...resto] = valor.split(':');
  const nombre = resto.join(':');
  if (!nombre || nombre.includes('*')) return { tipo: 'Desconocido', nombre: valor };
  return { tipo, nombre };
}

// Lee los valores de una opcion de la linea de comandos (--opcion a b --otra ...)
function valoresOpcion(tokens, nombres) {
  const res = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    for (const n of nombres) {
      if (t === n) {
        for (let j = i + 1; j < tokens.length && !tokens[j].startsWith('-'); j++) res.push(...tokens[j].split(','));
      } else if (t.startsWith(n + '=')) res.push(...t.slice(n.length + 1).split(','));
    }
  }
  return res.map((v) => v.replace(/^["']|["']$/g, ''));
}

// ---------- Clasificar la accion ----------
// Reemplaza las variables que el mismo comando define, por ejemplo $d = "C:\\..." (PowerShell) o D="..." (Bash)
function expandirVariables(cmd) {
  const vars = {};
  for (const m of cmd.matchAll(/(?:^|[;\n&]\s*)\$?([A-Za-z_]\w*)\s*=\s*("[^"]*"|'[^']*'|[^\s;&|]+)/g)) {
    vars[m[1].toLowerCase()] = m[2].replace(/^["']|["']$/g, '');
  }
  return cmd.replace(/\$\{?([A-Za-z_]\w*)\}?/g, (todo, n) => (n.toLowerCase() in vars ? vars[n.toLowerCase()] : todo));
}

function analizarComando(cmdOriginal) {
  const cmd = expandirVariables(cmdOriginal);
  // Estos subcomandos solo consultan o cancelan: no modifican la organizacion
  if (/\bsf\s+project\s+deploy\s+(report|preview|cancel)\b/.test(cmd) && !/\bsf\s+project\s+deploy\s+(start|validate|quick|resume)\b/.test(cmd)) return null;
  // Solo interesan los comandos que modifican la organizacion
  const m = cmd.match(/\bsf\s+(project\s+deploy|project\s+delete|deploy)\b[^&|;\n]*/);
  if (!m) return null;
  const tokens = m[0].match(/"[^"]*"|'[^']*'|\S+/g) || [];
  const esBorrado = /project\s+delete/.test(m[0]);
  const items = [];
  const org = valoresOpcion(tokens, ['--target-org', '-o'])[0];
  if (org) ORG = org; // se consulta la misma organizacion a la que va el despliegue
  for (const v of valoresOpcion(tokens, ['--metadata', '-m'])) items.push({ ...componenteDeMetadata(v), t: esBorrado ? 'T3' : null });
  for (const v of valoresOpcion(tokens, ['--source-dir', '-d', '--source-path', '-p'])) for (const c of componentesDeCarpeta(v)) items.push({ ...c, t: esBorrado ? 'T3' : null });
  for (const v of valoresOpcion(tokens, ['--manifest', '-x'])) for (const c of componentesDeManifiesto(v)) items.push({ ...c, t: null });
  for (const v of valoresOpcion(tokens, ['--pre-destructive-changes', '--post-destructive-changes'])) for (const c of componentesDeManifiesto(v)) items.push({ ...c, t: 'T3' });
  for (const v of valoresOpcion(tokens, ['--metadata-dir'])) {
    const dir = path.isAbsolute(v) ? v : path.join(PROJECT, v);
    let archivos = []; try { archivos = fs.readdirSync(dir); } catch { items.push({ tipo: 'Desconocido', nombre: v, t: null }); }
    for (const a of archivos) {
      if (a === 'package.xml') for (const c of componentesDeManifiesto(path.join(dir, a))) items.push({ ...c, t: null });
      else if (/^destructiveChanges.*\.xml$/i.test(a)) for (const c of componentesDeManifiesto(path.join(dir, a))) items.push({ ...c, t: 'T3' });
    }
  }
  return items;
}

function analizarMcp(input) {
  for (const k of ['usernameOrAlias', 'targetOrg', 'target_org', 'org', 'username']) if (typeof input[k] === 'string' && input[k]) { ORG = input[k]; break; }
  // No se conoce de antemano el formato de deploy_metadata: se buscan rutas y nombres Tipo:Nombre
  const items = [];
  const visitar = (v) => {
    if (typeof v === 'string') {
      if (esDePaquete(v) || /\.xml$|\.cls$/.test(v)) {
        if (/\.xml$/.test(v) && !/-meta\.xml$/.test(v) && /package|manifest|destructive/i.test(path.basename(v))) {
          for (const c of componentesDeManifiesto(v)) items.push({ ...c, t: /destructive/i.test(path.basename(v)) ? 'T3' : null });
        } else for (const c of componentesDeCarpeta(v)) items.push({ ...c, t: null });
      } else if (/^[A-Za-z]+:[^\s]+$/.test(v)) items.push({ ...componenteDeMetadata(v), t: null });
    } else if (Array.isArray(v)) v.forEach(visitar);
    else if (v && typeof v === 'object') Object.values(v).forEach(visitar);
  };
  visitar(input);
  return items;
}

function riesgo(t, d, c) {
  if (t === 'T3' || d === 'D2' || c === 'C1') return 'Alto';
  if (d === 'D1') return 'Medio';
  return 'Bajo';
}

function main() {
  let entrada = '';
  try { entrada = fs.readFileSync(0, 'utf8'); } catch { return silencio(); }
  const ev = JSON.parse(entrada || '{}');
  // Registro de cada llamada, aunque no haya decision: sirve para saber si el hook corre
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(path.join(path.dirname(LOG), 'hook_llamadas.jsonl'),
      JSON.stringify({ fecha: new Date().toISOString(), herramienta: ev.tool_name, entrada: ev.tool_input }) + '\n');
  } catch { /* nada */ }
  const herramienta = ev.tool_name || '';
  const input = ev.tool_input || {};

  let accion; let items;
  if (herramienta === 'Bash' || herramienta === 'PowerShell') {
    items = analizarComando(input.command || '');
    if (items === null) return silencio();
    accion = 'desplegar';
  } else if (/^mcp__.+__deploy_metadata$/.test(herramienta)) { // cualquier nombre del servidor MCP
    items = analizarMcp(input);
    accion = 'desplegar';
  } else if (herramienta === 'Edit' || herramienta === 'Write' || herramienta === 'MultiEdit') {
    const ruta = input.file_path || '';
    if (!esDePaquete(ruta)) return silencio(); // solo archivos de metadatos del proyecto
    const existe = fs.existsSync(ruta);
    items = [{ ...componenteDeRuta(ruta), t: existe ? null : 'T1' }];
    accion = 'editar';
  } else return silencio();

  // El perfil se deduce de .claude/settings.local.json (el archivo de perfil copiado de perfiles/)
  const negadas = ((leerJson(path.join(CONF_DIR, 'settings.local.json'), {}).permissions || {}).deny) || [];
  const perfilNombre = negadas.includes('mcp__salesforce__deploy_metadata') ? 'sin_herramienta_despliegue'
    : negadas.includes('mcp__salesforce__run_soql_query') ? 'sin_consulta_dependencias' : 'completo';
  const capacidad = PERFILES[perfilNombre];
  const pendientes = leerJson(path.join(CONF_DIR, 'cambios_pendientes.json'), { componentes: [] }).componentes || [];
  const base = { condicion: (config.condicion || 'B').toUpperCase(), herramienta, accion, perfil: perfilNombre, entrada: input };

  // Condicion A del experimento (autonomia uniforme): todo como N4, pero se registra igual
  if ((config.condicion || 'B').toUpperCase() === 'A') {
    return responder('allow', 'Condicion A (autonomia uniforme): se permite como N4 sin aplicar la taxonomia.', { ...base, nivel: 'N4', condicion: 'A' });
  }
  if (!capacidad) return responder('ask', `Taxonomia: perfil "${perfilNombre}" desconocido; se pide confirmacion.`, base);
  if (!items.length) return responder('ask', 'Taxonomia: no se pudo saber que componentes cambia esta accion; se pide confirmacion.', base);

  const detalle = [];
  let peor = 'Bajo';
  let duda = null; // algo que no se pudo clasificar
  for (const it of items) {
    const cPend = pendientes.includes(`${it.tipo}:${it.nombre}`) ? 'C1' : 'C0';
    // Si ya se sabe que el riesgo es alto (se elimina o hay un cambio pendiente), no hace falta contar dependientes
    if (it.t === 'T3' || cPend === 'C1') {
      peor = 'Alto';
      detalle.push({ componente: `${it.tipo}:${it.nombre}`, T: it.t || 'T2', D: 'sin consultar', dependientes: null, C: cPend, riesgo: 'Alto' });
      continue;
    }
    if (it.tipo === 'Desconocido') { duda = duda || `no se puede clasificar ${it.nombre}`; continue; }
    let info;
    try { info = consultarComponente(it); } catch (e) {
      duda = duda || `fallo la consulta de dependencias (${e.message.slice(0, 300)})`; continue;
    }
    if (!info) { duda = duda || `el tipo ${it.tipo} no esta soportado`; continue; }
    const t = it.t || (info.existe ? 'T2' : 'T1');
    const n = info.existe ? info.dependientes : 0;
    const d = n === 0 ? 'D0' : n <= 10 ? 'D1' : 'D2';
    const c = pendientes.includes(`${it.tipo}:${it.nombre}`) ? 'C1' : 'C0';
    const r = riesgo(t, d, c);
    if (ORDEN_RIESGO[r] > ORDEN_RIESGO[peor]) peor = r;
    detalle.push({ componente: `${it.tipo}:${it.nombre}`, T: t, D: d, dependientes: n, C: c, riesgo: r, lista: info.lista });
  }

  // Con riesgo alto ya conocido el nivel no puede bajar mas; si no, lo que no se pudo clasificar se pregunta
  if (duda && peor !== 'Alto') return responder('ask', `Taxonomia: ${duda}; se pide confirmacion.`, { ...base, items });
  const nivel = TABLA4[capacidad][peor];
  const resumen = detalle.map((x) => `${x.componente} (${x.T}, ${x.dependientes === null ? x.D : x.D + '=' + x.dependientes}, ${x.C})`).join('; ');
  const razon = `Taxonomia: capacidad ${capacidad}, riesgo ${peor} -> ${nivel}. ${resumen}.`;
  const extra = { ...base, capacidad, riesgo: peor, nivel, detalle };

  if (accion === 'editar') {
    if (nivel === 'N1') return responder('deny', `${razon} En N1 el agente solo informa: no puede editar.`, extra);
    return responder('allow', `${razon} Puede preparar el cambio.`, extra);
  }
  if (nivel === 'N4') return responder('allow', `${razon} Despliega e informa.`, extra);
  if (nivel === 'N3') return responder('ask', `${razon} El despliegue necesita tu aprobacion.`, extra);
  return responder('deny', `${razon} En ${nivel} el agente no despliega: la persona decide y despliega.`, extra);
}

try { main(); } catch (e) {
  responder('ask', `Taxonomia: error del hook (${String(e.message).slice(0, 120)}); se pide confirmacion.`, {});
}
