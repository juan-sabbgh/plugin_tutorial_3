const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config(); // Carga las variables de entorno

const app = express();
const port = process.env.PORT || 3000;

//URL para llamar al agente
const url = 'https://agents.dyna.ai/openapi/v1/conversation/dialog/';

//agent api parameters
const AGENT_TOKEN = process.env.AGENT_TOKEN;
const AGENT_KEY = process.env.AGENT_KEY;
const AS_ACCOUNT = process.env.AS_ACCOUNT;

const AGENT_TOKEN_BS_IMG = process.env.AGENT_TOKEN_BS_IMG;
const AGENT_KEY_BS_IMG = process.env.AGENT_KEY_BS_IMG;

const YCLOUD_API = process.env.YCLOUD_API;

//database parameters
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_USER = process.env.DB_USER;
const DB_NAME = process.env.DB_NAME;

const dbConfig = {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
};

// Crea un pool de conexiones usando la configuración
const pool = new Pool(dbConfig);

// Crea un pool de conexiones para manejar las consultas de forma eficiente
//const pool = mysql.createPool(dbConfig);

async function executeQuery(servicio) {
    try {
        const searchTerm = `%${servicio}%`;
        console.log(`Aqui se deberia ejecutar la query para buscar ${searchTerm}`)
        //get link for that service
        const results = await pool.query("SELECT link FROM iimages_browspot WHERE servicio ILIKE $1", [searchTerm]);
        console.log(results.rows);
        //return rows
        return results.rows;
    } catch (error) {
        console.error("Error en la consulta SQL syntax:", error);
        throw error;
    }
}

async function acortarEnlace(urlLarga) {
    // La URL de la API de TinyURL es simple: se le pasa la URL a acortar como parámetro.
    const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(urlLarga)}`;

    try {
        console.log("Intentando acortar el enlace:", urlLarga);
        const response = await fetch(apiUrl);

        // Si la respuesta no es exitosa (ej. status 400, 500), lanzamos un error.
        if (!response.ok) {
            throw new Error(`La API de TinyURL respondió con el estado: ${response.status}`);
        }

        const urlCorta = await response.text();

        // La API de TinyURL a veces devuelve 'Error' en el texto si la URL es inválida.
        if (urlCorta === "Error") {
            throw new Error("TinyURL reportó un error con la URL proporcionada.");
        }

        console.log("Enlace acortado exitosamente:", urlCorta);
        return urlCorta;

    } catch (error) {
        // Si cualquier parte del bloque 'try' falla, lo capturamos aquí.
        console.error("Error al acortar con TinyURL. Se devolverá el enlace largo.", error.message);
        // Devolvemos la URL original como respaldo.
        return urlLarga;
    }
}

async function getChatSummary(hair_data) {
    try {
        // Create a more informative prompt including the database results
        const prompt = `Información del cabello del cliente: "${hair_data}"`;

        const requestData = {
            username: AS_ACCOUNT,
            question: prompt
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'cybertron-robot-key': AGENT_KEY,
                'cybertron-robot-token': AGENT_TOKEN
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data.answer;

    } catch (error) {
        console.error('Error getting chat summary:', error);
        throw error;
    }
}

async function getImageName(service) {
    try {
        // Create a more informative prompt including the database results
        const prompt = `Servicio: "${service}"`;

        const requestData = {
            username: AS_ACCOUNT,
            question: prompt
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'cybertron-robot-key': AGENT_KEY_BS_IMG,
                'cybertron-robot-token': AGENT_TOKEN_BS_IMG
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data.answer;

    } catch (error) {
        console.error('Error getting chat summary:', error);
        throw error;
    }
}

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

    const enlaceFinalWhatsApp = await acortarEnlace(enlaceLargoWhatsApp);

    // Segundo, llama a la función para acortar el enlace
    //const enlaceCortoWhatsApp = await acortarEnlace(enlaceLargoWhatsApp);

    // --- RESPUESTA PARA LA CLIENTA (MÁS ATRACTIVA) ---
    res.json({
        raw: {
            success: true,
            client_name: nombre,
            client_treatment: tratamiento,
            result: "Enlace de WhatsApp generado para agendar la cita."
        },
        // El markdown lo dejamos por si en el futuro se usa en una plataforma que sí lo soporte
        markdown: `[💬 ¡Sí, quiero agendar mi cita por WhatsApp!](${enlaceFinalWhatsApp})`,
        type: "markdown",
        // Esta es la parte clave: ahora el enlace que ve el usuario es corto y limpio
        desc: `¡Perfecto, ${nombre}! ✨ Estás a un solo paso de comenzar tu transformación.\n\n` +
            `Haz clic aquí para confirmar tu cita por WhatsApp: ${enlaceFinalWhatsApp}`
    });
});

// Función asíncrona para poder usar 'await'
async function enviarMensajeWhatsApp(number_receiver, image_link) {
    const url = 'https://api.ycloud.com/v2/whatsapp/messages/sendDirectly';

    // 1. Define las cabeceras (headers) de la petición
    const headers = {
        'X-API-Key': YCLOUD_API,
        'accept': 'application/json',
        'Content-Type': 'application/json' // Es importante que el Content-Type sea correcto
    };

    // 2. Define el cuerpo (body) de la petición
    const body = {
        type: "image",
        image: {
            link: image_link
        },
        to: number_receiver,
        from: "+525579435037"
    };

    // 3. Realiza la petición POST usando fetch
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body) // El cuerpo debe ser convertido a un string JSON
        });

        // Revisa si la petición fue exitosa (código de estado 200-299)
        if (!response.ok) {
            // Si hay un error, muestra el estado y el texto del error
            const errorText = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errorText}`);
        }

        // Convierte la respuesta a JSON
        const data = await response.json();

        console.log('✅ Éxito:', data);
        return data;

    } catch (error) {
        console.error('❌ Error en la petición:', error);
        return res.json({
            markdown: "...",
            type: "markdown",
            desc: "Ocurrió un error al enviar la imagen, intentalo de nuevo o puedes encontrar los resultados en nuestro Instagram @thebrowspotmx"
        });
    }
}

app.post('/api/transferir-whatsapp-new', async (req, res) => {
    //get info from the json sent in the request
    const {
        nombre,
        numero_contacto,
        descripcion_cabello,
        tipo_cabello,
        gustaria_mejorar,
        embarazada_lactando,
        uso_herramientas_calor,
        tratamiento
    } = req.body;

    const hair_resume = {
        "descripcion_cabello": descripcion_cabello,
        "tipo_cabello": tipo_cabello,
        "gustaria_mejorar": gustaria_mejorar,
        "embarazada_lactando": embarazada_lactando,
        "uso_herramientas_calor": uso_herramientas_calor
    }

    const hair_resume_str = JSON.stringify(hair_resume)

    console.log(`Hair resume: ${hair_resume_str} \nNombre: ${nombre}\nNumero_contacto: ${numero_contacto}\nTratamiento: ${tratamiento}`)

    // Step 3: Get AI interpretation of the results
    const cabello_resumen = await getChatSummary(hair_resume_str);

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
    const enlaceFinalWhatsApp = await acortarEnlace(enlaceLargoWhatsApp);
    //const enlaceCortoWhatsApp = await acortarEnlace(enlaceLargoWhatsApp);

    // --- RESPUESTA PARA LA CLIENTA (MÁS ATRACTIVA) ---
    res.json({
        // El markdown lo dejamos por si en el futuro se usa en una plataforma que sí lo soporte
        markdown: `[💬 ¡Sí, quiero agendar mi cita por WhatsApp!](${enlaceFinalWhatsApp})`,
        type: "markdown",
        // Esta es la parte clave: ahora el enlace que ve el usuario es corto y limpio
        desc: `¡Perfecto, ${nombre}! ✨ Estás a un solo paso de comenzar tu transformación.\n\n` +
            `Haz clic aquí para confirmar tu cita por WhatsApp: ${enlaceFinalWhatsApp}`
    });
});

app.post('/api/transferir-whatsapp-browspot', async (req, res) => {
    //get info from the json sent in the request
    const {
        nombre,
        numero_contacto,
        servicio
    } = req.body;

    // Número del negocio o asesor de WhatsApp (ejemplo: +52 55 2637 3003)
    const numeroDestino = "525523767744";

    // --- MENSAJE PARA LA HOST (MÁS CONTEXTO Y CALIDEZ) ---
    const mensaje = encodeURIComponent(
        `¡Hola! 👋 Vengo de Brow Bot y me gustaría agendar mi cita. ¡Estoy muy emocionada por empezar mi tratamiento! 💖\n\n` +
        `Aquí están mis datos:\n` +
        `---------------------------\n` +
        `👤 *Nombre:* ${nombre}\n` +
        `📞 *Contacto:* ${numero_contacto}\n` +
        `🌿 *Tratamiento de interés:* ${servicio}\n` +
        `---------------------------\n\n` +
        `¡Quedo atenta para confirmar los detalles! ✨`
    );

    // Generar link
    const enlaceLargoWhatsApp = `https://wa.me/${numeroDestino}?text=${mensaje}`;

    // Segundo, llama a la función para acortar el enlace
    const enlaceFinalWhatsApp = await acortarEnlace(enlaceLargoWhatsApp);
    //const enlaceCortoWhatsApp = await acortarEnlace(enlaceLargoWhatsApp);

    // --- RESPUESTA PARA LA CLIENTA (MÁS ATRACTIVA) ---
    res.json({
        // El markdown lo dejamos por si en el futuro se usa en una plataforma que sí lo soporte
        markdown: `[💬 ¡Sí, quiero agendar mi cita por WhatsApp!](${enlaceFinalWhatsApp})`,
        type: "markdown",
        // Esta es la parte clave: ahora el enlace que ve el usuario es corto y limpio
        desc: `¡Perfecto, ${nombre}! ✨ Estás a un solo paso de comenzar tu transformación.\n\n` +
            `Haz clic aquí para confirmar tu cita por WhatsApp: ${enlaceFinalWhatsApp}`
    });
});

app.post('/api/return-image-browspot', async (req, res) => {
    //get info from the json sent in the request
    const {
        servicio,
        function_call_username
    } = req.body;
    //get phone number from the body
    const numero = function_call_username.split('--').pop();
    console.log(`Se busca imagen para ${servicio} y se manda al numero: ${numero}`)
    try {

        //Get the exact service name with another agent that will map the name to one of the services, if it isnt in the database then it will return 'null'
        const image_name = await getImageName(servicio);
        console.log(`Resultado del agente de nombre de imagen: ${image_name}`)
        if (image_name == 'null'){
            console.log("sin resultados");
            return res.json({
                markdown: "...",
                type: "markdown",
                desc: "No se encontraron imagenes para ese servicio, puedes revisar nuestras redes sociales @thebrowspotmx\n¿Te gustaria agendar una cita?"
            });
        }

        //look for image link in database for that service
        const image_link_results = await executeQuery(image_name.toLowerCase());

        if (image_link_results.length == 0) {
            console.log("sin resultados");
            return res.json({
                markdown: "...",
                type: "markdown",
                desc: "No se encontraron imagenes para ese servicio, puedes revisar nuestras redes sociales @thebrowspotmx\n¿Te gustaria agendar una cita?"
            });
        }

        const image_link = image_link_results[0].link
        console.log(`link de la imagen: ${image_link}`)
        //Send image to phone number
        await enviarMensajeWhatsApp(numero, image_link);

        //return basic message like these are the results after getting the service xxxx
        return res.json({
            markdown: "...",
            type: "markdown",
            desc: `Asi es como quedan los resultados al aplicarte ${servicio}\n¿Te gustaria agendar una cita?`
        });
    } catch (error) {
        //Return error message as we couldnt find images for that service and to check the social media
        return res.json({
            markdown: "...",
            type: "markdown",
            desc: "Ocurrió un error al enviar la imagen, intentalo de nuevo o puedes encontrar los resultados en nuestro Instagram @thebrowspotmx\n¿Te gustaria agendar una cita?"
        });
    }

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

/*{"nombre": "Juan Alberto Calderon Sabbagh",
"numero_contacto": "5523767744”, ”descripcion_pelo": "es largo y con mucho frizz", "tipo_pelo": "muy rizado", "gustaria_mejorar": "reducir el frizz", "embarazada_lactando": false, "uso_herramientas_calor": "muy poco", "tratamiento": "hidrogeno"}*/