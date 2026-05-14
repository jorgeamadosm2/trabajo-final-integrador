// ── Formulario de contacto ────────────────────────────────────────────────────
// Intercepta el submit del formulario, envía los datos a POST /contacto y
// reemplaza el formulario con un mensaje de confirmación si tiene éxito,
// o muestra un error en pantalla si falla.
document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formularioContacto");
  if (!formulario) return;

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datos = {
      nombre:  formulario.querySelector('[name="nombre"]').value.trim(),
      email:   formulario.querySelector('[name="email"]').value.trim(),
      asunto:  formulario.querySelector('[name="asunto"]').value,
      mensaje: formulario.querySelector('[name="mensaje"]').value.trim(),
    };

    // Deshabilitar el botón mientras se envía para evitar doble submit
    const botonEnviar    = formulario.querySelector('[type="submit"]');
    const textoOriginal  = botonEnviar.textContent;
    botonEnviar.disabled = true;
    botonEnviar.textContent = "Enviando...";

    try {
      await apiFetch("/contacto", {
        method: "POST",
        body: JSON.stringify(datos),
      });

      // Reemplazar el formulario por pantalla de confirmación
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
      // Mostrar el error encima del formulario sin perder los datos cargados
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

      botonEnviar.disabled = false;
      botonEnviar.textContent = textoOriginal;
    }
  });
});
