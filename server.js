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