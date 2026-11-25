import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp, FaYoutube } from 'react-icons/fa6';
import Marca from '../Marca/Marca';

const REDES = [
  { nombre: 'WhatsApp', Icono: FaWhatsapp, url: 'https://wa.me/525570843374' },
  { nombre: 'Instagram', Icono: FaInstagram, url: 'https://www.instagram.com/avantcode1059' },
  { nombre: 'Facebook', Icono: FaFacebookF, url: 'https://www.facebook.com/share/19pMzZwGfy/?mibextid=wwXIfr' },
  { nombre: 'TikTok', Icono: FaTiktok, url: 'https://www.tiktok.com/@avantcode' },
  { nombre: 'YouTube', Icono: FaYoutube, url: 'https://youtube.com/@avantcode' },
];

const SITIO = 'https://www.avantcodeapp.com';

const COLUMNAS = [
  {
    titulo: 'Academy',
    enlaces: [
      { to: '/cursos', texto: 'Todos los cursos' },
      { to: '/cursos?precio=gratis', texto: 'Cursos gratis' },
      { to: '/#como-funciona', texto: 'Cómo funciona' },
      { to: '/#certificados', texto: 'Verificar certificado' },
    ],
  },
  {
    titulo: 'Tu cuenta',
    enlaces: [
      { to: '/registro', texto: 'Crear cuenta' },
      { to: '/entrar', texto: 'Entrar' },
      { to: '/panel', texto: 'Mi panel' },
      { to: '/olvide-contrasena', texto: 'Recuperar contraseña' },
    ],
  },
  {
    titulo: 'AvantCode',
    enlaces: [
      { href: SITIO, texto: 'Sitio web' },
      { href: `${SITIO}/servicios`, texto: 'Servicios' },
      { href: `${SITIO}/contacto`, texto: 'Contacto' },
      { href: `${SITIO}/aviso-de-privacidad`, texto: 'Aviso de privacidad' },
    ],
  },
];

const Footer = () => (
  <footer className="ac-pie">
    <div className="ac-contenedor ac-contenedor--amplio">
      <div className="ac-pie-grid">
        <div className="ac-pie-marca">
          <Marca claro />
          <p>Cursos prácticos de tecnología, hechos por el equipo de AvantCode.</p>
          <ul className="ac-pie-redes" aria-label="Redes sociales">
            {REDES.map(({ nombre, Icono, url }) => (
              <li key={nombre}>
                <a href={url} target="_blank" rel="noopener noreferrer" aria-label={nombre}>
                  <Icono size={17} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {COLUMNAS.map((c) => (
          <nav key={c.titulo} aria-label={c.titulo}>
            <h2 className="ac-pie-titulo">{c.titulo}</h2>
            <ul>
              {c.enlaces.map((e) => (
                <li key={e.texto}>
                  {e.href ? (
                    <a href={e.href} target="_blank" rel="noopener noreferrer">{e.texto}</a>
                  ) : (
                    <Link to={e.to}>{e.texto}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="ac-pie-base">
        <span>© {new Date().getFullYear()} AvantCode Academy. Todos los derechos reservados.</span>
        <span>Hecho en la Ciudad de México</span>
      </div>
    </div>
  </footer>
);

export default Footer;
