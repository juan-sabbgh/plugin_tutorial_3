//import express library
const express = require('express');

//create an instance of express
const app = express();
//port on which the server will run
const PORT = 3000;

app.use(express.json());

app.post('/plugin-tutorial', (req, res) => {
    //get info from the json sent in the request
    const {
        name,
        age,
        phone_number
    } = req.body;

    /*You can do some process here
        Like check data on a database
        Check user info
        Send email
        Add row to gsheets or mysql database
    */
    //output format
    /*
        Plugin endpoints should always return info with this template:
        {
            //raw parameter can have a json of general info about the result
            raw: {
                success: true,
                client_name: name,
                client_age: age,
                result: "The user was added to the database successfully"
            },
            //type is the type of info you're gonna return, this can be either "markdown" (string data that can be rendered with gpt-ish markdown like |...|...| for tables) or "chart" (graph data, like piecharts, bar-charts)
            type: "markdown"
            //markdown parameter is the info that you're gonna return in the markdown format, this has to be with the typical markdown of chatgpt |...|...|. For now we leave it like "..." as we do not want to render info with a certain format
            markdown: "...",
            //desc is a string of plain text that is gonna be shown on the chat, this can also have a markdown for example bold letter with **[text]**, lists 1.[text] 2.[text] 3.[text]
            "desc": "Se registro correctamente "

        }
    */

    res.json({
        raw: {
            success: true,
            client_name: name,
            client_age: age,
            result: "The user was added to the database successfully"
        },
        markdown: "...",
        type: "markdown",
        desc: `Se registro correctamente a *${name}*, con numero de contacto *${phone_number}* y edad ${age}`
    });
})

//initialize server with app.listen method, if there are no errors when initializing
//the server then it will print succesfully in the console, if not then print error
app.listen(PORT, (error) => {
    if (!error)
        console.log(`Server running on http://localhost:${PORT}`);
    else
        console.log("Error occurred, server can't start", error);
}
);