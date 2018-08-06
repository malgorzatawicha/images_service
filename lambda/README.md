### Deploy lambda to production

Lambda will be deployed during `terraform apply` as zipped `function.zip`.

To create `zip` file you need:
```
cd <project_directory>/lambda
rm -rf function.zip
zip -r function.zip index.js node_modules
```

### Test lambda

Pack lambda:
```
cd <project_directory>/lambda
zip -r function.zip index.js node_modules
```

Upload lambda:

```
cd <project_directory>/infrastructure
terraform apply --target aws_iam_role.lambda_role --target aws_iam_role_policy.lambda-allow-all --target aws_lambda_function.images_lambda
```

Define tests (from `event.json`).


