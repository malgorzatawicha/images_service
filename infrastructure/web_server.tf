resource "aws_security_group" "images_webserver_sg" {
  name = "images_webserver_sg"
  description = "Allow incoming HTTP connections"

  ingress {
    from_port = 80
    protocol = "tcp"
    to_port = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  vpc_id = "${aws_vpc.images_vpc.id}"

  tags {
    Name = "Images Web Server Security Group"
  }
}

resource "aws_lb" "webserver_load_balancer" {
  name = "webserver-load-balancer"
  internal = false
  load_balancer_type = "application"
  subnets = ["${aws_subnet.images_public_subnet1.id}", "${aws_subnet.images_public_subnet2.id}"]
}

resource "aws_lb_listener" "webserver_load_balancer_listener" {
  "default_action" {
    target_group_arn = "${aws_lb_target_group.webserver_load_balancer_target_group.arn}"
    type = "forward"
  }
  load_balancer_arn = "${aws_lb.webserver_load_balancer.arn}"
  port = 80
  protocol = "HTTP"
}

resource "aws_lb_target_group" "webserver_load_balancer_target_group" {
  port = 80
  protocol = "HTTP"
  vpc_id = "${aws_vpc.images_vpc.id}"
  name = "webserver-target-group"
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
    Name = "Web Server Target Group"
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_launch_configuration" "webserver_launch_configuration" {
  image_id = "ami-466768ac"
  instance_type = "t1.micro"
  security_groups = ["${aws_security_group.images_webserver_sg.id}"]
  associate_public_ip_address = true
  name = "webserver_launch_configuration"
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "webserver_autoscaling" {
  max_size = 2
  min_size = 1
  name = "webserver_autoscaling"
  vpc_zone_identifier = ["${aws_subnet.images_public_subnet1.id}", "${aws_subnet.images_public_subnet2.id}"]
  launch_configuration = "${aws_launch_configuration.webserver_launch_configuration.name}"
  health_check_grace_period = 300
  health_check_type = "ELB"

  tag {
    key = "Name"
    propagate_at_launch = true
    value = "Images Web Server"
  }
}

# Scale up
resource "aws_autoscaling_policy" "webserver_cpu_policy_scaleup" {
  autoscaling_group_name = "${aws_autoscaling_group.webserver_autoscaling.name}"
  name = "webserver_cpu_policy_scaleup"
  adjustment_type = "ChangeInCapacity"
  scaling_adjustment = 1
  cooldown = 300
  policy_type = "SimpleScaling"
}

resource "aws_cloudwatch_metric_alarm" "webserver_cpu_alarm_scaleup" {
  alarm_name = "webserver_cpu_alarm_scaleup"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods = 2
  metric_name = "CPUUtilization"
  namespace = "AWS/EC2"
  period = 120
  statistic = "Average"
  threshold = 50
  dimensions {
    AutoScalingGroupName = "${aws_autoscaling_group.webserver_autoscaling.name}"
  }

  alarm_description = "This metric monitors ec2 cpu utilization"
  alarm_actions = ["${aws_autoscaling_policy.webserver_cpu_policy_scaleup.arn}"]
}

# Scale down
resource "aws_autoscaling_policy" "webserver_cpu_policy_scaledown" {
  autoscaling_group_name = "${aws_autoscaling_group.webserver_autoscaling.name}"
  name = "webserver_cpu_policy_scaledown"
  adjustment_type = "ChangeInCapacity"
  scaling_adjustment = -1
  cooldown = 300
  policy_type = "SimpleScaling"
}

resource "aws_cloudwatch_metric_alarm" "webserver_cpu_alarm_scaledown" {
  alarm_name = "webserver_cpu_alarm_scaledown"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods = 2
  metric_name = "CPUUtilization"
  namespace = "AWS/EC2"
  period = 120
  statistic = "Average"
  threshold = 5
  dimensions {
    AutoScalingGroupName = "${aws_autoscaling_group.webserver_autoscaling.name}"
  }

  alarm_description = "This metric monitors ec2 cpu utilization"
  alarm_actions = ["${aws_autoscaling_policy.webserver_cpu_policy_scaledown.arn}"]
}
