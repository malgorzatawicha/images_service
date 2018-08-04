# images_service

### Requirements

- `terraform`
- Account on AWS

### Launch project

* Clone directory:
```
git clone git@bitbucket.org:malgorzatawicha/images_service.git
```

* Fill AWS credentials

In `<project_directory>/infrastructure/terraform.tfvars.default` there are variables that should be filled before applying `terraform`.

Move it to `<project_directory>/infrastructure/terraform.tfvars` and edit file according to your credentials:

```
cd <project_directory>/infrastructure
mv terraform.tfvars.default terraform.tfvars
nano terraform.tfvars
```
