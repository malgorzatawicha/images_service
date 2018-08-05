'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('node-uuid');

const AWS = require('aws-sdk');
const config = require('./config');
if (process.env.NODE_ENV !== 'PRODUCTION') {
    AWS.config.update(config.aws_local_config);
} else {
    AWS.config.update(config.aws_remote_config);
}
const database = new AWS.DynamoDB.DocumentClient();

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// App
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const router = express.Router();

router.get('/', (request, response) => {
    return response.status(303).append("Location", "/v1/images/").send();
});

// @todo add pagination to request

router.route('/images')
    .get(function (request, response) {

        const params = {
            TableName: config.aws_table_name
        };
        database.scan(params, function(error, data) {
            if (error) {
                console.log(error);
                return responseInternalServerError(response);
            }
            const { Items } = data;
            return response.send({data: Items.map(assembleItem)});
        });
    })

    .post(function (request, response) {
        const {sourceUrl, imageName, sizes} = request.body;
        if (!sourceUrl || !imageName || !sizes) {
            return responseMissingFields(sourceUrl, imageName, sizes, response);
        }
        const invalidFields = getInvalidFields(sourceUrl, imageName, sizes);

        if (Object.keys(invalidFields).length > 0) {
            return responseInvalidFields(invalidFields, response);
        }

        const id = uuid.v4();

        const params = {
            TableName: config.aws_table_name,
            Item: {
                id: id,
                imageUrl: sourceUrl,
                imageName: imageName,
                sizes: sizes
            }
        };
        database.put(params, function (error) {
            if (error) {
                return responseInternalServerError(response);
            }
            return response.status(202).append("Location", "/v1/queue/" + id).send();
        })
})
;

router.route('/images/:id')
    .get(function (request, response) {

        const params = {
            TableName: config.aws_table_name,
            Key: {
                'id': request.params.id
            }
        };

        database.get(params, function (error, data) {
            if (error) {
                return responseInternalServerError(response);
            }

            const {Item} = data;

            if (!Item) {
                return response.status(404).send();
            }
            return response.json({
                data: assembleItem(Item)
            });
        });
    })
    .put(function (request, response) {
        const {sourceUrl, imageName, sizes} = request.body;
        if (!sourceUrl || !imageName || !sizes) {
            return responseMissingFields(sourceUrl, imageName, sizes, response);
        }
        const invalidFields = getInvalidFields(sourceUrl, imageName, sizes);

        if (Object.keys(invalidFields).length > 0) {
            return responseInvalidFields(invalidFields, response);
        }

        const params = {
            TableName: config.aws_table_name,
            Key: {
                "id": request.params.id
            },
            UpdateExpression: "set imageUrl=:url, imageName=:name, sizes=:sizes",
            ConditionExpression: "attribute_exists(id)",
            ExpressionAttributeValues: {
                ":url": sourceUrl,
                ":name": imageName,
                ":sizes": sizes
            }
        };

        database.update(params, function (error, data) {
            if (error) {
                if (error.code === 'ConditionalCheckFailedException') {
                    return response.status(404).send();
                }
                return responseInternalServerError(response);
            }
            return response.status(202).append("Location", "/v1/queue/" + request.params.id).send();
        })

    })
    .delete(function (request, response) {
        const params = {
            TableName: config.aws_table_name,
            Key: {
                "id": request.params.id
            },
            ConditionExpression: "attribute_exists(id)"
        };

        database.delete(params, function (error, data) {
            if (error) {
                if (error.code === 'ConditionalCheckFailedException') {
                    return response.status(204).send();
                }
                return responseInternalServerError(response);
            }
            return response.status(202).send();
        })
    })
;
router.route('/queue/:id')
    .get(function (request, response) {
        if (request.params.id === '1') {
            return response.send({data: {status: "pending"}});
        }

        if (request.params.id === '3') {
            return response.status(303).append("Location", "/v1/images/" + request.params.id).send();
        }

        return response.status(404).send();
    });

function getInvalidFields(sourceUrl, imageName, sizes) {
    let invalidFields = {};
    if (!validUrl(sourceUrl)) {
        invalidFields.sourceUrl = 'Wrong url format';
    }
    if (!Array.isArray(sizes)) {
        invalidFields.sizes = 'Is not array';
    }
    if (sizes.length === 0) {
        invalidFields.sizes = 'Wrong count of sizes';
    }

    if (sizes.some(isNaN)) {
        invalidFields.sizes = 'Not all of sizes is numeric';
    }

    return invalidFields;
}

function validUrl(str) {
    const urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    const url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
}

function responseInvalidFields(fields, response) {
    response.status(422).send({
        error: {
            status: 422,
            error: "FIELDS_VALIDATION_ERROR",
            description: "One or more fields are raised validation errors.",
            fields: fields
        }
    });
}

function responseMissingFields(sourceUrl, imageName, sizes, response) {
    const message = 'Missing field.';
    let errorFields = {};
    if (!sourceUrl) {
        errorFields.sourceUrl = message;
    }
    if (!imageName) {
        errorFields.imageName = message;
    }
    if (!sizes) {
        errorFields.sizes = message;
    }
    response.status(400).send({
        error: {
            status: 400,
            error: "MISSING_DATA",
            description: "One or more fields are missing.",
            fields: errorFields
        }
    });
}

function responseInternalServerError(response) {
    return response.status(500).send({
        message: 'Internal server error'
    });
}

function assembleItem (item) {
    let result = {
        'id': item.id,
        'url': item.imageUrl,
        'original': {
            'width': 'todo',
            'height': 'todo',
            'url': 'todo'
        }
    };

    for (let index in item.sizes) {
        const name = "width" + item.sizes[index];
        result[name] = {
            'width': 'todo',
            'height': 'todo',
            'url': 'todo'
        }
    }
    return result;
}

app.use('/v1', router);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
