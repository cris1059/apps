import { Code2, Bot, Megaphone, Layers, Target, BookOpen, Server, Shield, BarChart3, Laptop } from 'lucide-react';

/* Ícono y tono de una categoría según palabras clave. */
const REGLAS = [
  { claves: ['desarrollo', 'program', 'web', 'código', 'codigo', 'software'], Icono: Code2, clase: 'app-icono-tinta' },
  { claves: ['inteligencia', 'ia', 'ai', 'datos'], Icono: Bot, clase: 'app-icono-violeta' },
  { claves: ['marketing', 'redes', 'ventas', 'publicidad'], Icono: Megaphone, clase: 'app-icono-ambar' },
  { claves: ['diseño', 'diseno', 'ux', 'ui'], Icono: Layers, clase: 'app-icono-teal' },
  { claves: ['negocio', 'emprend', 'gestión', 'gestion'], Icono: Target, clase: 'app-icono-rojo' },
  { claves: ['infra', 'redes de', 'servidor', 'nube'], Icono: Server, clase: 'app-icono-tinta' },
  { claves: ['seguridad', 'ciber'], Icono: Shield, clase: 'app-icono-teal' },
  { claves: ['excel', 'análisis', 'analisis'], Icono: BarChart3, clase: 'app-icono-violeta' },
  { claves: ['ofimática', 'ofimatica', 'computación', 'computacion'], Icono: Laptop, clase: 'app-icono-claro' },
];

export const iconoCategoria = (categoria = '') => {
  const texto = String(categoria).toLowerCase();
  const regla = REGLAS.find((r) => r.claves.some((c) => texto.split(/[\s,/-]+/).some((p) => p.startsWith(c)) || texto.includes(c)));
  return regla || { Icono: BookOpen, clase: 'app-icono-claro' };
};
