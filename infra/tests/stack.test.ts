import { test } from "node:test";
import { App } from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { ContactStack } from "../lib/contact-stack";
import assert from "node:assert/strict";

test("resource names and stack tags follow the deployment stage", () => {
  for (const environment of ["prod", "dev-eu"]) {
    const stack = new ContactStack(new App({ context: { stage: environment } }), "PlainlySmartContact");
    assert.equal(stack.stackName, `ps-${environment}-contact`);
    const template = Template.fromStack(stack);
    const tags = Object.entries({ Project: "Plainlysmart", ProjectCode: "ps", Environment: environment, ManagedBy: "CDK" })
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([Key, Value]) => ({ Key, Value }));
    template.hasResourceProperties("AWS::Lambda::Function", { FunctionName: `ps-${environment}-contact-handler`, Tags: Match.arrayWith(tags) });
    template.hasResourceProperties("AWS::ApiGatewayV2::Api", { Name: `ps-${environment}-contact-api` });
    template.hasResourceProperties("AWS::Logs::LogGroup", { LogGroupName: `/aws/lambda/ps-${environment}-contact-handler` });
    template.hasResourceProperties("AWS::Logs::LogGroup", { LogGroupName: `ps-${environment}-contact-access-logs` });
    template.resourceCountIs("AWS::SecretsManager::Secret", 0);
    for (const role of Object.values(template.findResources("AWS::IAM::Role"))) {
      assert.equal(role.Properties.RoleName, undefined);
    }
  }
  assert.equal(new ContactStack(new App(), "DefaultTest").stackName, "ps-prod-contact");
});

test("unsafe or excessively long stages are rejected", () => {
  for (const stage of ["", "Prod", "a/b", "prod\n", "-dev", "dev-", "dev--eu", "a".repeat(33), 123]) {
    assert.throws(() => new ContactStack(new App({ context: { stage } }), "Invalid"), /stage must/);
  }
});

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
