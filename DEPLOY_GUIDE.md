# Guia de Deploy en GitHub Pages (otro usuario)

Guia paso a paso para clonar este proyecto y hostearlo en tu propia cuenta de GitHub Pages.

## Requisitos previos

- Cuenta de GitHub
- [Node.js](https://nodejs.org/) v20 o superior instalado
- [Git](https://git-scm.com/) instalado

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/hendryavila/agent-mastery.git
cd agent-mastery
```

## Paso 2 — Crear tu propio repositorio en GitHub

1. Ve a github.com/new
2. Ponle un nombre a tu repositorio (ejemplo: `agent-mastery`)
3. Dejalo como **Public** (GitHub Pages gratuito solo funciona con repos publicos en cuentas free)
4. **No** marques "Add a README" ni ninguna otra opcion — el repo debe estar vacio
5. Click en **Create repository**

## Paso 3 — Cambiar el remote a tu repositorio

```bash
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
```

## Paso 4 — Actualizar el BASE_PATH

Este es el paso **mas importante**. El `BASE_PATH` debe coincidir con el nombre de tu repositorio.

Abri el archivo `.github/workflows/deploy.yml` y busca esta linea:

```yaml
env:
  BASE_PATH: '/agent-mastery'
```

Cambiala al nombre **exacto** de tu repositorio:

```yaml
env:
  BASE_PATH: '/NOMBRE_DE_TU_REPO'
```

> Si el nombre del repo es el mismo (`agent-mastery`), no necesitas cambiar nada.

## Paso 5 — Push al repositorio

```bash
git branch -M main
git push -u origin main
```

## Paso 6 — Habilitar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (pestana superior)
3. En el menu lateral izquierdo, click en **Pages**
4. En **Source**, selecciona **GitHub Actions**

> No selecciones "Deploy from a branch". El workflow ya se encarga de todo.

## Paso 7 — Verificar el deploy

1. Despues del push, ve a la pestana **Actions** de tu repositorio
2. Deberias ver el workflow **"Deploy to GitHub Pages"** ejecutandose
3. Espera a que termine (~1-2 minutos)
4. Tu sitio estara disponible en:

```
https://TU_USUARIO.github.io/NOMBRE_DE_TU_REPO/
```

## Solucion de problemas

### El workflow falla en el build
- Verifica que el `BASE_PATH` en `deploy.yml` coincida **exactamente** con el nombre del repositorio (con `/` al inicio, sin `/` al final)

### La pagina carga en blanco o con errores 404
- El `BASE_PATH` no coincide con el nombre del repo. Revisa el Paso 4
- Verifica que en Settings > Pages el source sea **GitHub Actions**, no "Deploy from a branch"

### Los estilos no cargan
- Mismo problema: `BASE_PATH` incorrecto. Todos los assets (CSS, JS) usan esa ruta base

### El workflow no aparece en Actions
- Asegurate de que el archivo `.github/workflows/deploy.yml` existe en tu rama `main`
