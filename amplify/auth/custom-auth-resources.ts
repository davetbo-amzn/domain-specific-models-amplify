import { CfnUserPool, CfnUserPoolDomain } from  'aws-cdk-lib/aws-cognito';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';


type CustomResourcesProps = {
  parentStackName: string,
  userPool: CfnUserPool
}

export default class CustomAuthResources extends Stack {
  userPool: CfnUserPool;
  userPoolDomain: CfnUserPoolDomain;

  constructor(scope: Construct, id: string, cProps: CustomResourcesProps, props: StackProps={}) {
    super(scope, id, props);
    this.userPool = cProps.userPool;
    this.userPoolDomain = new CfnUserPoolDomain(this, 'UserPoolDomain', {
      domain: `${this.node.getContext('user_pool_domain_prefix')}-${this.account}-${this.region}`,
      userPoolId: this.userPool.attrUserPoolId
    });
    
  }
}