import {
    CfnOutput,
    Stack,
    StackProps,
    aws_ec2 as ec2,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export default class VpcStack extends Stack {
    // appSecurityGroup: ec2.SecurityGroup;
    // vpc: ec2.Vpc;
    newVpc: ec2.Vpc;
    newAppSecurityGroup: ec2.SecurityGroup;
    
    constructor(scope: Construct, id: string, 
        parentStack: Stack,
        props: StackProps={}
    ) {
        super(scope, id, props)
        
        this.newVpc = new ec2.Vpc(scope, "SingleAzVpc", {
            enableDnsHostnames: true,
            enableDnsSupport: true,
            cidr: '10.100.0.0/16',
            maxAzs: 1,
            subnetConfiguration: [
                {
                    "cidrMask": 21,
                    "name": 'ingress',
                    "subnetType": ec2.SubnetType.PUBLIC,
                },
                {
                    "cidrMask": 21,
                    "name": 'data_isolated',
                    "subnetType": ec2.SubnetType.PRIVATE_ISOLATED,
                }
            ]
        })

        // this.vpc = new ec2.Vpc(scope, "Vpc", {
        //     enableDnsHostnames: true,
        //     enableDnsSupport: true,
        //     subnetConfiguration: [
        //         {
        //             "cidrMask": 21,
        //             "name": 'ingress',
        //             "subnetType": ec2.SubnetType.PUBLIC,
        //         },
        //         {
        //             "cidrMask": 21,
        //             "name": 'data_isolated',
        //             "subnetType": ec2.SubnetType.PRIVATE_ISOLATED,
        //         }
        //     ]
        // })

        // this.appSecurityGroup = new ec2.SecurityGroup(scope, 'AppSecurityGroup', { 
        //     vpc: this.vpc,
        //     allowAllOutbound: true
        // })
        this.newAppSecurityGroup = new ec2.SecurityGroup(scope, 'NewAppSecurityGroup', { 
            vpc: this.newVpc,
            allowAllOutbound: true
        })

        this.newAppSecurityGroup.addIngressRule(
            ec2.Peer.ipv4(this.newVpc.vpcCidrBlock),
            ec2.Port.allTraffic()
        )
        
        this.newAppSecurityGroup.addIngressRule(
            ec2.Peer.ipv4(this.node.getContext('os_dashboards_ec2_enable_traffic_from_ip')),
            ec2.Port.HTTPS
        );

        const newDynamodbEndpoint = this.newVpc.addGatewayEndpoint('NewDynamoDbEndpoint',{
            service: ec2.GatewayVpcEndpointAwsService.DYNAMODB
        })

        // const dynamodbEndpoint = this.vpc.addGatewayEndpoint('DynamoDbEndpoint',{
        //     service: ec2.GatewayVpcEndpointAwsService.DYNAMODB
        // })

        // const s3Endpoint = this.vpc.addGatewayEndpoint('S3Endpoint',{
        //     service: ec2.GatewayVpcEndpointAwsService.S3
        // })

        const newS3Endpoint = this.newVpc.addGatewayEndpoint('NewS3Endpoint',{
            service: ec2.GatewayVpcEndpointAwsService.S3
        })

        // const kmsEndpoint = this.vpc.addInterfaceEndpoint("KmsEndpoint", {
        //     privateDnsEnabled: true,
        //     service: new ec2.InterfaceVpcEndpointService(
        //         `com.amazonaws.${parentStack.region}.kms`, 
        //         443
        //     ),
        //     subnets: {
        //         subnetType:ec2.SubnetType.PRIVATE_ISOLATED
        //     }
        // })
        const newKmsEndpoint = this.newVpc.addInterfaceEndpoint("NewKmsEndpoint", {
            privateDnsEnabled: true,
            service: new ec2.InterfaceVpcEndpointService(
                `com.amazonaws.${parentStack.region}.kms`, 
                443
            ),
            subnets: {
                subnetType:ec2.SubnetType.PRIVATE_ISOLATED
            }
        })

        // const bedrockEndpoint = this.vpc.addInterfaceEndpoint("BedrockEndpoint",{
        //     privateDnsEnabled: true,
        //     service: new ec2.InterfaceVpcEndpointService(
        //         `com.amazonaws.${parentStack.region}.bedrock`,
        //         443
        //     ),
        //     subnets: {
        //         subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        //     }
        // })
        
        const newBedrockEndpoint = this.newVpc.addInterfaceEndpoint("NewBedrockEndpoint",{
            privateDnsEnabled: true,
            service: new ec2.InterfaceVpcEndpointService(
                `com.amazonaws.${parentStack.region}.bedrock`,
                443
            ),
            subnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            }
        })

        // const bedrockAgentEndpoint = this.vpc.addInterfaceEndpoint("BedrockAgentEndpoint", {
        //     privateDnsEnabled: true,
        //     service: new ec2.InterfaceVpcEndpointService(
        //         `com.amazonaws.${parentStack.region}.bedrock-agent`,
        //         443
        //     ),
        //     subnets: {
        //         subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        //     }
        // })

        const newBedrockAgentEndpoint = this.newVpc.addInterfaceEndpoint("NewBedrockAgentEndpoint", {
            privateDnsEnabled: true,
            service: new ec2.InterfaceVpcEndpointService(
                `com.amazonaws.${parentStack.region}.bedrock-agent`,
                443
            ),
            subnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            }
        })

        // const bedrockAgentRuntimeEndpoint = this.vpc.addInterfaceEndpoint("BedrockAgentRuntimeEndpoint", {
        //     privateDnsEnabled: true,
        //     service: new ec2.InterfaceVpcEndpointService(
        //         `com.amazonaws.${parentStack.region}.bedrock-agent-runtime`,
        //         443
        //     ),
        //     subnets: {
        //         subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        //     }
        // })

        const newBedrockAgentRuntimeEndpoint = this.newVpc.addInterfaceEndpoint("NewBedrockAgentRuntimeEndpoint", {
            privateDnsEnabled: true,
            service: new ec2.InterfaceVpcEndpointService(
                `com.amazonaws.${parentStack.region}.bedrock-agent-runtime`,
                443
            ),
            subnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            }
        })


        // const bedrockRuntimeEndpoint = this.vpc.addInterfaceEndpoint("BedrockRuntimeEndpoint", {
        //     privateDnsEnabled: true,
        //     service: new ec2.InterfaceVpcEndpointService(
        //         `com.amazonaws.${parentStack.region}.bedrock-runtime`,
        //         443
        //     ),
        //     subnets: {
        //         subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        //     }
        // })

        const newBedrockRuntimeEndpoint = this.newVpc.addInterfaceEndpoint("NewBedrockRuntimeEndpoint", {
            privateDnsEnabled: true,
            service: new ec2.InterfaceVpcEndpointService(
                `com.amazonaws.${parentStack.region}.bedrock-runtime`,
                443
            ),
            subnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            }
        })

        // const apigwEndpoint = this.vpc.addInterfaceEndpoint("ApigwEndpoint", {
        //     privateDnsEnabled: true,
        //     service: new ec2.InterfaceVpcEndpointService(
        //         `com.amazonaws.${parentStack.region}.execute-api`,
        //         443
        //     ),
        //     subnets: {
        //         subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        //     },
        //     securityGroups: [this.appSecurityGroup]
        // })

        const newApigwEndpoint = this.newVpc.addInterfaceEndpoint("NewApigwEndpoint", {
            privateDnsEnabled: true,
            service: new ec2.InterfaceVpcEndpointService(
                `com.amazonaws.${parentStack.region}.execute-api`,
                443
            ),
            subnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            },
            securityGroups: [this.newAppSecurityGroup]
        })

        // const lambdaEndpoint = this.vpc.addInterfaceEndpoint("LambdaEndpoint",{
        //     privateDnsEnabled: true,
        //     service: new ec2.InterfaceVpcEndpointService(
        //         `com.amazonaws.${parentStack.region}.lambda`,
        //         443
        //     ),
        //     subnets: {
        //         subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        //     },
        //     securityGroups: [this.appSecurityGroup]
        // })

        const newLambdaEndpoint = this.newVpc.addInterfaceEndpoint("NewLambdaEndpoint",{
            privateDnsEnabled: true,
            service: new ec2.InterfaceVpcEndpointService(
                `com.amazonaws.${parentStack.region}.lambda`,
                443
            ),
            subnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            },
            securityGroups: [this.newAppSecurityGroup]
        })

        // const sqsEndpoint = this.vpc.addInterfaceEndpoint("SqsEndpoint", {
        //     privateDnsEnabled: true,
        //     service: new ec2.InterfaceVpcEndpointService(
        //         `com.amazonaws.${parentStack.region}.sqs`,
        //         443
        //     ),
        //     subnets: {
        //         subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        //     },
        //     securityGroups: [this.appSecurityGroup]
        // })

        const newSqsEndpoint = this.newVpc.addInterfaceEndpoint("NewSqsEndpoint", {
            privateDnsEnabled: true,
            service: new ec2.InterfaceVpcEndpointService(
                `com.amazonaws.${parentStack.region}.sqs`,
                443
            ),
            subnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            },
            securityGroups: [this.newAppSecurityGroup]
        })
    }
}