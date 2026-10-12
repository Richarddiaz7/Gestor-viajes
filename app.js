// ============================================================
// GESTOR DE VIAJES - Fase 3A (OCR del cartel Verdi)
// ============================================================

const PALABRA_MAESTRA = 'VERDI2026';

const LS_PERFILES       = 'gestor_viajes_perfiles_v2';
const LS_ACTIVO         = 'gestor_viajes_perfil_activo_v2';
const LS_ULTIMO_DESBLOQ = 'gestor_viajes_ultimo_desbloqueo';
const DB_NAME           = 'gestor_viajes_db';
const DB_VERSION        = 1;
const STORE_VIAJES      = 'viajes';

let perfiles = [];
let perfilActivo = null;
let perfilPendiente = null;
let modoActual = null;
let tasaFormulario = 0;
let blobCartel = null;
let blobPago = null;
let db = null;

// OCR
let tesseractCargado = false;
let ocrEnProgreso = false;

// ============================================================
// DOM
// ============================================================
const screenPerfiles   = document.getElementById('screen-perfiles');
const screenPin        = document.getElementById('screen-pin');
const screenRecuperar  = document.getElementById('screen-recuperar');
const screenMenu       = document.getElementById('screen-menu');
const screenForm       = document.getElementById('screen-form');
const screenHistorial  = document.getElementById('screen-historial');

const listaPerfiles    = document.getElementById('lista-perfiles');
const inputNombre      = document.getElementById('input-nombre-perfil');
const inputTelefono    = document.getElementById('input-telefono-perfil');
const inputPinCrear    = document.getElementById('input-pin-perfil');
const btnCrearPerfil   = document.getElementById('btn-crear-perfil');
const msgPerfil        = document.getElementById('msg-perfil');

const pinNombrePerfil  = document.getElementById('pin-nombre-perfil');
const inputPinLogin    = document.getElementById('input-pin-login');
const btnVerificarPin  = document.getElementById('btn-verificar-pin');
const btnOlvidePin     = document.getElementById('btn-olvide-pin');
const btnVolverPerfiles= document.getElementById('btn-volver-perfiles');
const msgPin           = document.getElementById('msg-pin');

const inputPalabraMaestra = document.getElementById('input-palabra-maestra');
const inputNuevoPin       = document.getElementById('input-nuevo-pin');
const btnResetearPin      = document.getElementById('btn-resetear-pin');
const btnCancelarRecuperar= document.getElementById('btn-cancelar-recuperar');
const msgRecuperar        = document.getElementById('msg-recuperar');

const nombrePerfilUI   = document.getElementById('nombre-perfil-activo');
const btnCambiarPerfil = document.getElementById('btn-cambiar-perfil');
const btnVerHistorial  = document.getElementById('btn-ver-historial');

const formTitulo      = document.getElementById('form-titulo');
const formTasaEl      = document.getElementById('form-tasa');
const btnRefreshTasa  = document.getElementById('btn-refresh-tasa');
const btnVolverMenu   = document.getElementById('btn-volver-menu');
const formOrigen      = document.getElementById('form-origen');
const formDestino     = document.getElementById('form-destino');
const formId          = document.getElementById('form-id');
const formUsd         = document.getElementById('form-usd');
const formVes         = document.getElementById('form-ves');
const formEmpresaUsd  = document.getElementById('form-empresa-usd');
const formEmpresaVes  = document.getElementById('form-empresa-ves');
const formMioUsd      = document.getElementById('form-mio-usd');
const formMioVes      = document.getElementById('form-mio-ves');
const formPago        = document.getElementById('form-pago');
const formPlantillaContainer = document.getElementById('form-plantilla-container');
const formPlantilla   = document.getElementById('form-plantilla');
const formDesglose    = document.getElementById('form-desglose');
const btnVistaPrevia  = document.getElementById('btn-vista-previa');
const previewContainer= document.getElementById('preview-container');
const previewTexto    = document.getElementById('preview-texto');
const btnCopiarMensaje= document.getElementById('btn-copiar-mensaje');
const btnEnviarWA     = document.getElementById('btn-enviar-wa');

const btnCamCartel    = document.getElementById('btn-cam-cartel');
const btnGalCartel    = document.getElementById('btn-gal-cartel');
const fileCartel      = document.getElementById('file-cartel');
const fileCartelGal   = document.getElementById('file-cartel-gal');
const prevCartel      = document.getElementById('prev-cartel');
const btnQuitarCartel = document.getElementById('btn-quitar-cartel');
const btnLeerCartel   = document.getElementById('btn-leer-cartel');
const ocrStatus       = document.getElementById('ocr-status');

const btnCamPago      = document.getElementById('btn-cam-pago');
const btnGalPago      = document.getElementById('btn-gal-pago');
const filePago        = document.getElementById('file-pago');
const filePagoGal     = document.getElementById('file-pago-gal');
const prevPago        = document.getElementById('prev-pago');
const btnQuitarPago   = document.getElementById('btn-quitar-pago');

const btnVolverMenuHist = document.getElementById('btn-volver-menu-hist');
const btnExportarCSV    = document.getElementById('btn-exportar-csv');
const histRango         = document.getElementById('hist-rango');
const histModo          = document.getElementById('hist-modo');
const histLista         = document.getElementById('hist-lista');
const histTotalViajes   = document.getElementById('hist-total-viajes');
const histTotalUSD      = document.getElementById('hist-total-usd');
const histTotalVES      = document.getElementById('hist-total-ves');
const histMioUSD        = document.getElementById('hist-mio-usd');
const histMioVES        = document.getElementById('hist-mio-ves');
const histEmpresaUSD    = document.getElementById('hist-empresa-usd');

const TITULOS_MODO = {
  app:      '📱 Viaje x App',
  manual:   '🚕 Paseo Manual',
  asignado: '📋 Asignado por Empresa'
};

const TIPOS_TEXTO = {
  app:      'Captado app 70/30',
  manual:   'Captado por mi 70/30',
  asignado: 'Asignado'
};

// ============================================================
// HASH
// ============================================================
async function hashearPin(pin) {
  const buffer = new TextEncoder().encode(pin + '_gv_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// PERSISTENCIA
// ============================================================
function cargarDatos() {
  try {
    perfiles = JSON.parse(localStorage.getItem(LS_PERFILES)) || [];
  } catch (e) { perfiles = []; }
  perfilActivo = localStorage.getItem(LS_ACTIVO) || null;
}

function guardarPerfiles() {
  localStorage.setItem(LS_PERFILES, JSON.stringify(perfiles));
}

function guardarPerfilActivo() {
  if (perfilActivo) localStorage.setItem(LS_ACTIVO, perfilActivo);
  else localStorage.removeItem(LS_ACTIVO);
}

function hoyString() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function yaDesbloqueoHoy() {
  const ultimo = localStorage.getItem(LS_ULTIMO_DESBLOQ);
  return ultimo === (perfilActivo + '|' + hoyString());
}

function marcarDesbloqueoHoy() {
  if (perfilActivo) localStorage.setItem(LS_ULTIMO_DESBLOQ, perfilActivo + '|' + hoyString());
}

function limpiarDesbloqueo() {
  localStorage.removeItem(LS_ULTIMO_DESBLOQ);
}

// ============================================================
// INDEXEDDB
// ============================================================
function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_VIAJES)) {
        const store = database.createObjectStore(STORE_VIAJES, {
          keyPath: 'id', autoIncrement: true
        });
        store.createIndex('fecha', 'fecha', { unique: false });
        store.createIndex('perfil', 'perfil', { unique: false });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e);
  });
}

function guardarViaje(viaje) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIAJES, 'readwrite');
    const req = tx.objectStore(STORE_VIAJES).add(viaje);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function obtenerViajes() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIAJES, 'readonly');
    const req = tx.objectStore(STORE_VIAJES).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function eliminarViaje(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIAJES, 'readwrite');
    const req = tx.objectStore(STORE_VIAJES).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ============================================================
// MENSAJES Y PANTALLAS
// ============================================================
function mostrarMensaje(el, texto, esError = false) {
  el.textContent = texto;
  el.className = 'text-center text-xs mt-2 ' + (esError ? 'text-red-600' : 'text-green-600');
  if (!texto) el.className = 'text-center text-xs';
}

function mostrarPantalla(cual) {
  screenPerfiles.classList.add('hidden');
  screenPin.classList.add('hidden');
  screenRecuperar.classList.add('hidden');
  screenMenu.classList.add('hidden');
  screenForm.classList.add('hidden');
  screenHistorial.classList.add('hidden');

  if (cual === 'perfiles')  screenPerfiles.classList.remove('hidden');
  if (cual === 'pin')       screenPin.classList.remove('hidden');
  if (cual === 'recuperar') screenRecuperar.classList.remove('hidden');
  if (cual === 'form')      screenForm.classList.remove('hidden');
  if (cual === 'historial') screenHistorial.classList.remove('hidden');
  if (cual === 'menu') {
    screenMenu.classList.remove('hidden');
    nombrePerfilUI.textContent = perfilActivo || '—';
  }
}

// ============================================================
// PERFILES
// ============================================================
function renderizarPerfiles() {
  listaPerfiles.innerHTML = '';
  if (perfiles.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'text-center text-sm text-gray-500 py-4';
    vacio.textContent = 'Aún no hay perfiles guardados';
    listaPerfiles.appendChild(vacio);
    return;
  }
  perfiles.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm p-3 flex justify-between items-center';
    const info = document.createElement('div');
    info.className = 'flex-1';
    info.innerHTML = `
      <p class="font-semibold text-gray-800">${p.nombre}</p>
      ${p.telefono ? `<p class="text-xs text-gray-500">${p.telefono}</p>` : ''}
    `;
    const btnUsar = document.createElement('button');
    btnUsar.textContent = 'Usar';
    btnUsar.className = 'bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700';
    btnUsar.addEventListener('click', () => pedirPinPara(p.nombre));
    const btnBorrar = document.createElement('button');
    btnBorrar.textContent = '🗑';
    btnBorrar.className = 'ml-2 text-gray-400 hover:text-red-600 px-2';
    btnBorrar.addEventListener('click', () => eliminarPerfil(idx));
    const acciones = document.createElement('div');
    acciones.className = 'flex items-center';
    acciones.appendChild(btnUsar);
    acciones.appendChild(btnBorrar);
    card.appendChild(info);
    card.appendChild(acciones);
    listaPerfiles.appendChild(card);
  });
}

async function crearPerfil() {
  const nombre   = inputNombre.value.trim();
  const telefono = inputTelefono.value.trim();
  const pin      = inputPinCrear.value.trim();

  if (!nombre) { mostrarMensaje(msgPerfil, '⚠️ El nombre es obligatorio', true); return; }
  if (!/^\d{4}$/.test(pin)) { mostrarMensaje(msgPerfil, '⚠️ El PIN debe ser de 4 dígitos', true); return; }
  if (perfiles.some(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
    mostrarMensaje(msgPerfil, '⚠️ Ya existe un perfil con ese nombre', true); return;
  }

  const pinHash = await hashearPin(pin);
  perfiles.push({ nombre, telefono, pinHash });
  guardarPerfiles();
  inputNombre.value = ''; inputTelefono.value = ''; inputPinCrear.value = '';
  mostrarMensaje(msgPerfil, '✅ Perfil creado');
  renderizarPerfiles();
  setTimeout(() => mostrarMensaje(msgPerfil, ''), 2000);
}

function eliminarPerfil(idx) {
  if (!confirm(`¿Eliminar el perfil "${perfiles[idx].nombre}"?`)) return;
  const eraActivo = perfiles[idx].nombre === perfilActivo;
  perfiles.splice(idx, 1);
  guardarPerfiles();
  if (eraActivo) { perfilActivo = null; guardarPerfilActivo(); limpiarDesbloqueo(); }
  renderizarPerfiles();
}

// ============================================================
// PIN
// ============================================================
function pedirPinPara(nombre) {
  perfilPendiente = nombre;
  pinNombrePerfil.textContent = 'Perfil: ' + nombre;
  inputPinLogin.value = '';
  mostrarMensaje(msgPin, '');
  mostrarPantalla('pin');
  setTimeout(() => inputPinLogin.focus(), 100);
}

async function verificarPin() {
  const pin = inputPinLogin.value.trim();
  if (!/^\d{4}$/.test(pin)) { mostrarMensaje(msgPin, '⚠️ Ingresa 4 dígitos', true); return; }
  const perfil = perfiles.find(p => p.nombre === perfilPendiente);
  if (!perfil) { mostrarMensaje(msgPin, '⚠️ Perfil no encontrado', true); return; }
  const hash = await hashearPin(pin);
  if (hash !== perfil.pinHash) {
    mostrarMensaje(msgPin, '❌ PIN incorrecto', true);
    inputPinLogin.value = '';
    return;
  }
  perfilActivo = perfil.nombre;
  guardarPerfilActivo();
  marcarDesbloqueoHoy();
  perfilPendiente = null;
  inputPinLogin.value = '';
  mostrarMensaje(msgPin, '');
  mostrarPantalla('menu');
}

function irARecuperar() {
  inputPalabraMaestra.value = '';
  inputNuevoPin.value = '';
  mostrarMensaje(msgRecuperar, '');
  mostrarPantalla('recuperar');
}

async function resetearPin() {
  const palabra = inputPalabraMaestra.value.trim();
  const nuevoPin = inputNuevoPin.value.trim();
  if (palabra !== PALABRA_MAESTRA) { mostrarMensaje(msgRecuperar, '❌ Palabra maestra incorrecta', true); return; }
  if (!/^\d{4}$/.test(nuevoPin)) { mostrarMensaje(msgRecuperar, '⚠️ El nuevo PIN debe ser de 4 dígitos', true); return; }
  const perfil = perfiles.find(p => p.nombre === perfilPendiente);
  if (!perfil) { mostrarMensaje(msgRecuperar, '⚠️ Perfil no encontrado', true); return; }
  perfil.pinHash = await hashearPin(nuevoPin);
  guardarPerfiles();
  mostrarMensaje(msgRecuperar, '✅ PIN actualizado');
  setTimeout(() => {
    perfilPendiente = null;
    mostrarPantalla('perfiles');
    renderizarPerfiles();
  }, 1500);
}

// ============================================================
// FORMULARIO
// ============================================================
async function obtenerTasa() {
  try {
    const res = await fetch('https://allratestoday.com/api/open/central-bank/bcv?source=USD&target=VES');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const precio = data?.rate ?? null;
    if (!precio || isNaN(precio)) throw new Error('Tasa no encontrada');
    return parseFloat(precio);
  } catch (e) {
    console.error('Error tasa:', e);
    return 0;
  }
}

async function abrirFormulario(modo) {
  modoActual = modo;
  formTitulo.textContent = TITULOS_MODO[modo] || 'Nuevo viaje';

  formOrigen.value = '';
  formDestino.value = '';
  formId.value = '';
  formUsd.value = '';
  formVes.value = '';
  formPlantilla.value = '';
  formPago.value = 'PAGO MOVIL';
  previewContainer.classList.add('hidden');

  limpiarImagen('cartel');
  limpiarImagen('pago');

  if (modo === 'asignado') {
    formPlantillaContainer.classList.remove('hidden');
    formDesglose.classList.add('hidden');
  } else {
    formPlantillaContainer.classList.add('hidden');
    formDesglose.classList.remove('hidden');
  }

  mostrarPantalla('form');

  formTasaEl.value = '0.00';
  const tasa = await obtenerTasa();
  if (tasa > 0) {
    tasaFormulario = tasa;
    formTasaEl.value = tasa.toFixed(2);
    recalcularFormulario();
  }
}

function recalcularFormulario() {
  const usd = parseFloat(formUsd.value) || 0;
  tasaFormulario = parseFloat(formTasaEl.value) || 0;

  if (tasaFormulario > 0) {
    const ves = usd * tasaFormulario;
    const empresaUsd = usd * 0.70;
    const empresaVes = empresaUsd * tasaFormulario;
    const mioUsd     = usd * 0.30;
    const mioVes     = mioUsd * tasaFormulario;

    formVes.value = ves.toFixed(2);
    formEmpresaUsd.textContent = '$' + empresaUsd.toFixed(2);
    formEmpresaVes.textContent = 'Bs ' + empresaVes.toFixed(2);
    formMioUsd.textContent     = '$' + mioUsd.toFixed(2);
    formMioVes.textContent     = 'Bs ' + mioVes.toFixed(2);
  } else {
    formVes.value = '';
    formEmpresaUsd.textContent = '$0.00';
    formEmpresaVes.textContent = 'Bs 0.00';
    formMioUsd.textContent     = '$0.00';
    formMioVes.textContent     = 'Bs 0.00';
  }
  previewContainer.classList.add('hidden');
}

function construirMensaje() {
  const nombre  = perfilActivo || '[Conductor]';
  const tipo    = TIPOS_TEXTO[modoActual] || '';
  const origen  = formOrigen.value.trim()  || '[Origen]';
  const destino = formDestino.value.trim() || '[Destino]';
  const id      = formId.value.trim()      || '[ID del viaje]';
  const pago    = formPago.value;
  const usd     = parseFloat(formUsd.value) || 0;
  const ves     = usd * tasaFormulario;

  let adjuntos = 'ID + captura del cartel';
  if (pago === 'PAGO MOVIL' || pago === 'PUNTO DE VENTA') {
    adjuntos = 'ID + captura del cartel + captura del pago móvil';
  } else if (pago === 'EFECTIVO USD' || pago === 'EFECTIVO VES') {
    adjuntos = 'ID + captura del cartel + foto del efectivo';
  }

  let mensaje = 'REPORTE DE TRASLADO\n';
  if (modoActual !== 'asignado') mensaje += '70/30\n';
  mensaje += 'Conductor: [' + nombre + ']\n';
  mensaje += 'Tipo: [' + tipo + ']\n';
  mensaje += 'Origen: [' + origen + ']\n';
  mensaje += 'Destino: [' + destino + ']\n';
  mensaje += 'ID del viaje: [' + id + ']\n';
  mensaje += 'Monto USD: $' + usd.toFixed(2) + '\n';
  if (tasaFormulario > 0) {
    mensaje += 'Tasa BCV: ' + tasaFormulario.toFixed(2) + ' Bs/$\n';
    mensaje += 'Monto VES: Bs ' + ves.toFixed(2) + '\n';
  }
  mensaje += 'Pago: ' + pago + '\n';
  mensaje += 'Adjuntos: ' + adjuntos;

  if (modoActual === 'asignado' && formPlantilla.value.trim()) {
    mensaje += '\n\n--- PLANTILLA ORIGINAL ---\n';
    mensaje += formPlantilla.value.trim();
  }
  return mensaje;
}

// ============================================================
// OCR DEL CARTEL
// ============================================================
async function cargarTesseract() {
  if (tesseractCargado) return;
  if (typeof Tesseract !== 'undefined') { tesseractCargado = true; return; }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => { tesseractCargado = true; resolve(); };
    script.onerror = () => reject(new Error('No se pudo cargar Tesseract'));
    document.head.appendChild(script);
  });
}

function mostrarEstadoOCR(texto, tipo = 'info') {
  ocrStatus.textContent = texto;
  ocrStatus.classList.remove('hidden');
  const colores = {
    info:    'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    error:   'bg-yellow-50 text-yellow-800 border-yellow-200'
  };
  ocrStatus.className = 'text-xs p-2 rounded border mt-2 ' + (colores[tipo] || colores.info);
}

function ocultarEstadoOCR() {
  ocrStatus.classList.add('hidden');
  ocrStatus.textContent = '';
}

function resaltarCampo(campo) {
  campo.classList.add('border-green-500', 'bg-green-50');
  setTimeout(() => {
    campo.classList.remove('border-green-500', 'bg-green-50');
  }, 2500);
}

function parsearCartel(texto) {
  const limpio = texto.replace(/[^\S\n]+/g, ' ');
  console.log('📝 Texto OCR (normalizado):', limpio);

  // ID: patrón #XXXXXXXXX (9 dígitos según ejemplos)
  let id = null;
  const idMatch = limpio.match(/#\s*(\d{7,11})/);
  if (idMatch) {
    id = idMatch[1];
  } else {
    const ids = limpio.match(/\b\d{8,10}\b/g);
    if (ids && ids.length > 0) id = ids[0];
  }

  // Monto USD
  let usd = null;

  // 1) Buscar en la línea que dice "recoja" (más fiable)
  const lineas = limpio.split('\n');
  for (const linea of lineas) {
    if (/recoja|efectivo/i.test(linea)) {
      const m = linea.match(/\$\s*(\d{1,4}(?:[.,]\d{2}))/);
      if (m) {
        usd = parseFloat(m[1].replace(',', '.')).toFixed(2);
        break;
      }
    }
  }

  // 2) Fallback: cualquier $XX.XX en todo el texto
  if (!usd) {
    const todos = limpio.match(/\$\s*(\d{1,4}(?:[.,]\d{2}))/g);
    if (todos && todos.length > 0) {
      const valores = todos.map(m =>
        parseFloat(m.replace(/[$\s]/g, '').replace(',', '.'))
      ).filter(v => v > 0 && v < 10000);
      if (valores.length > 0) {
        usd = valores[valores.length - 1].toFixed(2);
      }
    }
  }

  return { id, usd };
}

async function leerCartel() {
  if (!blobCartel) {
    alert('⚠️ Primero captura el cartel de Verdi');
    return;
  }
  if (ocrEnProgreso) return;

  ocrEnProgreso = true;
  btnLeerCartel.disabled = true;
  btnLeerCartel.textContent = '⏳ Leyendo...';
  mostrarEstadoOCR('🔍 Iniciando lector (primera vez descarga ~15 MB)...', 'info');

  try {
    await cargarTesseract();

    const resultado = await Tesseract.recognize(blobCartel, 'spa', {
      logger: m => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(m.progress * 100);
          mostrarEstadoOCR(`🔍 Leyendo cartel... ${pct}%`, 'info');
        } else if (m.status === 'loading language traineddata') {
          mostrarEstadoOCR('🔍 Cargando idioma español (una vez)...', 'info');
        }
      }
    });

    const texto = resultado.data.text;
    console.log('📝 Texto crudo OCR:', texto);

    const { id, usd } = parsearCartel(texto);

    const detectado = [];
    if (id) {
      formId.value = id;
      resaltarCampo(formId);
      detectado.push('ID: ' + id);
    }
    if (usd) {
      formUsd.value = usd;
      recalcularFormulario();
      resaltarCampo(formUsd);
      detectado.push('Monto: $' + usd);
    }

    if (detectado.length > 0) {
      mostrarEstadoOCR('✅ Detectado → ' + detectado.join(' · '), 'success');
    } else {
      mostrarEstadoOCR('⚠️ No pude detectar datos. Escríbelos manualmente.', 'error');
    }

  } catch (e) {
    console.error('Error OCR:', e);
    mostrarEstadoOCR('⚠️ Error leyendo el cartel. Verifica tu conexión e intenta de nuevo.', 'error');
  } finally {
    ocrEnProgreso = false;
    btnLeerCartel.disabled = false;
    btnLeerCartel.textContent = '🔍 Leer cartel';
  }
}

// ============================================================
// IMÁGENES
// ============================================================
function limpiarImagen(tipo) {
  if (tipo === 'cartel') {
    blobCartel = null;
    prevCartel.src = '';
    prevCartel.classList.add('hidden');
    btnQuitarCartel.classList.add('hidden');
    btnLeerCartel.classList.add('hidden');
    fileCartel.value = '';
    fileCartelGal.value = '';
    ocultarEstadoOCR();
  } else {
    blobPago = null;
    prevPago.src = '';
    prevPago.classList.add('hidden');
    btnQuitarPago.classList.add('hidden');
    filePago.value = '';
    filePagoGal.value = '';
  }
}

async function manejarArchivo(file, tipo) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('⚠️ Solo se permiten imágenes'); return; }
  if (file.size > 8 * 1024 * 1024) { alert('⚠️ La imagen es muy grande (máx 8 MB)'); return; }

  if (tipo === 'cartel') blobCartel = file;
  else blobPago = file;

  const url = URL.createObjectURL(file);
  const img = tipo === 'cartel' ? prevCartel : prevPago;
  const btnQ = tipo === 'cartel' ? btnQuitarCartel : btnQuitarPago;
  img.src = url;
  img.classList.remove('hidden');
  btnQ.classList.remove('hidden');

  // Si es el cartel, mostrar botón "Leer cartel" y auto-ejecutar OCR
  if (tipo === 'cartel') {
    btnLeerCartel.classList.remove('hidden');
    // Auto-ejecutar OCR tras un pequeño delay para que se vea la imagen
    setTimeout(() => {
      if (blobCartel && !ocrEnProgreso) leerCartel();
    }, 500);
  }
}

// ============================================================
// ENVIAR A WHATSAPP + GUARDAR
// ============================================================
async function enviarWhatsApp() {
  if (!formOrigen.value.trim() || !formDestino.value.trim() || !formUsd.value) {
    alert('⚠️ Completa al menos: Origen, Destino y Monto USD');
    return;
  }

  const mensaje = construirMensaje();
  const usd = parseFloat(formUsd.value) || 0;
  const ves = usd * tasaFormulario;

  const viaje = {
    fecha: new Date().toISOString(),
    perfil: perfilActivo,
    modo: modoActual,
    tipo: TIPOS_TEXTO[modoActual],
    origen: formOrigen.value.trim(),
    destino: formDestino.value.trim(),
    viajeId: formId.value.trim(),
    usd: usd,
    tasa: tasaFormulario,
    ves: ves,
    pago: formPago.value,
    mensaje: mensaje
  };

  try {
    await guardarViaje(viaje);
    console.log('✅ Viaje guardado en historial');
  } catch (e) {
    console.error('Error guardando viaje:', e);
  }

  const archivos = [];
  if (blobCartel) archivos.push(new File([blobCartel], 'cartel_verdi.jpg', { type: blobCartel.type || 'image/jpeg' }));
  if (blobPago) archivos.push(new File([blobPago], 'pago_movil.jpg', { type: blobPago.type || 'image/jpeg' }));

  if (navigator.canShare && archivos.length > 0 && navigator.canShare({ files: archivos })) {
    try {
      await navigator.share({ text: mensaje, files: archivos });
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Error Web Share:', e);
    }
  } else {
    const waURL = 'https://wa.me/?text=' + encodeURIComponent(mensaje);
    window.open(waURL, '_blank');
  }

  setTimeout(() => {
    modoActual = null;
    mostrarPantalla('menu');
  }, 800);
}

// ============================================================
// HISTORIAL
// ============================================================
async function abrirHistorial() {
  mostrarPantalla('historial');
  await cargarHistorial();
}

async function cargarHistorial() {
  try {
    const todos = await obtenerViajes();
    let viajes = todos.filter(v => v.perfil === perfilActivo);

    const rango = histRango.value;
    const ahora = new Date();
    let desde = null;
    if (rango === 'hoy') desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    else if (rango === 'semana') desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (rango === 'mes') desde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (desde) viajes = viajes.filter(v => new Date(v.fecha) >= desde);

    const modo = histModo.value;
    if (modo !== 'todos') viajes = viajes.filter(v => v.modo === modo);

    viajes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    renderizarHistorial(viajes);
  } catch (e) {
    console.error('Error cargando historial:', e);
  }
}

function renderizarHistorial(viajes) {
  let totalUSD = 0, totalVES = 0, mioUSD = 0, mioVES = 0, empresaUSD = 0;

  viajes.forEach(v => {
    totalUSD += v.usd || 0;
    totalVES += v.ves || 0;
    if (v.modo !== 'asignado') {
      mioUSD += (v.usd || 0) * 0.30;
      mioVES += (v.ves || 0) * 0.30;
      empresaUSD += (v.usd || 0) * 0.70;
    }
  });

  histTotalViajes.textContent = viajes.length;
  histTotalUSD.textContent    = '$' + totalUSD.toFixed(2);
  histTotalVES.textContent    = 'Bs ' + totalVES.toFixed(2);
  histMioUSD.textContent      = '$' + mioUSD.toFixed(2);
  histMioVES.textContent      = 'Bs ' + mioVES.toFixed(2);
  histEmpresaUSD.textContent  = '$' + empresaUSD.toFixed(2);

  histLista.innerHTML = '';

  if (viajes.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'text-center text-sm text-gray-500 py-6';
    vacio.textContent = 'No hay viajes en este período';
    histLista.appendChild(vacio);
    return;
  }

  viajes.forEach(v => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm p-3';

    const fecha = new Date(v.fecha);
    const fechaStr = fecha.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' }) +
                     ' ' + fecha.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    const emojiModo = v.modo === 'app' ? '📱' : v.modo === 'manual' ? '🚕' : '📋';

    let mioTexto = '';
    if (v.modo !== 'asignado') {
      mioTexto = `<span class="text-green-700">💰 $${(v.usd * 0.30).toFixed(2)}</span>`;
    } else {
      mioTexto = `<span class="text-gray-400 text-xs">Asignado</span>`;
    }

    card.innerHTML = `
      <div class="flex justify-between items-start mb-1">
        <span class="text-xs text-gray-500">${fechaStr}</span>
        <span class="text-xs">${emojiModo}</span>
      </div>
      <div class="text-sm font-semibold text-gray-800">${v.origen} → ${v.destino}</div>
      <div class="flex justify-between items-center mt-2 text-xs">
        <span class="font-mono">$${v.usd.toFixed(2)} | Bs ${(v.ves || 0).toFixed(2)}</span>
        ${mioTexto}
      </div>
      <div class="flex justify-between items-center mt-2">
        <span class="text-xs text-gray-500">${v.pago}</span>
        <button data-id="${v.id}" class="btn-eliminar-viaje text-xs text-red-600 underline">Eliminar</button>
      </div>
    `;
    histLista.appendChild(card);
  });

  document.querySelectorAll('.btn-eliminar-viaje').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      if (!confirm('¿Eliminar este viaje del historial?')) return;
      await eliminarViaje(id);
      await cargarHistorial();
    });
  });
}

// ============================================================
// EXPORTAR CSV
// ============================================================
async function exportarCSV() {
  try {
    const todos = await obtenerViajes();
    let viajes = todos.filter(v => v.perfil === perfilActivo);

    const rango = histRango.value;
    const ahora = new Date();
    let desde = null;
    if (rango === 'hoy') desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    else if (rango === 'semana') desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (rango === 'mes') desde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (desde) viajes = viajes.filter(v => new Date(v.fecha) >= desde);

    const modo = histModo.value;
    if (modo !== 'todos') viajes = viajes.filter(v => v.modo === modo);

    viajes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (viajes.length === 0) { alert('No hay viajes para exportar'); return; }

    let csv = 'Fecha,Modo,Tipo,Origen,Destino,ID Viaje,USD,Tasa,VES,Pago,Tu30USD,Empresa70USD\n';
    viajes.forEach(v => {
      const fecha = new Date(v.fecha).toLocaleString('es-VE');
      const mio = v.modo !== 'asignado' ? (v.usd * 0.30).toFixed(2) : '0.00';
      const empresa = v.modo !== 'asignado' ? (v.usd * 0.70).toFixed(2) : '0.00';
      csv += `"${fecha}","${v.modo}","${v.tipo}","${v.origen}","${v.destino}","${v.viajeId}",${v.usd},${v.tasa},${v.ves},"${v.pago}",${mio},${empresa}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viajes_${perfilActivo.replace(/\s+/g, '_')}_${hoyString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Error exportando CSV:', e);
    alert('Error al exportar');
  }
}

// ============================================================
// EVENTOS
// ============================================================
btnCrearPerfil.addEventListener('click', crearPerfil);
inputPinCrear.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});
inputNombre.addEventListener('keydown', (e) => { if (e.key === 'Enter') inputTelefono.focus(); });

btnVerificarPin.addEventListener('click', verificarPin);
inputPinLogin.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});
inputPinLogin.addEventListener('keydown', (e) => { if (e.key === 'Enter') verificarPin(); });
btnOlvidePin.addEventListener('click', irARecuperar);
btnVolverPerfiles.addEventListener('click', () => {
  perfilPendiente = null;
  mostrarPantalla('perfiles');
  renderizarPerfiles();
});

btnResetearPin.addEventListener('click', resetearPin);
btnCancelarRecuperar.addEventListener('click', () => mostrarPantalla('pin'));
inputNuevoPin.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

btnCambiarPerfil.addEventListener('click', () => {
  limpiarDesbloqueo();
  perfilActivo = null;
  guardarPerfilActivo();
  mostrarPantalla('perfiles');
  renderizarPerfiles();
});

btnVerHistorial.addEventListener('click', abrirHistorial);

formUsd.addEventListener('input', recalcularFormulario);
formTasaEl.addEventListener('input', recalcularFormulario);

btnVolverMenu.addEventListener('click', () => {
  modoActual = null;
  mostrarPantalla('menu');
});

btnRefreshTasa.addEventListener('click', async () => {
  formTasaEl.value = '0.00';
  const tasa = await obtenerTasa();
  if (tasa > 0) {
    tasaFormulario = tasa;
    formTasaEl.value = tasa.toFixed(2);
    recalcularFormulario();
  }
});

btnVistaPrevia.addEventListener('click', () => {
  if (!formUsd.value || !formOrigen.value.trim() || !formDestino.value.trim()) {
    alert('⚠️ Completa al menos: Origen, Destino y Monto USD');
    return;
  }
  previewTexto.textContent = construirMensaje();
  previewContainer.classList.remove('hidden');
  previewContainer.scrollIntoView({ behavior: 'smooth' });
});

btnCopiarMensaje.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(previewTexto.textContent);
    btnCopiarMensaje.textContent = '✅ Copiado';
    setTimeout(() => btnCopiarMensaje.textContent = '📋 Copiar mensaje', 1500);
  } catch (e) {
    alert('Mensaje:\n\n' + previewTexto.textContent);
  }
});

btnEnviarWA.addEventListener('click', enviarWhatsApp);

btnCamCartel.addEventListener('click', () => fileCartel.click());
btnGalCartel.addEventListener('click', () => fileCartelGal.click());
fileCartel.addEventListener('change', e => manejarArchivo(e.target.files[0], 'cartel'));
fileCartelGal.addEventListener('change', e => manejarArchivo(e.target.files[0], 'cartel'));
btnQuitarCartel.addEventListener('click', () => limpiarImagen('cartel'));
btnLeerCartel.addEventListener('click', leerCartel);

btnCamPago.addEventListener('click', () => filePago.click());
btnGalPago.addEventListener('click', () => filePagoGal.click());
filePago.addEventListener('change', e => manejarArchivo(e.target.files[0], 'pago'));
filePagoGal.addEventListener('change', e => manejarArchivo(e.target.files[0], 'pago'));
btnQuitarPago.addEventListener('click', () => limpiarImagen('pago'));

btnVolverMenuHist.addEventListener('click', () => mostrarPantalla('menu'));
histRango.addEventListener('change', cargarHistorial);
histModo.addEventListener('change', cargarHistorial);
btnExportarCSV.addEventListener('click', exportarCSV);

document.querySelectorAll('.btn-modo').forEach(btn => {
  btn.addEventListener('click', () => abrirFormulario(btn.dataset.modo));
});

// ============================================================
// INICIO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await abrirDB();
    console.log('✅ IndexedDB lista');
  } catch (e) {
    console.error('Error IndexedDB:', e);
  }

  cargarDatos();

  if (perfiles.length === 0) {
    mostrarPantalla('perfiles');
    renderizarPerfiles();
    return;
  }

  if (perfilActivo && yaDesbloqueoHoy()) {
    mostrarPantalla('menu');
    return;
  }

  if (perfilActivo) {
    pedirPinPara(perfilActivo);
    return;
  }

  mostrarPantalla('perfiles');
  renderizarPerfiles();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}
