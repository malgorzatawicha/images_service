resource "aws_ecr_repository" "images_application" {
  name = "images/application"
}

resource "aws_ecs_cluster" "images_cluster" {
  name = "images_cluster"
}

data "template_file" "web_task" {
  template = "${file("container_definition.json")}"

  vars {
    web_server_image = "${aws_ecr_repository.images_application.repository_url}"
    aws_access_key = "${var.access_key}"
    aws_secret_key = "${var.secret_key}"
  }
}

data "aws_ecs_task_definition" "images" {
  task_definition = "${aws_ecs_task_definition.images.family}"
  depends_on = [ "aws_ecs_task_definition.images" ]
}
resource "aws_ecs_task_definition" "images" {
  container_definitions = "${data.template_file.web_task.rendered}"
  family = "images"
}

resource "aws_ecs_service" "images_ecs_service" {
  name = "images-service"
  task_definition = "${aws_ecs_task_definition.images.family}:${max("${aws_ecs_task_definition.images.revision}", "${data.aws_ecs_task_definition.images.revision}")}"
  cluster = "${aws_ecs_cluster.images_cluster.id}"
  desired_count = 2
  load_balancer {
    container_name = "images"
    container_port = 80
    target_group_arn = "${aws_lb_target_group.images_load_balancer_target_group.arn}"
  }
  depends_on = ["aws_lb_listener.images_load_balancer_listener"]
}