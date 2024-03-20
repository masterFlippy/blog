#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkGqlStack } from "../lib/cdk_gql-stack";

const app = new cdk.App();
new CdkGqlStack(app, "CdkGqlStack", {
  env: {
    account: "deployment_account",
    region: "deployment_region",
  },
});
