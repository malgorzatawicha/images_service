resource "aws_iam_role" "lambda_role" {
  name = "lambda_role"
  assume_role_policy = "${data.aws_iam_policy_document.lambda-assume-role.json}"
}

data "aws_iam_policy_document" "lambda-assume-role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}
resource "aws_iam_role_policy" "lambda-allow-all" {
  name = "allow_all"
  role = "${aws_iam_role.lambda_role.name}"
  policy = "${data.aws_iam_policy_document.lambda-allow-all.json}"
}

data "aws_iam_policy_document" "lambda-allow-all" {
  statement {
    actions = [
      "*"
    ]

    resources = [
      "*",
    ]
  }
}

resource "aws_lambda_function" "images_lambda" {
  function_name = "images_lambda"
  handler = "index.handler"
  runtime = "nodejs8.10"
  filename = "${path.module}/../lambda/function.zip"
  source_code_hash = "${base64sha256(file("${path.module}/../lambda/function.zip"))}"
  role = "${aws_iam_role.lambda_role.arn}"
}

resource "aws_lambda_event_source_mapping" "event_source_mapping" {
  batch_size        = 100
  event_source_arn  = "${aws_dynamodb_table.db_images.stream_arn}"
  enabled           = true
  function_name     = "${aws_lambda_function.images_lambda.function_name}"
  starting_position = "LATEST"
}
