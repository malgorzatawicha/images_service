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

app.get('/v1/images', function (request, response) {
    response.json({
        data: [
            {
                id: 1,
                url: "www.google.com/image1",
                imageName: "custom name",
                original: {
                    width: 1200,
                    height: 900,
                    url: "www.amazon.com/s3/image1/full"
                },
                width50: {
                    width: 50,
                    height: 40,
                    url: "www.amazon.com/s3/image1/50"
                },
                width100: {
                    width: 100,
                    height: 80,
                    url: "www.amazon.com/s3/image1/100"
                }
            },
            {
                id: 2,
                url: "www.google.com/image2",
                imageName: "second custom name",
                original: {
                    width: 700,
                    height: 700,
                    url: "www.amazon.com/s3/image2/full"
                },
                width70: {
                    width: 70,
                    height: 70,
                    url: "www.amazon.com/s3/image2/70"
                },
                width140: {
                    width: 140,
                    height: 140,
                    url: "www.amazon.com/s3/image1/140"
                }
            }
        ]
    });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
