const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config(); // Carga las variables de entorno

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite requests desde tu frontend
app.use(express.json()); // Para poder leer el body JSON

// ENDPOINT para enviar WhatsApp con informacion
app.post('/api/transferir-whatsapp', (req, res) => {
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
    const enlaceWhatsApp = `https://wa.me/${numeroDestino}?text=${mensaje}`;

    // --- RESPUESTA PARA LA CLIENTA (MÁS ATRACTIVA) ---
    res.json({
        raw: {
            success: true,
            client_name: nombre,
            client_treatment: tratamiento,
            result: "Enlace de WhatsApp generado para agendar la cita."
        },
        markdown: `[💬 ¡Sí, quiero agendar mi cita por WhatsApp!](${enlaceWhatsApp})`,
        type: "markdown",
        desc: `¡Perfecto, ${nombre}! ✨ Estás a un solo paso de comenzar tu transformación.\n\n` +
            `Haz clic en el enlace para enviar tu solicitud a nuestra anfitriona por WhatsApp. Ella te atenderá con mucho cariño para confirmar el día, la hora y los detalles del pago. 💖`
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