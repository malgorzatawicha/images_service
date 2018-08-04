resource "aws_iam_role" "images_ecs_role" {
  name = "images_ecs_role"
  assume_role_policy  = "${data.aws_iam_policy_document.images_iam_policy.json}"
}

data "aws_iam_policy_document" "images_iam_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "images_policy_attachment" {
  role       = "${aws_iam_role.images_ecs_role.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "images_ecs_ec2_instance_profile" {
  name = "ec2_instance_profile"
  role = "${aws_iam_role.images_ecs_role.name}"
}

resource "aws_lb" "images_load_balancer" {
  name = "images-load-balancer"
  internal = false
  load_balancer_type = "application"
  security_groups = ["${aws_security_group.images_sg.id}"]
  subnets = ["${aws_subnet.images_public_subnet1.id}", "${aws_subnet.images_public_subnet2.id}"]
}

resource "aws_lb_listener" "images_load_balancer_listener" {
  "default_action" {
    target_group_arn = "${aws_lb_target_group.images_load_balancer_target_group.arn}"
    type = "forward"
  }
  load_balancer_arn = "${aws_lb.images_load_balancer.arn}"
  port = 80
  protocol = "HTTP"
}

resource "aws_lb_target_group" "images_load_balancer_target_group" {
  port = 80
  protocol = "HTTP"
  vpc_id = "${aws_vpc.images_vpc.id}"
  name = "images-target-group"
  health_check {
    interval = 30
    protocol = "HTTP"
    healthy_threshold = 3
    unhealthy_threshold = 3
    matcher = "200"
    path = "/"
    timeout = 5
  }
  tags {
    Name = "Images Load Balancer Target Group"
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_launch_configuration" "images_launch_configuration" {
  image_id = "${var.image}"
  instance_type = "t1.micro"
  iam_instance_profile = "${aws_iam_instance_profile.images_ecs_ec2_instance_profile.id}"
  security_groups = ["${aws_security_group.images_sg.id}"]
  associate_public_ip_address = true
  name = "images_launch_configuration"

  user_data = <<EOF
#!/bin/bash
echo "ECS_CLUSTER=images_cluster" >> /etc/ecs/ecs.config
EOF

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "images_autoscaling" {
  max_size = 2
  min_size = 1
  name = "images_autoscaling"
  vpc_zone_identifier = ["${aws_subnet.images_public_subnet1.id}", "${aws_subnet.images_public_subnet2.id}"]
  launch_configuration = "${aws_launch_configuration.images_launch_configuration.name}"
  health_check_grace_period = 300
  health_check_type = "ELB"

  tag {
    key = "Name"
    propagate_at_launch = true
    value = "Images Web Server"
  }
}

# Scale up
resource "aws_autoscaling_policy" "images_cpu_policy_scaleup" {
  autoscaling_group_name = "${aws_autoscaling_group.images_autoscaling.name}"
  name = "images_cpu_policy_scaleup"
  adjustment_type = "ChangeInCapacity"
  scaling_adjustment = 1
  cooldown = 300
  policy_type = "SimpleScaling"
}

resource "aws_cloudwatch_metric_alarm" "images_cpu_alarm_scaleup" {
  alarm_name = "images_cpu_alarm_scaleup"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods = 2
  metric_name = "CPUUtilization"
  namespace = "AWS/EC2"
  period = 120
  statistic = "Average"
  threshold = 50
  dimensions {
    AutoScalingGroupName = "${aws_autoscaling_group.images_autoscaling.name}"
  }

  alarm_description = "This metric monitors ec2 cpu utilization"
  alarm_actions = ["${aws_autoscaling_policy.images_cpu_policy_scaleup.arn}"]
}

# Scale down
resource "aws_autoscaling_policy" "images_cpu_policy_scaledown" {
  autoscaling_group_name = "${aws_autoscaling_group.images_autoscaling.name}"
  name = "images_cpu_policy_scaledown"
  adjustment_type = "ChangeInCapacity"
  scaling_adjustment = -1
  cooldown = 300
  policy_type = "SimpleScaling"
}

resource "aws_cloudwatch_metric_alarm" "images_cpu_alarm_scaledown" {
  alarm_name = "images_cpu_alarm_scaledown"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods = 2
  metric_name = "CPUUtilization"
  namespace = "AWS/EC2"
  period = 120
  statistic = "Average"
  threshold = 5
  dimensions {
    AutoScalingGroupName = "${aws_autoscaling_group.images_autoscaling.name}"
  }

  alarm_description = "This metric monitors ec2 cpu utilization"
  alarm_actions = ["${aws_autoscaling_policy.images_cpu_policy_scaledown.arn}"]
}
