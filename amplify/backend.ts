import * as cdk from 'aws-cdk-lib';
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { jobsInputBucket, jobsOutputBucket } from './storage/resource';
import CustomAuthResources from './auth/custom-auth-resources';
import IngestionServiceStack from './functions/ingestionService/resource';
import OpenSearchServiceStack from './functions/openSearchService/resource';
import OpenSearchDashboardsProxyStack from './functions/openSearchService/opensearchDashboardProxy';
import VpcStack from './vpc';


const backend = defineBackend({
  auth,
  data,
  jobsInputBucket,
  jobsOutputBucket,
});


const inputBucket = backend.jobsInputBucket.resources.bucket
const outputBucket = backend.jobsOutputBucket.resources.bucket
const authenticatedRole = backend.auth.resources.authenticatedUserIamRole
const { cfnResources } = backend.auth.resources;
const { cfnIdentityPool, cfnUserPool } = cfnResources;

const customResourcesStack = backend.createStack('CustomResources');

const vpcStack = new VpcStack(customResourcesStack, 'VpcStack',
  customResourcesStack
)

const customAuthResourcesStack = new CustomAuthResources(customResourcesStack, 'CustomAuthResources', {
  parentStackName: customResourcesStack.stackName,
  userPool: cfnUserPool
})
 
const openSearchServiceStack = new OpenSearchServiceStack(customResourcesStack, 'OpenSearchServiceStack', {
  appSecurityGroup: vpcStack.newAppSecurityGroup,
  authRoleArn: backend.auth.resources.authenticatedUserIamRole.roleArn,  
  cognitoIdentityPoolId: cfnIdentityPool.attrId,
  cognitoUserPoolId: cfnUserPool.attrUserPoolId,
  parentStack: customResourcesStack,
  vpc: vpcStack.newVpc
})

const openSearchDashboardsProxyStack = new OpenSearchDashboardsProxyStack(customResourcesStack, 'OpenSearchDashboardsProxyStack', {
  appSecurityGroup: vpcStack.newAppSecurityGroup,
  osDomain: openSearchServiceStack.domain,
  parentStack: customResourcesStack,
  userPoolDomainName: customAuthResourcesStack.userPoolDomain.domain,
  openSearchEndpoint: openSearchServiceStack.openSearchEndpoint,
  vpc: vpcStack.newVpc
})

const ingestionServiceStack = new IngestionServiceStack(customResourcesStack, 'IngestionServiceStack', {
  appSecurityGroup: vpcStack.newAppSecurityGroup,
  ingestionBucketName: inputBucket.bucketName,
  parentStack: customResourcesStack,
  vectorStoreEndpoint: openSearchServiceStack.openSearchEndpoint,
  vpc: vpcStack.newVpc
})

// const cfnIngestionServiceRole = new cdk.CfnOutput(customResourcesStack, 'IngestionServiceRole', {
//   value: ingestionServiceStack.ingestionServiceRole.roleArn
// })

