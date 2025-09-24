const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config(); // Carga las variables de entorno

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite requests desde tu frontend
app.use(express.json()); // Para poder leer el body JSON

// Agregamos esta función para acortar la URL
async function acortarEnlace(urlLarga) {
    // Usamos un bloque try...catch para manejar cualquier error con el servicio externo
    try {
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(urlLarga)}`);
        if (response.ok) {
            const urlCorta = await response.text();
            return urlCorta;
        }
        // Si el servicio falla, devolvemos la URL original para no romper el flujo
        return urlLarga;
    } catch (error) {
        console.error("Error al acortar el enlace:", error);
        // En caso de error, devolvemos la URL original
        return urlLarga;
    }
}


// ENDPOINT para enviar WhatsApp con informacion
app.post('/api/transferir-whatsapp', async (req, res) => {
    //get info from the json sent in the request
    const {
        nombre,
        numero_contacto,
        cabello_resumen,
        tratamiento
    } = req.body;

    // Número del negocio o asesor de WhatsApp (ejemplo: +52 55 2637 3003)
    const numeroDestino = "525523767744";

    // --- MENSAJE PARA LA HOST (MÁS CONTEXTO Y CALIDEZ) ---
    const mensaje = encodeURIComponent(
        `¡Hola! 👋 Vengo de KeerAI y me gustaría agendar mi cita. ¡Estoy muy emocionada por empezar mi tratamiento! 💖\n\n` +
        `Aquí están mis datos:\n` +
        `---------------------------\n` +
        `👤 *Nombre:* ${nombre}\n` +
        `📞 *Contacto:* ${numero_contacto}\n` +
        `✍️ *Resumen de mi cabello:* ${cabello_resumen}\n` +
        `🌿 *Tratamiento de interés:* ${tratamiento}\n` +
        `---------------------------\n\n` +
        `¡Quedo atenta para confirmar los detalles! ✨`
    );

    // Generar link
    const enlaceLargoWhatsApp = `https://wa.me/${numeroDestino}?text=${mensaje}`;

    // Segundo, llama a la función para acortar el enlace
    const enlaceCortoWhatsApp = await acortarEnlace(enlaceLargoWhatsApp);

    // --- RESPUESTA PARA LA CLIENTA (MÁS ATRACTIVA) ---
    res.json({
        raw: {
            success: true,
            client_name: nombre,
            client_treatment: tratamiento,
            result: "Enlace de WhatsApp corto generado para agendar la cita."
        },
        // El markdown lo dejamos por si en el futuro se usa en una plataforma que sí lo soporte
        markdown: `[💬 ¡Sí, quiero agendar mi cita por WhatsApp!](${enlaceCortoWhatsApp})`,
        type: "markdown",
        // Esta es la parte clave: ahora el enlace que ve el usuario es corto y limpio
        desc: `¡Perfecto, ${nombre}! ✨ Estás a un solo paso de comenzar tu transformación.\n\n` +
            `Haz clic aquí para confirmar tu cita por WhatsApp: ${enlaceCortoWhatsApp}`
    });
});

app.post('/api/send-whatsapp', (req, res) => {
    //get info from the json sent in the request
    const {
        nombre,
        numero_contacto,
        cabello_resumen,
        tratamiento
    } = req.body;

    // Número del negocio o asesor de WhatsApp (ejemplo: +52 55 2637 3003)
    const numeroDestino = "525523767744";

    // Mensaje que irá en el WhatsApp (se encodea para que funcione bien en el link)
    const mensaje = encodeURIComponent(
        `👤 Nombre: ${nombre}\n📞 Contacto: ${numero_contacto}\n💇‍♀️ Resumen Cabello: ${cabello_resumen}\n✨ Tratamiento: ${tratamiento}\n\nQuiero agendar mi cita, por favor.`
    );

    // Generar link
    const enlaceWhatsApp = `https://wa.me/${numeroDestino}?text=${mensaje}`;

    res.json({
        raw: {
            success: true,
            client_name: nombre,
            client_treatment: tratamiento,
            result: "Se le envió correctamente el enlace al WhatsApp para agendar cita"
        },
        markdown: `[📲 Enlace directo a WhatsApp](${enlaceWhatsApp})`,
        type: "markdown",
        desc: `Aquí tienes el enlace para continuar en WhatsApp y confirmar la cita: \n\n${enlaceWhatsApp}`
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});