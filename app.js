// ============================================================
// GESTOR DE VIAJES - Fase 2.4 (Formulario + Capturas + WhatsApp)
// ============================================================

// ⚙️ CONFIGURACIÓN: Cambia esta palabra por la que tú quieras.
const PALABRA_MAESTRA = 'VERDI2026';

const LS_PERFILES       = 'gestor_viajes_perfiles_v2';
const LS_ACTIVO         = 'gestor_viajes_perfil_activo_v2';
const LS_ULTIMO_DESBLOQ = 'gestor_viajes_ultimo_desbloqueo';

// ===== Estado en memoria =====
let perfiles = [];
let perfilActivo = null;
let perfilPendiente = null;
let modoActual = null;
let tasaFormulario = 0;
let blobCartel = null;
let blobPago = null;

// ============================================================
// REFERENCIAS AL DOM
// ============================================================
const screenPerfiles   = document.getElementById('screen-perfiles');
const screenPin        = document.getElementById('screen-pin');
const screenRecuperar  = document.getElementById('screen-recuperar');
const screenMenu       = document.getElementById('screen-menu');
const screenForm       = document.getElementById('screen-form');

// Perfiles
const listaPerfiles    = document.getElementById('lista-perfiles');
const inputNombre      = document.getElementById('input-nombre-perfil');
const inputTelefono    = document.getElementById('input-telefono-perfil');
const inputPinCrear    = document.getElementById('input-pin-perfil');
const btnCrearPerfil   = document.getElementById('btn-crear-perfil');
const msgPerfil        = document.getElementById('msg-perfil');

// PIN
const pinNombrePerfil  = document.getElementById('pin-nombre-perfil');
const inputPinLogin    = document.getElementById('input-pin-login');
const btnVerificarPin  = document.getElementById('btn-verificar-pin');
const btnOlvidePin     = document.getElementById('btn-olvide-pin');
const btnVolverPerfiles= document.getElementById('btn-volver-perfiles');
const msgPin           = document.getElementById('msg-pin');

// Recuperación
const inputPalabraMaestra = document.getElementById('input-palabra-maestra');
const inputNuevoPin       = document.getElementById('input-nuevo-pin');
const btnResetearPin      = document.getElementById('btn-resetear-pin');
const btnCancelarRecuperar= document.getElementById('btn-cancelar-recuperar');
const msgRecuperar        = document.getElementById('msg-recuperar');

// Menú
const nombrePerfilUI   = document.getElementById('nombre-perfil-activo');
const btnCambiarPerfil = document.getElementById('btn-cambiar-perfil');
const btnVerHistorial  = document.getElementById('btn-ver-historial');

// Formulario
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

// Imágenes
const btnCamCartel    = document.getElementById('btn-cam-cartel');
const btnGalCartel    = document.getElementById('btn-gal-cartel');
const fileCartel      = document.getElementById('file-cartel');
const fileCartelGal   = document.getElementById('file-cartel-gal');
const prevCartel      = document.getElementById('prev-cartel');
const btnQuitarCartel = document.getElementById('btn-quitar-cartel');

const btnCamPago      = document.getElementById('btn-cam-pago');
const btnGalPago      = document.getElementById('btn-gal-pago');
const filePago        = document.getElementById('file-pago');
const filePagoGal     = document.getElementById('file-pago-gal');
const prevPago        = document.getElementById('prev-pago');
const btnQuitarPago   = document.getElementById('btn-quitar-pago');

// ============================================================
// TÍTULOS Y TIPOS
// ============================================================
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
// HASH DEL PIN (SHA-256)
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
  } catch (e) {
    perfiles = [];
  }
  perfilActivo = localStorage.getItem(LS_ACTIVO) || null;
}

function guardarPerfiles() {
  localStorage.setItem(LS_PERFILES, JSON.stringify(perfiles));
}

function guardarPerfilActivo() {
  if (perfilActivo) {
    localStorage.setItem(LS_ACTIVO, perfilActivo);
  } else {
    localStorage.removeItem(LS_ACTIVO);
  }
}

// ============================================================
// CONTROL DE DESBLOQUEO DIARIO
// ============================================================
function hoyString() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function yaDesbloqueoHoy() {
  const ultimo = localStorage.getItem(LS_ULTIMO_DESBLOQ);
  return ultimo === (perfilActivo + '|' + hoyString());
}

function marcarDesbloqueoHoy() {
  if (perfilActivo) {
    localStorage.setItem(LS_ULTIMO_DESBLOQ, perfilActivo + '|' + hoyString());
  }
}

function limpiarDesbloqueo() {
  localStorage.removeItem(LS_ULTIMO_DESBLOQ);
}

// ============================================================
// MENSAJES
// ============================================================
function mostrarMensaje(el, texto, esError = false) {
  el.textContent = texto;
  el.className = 'text-center text-xs mt-2 ' + (esError ? 'text-red-600' : 'text-green-600');
  if (!texto) el.className = 'text-center text-xs';
}

// ============================================================
// PANTALLAS
// ============================================================
function mostrarPantalla(cual) {
  screenPerfiles.classList.add('hidden');
  screenPin.classList.add('hidden');
  screenRecuperar.classList.add('hidden');
  screenMenu.classList.add('hidden');
  screenForm.classList.add('hidden');

  if (cual === 'perfiles')  screenPerfiles.classList.remove('hidden');
  if (cual === 'pin')       screenPin.classList.remove('hidden');
  if (cual === 'recuperar') screenRecuperar.classList.remove('hidden');
  if (cual === 'form')      screenForm.classList.remove('hidden');
  if (cual === 'menu') {
    screenMenu.classList.remove('hidden');
    nombrePerfilUI.textContent = perfilActivo || '—';
  }
}

// ============================================================
// LISTA DE PERFILES
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
    btnBorrar.title = 'Eliminar perfil';
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

// ============================================================
// ACCIONES PERFILES
// ============================================================
async function crearPerfil() {
  const nombre   = inputNombre.value.trim();
  const telefono = inputTelefono.value.trim();
  const pin      = inputPinCrear.value.trim();

  if (!nombre) {
    mostrarMensaje(msgPerfil, '⚠️ El nombre es obligatorio', true);
    return;
  }
  if (!/^\d{4}$/.test(pin)) {
    mostrarMensaje(msgPerfil, '⚠️ El PIN debe ser de 4 dígitos', true);
    return;
  }
  if (perfiles.some(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
    mostrarMensaje(msgPerfil, '⚠️ Ya existe un perfil con ese nombre', true);
    return;
  }

  const pinHash = await hashearPin(pin);
  perfiles.push({ nombre, telefono, pinHash });
  guardarPerfiles();

  inputNombre.value = '';
  inputTelefono.value = '';
  inputPinCrear.value = '';
  mostrarMensaje(msgPerfil, '✅ Perfil creado');
  renderizarPerfiles();

  setTimeout(() => mostrarMensaje(msgPerfil, ''), 2000);
}

function eliminarPerfil(idx) {
  if (!confirm(`¿Eliminar el perfil "${perfiles[idx].nombre}"?`)) return;
  const eraActivo = perfiles[idx].nombre === perfilActivo;
  perfiles.splice(idx, 1);
  guardarPerfiles();
  if (eraActivo) {
    perfilActivo = null;
    guardarPerfilActivo();
    limpiarDesbloqueo();
  }
  renderizarPerfiles();
}

// ============================================================
// FLUJO DE PIN
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
  if (!/^\d{4}$/.test(pin)) {
    mostrarMensaje(msgPin, '⚠️ Ingresa 4 dígitos', true);
    return;
  }

  const perfil = perfiles.find(p => p.nombre === perfilPendiente);
  if (!perfil) {
    mostrarMensaje(msgPin, '⚠️ Perfil no encontrado', true);
    return;
  }

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

// ============================================================
// RECUPERACIÓN
// ============================================================
function irARecuperar() {
  inputPalabraMaestra.value = '';
  inputNuevoPin.value = '';
  mostrarMensaje(msgRecuperar, '');
  mostrarPantalla('recuperar');
}

async function resetearPin() {
  const palabra = inputPalabraMaestra.value.trim();
  const nuevoPin = inputNuevoPin.value.trim();

  if (palabra !== PALABRA_MAESTRA) {
    mostrarMensaje(msgRecuperar, '❌ Palabra maestra incorrecta', true);
    return;
  }
  if (!/^\d{4}$/.test(nuevoPin)) {
    mostrarMensaje(msgRecuperar, '⚠️ El nuevo PIN debe ser de 4 dígitos', true);
    return;
  }

  const perfil = perfiles.find(p => p.nombre === perfilPendiente);
  if (!perfil) {
    mostrarMensaje(msgRecuperar, '⚠️ Perfil no encontrado', true);
    return;
  }

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
// FORMULARIO: OBTENER TASA
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

// ============================================================
// FORMULARIO: ABRIR
// ============================================================
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

// ============================================================
// FORMULARIO: RECALCULAR
// ============================================================
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

// ============================================================
// FORMULARIO: CONSTRUIR MENSAJE
// ============================================================
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

  if (modoActual !== 'asignado') {
    mensaje += '70/30\n';
  }

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
// IMÁGENES
// ============================================================
function limpiarImagen(tipo) {
  if (tipo === 'cartel') {
    blobCartel = null;
    prevCartel.src = '';
    prevCartel.classList.add('hidden');
    btnQuitarCartel.classList.add('hidden');
    fileCartel.value = '';
    fileCartelGal.value = '';
  } else {
    blobPago = null;
    prevPago.src = '';
    prevPago.classList.add('hidden');
    btnQuitarPago.classList.add('hidden');
    filePago.value = '';
    filePagoGal.value = '';
  }
}

function manejarArchivo(file, tipo) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('⚠️ Solo se permiten imágenes');
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    alert('⚠️ La imagen es muy grande (máx 8 MB)');
    return;
  }

  if (tipo === 'cartel') blobCartel = file;
  else blobPago = file;

  const url = URL.createObjectURL(file);
  const img = tipo === 'cartel' ? prevCartel : prevPago;
  const btnQ = tipo === 'cartel' ? btnQuitarCartel : btnQuitarPago;

  img.src = url;
  img.classList.remove('hidden');
  btnQ.classList.remove('hidden');
}

// ============================================================
// ENVIAR A WHATSAPP
// ============================================================
async function enviarWhatsApp() {
  if (!formOrigen.value.trim() || !formDestino.value.trim() || !formUsd.value) {
    alert('⚠️ Completa al menos: Origen, Destino y Monto USD');
    return;
  }

  const mensaje = construirMensaje();

  const archivos = [];
  if (blobCartel) {
    archivos.push(new File([blobCartel], 'cartel_verdi.jpg', { type: blobCartel.type || 'image/jpeg' }));
  }
  if (blobPago) {
    archivos.push(new File([blobPago], 'pago_movil.jpg', { type: blobPago.type || 'image/jpeg' }));
  }

  if (navigator.canShare && archivos.length > 0 && navigator.canShare({ files: archivos })) {
    try {
      await navigator.share({
        text: mensaje,
        files: archivos
      });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error('Error Web Share:', e);
    }
  }

  const waURL = 'https://wa.me/?text=' + encodeURIComponent(mensaje);
  window.open(waURL, '_blank');
}

// ============================================================
// EVENTOS: PERFILES
// ============================================================
btnCrearPerfil.addEventListener('click', crearPerfil);
inputPinCrear.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});
inputNombre.addEventListener('keydown', (e) => { if (e.key === 'Enter') inputTelefono.focus(); });

// EVENTOS: PIN
btnVerificarPin.addEventListener('click', verificarPin);
inputPinLogin.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});
inputPinLogin.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') verificarPin();
});
btnOlvidePin.addEventListener('click', irARecuperar);
btnVolverPerfiles.addEventListener('click', () => {
  perfilPendiente = null;
  mostrarPantalla('perfiles');
  renderizarPerfiles();
});

// EVENTOS: RECUPERACIÓN
btnResetearPin.addEventListener('click', resetearPin);
btnCancelarRecuperar.addEventListener('click', () => {
  mostrarPantalla('pin');
});
inputNuevoPin.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// EVENTOS: MENÚ
btnCambiarPerfil.addEventListener('click', () => {
  limpiarDesbloqueo();
  perfilActivo = null;
  guardarPerfilActivo();
  mostrarPantalla('perfiles');
  renderizarPerfiles();
});

btnVerHistorial.addEventListener('click', () => {
  alert('Historial: próximamente en Fase 2.5');
});

// EVENTOS: FORMULARIO
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

// EVENTOS: IMÁGENES
btnCamCartel.addEventListener('click', () => fileCartel.click());
btnGalCartel.addEventListener('click', () => fileCartelGal.click());
fileCartel.addEventListener('change', e => manejarArchivo(e.target.files[0], 'cartel'));
fileCartelGal.addEventListener('change', e => manejarArchivo(e.target.files[0], 'cartel'));
btnQuitarCartel.addEventListener('click', () => limpiarImagen('cartel'));

btnCamPago.addEventListener('click', () => filePago.click());
btnGalPago.addEventListener('click', () => filePagoGal.click());
filePago.addEventListener('change', e => manejarArchivo(e.target.files[0], 'pago'));
filePagoGal.addEventListener('change', e => manejarArchivo(e.target.files[0], 'pago'));
btnQuitarPago.addEventListener('click', () => limpiarImagen('pago'));

// EVENTOS: BOTONES DE MODO
document.querySelectorAll('.btn-modo').forEach(btn => {
  btn.addEventListener('click', () => {
    abrirFormulario(btn.dataset.modo);
  });
});

// ============================================================
// INICIO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
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

// ============================================================
// SERVICE WORKER
// ============================================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}