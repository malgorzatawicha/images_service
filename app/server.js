'use strict';

const express = require('express');
const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-west-1'});

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (request, response) => {

    const database = new AWS.DynamoDB({apiVersion: '2012-10-08'});
    const params = {
        TableName: 'db_images',
        Key: {
            'imageId' : {S: '5'},
        }
    };

    database.getItem(params, function(error, data) {
        if (error) {
            response.send(error);
        } else {
            response.send(data.Item);
        }
    });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);