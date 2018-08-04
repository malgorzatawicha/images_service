# images_service

### Requirements

- `terraform`
- Account on AWS

### Launch project locally

Build docker image:
```
cd <project_directory>/app
docker build -t images/application .
```
Run docker:
```
docker run --rm -p 80:80 -e AWS_ACCESS_KEY_ID='<YOUR_AWS_ACCESS_KEY>' -e AWS_SECRET_ACCESS_KEY='YOUR_AWS_SECRET_KEY' images/application
```

And visit in browser:
```
http://localhost:80
```
### Launch project in production

Clone directory:
```
git clone git@bitbucket.org:malgorzatawicha/images_service.git
```

##### Create production infrastructure

* Fill AWS credentials

In `<project_directory>/infrastructure/terraform.tfvars.default` there are variables that should be filled before applying `terraform`.

Move it to `<project_directory>/infrastructure/terraform.tfvars` and edit file according to your credentials:

```
cd <project_directory>/infrastructure
mv terraform.tfvars.default terraform.tfvars
nano terraform.tfvars
```

Project will be accessible under url returned in output of `terraform apply`.

##### Push dockers to AWS

Build docker image:
```
cd <project_directory>/app
docker build -t images/application .
docker tag images/application:latest <account_id>.dkr.ecr.eu-west-1.amazonaws.com/images/application:latest
```
Push image to AWS:
```
aws ecr get-login --no-include-email --region eu-west-1
docker push <account_id>.dkr.ecr.eu-west-1.amazonaws.com/images/application:latest
```
