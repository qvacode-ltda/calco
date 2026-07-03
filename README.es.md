<p align="center">
  <img src="assets/brand/banner.svg" alt="Calco — clona cualquier web en producción a un codebase Astro limpio" width="100%" />
</p>

<p align="center">
  <a href="https://qvacode.github.io/calco/"><img src="https://img.shields.io/badge/demo_en_vivo-clon_de_tailwindcss.com-22D3EE?style=flat-square&labelColor=0A0E1A" alt="Demo en vivo" /></a>
  <img src="https://img.shields.io/badge/Astro-7-F4F7FB?style=flat-square&labelColor=0A0E1A&logo=astro&logoColor=22D3EE" alt="Astro 7" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-F4F7FB?style=flat-square&labelColor=0A0E1A&logo=tailwindcss&logoColor=22D3EE" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F4F7FB?style=flat-square&labelColor=0A0E1A&logo=cloudflareworkers&logoColor=22D3EE" alt="Cloudflare Workers" />
  <img src="https://img.shields.io/badge/Claude_Code-driven-F4F7FB?style=flat-square&labelColor=0A0E1A&logo=claude&logoColor=22D3EE" alt="Claude Code" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/licencia-MIT-F4F7FB?style=flat-square&labelColor=0A0E1A" alt="Licencia MIT" /></a>
</p>

<p align="center"><a href="README.md">English</a> · <b>Español</b></p>

# Calco

**Clona cualquier web en producción a un codebase Astro limpio, estático y tuyo.**

Un *calco* es una copia exacta, un trazado. Apúntalo a una URL desde Claude Code y captura el
HTML y CSS reales del sitio, extrae su sistema de diseño en artefactos auditables y reconstruye
la página sección por sección como un proyecto [Astro 7](https://astro.build) +
[Tailwind CSS v4](https://tailwindcss.com) que se despliega a Cloudflare con un comando.

## Por qué lo usan founders

La web en producción de una empresa seria no es un mockup. Es el resultado superviviente de
meses de investigación de diseño, UX y conversión: cada decisión de espaciado, cada jerarquía
de titulares, cada interacción ya se probó contra tráfico real. Calco convierte ese terreno
validado en tu codebase de partida:

- **Velocidad con resultados validados.** Una reconstrucción pixel-perfect en horas, no un
  proyecto de rediseño de semanas. Parte de patrones que ya funcionan y hazlos tuyos.
- **Código real, no un scrape.** Componentes `.astro` limpios, design tokens en `@theme`,
  assets self-hosted, JS vanilla + GSAP para el movimiento. Cero runtime de framework por
  defecto.
- **Listo para producción.** TypeScript estricto, ESLint, Prettier, shell SEO y deploy a
  Cloudflare Workers con un comando, todo cableado de fábrica.

## La prueba

Júzgalo tú mismo: apuntamos Calco a una de las homepages más difíciles de internet.

|              |                                                                       |
| ------------ | ---------------------------------------------------------------------- |
| **Original** | <https://tailwindcss.com>                                              |
| **Clon**     | <https://qvacode.github.io/calco/> (auto-desplegado desde este repo)   |
| **Código**   | [`examples/tailwindcss.com`](examples/tailwindcss.com)                 |

Todo en la demo está reconstruido como código real: el marco de raíles con tramado, los demos
bento vivos, los logos de sponsors en SVG inline, las fuentes. Sin screenshots, sin iframes.

## Empezar

Necesitas **Node 20+** (22 recomendado) y **[Claude Code](https://claude.com/claude-code)**.

```bash
# 1. Consigue el código — o pulsa "Use this template" en GitHub
git clone https://github.com/qvacode/calco mi-web && cd mi-web

# 2. Instala todo: dependencias + el navegador Playwright de extracción
npm run setup

# 3. Abre Claude Code y clona tu primer sitio
claude
/clone-website https://example.com

# 4. Publícalo
npm run deploy        # astro build && wrangler deploy
```

Los servidores MCP que Calco necesita — **Playwright** (inspección del sitio vivo) y
**context7** (docs actuales de Astro/Tailwind) — están declarados en [`.mcp.json`](.mcp.json).
Claude Code los detecta automáticamente al abrir la carpeta; no hay nada más que configurar.

## Cómo funciona

Calco es **source-first**: trabaja desde el markup real del objetivo, nunca desde screenshots
ni de memoria. El skill `/clone-website` orquesta cinco fases:

1. **Captura** — `scripts/inspection/fetch-source.mjs` guarda el HTML + CSS reales en disco.
2. **Extracción** — el agente `design-extractor` destila tokens, fuentes, assets y
   comportamientos en artefactos auditables (`DESIGN.md`, `BEHAVIORS.md`, specs por sección).
3. **Construcción** — agentes `astro-builder` reconstruyen el marco global y cada sección
   desde el markup real, en paralelo en git worktrees (máximo 3 a la vez, con reintento).
4. **Ensamblaje** — merge de worktrees, descarga de assets en lote, fuentes y SEO.
5. **QA** — el agente `design-critic` compara clon vs original a 1440 y 390 con screenshots y
   marca cada desviación; `npm run verify` valida tipos, lint y build.

| Agente             | Rol                                                                |
| ------------------ | ------------------------------------------------------------------ |
| `design-extractor` | inspecciona el sitio vivo → tokens, assets, comportamientos, specs |
| `astro-builder`    | construye un componente `.astro` desde su spec                     |
| `code-reviewer`    | revisa el diff: correctitud, a11y, rendimiento, fidelidad          |
| `design-critic`    | QA visual contra el original + auditoría de "AI slop"              |
| `commit-crafter`   | Conventional Commits agrupados por cambio                          |

La extracción es determinista donde es posible: conversión de color, captura de estilos y
descargas corren en scripts de Node/navegador (`scripts/inspection/*`), así el modelo gasta
tokens en criterio, no en trabajo mecánico. Ver
[`docs/research/INSPECTION_GUIDE.md`](docs/research/INSPECTION_GUIDE.md).

## Comandos

**En Claude Code:** `/clone-website <url>` · `/extract-design <url>` · `/build-section <spec>`
· `/review` · `/qa <url>` · `/refine` · `/commit` · `/deploy`

**Scripts npm:**

| Script                            | Hace                                            |
| --------------------------------- | ------------------------------------------------ |
| `setup`                           | instala deps + navegador Playwright, verifica    |
| `dev` / `build` / `preview`       | Astro dev / build → `dist/` / preview            |
| `check` / `lint` / `format`       | `astro check` / ESLint / Prettier                |
| `verify`                          | check + lint + build (antes de publicar)         |
| `deploy` / `cf:preview`           | `wrangler deploy` / preview local de Workers     |
| `assets:download <manifest.json>` | descarga assets del clon en lote (concurrencia 3)|

## Qué obtienes

```
src/
  pages/            # rutas (index.astro → /)
  layouts/          # BaseLayout.astro (shell HTML + SEO)
  components/       # componentes de sección + icons/ (SVGs extraídos)
  styles/global.css # @import "tailwindcss" + tokens @theme (el contrato de diseño)
scripts/
  inspection/       # extracción determinista: captura de source, estilos, colores
  setup.mjs         # setup del entorno en un paso
.claude/            # agentes, skills, comandos y workflows del pipeline
.mcp.json           # Playwright + context7, preconfigurados
examples/
  tailwindcss.com/  # el clon demo terminado (auto-deploy a GitHub Pages)
```

## Principios de diseño

- **Emulación pixel-perfect.** El sitio objetivo *es* el sistema de diseño; la fidelidad gana
  al lucimiento.
- **Contenido y assets reales.** Texto, imágenes, videos y SVGs de verdad, nunca placeholders.
- **Cero "AI slop".** Una rúbrica de gusto vigila cada decisión ambigua: sin fuentes
  genéricas, sin gradientes ni glassmorphism inmotivados, jerarquía real.
- **Mejora deliberada.** ¿Quieres ir más allá del 1:1? `/refine` aplica mejoras con criterio
  sobre el clon en lugar de improvisar.

## Uso responsable

Calco es un acelerador de investigación y prototipado, no una máquina de plagio. El clon de la
web de otro es un **punto de partida para tu propio producto**: respeta marcas, copyright y
assets de marca; reemplaza contenido, imágenes y branding por los tuyos antes de publicar nada.
La demo de tailwindcss.com incluida existe para probar la fidelidad, lleva `noindex` y no está
afiliada ni avalada por Tailwind Labs.

## Licencia

[MIT](LICENSE) © 2026 David E. Hernández

---

<p align="center">
  Construido por <a href="https://qvacode.com.br"><b>QVACODE</b></a> — growth engineering para founders y SaaS.<br />
  <a href="https://qvacode.com.br">qvacode.com.br</a> ·
  <a href="https://www.linkedin.com/in/ernesto-growth">LinkedIn</a> ·
  <a href="https://x.com/qvacode">X</a>
</p>
