import { LayoutGrid, BookOpen, Award, Compass, UserCircle2, Gift } from 'lucide-react';

/* Menú del área del alumno. */
export const SECCIONES = [
  {
    titulo: 'Aprendizaje',
    enlaces: [
      { to: '/panel', icono: LayoutGrid, texto: 'Inicio' },
      { to: '/mis-cursos', icono: BookOpen, texto: 'Mis cursos' },
      { to: '/certificados', icono: Award, texto: 'Certificados' },
    ],
  },
  {
    titulo: 'Descubrir',
    enlaces: [{ to: '/cursos', icono: Compass, texto: 'Explorar cursos' }],
  },
  {
    titulo: 'Cuenta',
    enlaces: [
      { to: '/invita', icono: Gift, texto: 'Invita y gana' },
      { to: '/perfil', icono: UserCircle2, texto: 'Mi perfil' },
    ],
  },
];

const TITULOS = {
  '/panel': 'Inicio',
  '/mis-cursos': 'Mis cursos',
  '/certificados': 'Certificados',
  '/perfil': 'Mi perfil',
  '/invita': 'Invita y gana',
};

export const tituloDeRuta = (pathname) => TITULOS[pathname] || 'Academy';
