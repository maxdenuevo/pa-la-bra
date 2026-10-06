# CLAUDE.md · Palabra generadora en vivo

Webapp para la exposición grupal del Tema 1 de Transformaciones Socioculturales (Psicología UDP), lunes 19-10-2026. Tema: el exilio de Paulo Freire en Chile (1964-1969) y su rol en la reforma agraria.

La app hace que la sala viva el método de Freire en vez de escucharlo. Cada persona manda desde su celular una palabra que le pese hoy. El proyector la separa en sílabas, arma la familia silábica como en la "ficha del descubrimiento" y la sala forma palabras nuevas. Después se revela que eso hacían los campesinos en los asentamientos de Curicó en 1968.

Principio rector. La app no deposita contenido en la audiencia (eso sería educación bancaria). Las palabras las pone la sala.

---

## Nombre

Ordenados por recomendación. El nombre aparece en el QR y en la URL, así que conviene corto y legible.

| Nombre | Slug | Por qué |
|---|---|---|
| **pa·la·bra** (recomendado) | `pa-la-bra` | El nombre ya está separado en sílabas. Explica el método sin decir nada |
| Decir su palabra | `decir-su-palabra` | Viene del título de la introducción de Fiori ("Aprender a decir su palabra"). Más largo, muy citable |
| Ficha del descubrimiento | `ficha` | Nombre técnico del método. Bueno para quien ya leyó el texto |
| Círculo de cultura | `circulo` | Nombre del espacio donde se alfabetizaba, con coordinador y sin profesor |
| La venda | `la-venda` | Por la frase campesina "se nos cayó la venda de los ojos". Misterioso, funciona como gancho |
| ta te ti to tu | `tatetitotu` | Lúdico, suena a juego infantil chileno. Puede restar seriedad |
| Brocha | `brocha` | Guiño a la Brigada Ramona Parra. No dice nada del método |

Decisión pendiente de Max. Mientras tanto se usa `pa-la-bra` en código y textos.

---

## Stack

- **Astro** en salida estática. Sin adaptador de servidor salvo que algo lo exija.
- **Supabase** (Postgres y Realtime) desde el cliente con la clave anónima pública y RLS.
- **Vercel** para el despliegue.
- JavaScript o TypeScript sin framework de UI. Islas de Astro con scripts nativos. Si una vista se vuelve inmanejable, preguntar antes de sumar Preact o similar.
- Pruebas con `node:test` (incluido en Node, sin dependencias).

### Reglas de trabajo

- Preguntar antes de instalar cualquier dependencia. La lista mínima esperada es `astro` y `@supabase/supabase-js`.
- Nunca leer ni mostrar archivos `.env`. Las variables se documentan en `.env.example`.
- Git sin líneas `Co-Authored-By`.
- La solución más simple que funcione. Sin sobreingeniería, sin auth, sin panel de administración.
- No tocar código no relacionado con la tarea. Si se ve un code smell, avisarlo aparte.
- Comentarios mínimos. Textos de interfaz en español de Chile, tuteo, sin emojis.

### Variables de entorno

```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
PUBLIC_SESION=expo-1910
```

---

## Rutas

| Ruta | Para | Qué hace |
|---|---|---|
| `/` | Celulares de la audiencia | Un campo, un botón, confirmación "tu palabra entró" |
| `/sala` | Proyector | Muro de palabras, ficha silábica, creación y revelación. Se controla con teclado |
| `/sala?demo` | Respaldo | Igual que `/sala`, con palabras precargadas y estado local. No usa red |
| `?s=ensayo-1` | Ambas | Separa sesiones para que los ensayos no contaminen la exposición |

---

## Flujo en el proyector

| Tecla | Fase | Qué se ve |
|---|---|---|
| `1` | Recolección | QR grande y la pregunta "¿Qué palabra pesa en tu vida hoy?". Las palabras entran como carteles que se pegan al muro, con rotación leve |
| `2` | Ficha | Clic en una palabra. Se parte en sílabas (`deu · da`) y cada sílaba despliega su familia (`da · de · di · do · du`) |
| `3` | Creación | Pregunta "¿Qué palabras nuevas pueden armar con estas sílabas?". La sala manda palabras y aparecen junto a la ficha. Opcional según tiempo |
| `4` | Revelación | Texto de cierre (ver Contenidos) |

Otras teclas

- `H` oculta el cartel seleccionado o bajo el cursor (moderación inmediata, solo local).
- `Q` muestra u oculta el QR en cualquier fase.
- `F` pantalla completa.
- `←` `→` recorren las sílabas en la fase 2.
- `R` reinicia la vista sin borrar datos.

Tiempo objetivo. Fase 1 durante la presentación del grupo (20 s con reloj). Fases 2 a 4 en unos 45 s, dentro del paso 2 de la exposición.

---

## Vista de audiencia (`/`)

- Mobile first. Una sola pantalla.
- Pregunta grande, campo de texto, botón "Mandar".
- Validación en cliente. Una sola palabra, solo letras (incluye tildes, ü y ñ), entre 2 y 20 caracteres. Se normaliza a minúsculas.
- Enfriamiento de 10 s entre envíos, guardado en `localStorage`.
- En fase 3 la misma vista cambia la pregunta (lee la fase actual desde una fila de control o desde un canal Realtime de broadcast).
- Sin cookies de seguimiento, sin analítica, sin datos personales.
- Debe funcionar con mala conexión. Si el envío falla, mostrar "no entró, intenta de nuevo" sin perder lo escrito.

---

## Datos (Supabase)

```sql
create table palabras (
  id uuid primary key default gen_random_uuid(),
  sesion text not null,
  texto text not null check (texto ~ '^[a-záéíóúüñ]{2,20}$'),
  fase smallint not null default 1 check (fase in (1, 3)),
  created_at timestamptz not null default now()
);

alter table palabras enable row level security;

create policy "insertar anon" on palabras
  for insert to anon with check (true);

create policy "leer anon" on palabras
  for select to anon using (true);

alter publication supabase_realtime add table palabras;
```

- La moderación es local en `/sala` (tecla `H`) más una lista de palabras bloqueadas en el cliente de la sala. No se borra nada en la base.
- La fase actual se comunica por un canal Realtime de broadcast (`fase:{sesion}`) que emite `/sala`. Sin tabla extra.
- Antes de crear el proyecto Supabase, preguntar (puede tener costo).

---

## Silabeo y familias

`src/lib/silabas.js` exporta `silabear(palabra)` y `familia(silaba)`. Funciones puras, con pruebas.

### Reglas de silabeo

1. Una consonante entre vocales va con la vocal siguiente (`pe-ga`).
2. Dos consonantes entre vocales se separan (`cam-po`), salvo los grupos inseparables `pr br tr dr cr gr fr pl bl cl gl fl` (`pa-trón`, `mi-cro`).
3. `ch`, `ll`, `rr` son una sola consonante (`a-rrien-do`, `llu-via`).
4. Tres consonantes. Si las dos últimas son grupo inseparable, la primera va atrás (`ham-bre`); si no, las dos primeras van atrás (`ins-ti-tu-to`).
5. Diptongo (vocal débil `i u` sin tilde junto a otra vocal) no se separa (`deu-da`, `ciu-dad`). Dos fuertes `a e o` sí (`po-e-ta`). Débil con tilde rompe el diptongo (`pa-ís`, `rí-o`).
6. `qu` y `gu` antes de `e` `i` son dígrafos (`gue-rra`, `que-so`).
7. `h` intermedia no impide el diptongo ni la separación de fuertes (`a-ho-rro`).

### Casos de prueba mínimos

```
deuda → deu-da          pega → pe-ga            arriendo → a-rrien-do
micro → mi-cro          cae → ca-e              trabajo → tra-ba-jo
ambulancia → am-bu-lan-cia                      tierra → tie-rra
patrón → pa-trón        campesino → cam-pe-si-no                     
llave → lla-ve          país → pa-ís            poeta → po-e-ta
ahorro → a-ho-rro       instituto → ins-ti-tu-to                     
transporte → trans-por-te                       sueldo → suel-do
guerra → gue-rra        examen → e-xa-men       estrés → es-trés
huelga → huel-ga        reforma → re-for-ma     chile → chi-le
lluvia → llu-via        río → rí-o              ciudad → ciu-dad
agua → a-gua            leer → le-er            hambre → ham-bre
cansancio → can-san-cio pan → pan               queso → que-so
```

### Familias

`familia(silaba)` toma el ataque (consonantes antes de la vocal) y lo combina con las cinco vocales, respetando la ortografía.

| Ataque | Familia |
|---|---|
| `d` | da de di do du |
| `tr` | tra tre tri tro tru |
| `c` / `qu` | ca que qui co cu |
| `g` / `gu` | ga gue gui go gu |
| `z` / `c` suave | za ce ci zo zu |
| `ll` | lla lle lli llo llu |
| sin ataque | a e i o u |

Las codas (`deu` → `d`, `cam` → `c`) se ignoran para la familia. Es lo que hacía la ficha del descubrimiento.

---

## Estética · Brigada Ramona Parra

Referencia. Muralismo callejero chileno de fines de los 60 y comienzos de los 70. Se toma el lenguaje visual, no obras específicas.

### Principios

- **Planos de color puro**, sin degradados ni transparencias.
- **Contorno negro grueso** en todo (8 a 12 px en proyector, 4 a 6 px en celular).
- **Sombra dura desplazada**, negra y sin desenfoque, como capa de pintura.
- **Letras pintadas a brocha**. Gruesas, condensadas, de trazo irregular, a veces con contorno.
- **Composición de muro**. Carteles que se superponen, rotación entre −4° y 4°, nada perfectamente alineado.
- **Bordes ásperos** con un filtro SVG (`feTurbulence` más `feDisplacementMap`) aplicado a los paneles, no al texto (legibilidad primero).

### Paleta

| Rol | Color | Hex |
|---|---|---|
| Rojo (dominante) | rojo bermellón | `#D62828` |
| Amarillo | amarillo cadmio | `#F7B801` |
| Azul | azul ultramar | `#1D3A8A` |
| Verde | verde hoja | `#2A7D3E` |
| Negro | contorno y fondo | `#111111` |
| Blanco | muro y texto | `#FFFFFF` |

Proporción aproximada en pantalla. Rojo y negro 60%, amarillo 25%, azul y verde como acentos. Es la misma paleta de las diapositivas.

### Tipografía

- Display para palabras y títulos. Una grotesca o rotulada muy gruesa y condensada, o una de trazo de brocha. Elegir de Google Fonts, revisar licencia y probar legibilidad a 10 metros antes de decidir.
- Texto de apoyo. Una sans legible y robusta.
- Tamaño mínimo en proyector 48 px para cualquier texto, 120 px o más para la palabra elegida en la fase 2.

### Motivos permitidos

Formas propias y simples dibujadas en SVG. Manos, soles con rayos, espigas de trigo, estrellas, flores, rostros esquemáticos de perfil. Funcionan como marco o fondo, nunca compiten con las palabras.

### Evitar

- Reproducir murales reales o firmas de la BRP.
- Símbolos partidarios (hoz y martillo, logos de partidos, consignas electorales). La exposición trata de un gobierno DC y de un pedagogo sin militancia; la estética se usa como lenguaje popular de la época, no como adhesión.
- Fotos de personas reales.
- Animaciones que distraigan. Entrada de carteles de 300 a 500 ms, sin rebotes infinitos. Respetar `prefers-reduced-motion`.

---

## Contenidos

Textos de interfaz (editables en `src/contenido.js`).

- Pregunta fase 1. "¿Qué palabra pesa en tu vida hoy?"
- Ayuda fase 1. "Una sola palabra. Es anónimo."
- Pregunta fase 3. "¿Qué palabras nuevas pueden armar con estas sílabas?"
- Confirmación. "Tu palabra entró al muro."
- Revelación (fase 4)
  - Título. "Esto hacían en los asentamientos de Curicó en 1968."
  - Cita. "Antes estábamos ciegos, ahora ya se nos cayó la venda de los ojos."
  - Atribución. "Frase campesina recogida en un informe de ICIRA, citado en Muñoz Camus (2019)."
  - Pie. "Método psicosocial de Paulo Freire · universo vocabular, palabra generadora, círculo de cultura, familias silábicas."
- Pie permanente de `/sala`, discreto. "Hecho por el grupo del Tema 1 con apoyo de IA generativa, declarado."

Palabras precargadas para `?demo`. deuda, pega, arriendo, micro, cae, sueldo, tierra, patrón, trabajo, estrés, lluvia, ciudad.

---

## Estructura sugerida

```
src/
  pages/
    index.astro        # audiencia
    sala.astro         # proyector
  lib/
    silabas.js         # silabear() y familia()
    supabase.js        # cliente
    bloqueadas.js      # lista de moderación
  contenido.js         # textos de interfaz
  styles/
    mural.css          # tokens de color, contornos, sombras, filtro áspero
tests/
  silabas.test.js      # node --test
public/
  filtro-aspero.svg
.env.example
```

---

## Hecho cuando

- [ ] `silabear` pasa todos los casos de prueba.
- [ ] Desde tres celulares distintos las palabras llegan a `/sala` en menos de 2 s.
- [ ] `H` oculta un cartel sin recargar.
- [ ] `/sala?demo` funciona con el wifi apagado.
- [ ] Legible desde el fondo de una sala con proyector (probar en la UDP si es posible).
- [ ] La vista de audiencia carga en menos de 2 s con 4G débil.
- [ ] Existe un video de respaldo de 30 s con las cuatro fases.

## Calendario

| Fecha | Hito |
|---|---|
| Lun 12-10 | Primera versión con modo demo y silabeo probado |
| Mié 14-10 | Prueba con el grupo desde sus celulares |
| Dom 18-10 | Versión final, sesión `expo-1910` limpia, QR definitivo en la diapositiva 2, video de respaldo |

## Fuera de alcance

- Cuentas, login o panel de administración.
- Guardar datos personales.
- Validar que las palabras de la fase 3 existan en un diccionario. Las valida la sala, como en un círculo de cultura.
- El "zoom de la imaginación sociológica" u otras vistas de la exposición.
