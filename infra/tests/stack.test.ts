import { test } from "node:test";
import { App } from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { ContactStack } from "../lib/contact-stack";

test("small HTTP proxy API with scoped secrets access and logging", () => {
  const template = Template.fromStack(new ContactStack(new App(), "TestContact"));
  template.resourceCountIs("AWS::Lambda::Function", 1);
  template.resourceCountIs("AWS::Logs::LogGroup", 2);
  template.resourceCountIs("AWS::EC2::VPC", 0);
  template.hasResourceProperties("AWS::Lambda::Function", { Runtime: "nodejs24.x" });
  template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
    ProtocolType: "HTTP", CorsConfiguration: { AllowMethods: ["POST"], AllowHeaders: ["content-type"], AllowOrigins: Match.arrayWith(["https://plainlysmart.com", "http://localhost:3000"]) },
  });
  template.hasResourceProperties("AWS::ApiGatewayV2::Route", { RouteKey: "POST /contact" });
  template.hasResourceProperties("AWS::ApiGatewayV2::Integration", { IntegrationType: "AWS_PROXY", PayloadFormatVersion: "2.0" });
  template.hasResourceProperties("AWS::ApiGatewayV2::Stage", { AccessLogSettings: Match.objectLike({ DestinationArn: Match.anyValue() }) });
  template.hasResourceProperties("AWS::IAM::Policy", { PolicyDocument: { Statement: Match.arrayWith([Match.objectLike({ Action: ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"], Resource: { Ref: "ContactSecretArn" } })]) } });
});
test("optional custom domain and DNS validated ACM certificate", () => {
  const app = new App({ context: { domainName: "api.plainlysmart.com" } });
  const template = Template.fromStack(new ContactStack(app, "DomainTest"));
  template.hasResourceProperties("AWS::CertificateManager::Certificate", { DomainName: "api.plainlysmart.com", ValidationMethod: "DNS" });
  template.resourceCountIs("AWS::ApiGatewayV2::ApiMapping", 1);
});
