const express = require ('express');
const axios = require('axios');
const router = express.Router();
const keys = require("../keys/keys");
const hmacSHA256 = require('crypto-js/hmac-sha256');
const Hex = require('crypto-js/enc-hex');
const controller = {};

const username = keys.username;
const password = keys.password;
const publickey = keys.publickey;

controller.home = (req, res) => {
    res.render("index", { title: 'Demo NodeJS' })
}

controller.formtoken = async (req, res) => {

    const mode = req.body.mode;

    url = 'https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment';
    const auth = 'Basic ' + btoa(username + ':' + password); 

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': auth,
    };

    // Datos de la compra
    const data = {
        "amount":   180,
        "currency": "PEN",
        "orderId":  "myOrderId-999999",
        "customer": {
            "email": "sample@example.com"
        }
    };

    // Realizar la solicitud POST utilizando Axios
    const response = await axios.post(url, data, {
      headers: headers,
    });

    if (response.data.status == 'SUCCESS'){
        console.log(response.data.status);
        const token = response.data.answer.formToken;

        if (mode == 'pop-in'){
            res.render("formtoken", {mode, token, publickey});
        }else{
            res.render("formtoken", {mode, token, publickey});
        }
    }else{
        console.error(response.data);
        res.status(500).send('error');
    }
}

controller.paidResult = (req, res) => {
    const answer = JSON.parse(req.body['kr-answer']);
    const hash = req.body["kr-hash"]

    const answerHash = Hex.stringify(
        hmacSHA256(JSON.stringify(answer), keys.HMACSHA256)
    )

    if (hash == answerHash){
        res.status(200).render("result", { 'response' : answer.orderStatus, 'orderDetails': answer.orderDetails });
    }else{
        res.status(500).render("result", { 'response' : 'Error en el pago'});
    }
}

controller.ipn = (req, res) => {
    console.log(req.body);

    const answer = JSON.parse(req.body["kr-answer"])
    const hash = req.body["kr-hash"]

    const answerHash = Hex.stringify(
        hmacSHA256(JSON.stringify(answer), keys.password)
    )
    console.log('IPN');
    console.log(answer);
    console.log('Codigo Hash: ' + answerHash);

    if (hash === answerHash){
        res.status(200).send({'response' : answer.orderStatus })
    }
    else {
        res.status(500).send( {'response' : 'Es probable un intento de fraude'})
    }
}

module.exports = controller;