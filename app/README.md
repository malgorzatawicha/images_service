# API documentation

## List resources

##### Example of basic request

Request: 
```
GET /v1/images/
```

Response:
```
HTTP/1.1 200 OK

{
  data: [
     {
        id: 1
        url: www.google.com/image1
        imageName: custom name
        original: {
          width: 1200
          height: 900
          url: www.amazon.com/s3/image1/full
        }
        width50: {
          width: 50
          height: 40
          url: www.amazon.com/s3/image1/50
        } 
        width100: {
          width: 100
          height: 80
          url: www.amazon.com/s3/image1/100
        } 
     }
     {
         id: 2
         url: www.google.com/image2
         imageName: second custom name
         original: {
           width: 700
           height: 700
           url: www.amazon.com/s3/image2/full
         }
         width70: {
           width: 70
           height: 70
           url: www.amazon.com/s3/image2/70
         } 
         width140: {
           width: 140
           height: 140
           url: www.amazon.com/s3/image2/140
         } 
      }
  ]
}
```

##### Example of pagination request

## Create resource

##### Example of basic request

Request:

```
POST /v1/images/

{
  sourceUrl: www.google.com/image3
  imageName: my new image
  sizes: [50, 100]
}
```

Response:

```
HTTP/1.1 202 Accepted
Location: /queue/3
```

##### Example of missing one of fields request

Request:

```
POST /v1/images/

{
  sourceUrl: www.google.com/image3
  sizes: [50, 100]
}
```

Response:

```
HTTP/1.1 400 Bad Request

error {
    status: 400
    error: MISSING_DATA
    description: One or more fields are missing.
    fields {
        imageName: Missing field.
    }    
}
```


##### Example of not valid one of fields request

Request:

```
POST /v1/images/

{
  sourceUrl: www.google.com/image3
  imageName: some name
  sizes: [strange_size, 100]
}
```

Response:

```
HTTP/1.1 422 Unprocessable Entity

error {
    status: 422
    error: FIELDS_VALIDATION_ERROR
    description: One or more fields raised validation errors.
    fields {
        sizes: Not all of sizes is numeric.
    }
}        
```

## Waiting for resource to be fully created

##### Example of basic request

Request:

```
GET /v1/queue/5
```

Response:
```
HTTP/1.1 200 OK

data {
  status: pending
}  
```


##### Example of not found entity request

Request:

```
GET /v1/queue/5
```

Response:
```
HTTP/1.1 404 Not Found
```

##### Example of finished entity request

Request:

```
GET /v1/queue/5
```

Response:
```
HTTP/1.1 303 See Other
Location: /v1/images/5
```

## Getting resource

##### Example of basic request

Request:

```
GET /v1/images/5
```

Response:

```
HTTP/1.1 200 OK

data {
        id: 5
        url: www.google.com/image5
        imageName: custom name
        original: {
          width: 1200
          height: 900
          url: www.amazon.com/s3/image5/full
        }
        width50: {
          width: 50
          height: 40
          url: www.amazon.com/s3/image5/50
        } 
        width100: {
          width: 100
          height: 80
          url: www.amazon.com/s3/image5/100
        } 
     }

```


##### Example of not found entity request

Request:

```
GET /v1/images/5
```

Response:
```
HTTP/1.1 404 Not Found
```

## Modify resource

##### Example of basic request

Request:

```
PUT /v1/images/5

{
  sourceUrl: www.google.com/image3
  imageName: my new image
  sizes: [50, 100]
}
```

Response:

```
HTTP/1.1 202 Accepted
Location: /queue/5
```

##### Example of not found entity request
Request:

```
PUT /v1/images/5

{
  sourceUrl: www.google.com/image5
  imageName: my new image
  sizes: [50, 100]
}
```

Response:
```
HTTP/1.1 404 Not Found
```


##### Example of missing one of fields request

Request:

```
PUT /v1/images/3

{
  sourceUrl: www.google.com/image3
  sizes: [50, 100]
}
```

Response:

```
HTTP/1.1 400 Bad Request

error {
    status: 400
    error: MISSING_DATA
    description: One or more fields are missing.
    fields {
        imageName: Missing field.
    }    
}
```

##### Example of not valid one of fields request

Request:

```
PUT /v1/images/3

{
  sourceUrl: www.google.com/image3
  imageName: some name
  sizes: [strange_size, 100]
}
```

Response:

```
HTTP/1.1 422 Unprocessable Entity

error {
    status: 422
    error: FIELDS_VALIDATION_ERROR
    description: One or more fields raised validation errors.
    fields {
        sizes: Wrong image size.
    }
}        
```


## Delete resource

##### Example of basic request

Request:

```
DELETE /v1/images/5
```

Response:

```
HTTP/1.1 202 Accepted
```

##### Example of already deleted entity request

Request:

```
DELETE /v1/images/5
```

Response:

```
HTTP/1.1 204 No Content
```

