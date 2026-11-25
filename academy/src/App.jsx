import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Cargando from './components/UI/Cargando';
import Intro from './components/Intro/Intro';

// Sitio público (diseño de avantcodeapp.com, rama version-2027)
import SitioLayout from './components/Sitio/SitioLayout';
import Inicio from './pages/publico/Inicio';
import Catalogo from './pages/publico/Catalogo';
import CursoDetalle from './pages/publico/CursoDetalle';
import VerificarCertificado from './pages/publico/VerificarCertificado';
import CertificadoPublico from './pages/publico/CertificadoPublico';
import VistaPreviaActividad from './pages/publico/VistaPreviaActividad';

// Acceso
import Registro from './pages/auth/Registro';
import Entrar from './pages/auth/Entrar';
import VerificaTuCorreo from './pages/auth/VerificaTuCorreo';
import VerificarCorreo from './pages/auth/VerificarCorreo';
import OlvideContrasena from './pages/auth/OlvideContrasena';
import Restablecer from './pages/auth/Restablecer';

// Área del alumno (diseño del sistema AvantCode)
import PanelLayout from './components/Panel/PanelLayout';
import PanelInicio from './pages/panel/PanelInicio';
import MisCursos from './pages/panel/MisCursos';
import Aprender from './pages/panel/Aprender';
import Certificados from './pages/panel/Certificados';
import Perfil from './pages/panel/Perfil';
import Invita from './pages/panel/Invita';
import { guardarInvitacion } from './utils/invitacion';

/* Requiere sesión; si no hay, manda a /entrar y regresa después. */
const RutaAlumno = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth();
  const { pathname, search } = useLocation();
  if (cargando) return <Cargando pantalla />;
  if (!estaAutenticado) return <Navigate to={`/entrar?volver=${encodeURIComponent(pathname + search)}`} replace />;
  return children;
};

/* Pantallas de acceso: con sesión iniciada no tienen sentido. */
const RutaInvitado = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth();
  if (cargando) return <Cargando pantalla />;
  return estaAutenticado ? <Navigate to="/panel" replace /> : children;
};

/* ?invita=<código> en cualquier página: se guarda para usarlo al crear la cuenta. */
const GuardarInvitacion = () => {
  const { search } = useLocation();
  useEffect(() => {
    const codigo = new URLSearchParams(search).get('invita');
    if (codigo) guardarInvitacion(codigo);
  }, [search]);
  return null;
};

/* Vuelve arriba al cambiar de página. */
const ArribaAlNavegar = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Intro de marca: negro → logo → nombre → "Academy" → la página entra */}
        <Intro />
        <ArribaAlNavegar />
        <GuardarInvitacion />
        <Toaster
          position="top-center"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(22, 22, 22, .86)',
              color: '#fff',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              border: '1px solid rgba(255, 255, 255, .08)',
              borderRadius: '999px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 16px 40px -12px rgba(0, 0, 0, .45)',
            },
            success: { duration: 3000, iconTheme: { primary: '#D4FF3F', secondary: '#161616' } },
            error: { iconTheme: { primary: '#F26B5E', secondary: '#161616' } },
          }}
        />

        <Routes>
          {/* Sitio público */}
          <Route element={<SitioLayout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/cursos" element={<Catalogo />} />
            <Route path="/cursos/:slug" element={<CursoDetalle />} />
            <Route path="/certificados/:folio" element={<VerificarCertificado />} />
          </Route>

          {/* Página del certificado: solo el certificado, sin menú ni pie. */}
          <Route path="/verified/:folio" element={<CertificadoPublico />} />

          {/* Acceso */}
          <Route path="/registro" element={<RutaInvitado><Registro /></RutaInvitado>} />
          <Route path="/entrar" element={<RutaInvitado><Entrar /></RutaInvitado>} />
          <Route path="/verifica-tu-correo" element={<RutaInvitado><VerificaTuCorreo /></RutaInvitado>} />
          <Route path="/verificar/:token" element={<VerificarCorreo />} />
          <Route path="/olvide-contrasena" element={<RutaInvitado><OlvideContrasena /></RutaInvitado>} />
          <Route path="/restablecer/:token" element={<Restablecer />} />

          {/* Reproductor del curso: pantalla completa, sin la barra lateral */}
          <Route path="/aprender/:slug" element={<RutaAlumno><Aprender /></RutaAlumno>} />

          {/* Vista previa del examen o la práctica desde el editor del sistema */}
          <Route path="/vista-previa/actividad" element={<VistaPreviaActividad />} />

          {/* Área del alumno */}
          <Route element={<RutaAlumno><PanelLayout /></RutaAlumno>}>
            <Route path="/panel" element={<PanelInicio />} />
            <Route path="/mis-cursos" element={<MisCursos />} />
            <Route path="/certificados" element={<Certificados />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/invita" element={<Invita />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
