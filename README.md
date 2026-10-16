<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Configuración y acceso

El inicio de sesión usa la API de FitOS (`fitos-api`); el front ya no trae usuarios propios.

1. Copia `.env.example` a `.env.local` y ajusta `VITE_API_URL` (no hay valor por defecto: sin él, el login avisa que falta configurar).
2. La API debe tener tu origen en `Cors:AllowedOrigins` (en desarrollo, `http://localhost:3000`).
3. En el login se escribe el **gimnasio** (su identificador). En producción, con `VITE_BASE_DOMAIN` definido, se toma del subdominio.
4. Un usuario con contraseña temporal debe definir una propia antes de entrar.

La sesión se guarda en `sessionStorage` (se pierde al cerrar la pestaña).

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
