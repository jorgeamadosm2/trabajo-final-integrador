/**
 * contacto-api.js — Envío del formulario de contacto a la API
 *
 * Intercepta el submit del formulario en contacto.html y envía los datos
 * al backend Flask vía POST /api/contacto.
 *
 * Comportamientos:
 *   - Deshabilita el botón al enviar (evita doble submit)
 *   - En éxito: reemplaza el formulario con un mensaje de confirmación
 *   - En error: muestra el mensaje de error arriba del formulario
 *     y re-habilita el botón para que el usuario pueda corregir y reintentar
 */

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formularioContacto");
  if (!formulario) return; // Solo se ejecuta en contacto.html

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault(); // Evitar que el navegador recargue la página al enviar

    // Leer los valores actuales de los campos del formulario
    const datos = {
      nombre:  formulario.querySelector('[name="nombre"]').value.trim(),
      email:   formulario.querySelector('[name="email"]').value.trim(),
      asunto:  formulario.querySelector('[name="asunto"]').value,
      mensaje: formulario.querySelector('[name="mensaje"]').value.trim(),
    };

    // Deshabilitar el botón de envío para prevenir múltiples envíos
    const botonEnviar = formulario.querySelector('[type="submit"]');
    const textoOriginal = botonEnviar.textContent;
    botonEnviar.disabled = true;
    botonEnviar.textContent = "Enviando...";

    try {
      // Enviar los datos como JSON al backend
      await apiFetch("/contacto", {
        method: "POST",
        body: JSON.stringify(datos),
      });

      // Éxito: reemplazar todo el formulario con una confirmación visual
      formulario.innerHTML = `
        <div style="
          text-align: center;
          padding: 3rem 2rem;
          background: #f0fdf4;
          border-radius: 12px;
          border: 2px solid #86efac;
        ">
          <p style="font-size: 3rem; margin-bottom: 1rem;">✅</p>
          <h3 style="color: #166534; margin-bottom: 0.5rem;">¡Mensaje enviado!</h3>
          <p style="color: #15803d;">
            Gracias por contactarnos. Te respondemos a la brevedad en <strong>${datos.email}</strong>.
          </p>
        </div>
      `;

    } catch (error) {
      // Error: mostrar mensaje encima del formulario sin borrarlo
      let mensajeError = document.getElementById("error-formulario");
      if (!mensajeError) {
        mensajeError = document.createElement("div");
        mensajeError.id = "error-formulario";
        mensajeError.style.cssText = `
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          color: #dc2626;
        `;
        formulario.prepend(mensajeError);
      }
      mensajeError.textContent = `Error: ${error.message}. Verificá los datos e intentá de nuevo.`;

      // Rehabilitar el botón para que el usuario pueda corregir y reintentar
      botonEnviar.disabled = false;
      botonEnviar.textContent = textoOriginal;
    }
  });
});
