/* Indicador de carga centrado. `pantalla` ocupa toda la ventana. */
const Cargando = ({ pantalla = false, texto }) => (
  <div
    className={`flex flex-col items-center justify-center gap-4 ${pantalla ? 'min-h-screen bg-gray-100' : 'h-64'}`}
    role="status"
    aria-live="polite"
  >
    <span className="cargador" />
    <span className={texto ? 'text-sm text-tinta-3' : 'sr-only'}>{texto || 'Cargando…'}</span>
  </div>
);

export default Cargando;
