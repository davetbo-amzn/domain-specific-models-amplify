//  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0
import {
    StackProps,
    RemovalPolicy,
    Stack,
 } from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as aos from 'aws-cdk-lib/aws-opensearchservice';
import { CfnIdentityPool, CfnUserPool, CfnUserPoolDomain } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface OpenSearchServiceStackProps {
  appSecurityGroup: ec2.ISecurityGroup;
  authRoleArn: string;
  cognitoIdentityPoolId: string;
  cognitoUserPoolId: string;
  parentStack: Stack;
  vpc: ec2.IVpc;
}

export default class OpenSearchServiceStack extends Stack {
  public readonly domain: aos.Domain;
  public readonly openSearchEndpoint: string;
  // public readonly openSearchProvider: lambda.Function;
  private readonly parentStack: Stack;

  constructor(scope: Construct, id: string, 
    vsProps: OpenSearchServiceStackProps, 
    props: StackProps={}
  ) {
    super(scope, id, props);
    this.parentStack = vsProps.parentStack;
    const cognitoDashboardsRole = new iam.Role(this, 'OpenSearchDashboardsCognitoRole', {
      assumedBy: new iam.ServicePrincipal('opensearchservice.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          'OsCognitoAccessPolicy',
          'arn:aws:iam::aws:policy/AmazonOpenSearchServiceCognitoAccess'
        )
      ]
    });

    cognitoDashboardsRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        principals: [new iam.ServicePrincipal('es.amazonaws.com')]
      })
    );

    this.domain = new aos.Domain(this, 'OsDomain', {
      version: aos.EngineVersion.OPENSEARCH_2_9,
      capacity: {
        dataNodeInstanceType: vsProps.parentStack.node.getContext('os_data_instance_type'),
        dataNodes: vsProps.parentStack.node.getContext('os_data_instance_ct'),
        masterNodeInstanceType: vsProps.parentStack.node.getContext('os_master_instance_type'),
        masterNodes: vsProps.parentStack.node.getContext('os_master_instance_ct'),
        multiAzWithStandbyEnabled:  vsProps.parentStack.node.getContext('os_multiaz_with_standby_enabled')
      },
      cognitoDashboardsAuth: {
        identityPoolId: vsProps.cognitoIdentityPoolId,
        userPoolId: vsProps.cognitoUserPoolId,
        role: cognitoDashboardsRole
      },
      ebs: {
        volumeSize:  vsProps.parentStack.node.getContext('os_data_instance_volume_size_gb'),
        volumeType: ec2.EbsDeviceVolumeType.GP3
      }, 
      enableAutoSoftwareUpdate: true,
      enforceHttps: true,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true
      },
      removalPolicy: RemovalPolicy.DESTROY,
      securityGroups: [vsProps.appSecurityGroup],
      vpc: vsProps.vpc,
      vpcSubnets: [{
        subnets: [
          vsProps.vpc.selectSubnets({ 
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED
          }).subnets[0]
        ],
      }],
      zoneAwareness: {
        enabled: false,
        // availabilityZoneCount: 2
      }
    });

    this.openSearchEndpoint = this.domain.domainEndpoint;

    // this.openSearchProvider = new lambda.Function(this, 'OpenSearchProviderFunction', {
    //       code: lambda.Code.fromAsset('amplify/functions/openSearchService', {
    //         bundling: {
    //           image: lambda.Runtime.PYTHON_3_11.bundlingImage,
    //           bundlingFileAccess: BundlingFileAccess.VOLUME_COPY,
    //           command: ['sh', '-c', buildCmds.join(' && ')]
    //         }
    //       }),
    //       memorySize: 1024,
    //       timeout: Duration.seconds(300),
    //       runtime: lambda.Runtime.PYTHON_3_11,
    //       handler: 'index.handler',
    //       environment: {
    //         DOMAIN_ENDPOINT: this.domain.domainEndpoint
    //       }
    //     });

    // this.openSearchProvider.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     actions: ['lambda:InvokeFunction'],
    //     // resources: [vsProps.authFn.functionArn]
    //   })
    // );
    // this.domain.grantReadWrite(this.openSearchProvider.grantPrincipal)
    // this.domain.grantIndexReadWrite("*", this.openSearchProvider.grantPrincipal)

    // new aosOpenSearchAccessPolicy(this, 'OpenSearchVectorServiceAccess',
    //   this.domain,
    //   this.openSearchProvider.grantPrincipal,
    //   true, true, true, true
    // );

    // this.openSearchProvider.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: ['ssm:GetParameter', 'ssm:GetParametersByPath'],
    //     resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/${vsProps.parentStack.stackName}*`]
    //   })
    // );

    const cognitoAuthRole = iam.Role.fromRoleArn(this, 'CognitoAuthRoleRef', vsProps.authRoleArn);

    // this.openSearchProvider.grantInvoke(cognitoAuthRole);

    this.domain.grantReadWrite(cognitoAuthRole.grantPrincipal)
    this.domain.grantIndexReadWrite("*", cognitoAuthRole.grantPrincipal)

    // new OpenSearchAccessPolicy(this, 'OpenSearchAccessForCognitoRole',
    //   this.domain,
    //   cognitoAuthRole.grantPrincipal,
    //   true, true, true, true
    // );

    // const vsFnName = new ssm.StringParameter(this, 'OpenSearchProviderFunctionName', {
    //   parameterName: `/${vsProps.parentStack.stackName}/vector_store_provider_function_name`,
    //   stringValue: this.openSearchProvider.functionName
    // });

    // vsFnName.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // const vsOriginParam = new ssm.StringParameter(this, 'OpenSearchProviderOrigin', {
    //   parameterName: `/${vsProps.parentStackName}/origin_vector_store_provider`,
    //   stringValue: this.openSearchProvider.functionName
    // });

    // vsOriginParam.applyRemovalPolicy(RemovalPolicy.DESTROY);

  }
}