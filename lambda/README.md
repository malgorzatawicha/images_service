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

### Deploy only lambda to AWS

```
cd <project_directory>/infrastructure
terraform apply --target aws_iam_role.lambda_role --target aws_iam_role_policy.lambda-allow-all --target aws_lambda_function.images_lambda
```