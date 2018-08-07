### Deploy lambda to production

Lambda will be deployed during `terraform apply` as zipped `function.zip`.

To create `zip` file you need:
```
cd <project_directory>/lambda
rm -rf function.zip
zip -r function.zip index.js node_modules
```

### Test lambda

```
cd <project_directory>/lambda
cat event.json | docker run --rm -v "$PWD":/var/task -i -e DOCKER_LAMBDA_USE_STDIN=1 lambci/lambda:nodejs8.10
```

### Install node modules

Node modules should be compatible with AWS Lambda environment.
You should install them on the same environment as AWS Lambda. 
```
docker run --rm -v "$PWD":/var/task lambci/lambda:build-nodejs8.10 npm install
```

