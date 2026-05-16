// ── Formulario de contacto ────────────────────────────────────────────────────
// Escucha el submit del formulario, envía los datos al backend y da feedback al usuario.
// Decidí no usar un redirect tras el éxito: prefiero reemplazar el formulario con
// un mensaje en la misma página para que la experiencia sea más fluida.
document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formularioContacto");
  if (!formulario) return;

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    // Recolecto los valores directamente desde los campos del formulario
    const datos = {
      nombre:  formulario.querySelector('[name="nombre"]').value.trim(),
      email:   formulario.querySelector('[name="email"]').value.trim(),
      asunto:  formulario.querySelector('[name="asunto"]').value,
      mensaje: formulario.querySelector('[name="mensaje"]').value.trim(),
    };

    // Deshabilito el botón para evitar que el usuario envíe el formulario dos veces
    const botonEnviar    = formulario.querySelector('[type="submit"]');
    const textoOriginal  = botonEnviar.textContent;
    botonEnviar.disabled = true;
    botonEnviar.textContent = "Enviando...";

    try {
      await apiFetch("/contacto", {
        method: "POST",
        body: JSON.stringify(datos),
      });

      // Reemplazo el contenido del formulario por la pantalla de confirmación.
      // Así no pierdo el layout de la sección pero el usuario ve que todo salió bien.
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
      // Si falla, muestro el error arriba del formulario sin borrar lo que el usuario escribió.
      // Creo el div de error solo si no existe (para evitar duplicados si el usuario reintenta).
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

      // Vuelvo a habilitar el botón para que pueda reintentar
      botonEnviar.disabled = false;
      botonEnviar.textContent = textoOriginal;
    }
  });
});
